# SPEC 10 — Mantenimiento de niños y salas con conexión a Supabase

> **Status:** Approved
> **Depends on:** SPEC 08, SPEC 09
> **Date:** 2026-08-24
> **Objective:** Crear las tablas `rooms` y `children` en Supabase con políticas RLS, seed de tres salas (Soles, Jardín de Estrellas, Fuente de Arcoíris), y conectar la página `/kids` y el perfil `/kids/[id]` a la base de datos real, reemplazando los datos mockeados.

## Scope

**In:**

- Crear el enum `child_status` (`active`, `archived`) en la base de datos
- Crear la tabla `rooms` con los campos del esquema de referencia: `id` (uuid PK), `daycare_id` (uuid FK a `daycares`), `name` (text), `created_at` (timestamptz)
- Crear la tabla `children` con los campos del esquema de referencia: `id` (uuid PK), `room_id` (uuid FK a `rooms`), `full_name` (text), `birth_date` (date), `enrolled_at` (date), `medical_notes` (text, nullable), `allergy_tags` (text[]), `photo_consent` (boolean, default true), `status` (child_status, default `active`), `created_at` / `updated_at` (timestamptz)
- Habilitar RLS en ambas tablas con políticas para:
  - Staff puede leer todos los niños y salas de su daycare
  - Staff puede insertar niños y salas en su daycare
  - Staff puede actualizar niños en su daycare (para archivar)
  - Parents pueden leer sus propios hijos (a través de `parent_children`, pero esa tabla aún no existe, así que por ahora solo staff accede)
- Seed de tres salas con nombres creativos: "Sala Soles", "Jardín de Estrellas", "Fuente de Arcoíris", vinculadas al daycare existente
- No crear niños en el seed (tabla `children` vacía inicialmente)
- Modificar `app/kids/page.tsx` para que lea los niños desde la tabla `children` de Supabase en lugar de los datos mockeados
- Agrupar los niños por sala en la UI, mostrando una sección por cada sala con su nombre y contador (ej: "SALA SOLES", "SALA JARDIN DE ESTRELLAS", etc.)
- Modificar `AddKidDialog` para que lea las salas desde la tabla `rooms` de Supabase en lugar de opciones hardcoded
- Modificar la Server Action de agregar niño para que inserte en la tabla `children` de Supabase
- Agregar funcionalidad de "archivar" niño (cambiar `status` a `archived`) con un botón en la tarjeta o perfil del niño
- Modificar `app/kids/[id]/page.tsx` para que lea el niño desde la tabla `children` de Supabase en lugar de los datos mockeados
- La sección de padres en el perfil (`ParentsSection`) sigue con datos mockeados por ahora (depende de la tabla `parent_children` que aún no existe)
- Todo el código (nombres de tablas, columnas, funciones) en inglés, texto de UI en español

**Out of scope (para futuros specs):**

- Tabla `parent_children` y lógica de vinculación padre-hijo (SPEC posterior)
- Tabla `invitations` y flujo de invitaciones
- Edición de datos de niños (solo agregar y archivar)
- Búsqueda/filtrado de niños en la UI (el search bar sigue siendo visual)
- Políticos RLS para parents (requiere `parent_children`)
- Otras tablas del esquema (`posts`, `post_children`, `reactions`, etc.)
- Modificaciones a la tabla `users` o `daycares`

## Data model

Según la referencia `opendaycare-database-schema.md` (secciones 3-4):

```sql
-- migrations/010_create_rooms_and_children.sql

-- 1. Enum child_status
create type public.child_status as enum ('active', 'archived');

-- 2. Tabla rooms
create table if not exists public.rooms (
  id         uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

-- 3. Tabla children
create table if not exists public.children (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references public.rooms(id) on delete cascade,
  full_name      text not null,
  birth_date     date not null,
  enrolled_at    date not null default current_date,
  medical_notes  text,
  allergy_tags   text[] not null default '{}',
  photo_consent  boolean not null default true,
  status         public.child_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 4. RLS
alter table public.rooms enable row level security;
alter table public.children enable row level security;

-- Políticas para rooms
create policy "Staff can read rooms in their daycare"
  on public.rooms for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'staff'
        and u.daycare_id = rooms.daycare_id
    )
  );

create policy "Staff can insert rooms in their daycare"
  on public.rooms for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'staff'
        and u.daycare_id = rooms.daycare_id
    )
  );

-- Políticas para children
create policy "Staff can read children in their daycare"
  on public.children for select
  using (
    exists (
      select 1 from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

create policy "Staff can insert children in their daycare"
  on public.children for insert
  with check (
    exists (
      select 1 from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

create policy "Staff can update children in their daycare"
  on public.children for update
  using (
    exists (
      select 1 from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  )
  with check (
    exists (
      select 1 from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

-- 5. Seed de salas
insert into public.rooms (daycare_id, name)
values
  ((select id from public.daycares limit 1), 'Sala Soles'),
  ((select id from public.daycares limit 1), 'Jardín de Estrellas'),
  ((select id from public.daycares limit 1), 'Fuente de Arcoíris');
```

