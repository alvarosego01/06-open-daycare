# SPEC 12 — Publicación de entradas con Supabase: crear, editar, eliminar

> **Status:** Approved
> **Depends on:** SPEC 06, SPEC 10, SPEC 11
> **Date:** 2026-08-26
> **Objective:** Conectar el flujo de creación de publicaciones a Supabase (tablas `posts`, `post_children`, `post_photos`), agregar subida de imágenes a Supabase Storage, e implementar edición y eliminación de publicaciones desde el feed.

## Scope

**In:**

- Conectar `CreatePostDialog` a datos reales: crear filas en `posts`, `post_children`, `post_photos` via Server Actions
- Crear bucket `post-photos` en Supabase Storage con políticas RLS (solo staff/admin pueden subir; las fotos son públicas para lectura)
- Server Action `createPost()` que:
  - Recibe `title` (opcional), `type` (enum `post_type`), `body` (opcional, max 1000 chars), `childIds` (array de UUIDs), `wholeRoom` (boolean), `files` (array de File, max 5, JPG/PNG, max 10MB c/u)
  - Si `wholeRoom = true`: etiqueta a todos los niños activos de la sala del staff
  - Si `wholeRoom = false`: etiqueta solo los `childIds` indicados (deben pertenecer a la sala del staff)
  - Sube las fotos al bucket `post-photos` en path `posts/{postId}/{position}-{filename}`
  - Inserta en `posts`, `post_children`, `post_photos` en una transacción lógica
  - Retorna el post creado con URLs de fotos
- Server Action `updatePost()` que:
  - Recibe `postId`, `title`, `type`, `body`, `childIds`, `wholeRoom`, `files` (nuevas), `existingPhotoIds` (fotos que se mantienen), `removedPhotoIds` (fotos que se eliminan)
  - Actualiza `posts`, reemplaza `post_children`, actualiza `post_photos` (agrega nuevas, elimina quitadas)
  - Elimina archivos del bucket para fotos removidas
  - Solo si el usuario es autor del post
- Server Action `deletePost()` que:
  - Recibe `postId`
  - Elimina fotos del bucket
  - Elimina filas de `post_photos`, `post_children`, `posts` (DELETE físico)
  - Solo si el usuario es autor del post o tiene rol `admin`
- Server Action `getPosts()` que:
  - Lee posts del daycare del usuario con author, children, photos
  - Ordena por `published_at` DESC
- Server Action `uploadPostPhotos()` que:
  - Recibe array de `File` y un `postId`
  - Valida formato (JPG/PNG), tamano (max 10MB), cantidad (max 5 total)
  - Sube a Supabase Storage bucket `post-photos`
  - Inserta filas en `post_photos`
  - Retorna URLs de las fotos subidas
- Crear políticas RLS para tablas `posts`, `post_children`, `post_photos`:
  - Staff/admin pueden insertar, actualizar y eliminar posts de su daycare
  - Staff/admin pueden leer posts de su daycare
  - Parents pueden leer posts donde sus hijos están etiquetados + posts tipo `announcement` de su sala
  - Staff/admin pueden gestionar `post_children` y `post_photos` de sus posts
- Modificar `CreatePostDialog` para:
  - Cargar niños reales desde `children` table filtrados por la sala del staff
  - Usar multi-selección de niños (chips seleccionables)
  - Opción "Toda la sala" excluyente con selección individual
  - Mostrar 6 tipos de post (sin "animo"): Comida, Siesta, Actividad, Logro, Foto, Anuncio
  - Campo título opcional
  - Campo descripción opcional (max 1000 chars, con contador)
  - Input file real con preview de fotos (thumbnails con opción de eliminar)
  - Popover de confirmación al hacer click en "Publicar"
  - Estados de loading y error
- Modificar `PostCard` para:
  - Leer datos reales del post (author, children, photos, type)
  - Mostrar menú `(...)` con opciones "Editar" y "Eliminar" (solo si el usuario es autor o admin)
  - Popover de confirmación para "Eliminar"
  - Al hacer "Editar": abre `CreatePostDialog` en modo edición con datos precargados
  - Al hacer "Eliminar": llama a `deletePost()` y remueve el post del feed
- Actualizar `app/page.tsx` (feed) para leer posts desde `getPosts()` en lugar de datos mock
- Eliminar tipo "animo" de `PostCategory`, `POST_CATEGORY_META` y `PostCard` (no existe en el enum DB)
- Todo el texto visible en espanol, todo el codigo en ingles

**Out of scope (para futuros specs):**

- Borradores de publicaciones
- Notificaciones push a padres cuando se publica
- Feed filtrado por nino o tipo (el feed muestra todos los posts del daycare)
- Comentarios funcionales en publicaciones
- Reacciones/likes funcionales
- Vista de detalle de publicación
- Edición de publicaciones de otros staff (solo las propias)
- Soft delete de publicaciones (se usa borrado físico)
- Compresión o redimensionamiento de imágenes

## Data model

```sql
-- migrations/012_post_rls_and_storage.sql

-- 1. RLS para tabla posts
alter table public.posts enable row level security;

-- Staff/admin pueden leer posts de su daycare
create policy "Staff can read posts in their daycare"
  on public.posts for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.id = posts.author_id
        and u.role in ('staff', 'admin')
    )
    or
    exists (
      select 1 from public.users u
      join public.rooms r on r.daycare_id = u.daycare_id
      where u.id = auth.uid()
        and u.role in ('staff', 'admin')
        and posts.room_id = r.id
    )
    or
    exists (
      select 1 from public.post_children pc
      join public.parent_children pcn on pcn.child_id = pc.child_id
      where pc.post_id = posts.id
        and pcn.parent_id = auth.uid()
    )
    or
    (posts.type = 'announcement'
     and exists (
       select 1 from public.users u
       join public.rooms r on r.daycare_id = u.daycare_id
       where u.id = auth.uid()
         and u.role = 'parent'
         and posts.room_id = r.id
     ))
  );

-- Staff/admin pueden insertar posts
create policy "Staff can insert posts"
  on public.posts for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.id = posts.author_id
        and u.role in ('staff', 'admin')
    )
  );

-- Staff/admin pueden actualizar sus propios posts
create policy "Staff can update own posts"
  on public.posts for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.id = posts.author_id
        and u.role in ('staff', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.id = posts.author_id
        and u.role in ('staff', 'admin')
    )
  );

-- Staff/admin pueden eliminar sus propios posts
create policy "Staff can delete own posts"
  on public.posts for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.id = posts.author_id
        and u.role in ('staff', 'admin')
    )
  );

-- 2. RLS para tabla post_children
alter table public.post_children enable row level security;

create policy "Staff can manage post_children in their daycare"
  on public.post_children for all
  using (
    exists (
      select 1 from public.posts p
      join public.users u on u.id = p.author_id
      where p.id = post_children.post_id
        and u.id = auth.uid()
        and u.role in ('staff', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.posts p
      join public.users u on u.id = p.author_id
      where p.id = post_children.post_id
        and u.id = auth.uid()
        and u.role in ('staff', 'admin')
    )
  );

-- Parents pueden leer post_children de posts que pueden ver
create policy "Parents can read post_children of visible posts"
  on public.post_children for select
  using (
    exists (
      select 1 from public.parent_children pc
      where pc.child_id = post_children.child_id
        and pc.parent_id = auth.uid()
    )
  );

-- 3. RLS para tabla post_photos
alter table public.post_photos enable row level security;

create policy "Staff can manage post_photos of their posts"
  on public.post_photos for all
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_photos.post_id
        and p.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_photos.post_id
        and p.author_id = auth.uid()
    )
  );

-- Parents pueden leer post_photos de posts que pueden ver
create policy "Parents can read post_photos of visible posts"
  on public.post_photos for select
  using (
    exists (
      select 1 from public.post_children pc
      join public.parent_children pcn on pcn.child_id = pc.child_id
      where pc.post_id = post_photos.post_id
        and pcn.parent_id = auth.uid()
    )
    or
    exists (
      select 1 from public.posts p
      join public.users u on u.role = 'parent'
      where p.id = post_photos.post_id
        and p.type = 'announcement'
        and u.id = auth.uid()
    )
  );

-- 4. Storage bucket
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', true);

-- Políticas de Storage
-- Staff/admin pueden subir fotos
create policy "Staff can upload post photos"
  on storage.objects for insert
  with check (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('staff', 'admin')
    )
  );

-- Staff/admin pueden eliminar sus fotos
create policy "Staff can delete own post photos"
  on storage.objects for delete
  using (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('staff', 'admin')
    )
  );

-- Lectura pública (las fotos son públicas)
create policy "Post photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'post-photos');
```