Notas:

- `rooms.daycare_id`: FK a `daycares(id)` con `ON DELETE CASCADE`.
- `children.room_id`: FK a `rooms(id)` con `ON DELETE CASCADE`.
- `children.allergy_tags`: Array de texto en inglés (ej: `{peanut,lactose}`). La UI traduce a español.
- `children.status`: Enum `child_status` con default `active`. Archivar cambia a `archived`.
- Las políticas RLS verifican que el usuario sea `staff` y pertenezca al mismo `daycare_id` que la sala/niño.
- No se crean niños en el seed, solo las tres salas.

## Implementation plan

1. **Crear archivo de migración.** Crear `migrations/010_create_rooms_and_children.sql` con el DDL completo: enum `child_status`, tablas `rooms` y `children`, habilitación de RLS, políticas de acceso para staff, y seed de las tres salas.

2. **Aplicar migración a Supabase.** Ejecutar la migración usando `supabase_apply_migration` con nombre `010_create_rooms_and_children` y el contenido del punto 1.

3. **Verificar tablas y RLS.** Consultar `pg_tables` para confirmar que `rooms` y `children` existen. Consultar `pg_policies` para confirmar que las políticas RLS fueron creadas. Consultar `public.rooms` para confirmar que las tres salas fueron creadas.

4. **Crear función helper para obtener el daycare_id del usuario actual.** Crear `utils/supabase/helpers.ts` con una función `getUserDaycareId(supabase)` que:
   - Llama a `supabase.auth.getUser()` para obtener el UID
   - Consulta `public.users` para obtener el `daycare_id`
   - Retorna el `daycare_id` o lanza error si no existe

5. **Crear Server Action para obtener salas.** Crear `app/kids/actions.ts` con una Server Action `getRooms()` que:
   - Crea el cliente de Supabase con `createClient(await cookies())`
   - Obtiene el `daycare_id` del usuario actual usando `getUserDaycareId()`
   - Consulta `public.rooms` filtrando por `daycare_id`
   - Retorna un array de `{ id, name }` ordenado por `name`

6. **Crear Server Action para obtener niños.** Crear en `app/kids/actions.ts` una Server Action `getChildren()` que:
   - Crea el cliente de Supabase con `createClient(await cookies())`
   - Obtiene el `daycare_id` del usuario actual
   - Consulta `public.children` uniendo con `public.rooms` para obtener el nombre de sala
   - Filtra por `rooms.daycare_id` y `children.status = 'active'`
   - Retorna un array de objetos con: `id`, `full_name`, `birth_date`, `enrolled_at`, `medical_notes`, `allergy_tags`, `photo_consent`, `room_id`, `room_name`
   - Ordena por `room_name` y luego por `full_name`

7. **Crear Server Action para agregar niño.** Crear en `app/kids/actions.ts` una Server Action `addChild(formData: FormData)` que:
   - Extrae `full_name`, `birth_date` (formato dd/mm/yyyy), `room_id`, `allergy_tags` (string separada por comas), `medical_notes` del formData
   - Convierte `birth_date` de dd/mm/yyyy a yyyy-mm-dd
   - Convierte `allergy_tags` de string a array de texto en inglés (minúsculas, trim)
   - Inserta en `public.children` con `status = 'active'`
   - Retorna `{ success: true }` o `{ error: string }`

8. **Crear Server Action para archivar niño.** Crear en `app/kids/actions.ts` una Server Action `archiveChild(childId: string)` que:
   - Actualiza `public.children` setando `status = 'archived'` donde `id = childId`
   - Retorna `{ success: true }` o `{ error: string }`

9. **Modificar `app/kids/page.tsx` para leer de Supabase.** Convertir la página en un Server Component (remover `"use client"`) que:
   - Llama a `getRooms()` y `getChildren()` en paralelo
   - Agrupa los niños por `room_name` en un objeto `{ [roomName: string]: Child[] }`
   - Renderiza una sección por cada sala con su nombre y contador
   - Pasa las salas como prop a `AddKidDialog` para el dropdown
   - Mantiene el diseño visual actual (grid de 2 columnas, tarjetas con avatar, badges, etc.)
   - Los niños archivaros no se muestran (ya filtrados en la query)

10. **Modificar `AddKidDialog` para leer salas de DB.** Cambiar el componente para que:
    - Reciba una prop `rooms: { id: string, name: string }[]` en lugar de opciones hardcoded
    - Use esas opciones en el `<select>` de sala
    - Llame a la Server Action `addChild(formData)` en lugar de retornar datos al padre
    - Después de guardar exitosamente, haga `revalidatePath('/kids')` o recargue la página para mostrar el nuevo niño