Notas:

- `posts.title` ya existe como nullable en la DB.
- `posts.body` ya existe como nullable en la DB.
- `posts.type` usa el enum `post_type` con valores: `meal`, `nap`, `activity`, `achievement`, `photo`, `announcement`.
- El tipo "animo" NO existe en el enum. Se elimina del frontend.
- `post_photos.url` almacena la ruta relativa dentro del bucket (ej: `posts/{postId}/0-filename.jpg`).
- El bucket `post-photos` es público para lectura.
- Las políticas RLS de `posts` para staff verifican que el author es el usuario actual.
- Las políticas RLS de `posts` para parents verifican que el post tiene `post_children` vinculados a sus hijos, o que es un `announcement` de su sala.

## Implementation plan

1. **Crear migración RLS y Storage.** Crear `migrations/012_post_rls_and_storage.sql` con el DDL del section Data model: políticas RLS para `posts`, `post_children`, `post_photos`, y bucket de Storage con sus políticas.

2. **Aplicar migración.** Ejecutar `supabase_apply_migration` con nombre `012_post_rls_and_storage`. Verificar que las políticas y el bucket se crearon correctamente.

3. **Crear Server Action `getRoomChildren`.** Crear en `app/actions/posts.ts` una función que:
   - Obtiene el `daycare_id` del usuario actual
   - Consulta `public.children` uniendo con `public.rooms` donde `rooms.daycare_id = user.daycare_id` y `children.status = 'active'`
   - Retorna array de `{ id, full_name, room_id, room_name }` ordenado por `room_name` y `full_name`

4. **Crear Server Action `createPost`.** Crear en `app/actions/posts.ts` una función que:
   - Recibe `title`, `type`, `body`, `childIds`, `wholeRoom`, `files`
   - Obtiene el usuario actual y su `daycare_id`/`room_id`
   - Valida: `type` es válido, `body` max 1000 chars, `files` max 5 y formato JPG/PNG y tamano max 10MB
   - Si `wholeRoom`: obtiene todos los `childIds` de la sala del staff
   - Valida que todos los `childIds` pertenecen a la sala del staff
   - Inserta en `posts` con `author_id`, `room_id`, `type`, `title`, `body`, `published_at = now()`
   - Si hay `files`: sube cada archivo a Storage en path `posts/{postId}/{position}-{filename}` y obtiene la URL pública
   - Inserta en `post_photos` con `post_id`, `url`, `position`, `width`, `height` (si se puede obtener)
   - Inserta en `post_children` con `post_id` y cada `child_id`
   - Retorna `{ success: true, post: Post }` o `{ error: string }`

5. **Crear Server Action `updatePost`.** Crear en `app/actions/posts.ts` una función que:
   - Recibe `postId`, `title`, `type`, `body`, `childIds`, `wholeRoom`, `newFiles`, `existingPhotoIds`, `removedPhotoIds`
   - Verifica que el usuario es autor del post
   - Actualiza `posts` con nuevos valores
   - Elimina filas de `post_children` existentes y crea nuevas con los `childIds` actualizados
   - Si `removedPhotoIds`: elimina filas de `post_photos` y archivos del Storage
   - Si `newFiles`: sube nuevos archivos y crea filas en `post_photos`
   - Retorna `{ success: true, post: Post }` o `{ error: string }`

6. **Crear Server Action `deletePost`.** Crear en `app/actions/posts.ts` una función que:
   - Recibe `postId`
   - Verifica que el usuario es autor del post o tiene rol `admin`
   - Consulta `post_photos` del post para obtener las URLs
   - Elimina archivos del Storage
   - Elimina filas de `post_photos`
   - Elimina filas de `post_children`
   - Elimina fila de `posts`
   - Retorna `{ success: true }` o `{ error: string }`

7. **Crear Server Action `getPosts`.** Crear en `app/actions/posts.ts` una función que:
   - Obtiene el usuario actual y su `daycare_id`
   - Si es staff/admin: consulta todos los posts del daycare (via `rooms`)
   - Si es parent: consulta posts donde sus hijos están en `post_children` + posts tipo `announcement` de su sala
   - Incluye datos del author (full_name, avatar_url), children etiquetados, y photos
   - Ordena por `published_at` DESC
   - Retorna array de posts con estructura completa

8. **Crear Server Action `getRooms`.** Crear en `app/actions/posts.ts` una función que:
   - Obtiene las salas del daycare del usuario
   - Retorna array de `{ id, name }`

9. **Crear componente `ConfirmPopover`.** Crear `components/ConfirmPopover.tsx`:
   - Popover que aparece al hacer click en un botón trigger
   - Props: `trigger` (ReactNode), `message` (string), `confirmLabel` (string), `onConfirm` (callback), `variant` ('danger' | 'primary')
   - Muestra mensaje + botones "Cancelar" y "Confirmar"
   - Se cierra al hacer click fuera o en "Cancelar"

10. **Reescribir `CreatePostDialog` con datos reales.** Modificar `components/CreatePostDialog.tsx`:
    - Props: `open`, `onClose`, `editMode` (boolean), `post` (datos del post a editar, opcional)
    - Cargar niños reales via `getRoomChildren()` al abrir el dialog
    - Cargar salas via `getRooms()` al abrir
    - Multi-selección de niños (chips seleccionables con avatar circular)
    - Opción "Toda la sala" como chip adicional (excluyente con selección individual)
    - 6 tipos de post (sin "animo"): pills con colores del `POST_CATEGORY_META` actualizado
    - Campo título opcional (input)
    - Campo descripción opcional (textarea, max 1000 chars, mostrar contador)
    - Input file real con `accept="image/jpeg,image/png"` y `multiple`
    - Preview de fotos seleccionadas (thumbnails 96x96 con botón X para eliminar)
    - Validación: tipo es obligatorio; si "Toda la sala" no está activo, al menos un niño debe estar seleccionado
    - Botón "Publicar" con popover de confirmación (`ConfirmPopover`)
    - En modo edición: precargar título, tipo, descripción, niños seleccionados, fotos existentes
    - Estados: loading (submitting), error (mensaje)
    - Al publicar/editar exitosamente: cerrar dialog, llamar callback de refresh

11. **Actualizar `POST_CATEGORY_META` en `data/posts.ts`.** Eliminar la entrada `animo` del objeto. Actualizar el tipo `PostCategory` para que no incluya `"animo"`.

12. **Actualizar `PostCard` con menú de acciones.** Modificar `components/PostCard.tsx`:
    - Leer datos reales del post (author name/initial, children names, photos URLs, type)
    - Agregar botón `(...)` en el header de la tarjeta
    - Al hacer click en `(...)`: muestra dropdown con opciones "Editar" y "Eliminar" (solo si el usuario es autor o admin)
    - "Eliminar" usa `ConfirmPopover` para confirmar
    - "Editar" abre `CreatePostDialog` en modo edición con datos precargados
    - Mostrar fotos reales desde URLs de Storage (componente `<img>`)
    - Mostrar nombres de niños etiquetados en el campo "Para:"

13. **Actualizar `app/page.tsx` (feed).** Modificar la página:
    - Convertir en Server Component que llama a `getPosts()`
    - Reemplazar import de `posts` mock por datos reales
    - Pasar callback de refresh al `PostCard` para actualizar después de editar/eliminar
    - Mantener el diseño visual actual

14. **Actualizar `Sidebar.tsx`.** Modificar para:
    - Pasar callback de refresh al `CreatePostDialog`
    - El dialog puede abrirse en modo crear o editar

15. **Ejecutar `pnpm run lint` y `npx tsc --noEmit`.** Verificar que no hay errores.

## Acceptance criteria