11. **Agregar botón de "Archivar" en la tarjeta de niño.** En `app/kids/page.tsx`, agregar un botón pequeño (ícono de archivo o papelera) en cada tarjeta que:
    - Al hacer click, muestra un confirm dialog simple ("¿Estás seguro de archivar a [nombre]?")
    - Si confirma, llama a `archiveChild(childId)`
    - Después de archivar, recarga la página para reflejar el cambio

12. **Modificar `app/kids/[id]/page.tsx` para leer de Supabase.** Mantener como Server Component que:
    - Recibe `params: Promise<{ id: string }>`
    - Llama a una Server Action `getChildById(id)` que consulta `public.children` uniendo con `public.rooms`
    - Si no encuentra el niño, llama a `notFound()`
    - Renderiza los datos reales del niño (nombre, fecha nacimiento, sala, fecha ingreso, notas médicas, allergy tags)
    - La sección de padres (`ParentsSection`) sigue con datos mockeados por ahora
    - Agregar un botón "Archivar" en el perfil que llama a `archiveChild(id)` y redirige a `/kids`

13. **Crear Server Action para obtener niño por ID.** Crear en `app/kids/actions.ts` una Server Action `getChildById(id: string)` que:
    - Consulta `public.children` uniendo con `public.rooms` donde `children.id = id`
    - Verifica que el usuario tenga acceso (mismo daycare)
    - Retorna el objeto completo del niño o `null` si no existe

14. **Actualizar `migrations/README.md`.** Documentar la migración `010_create_rooms_and_children` (número, nombre, descripción, estado `applied`).

15. **Ejecutar `pnpm run lint` y `npx tsc --noEmit`.** Asegurar que no hay errores de linting o tipado.

## Acceptance criteria

- [ ] Existe `migrations/010_create_rooms_and_children.sql` con el DDL completo
- [ ] La migración `010_create_rooms_and_children` se aplicó sin errores via `supabase_apply_migration`
- [ ] El enum `child_status` existe con valores `active`, `archived`
- [ ] La tabla `rooms` existe con las columnas: `id` (uuid, PK), `daycare_id` (uuid, FK a daycares), `name` (text), `created_at` (timestamptz)
- [ ] La tabla `children` existe con las columnas: `id` (uuid, PK), `room_id` (uuid, FK a rooms), `full_name` (text), `birth_date` (date), `enrolled_at` (date), `medical_notes` (text, nullable), `allergy_tags` (text[]), `photo_consent` (boolean, default true), `status` (child_status, default active), `created_at` (timestamptz), `updated_at` (timestamptz)
- [ ] `rooms.daycare_id` tiene FK a `daycares(id)` con `ON DELETE CASCADE`
- [ ] `children.room_id` tiene FK a `rooms(id)` con `ON DELETE CASCADE`
- [ ] RLS está habilitado en las tablas `rooms` y `children`
- [ ] Existen políticas RLS para `rooms` que permiten a staff leer e insertar salas de su daycare
- [ ] Existen políticas RLS para `children` que permiten a staff leer, insertar y actualizar niños de su daycare
- [ ] Las tres salas "Sala Soles", "Jardín de Estrellas", "Fuente de Arcoíris" existen en `public.rooms` vinculadas al daycare existente
- [ ] La tabla `public.children` está vacía (no hay niños en el seed)
- [ ] Existe `utils/supabase/helpers.ts` con la función `getUserDaycareId()`
- [ ] Existe `app/kids/actions.ts` con Server Actions: `getRooms()`, `getChildren()`, `addChild()`, `archiveChild()`, `getChildById()`
- [ ] `app/kids/page.tsx` lee los niños desde Supabase en lugar de datos mockeados
- [ ] La página `/kids` agrupa a los niños por sala, mostrando una sección por cada sala con su nombre y contador
- [ ] `AddKidDialog` lee las salas desde la tabla `rooms` de Supabase en lugar de opciones hardcoded
- [ ] Al agregar un niño nuevo, se inserta en la tabla `children` de Supabase
- [ ] Existe un botón para archivar niños en la tarjeta de la lista
- [ ] Al archivar un niño, su `status` cambia a `archived` en la base de datos
- [ ] Los niños archivaros no aparecen en la lista `/kids`
- [ ] `app/kids/[id]/page.tsx` lee el niño desde Supabase en lugar de datos mockeados
- [ ] El perfil muestra los datos reales del niño (nombre, fechas, sala, notas médicas, allergy tags)
- [ ] Existe un botón "Archivar" en el perfil del niño
- [ ] Al archivar desde el perfil, redirige a `/kids`
- [ ] `ParentsSection` sigue con datos mockeados (no se conecta a DB en este spec)
- [ ] Existe `migrations/README.md` actualizado con la migración `010_create_rooms_and_children` documentada
- [ ] `pnpm run lint` pasa sin errores (o los errores son pre-existentes y no relacionados con este spec)
- [ ] `npx tsc --noEmit` pasa sin errores