- [ ] Existe `migrations/012_post_rls_and_storage.sql` con políticas RLS para `posts`, `post_children`, `post_photos`
- [ ] La migración se aplicó sin errores via `supabase_apply_migration`
- [ ] El bucket `post-photos` existe en Supabase Storage y es público para lectura
- [ ] Existen políticas de Storage para upload (solo staff/admin), delete (solo staff/admin), y select (público)
- [ ] Existe `app/actions/posts.ts` con Server Actions: `getRoomChildren()`, `createPost()`, `updatePost()`, `deletePost()`, `getPosts()`, `getRooms()`
- [ ] `CreatePostDialog` carga niños reales desde la tabla `children` filtrados por la sala del staff
- [ ] `CreatePostDialog` permite multi-selección de niños (múltiples chips activos)
- [ ] `CreatePostDialog` tiene opción "Toda la sala" excluyente con selección individual
- [ ] `CreatePostDialog` muestra 6 tipos de post (sin "animo"): Comida, Siesta, Actividad, Logro, Foto, Anuncio
- [ ] `CreatePostDialog` tiene campo título opcional
- [ ] `CreatePostDialog` tiene campo descripción opcional con contador de caracteres (max 1000)
- [ ] `CreatePostDialog` tiene input file real con `accept="image/jpeg,image/png"` y `multiple`
- [ ] `CreatePostDialog` valida formato (JPG/PNG) y tamano (max 10MB) de archivos
- [ ] `CreatePostDialog` valida cantidad maxima de 5 fotos
- [ ] `CreatePostDialog` muestra preview de fotos seleccionadas (thumbnails 96x96)
- [ ] `CreatePostDialog` permite eliminar fotos del preview antes de publicar
- [ ] `CreatePostDialog` tiene popover de confirmación al hacer click en "Publicar"
- [ ] `CreatePostDialog` en modo edición precarga título, tipo, descripción, niños y fotos existentes
- [ ] `CreatePostDialog` en modo edición permite agregar, quitar y cambiar fotos
- [ ] `createPost()` inserta en `posts`, `post_children`, `post_photos` y sube fotos a Storage
- [ ] `createPost()` con `wholeRoom = true` etiqueta a todos los niños activos de la sala
- [ ] `createPost()` con `wholeRoom = false` etiqueta solo los niños seleccionados
- [ ] `updatePost()` actualiza `posts`, reemplaza `post_children`, actualiza `post_photos`
- [ ] `updatePost()` elimina archivos del Storage para fotos removidas
- [ ] `deletePost()` elimina fotos del Storage, `post_photos`, `post_children`, y `posts` (DELETE físico)
- [ ] `deletePost()` solo permite eliminar si el usuario es autor o admin
- [ ] `getPosts()` retorna posts con author, children y photos para staff/admin del daycare
- [ ] `PostCard` muestra menú `(...)` con opciones "Editar" y "Eliminar"
- [ ] `PostCard` muestra "Editar" y "Eliminar" solo si el usuario es autor o admin
- [ ] `PostCard` tiene popover de confirmación para "Eliminar"
- [ ] `PostCard` abre `CreatePostDialog` en modo edición al hacer "Editar"
- [ ] `PostCard` muestra fotos reales desde URLs de Storage
- [ ] `PostCard` muestra nombres de niños etiquetados
- [ ] `app/page.tsx` lee posts desde `getPosts()` en lugar de datos mock
- [ ] El feed se actualiza después de crear, editar o eliminar un post
- [ ] El tipo "animo" fue eliminado de `PostCategory`, `POST_CATEGORY_META` y `PostCard`
- [ ] `pnpm run lint` pasa sin errores
- [ ] `npx tsc --noEmit` pasa sin errores

## Decisions

- **Sí:** Conectar a Supabase real en este spec. El SPEC 06 dejó el flujo con datos mock; este spec lo completa.
- **No:** Mantener datos mock. El usuario confirmó que debe conectarse a Supabase.
- **Sí:** Eliminar tipo "animo" del frontend. No existe en el enum `post_type` de la DB.
- **No:** Agregar "animo" al enum de la DB. El usuario confirmó retirarlo.
- **Sí:** Multi-selección de niños. El usuario confirmó que se pueden elegir múltiples niños.
- **No:** Selección única. El usuario confirmó multi-selección.
- **Sí:** "Toda la sala" excluyente con selección individual. El usuario confirmó opción A.
- **No:** Permitir ambos simultáneamente. Sería redundante (si seleccionas toda la sala, ya están todos).
- **Sí:** Subida real de fotos a Supabase Storage. El usuario confirmó crear bucket.
- **No:** Fotos mock o placeholders. El usuario confirmó subida real.
- **Sí:** Max 5 fotos por publicación. El usuario confirmó.
- **No:** Sin límite de fotos. Podría causar problemas de performance y storage.
- **Sí:** Max 10MB por archivo. El usuario confirmó.
- **No:** Compresión de imágenes. El usuario dijo que no hace falta.
- **Sí:** Solo JPG y PNG. El usuario confirmó.
- **No:** Soporte para HEIC u otros formatos. El usuario confirmó solo JPG/PNG.
- **Sí:** Preview de fotos antes de publicar. El usuario confirmó.
- **No:** Subida directa sin preview. El usuario quiere ver las fotos antes.
- **Sí:** Popover de confirmación al publicar. El usuario confirmó.
- **No:** Publicación directa sin confirmación. El usuario quiere confirmación.
- **Sí:** Menú `(...)` en PostCard con Editar/Eliminar. El usuario confirmó.
- **No:** Botones de Editar/Eliminar siempre visibles. El usuario confirmó menú `(...)`.
- **Sí:** Popover de confirmación para eliminar. El usuario confirmó.
- **No:** Dialog de confirmación para eliminar. El usuario prefirió popover (más liviano).
- **Sí:** Borrado físico (DELETE). El usuario confirmó.
- **No:** Soft delete (campo `deleted_at`). El usuario confirmó borrado físico.
- **Sí:** Editar fotos (agregar/quitar/cambiar) en modo edición. El usuario confirmó.
- **No:** Solo editar texto en modo edición. El usuario confirmó que las fotos también.
- **Sí:** Solo staff y admin pueden crear/editar/eliminar. El usuario confirmó.
- **No:** Parents pueden crear posts. Solo staff/admin.
- **Sí:** Dialog modal (no página nueva). El usuario confirmó seguir con dialog.
- **No:** Página dedicada `/posts/new`. El usuario confirmó dialog modal.
- **Sí:** Sin soporte para borradores. El usuario confirmó que no hace falta.
- **No:** Sistema de borradores. Over-engineering para este caso.
- **Sí:** Descripción opcional (max 1000 chars). El usuario confirmó.
- **No:** Descripción obligatoria. El usuario dijo opcional.
- **Sí:** Título opcional. El mockup no lo tiene pero el usuario confirmó agregarlo como opcional.
- **No:** Título obligatorio. El usuario confirmó opcional.

## Identified risks

- **Storage costs:** Las fotos se suben a Supabase Storage. Si hay muchas publicaciones con fotos, el storage puede crecer. Para el volumen esperado de una guardería, es aceptable.
- **RLS complexity:** Las políticas RLS de `posts` son complejas (múltiples `exists` con joins). Puede tener impacto en performance si hay muchos posts, pero es aceptable para el volumen esperado.
- **Transacciones:** Las Server Actions no usan transacciones reales de Postgres. Si `createPost()` falla después de insertar en `posts` pero antes de insertar en `post_children`, quedan datos parciales. Mitigación: el usuario puede reintentar o eliminar el post incompleto.
- **Photo upload size:** Con max 10MB por archivo y max 5 fotos, una publicación puede tener hasta 50MB en fotos. Para el volumen esperado, es aceptable.
- **Parent feed:** La política RLS para parents es compleja. Si un padre tiene múltiples hijos en diferentes salas, la query puede ser lenta. Para el volumen esperado, es aceptable.

## What is **not** in this spec

- Borradores de publicaciones.
- Notificaciones push a padres.
- Feed filtrado por nino o tipo.
- Comentarios funcionales.
- Reacciones/likes funcionales.
- Vista de detalle de publicación.
- Edición de publicaciones de otros staff.
- Soft delete de publicaciones.
- Compresión o redimensionamiento de imágenes.

Cada uno de esos, si es necesario, va en su propio spec.