## Decisions

- **Sí:** Crear las tablas `rooms` y `children` en este spec. Son la base para el mantenimiento de niños.
- **No:** Crear las tablas en specs separados. Están directamente relacionadas y crearlas juntas es más eficiente.
- **Sí:** Incluir el enum `child_status` en este spec. Es dependencia directa de la tabla `children`.
- **No:** Dejar el enum para un spec posterior. No tiene uso sin la tabla.
- **Sí:** Seed de tres salas con nombres creativos ("Sala Soles", "Jardín de Estrellas", "Fuente de Arcoíris"). El usuario lo pidió explícitamente.
- **No:** Seed de niños. El usuario lo especificó: "no ocupamos ningún niño en la tabla".
- **Sí:** RLS con políticas basadas en `daycare_id` y rol `staff`. Sigue el patrón de SPEC 08.
- **No:** Políticas RLS para parents. Requiere la tabla `parent_children` que aún no existe.
- **Sí:** Agrupar niños por sala en la UI. El mockup actual ya muestra "SALA SOLES", es natural extenderlo a múltiples salas.
- **No:** Lista plana sin agrupación. El usuario confirmó que la vista actual soporta la idea de agrupaciones.
- **Sí:** Conectar el perfil `/kids/[id]` a Supabase. El usuario lo confirmó.
- **No:** Dejar el perfil con datos mockeados. El usuario confirmó que debe conectarse a DB.
- **Sí:** Leer salas desde DB en el dropdown de `AddKidDialog`. El usuario lo confirmó.
- **No:** Mantener opciones hardcoded en el dropdown. Sería inconsistente con el resto del spec.
- **Sí:** Incluir funcionalidad de archivar (cambiar `status` a `archived`). El usuario confirmó "Listar + Agregar + Archivar".
- **No:** Incluir edición de datos de niños. El usuario dijo "no hace falta un crud extendido".
- **Sí:** Convertir `app/kids/page.tsx` en Server Component. Es el patrón moderno de Next.js 16 para datos que pueden leerse en el servidor.
- **No:** Mantener como Client Component con fetching en el cliente. Sería menos eficiente y más complejo.
- **Sí:** Server Actions para todas las operaciones de DB. Es el patrón recomendado de Next.js 16 + Supabase SSR.
- **No:** API Routes (`/api/kids`). Agregaria complejidad innecesaria y no es el patrón moderno.
- **Sí:** `allergy_tags` como array de texto en inglés. Sigue el esquema de referencia. La UI traduce a español.
- **No:** Tabla normalizada `allergies` + `child_allergies`. Over-engineering para este caso.
- **Sí:** Todo en un solo archivo de migración `010_create_rooms_and_children.sql`. Sigue el patrón de specs anteriores.
- **No:** Separar en múltiples archivos de migración. Agregaria complejidad sin beneficio.
- **Sí:** Nombre de migración `010_create_rooms_and_children` (numerado, kebab-case). Sigue el patrón de specs anteriores.
- **No:** Conectar `ParentsSection` a DB en este spec. Depende de la tabla `parent_children` que aún no existe.

## Identified risks

- **RLS con subqueries en políticas:** Las políticas RLS usan `exists` con joins. Puede tener impacto en performance si hay muchos niños/salas, pero es aceptable para el volumen esperado de una guardería.
- **Conversión de fechas:** El formulario usa formato dd/mm/yyyy, pero la DB espera yyyy-mm-dd. La conversión en la Server Action debe ser robusta para evitar errores.
- **Allergy tags en inglés:** El usuario ingresa alergias en español (ej: "maní, lactosa"), pero se guardan en inglés (`{peanut, lactose}`). Por ahora, la conversión es manual en la Server Action. En el futuro, se podría normalizar con una tabla `allergies`.
- **Archivar sin confirmación avanzada:** El confirm dialog es simple. No hay "papelera" para restaurar niños archivaros en este spec.
- **ParentsSection con datos mockeados:** Puede ser confuso que el perfil muestre datos reales del niño pero datos mockeados de padres. Es aceptable temporalmente hasta que exista la tabla `parent_children`.

## What is **not** in this spec

- Tabla `parent_children` y lógica de vinculación padre-hijo.
- Tabla `invitations` y flujo de invitaciones.
- Edición de datos de niños (solo agregar y archivar).
- Búsqueda/filtrado de niños en la UI.
- Políticas RLS para parents.
- Otras tablas del esquema (`posts`, `post_children`, `reactions`, etc.).
- Restauración de niños archivaros (papelera).

Cada uno de esos, si se implementa, va en su propio spec.
