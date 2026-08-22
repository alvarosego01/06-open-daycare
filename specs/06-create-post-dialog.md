# SPEC 06 — Crear publicacion dialog

> **Status:** Implemented
> **Depends on:** SPEC 04, SPEC 05
> **Date:** 2026-08-22
> **Objective:** Implementar el dialogo "Nueva publicacion" en el feed que permita seleccionar destinatario (PARA), tipo de post (TIPO), descripcion y fotos mock, con persistencia en el array de posts y triggers desde el Sidebar y el composer del feed.

## Scope

**In:**

- Implementar dialogo triggered por el boton "Nueva publicacion" en el Sidebar Y por el composer "Comparti un momento..." en el feed (`app/page.tsx`)
- Coincidir con el diseno visual de `references/pantallas/crear-publicacion.dc.html` (colores, espaciado, tipografia, border-radius)
- Estructura del dialogo:
  - Header: "Cancelar" (izquierda, color `#94887B`), "Nueva publicacion" (centro, Fredoka 600 18px), "Publicar" (derecha, color `#D9583C`, font-weight 800)
  - Seccion PARA: pills de ninos seleccionables (datos mock de `data/kids.ts`) + opcion "Toda la sala"
  - Seccion TIPO: 7 pills de categorias (Comida, Siesta, Actividad, Logro, Animo, Foto, Anuncio)
  - Seccion DESCRIPCION: textarea opcional
  - Seccion FOTOS: grid con thumbnails de fotos mock (`public/photos/`) + boton "Agregar"
- Validacion: PARA y TIPO son obligatorios. Muestran borde rojo (`#D9583C`) al hacer click en "Publicar" si no estan seleccionados
- "Publicar" valido: crea objeto `Post`, lo agrega al array mock `posts` (al inicio), cierra el dialogo y resetea el formulario
- "Cancelar" y click en backdrop cierran el dialogo sin publicar
- Escape cierra el dialogo
- Extender el tipo `Post` para soportar las 7 categorias
- Crear 3 archivos SVG placeholder en `public/photos/` para poder leerlos desde el dialogo de fotos
- Reutilizar componente `Dialog` de SPEC 04 (anadir prop `maxWidth` para llegar a 580px)
- Todo el texto visible en espanol para coincidir con la referencia
- Todo el codigo (variables, funciones, tipos, interfaces) en ingles

**Out of scope (para futuros specs):**

- Subida real de archivos (input file) o drag-and-drop de fotos
- Edicion o eliminacion de publicaciones
- Persistencia en backend o API real
- Notificaciones push a familiares
- Filtrado del feed por nino o tipo
- Comentarios y likes funcionales en las publicaciones
- Vista previa de la publicacion antes de publicar

## Data model

Este spec extiende el tipo `Post` existente en `data/posts.ts` para soportar las 7 categorias del diseno, y agrega fotos.

```ts
// data/posts.ts — tipo extendido

// 7 categorias segun la referencia (badge label + colores)
type PostCategory =
  | "comida"
  | "siesta"
  | "actividad"
  | "logro"
  | "animo"
  | "foto"
  | "anuncio";

type PostAuthor = {
  name: string;
  initial: string;
  bgColor: string;
  textColor: string;
};

type Post = {
  id: string;
  category: PostCategory;
  author: PostAuthor;
  timestamp: string;
  publishedBy: string;
  recipient: string;
  content: string;
  photos?: string[]; // rutas a public/photos/*.svg
  likes: number;
  comments: number;
};
```

Mapeo de categoria a badge (label + colores de la referencia):

```ts
const POST_CATEGORY_META: Record<
  PostCategory,
  { label: string; bg: string; text: string }
> = {
  comida:     { label: "Comida",     bg: "#9A7B1E", text: "#FFFFFF" },
  siesta:     { label: "Siesta",     bg: "#E7DCF6", text: "#7B5FC0" },
  actividad:  { label: "Actividad",  bg: "#2E89A6", text: "#FFFFFF" },
  logro:      { label: "Logro",      bg: "#CFEBD8", text: "#3E9B6C" },
  animo:      { label: "Animo",      bg: "#F9D2DE", text: "#C56486" },
  foto:       { label: "Foto",       bg: "#FBD8CC", text: "#D9684A" },
  anuncio:    { label: "Anuncio",    bg: "#CCD8F4", text: "#4E72C8" },
};
```

Datos mock para el selector de fotos (en `components/CreatePostDialog.tsx` o `data/`):

```ts
const MOCK_PHOTOS = [
  "/photos/painting.svg",
  "/photos/playground.svg",
  "/photos/snack.svg",
];
```

Ninios mock para el selector PARA (reusa `kids` de `data/kids.ts`): se muestran Mateo, Sofia, Benjamin y la opcion "Toda la sala".

Formulario:

```ts
type CreatePostFormData = {
  recipient: string;   // id del nino o "" para "Toda la sala"
  category: PostCategory | null;
  content: string;
  photos: string[];
};
```

Convenciones visuales (heredadas de SPEC 04/05):

- Container bg `#FBF4EC`, border `#ECE0D0`, card shadow `0 20px 50px -24px rgba(63,54,46,.35)`, max-width 580px
- Borde de error: `#D9583C`
- Label style: 12px, font-weight 800, letter-spacing 0.7px, color `#94887B`
- Pills PARA seleccionado: bg `#3F362E`, text `#fff`; no seleccionado: bg `#FFFDF9`, border `#ECE0D0`, text `#6E6359`
- Pills TIPO: usan `POST_CATEGORY_META` (bg/text del badge)
- Fotos: tile 96x96, border-radius 14px, boton "Agregar" con borde punteado `#DBCDBA` y icono `+` color `#C5503A`

## Implementation plan

1. Crear carpeta `public/photos/` con 3 archivos SVG placeholder (ej. `painting.svg`, `playground.svg`, `snack.svg`) que representen escenas de guarderia (colores del mock). Estos son los archivos que el dialogo lee para mostrar las fotos mock.

2. Extender `data/posts.ts`:
   - Reemplazar la union discriminada por el tipo `Post` unico con campo `category: PostCategory` y `photos?: string[]`
   - Agregar `POST_CATEGORY_META`
   - Actualizar los 3 posts existentes: post 1 -> `category: "logro"`, post 2 -> `category: "actividad"`, post 3 -> `category: "anuncio"`
   - Exportar `PostCategory`, `Post`, `POST_CATEGORY_META`
   - Verificar que `components/PostCard.tsx` siga compilando (actualizar su uso de `type`/`photoPlaceholder` al nuevo `category`/`photos`)

3. Anadir prop `maxWidth` al componente `components/Dialog.tsx` (default `"md:max-w-[520px]"`) y usarla en la className del contenedor. El dialogo de crear publicacion usa `maxWidth="md:max-w-[580px]"`.

4. Crear `components/CreatePostDialog.tsx`:
   - Usa `Dialog` como wrapper con `maxWidth="md:max-w-[580px]"`
   - Props: `open: boolean`, `onClose: () => void`, `onPostCreated?: (post: Post) => void`
   - Header: "Cancelar" (izquierda, `#94887B`), "Nueva publicacion" (centro, Fredoka 600 18px), "Publicar" (derecha, `#D9583C`, font-weight 800)
   - Seccion PARA: pills de ninos (de `kids`) + "Toda la sala", seleccion unica, default Mateo
   - Seccion TIPO: 7 pills usando `POST_CATEGORY_META`, seleccion unica (default null)
   - Seccion DESCRIPCION: textarea (placeholder "Conta como le fue hoy...", min-height 120px), opcional, prellenada con texto de ejemplo de la referencia
   - Seccion FOTOS: grid de `MOCK_PHOTOS` (thumbnails 96x96 seleccionables) + boton "Agregar" (borde punteado). Click en foto la selecciona/deselecciona
   - Estado: `useState` para `recipient`, `category`, `content`, `photos`, y `hasError` booleans para `recipient` y `category`
   - Click "Publicar": valida `recipient` y `category`. Si invalido, marca error (borde rojo). Si valido, crea `Post` (id incremental, author = nino seleccionado o autor general para "Toda la sala", timestamp `HH:MM` actual, publishedBy "publicado por vos", recipient = nombre del nino o "" para "Toda la sala", content, photos), agrega al inicio del array `posts` (mutando el mock para persistencia en sesion), llama `onPostCreated`, resetea y `onClose`
   - "Cancelar" / backdrop / Escape: resetea y `onClose`

5. Actualizar `components/Sidebar.tsx` para que el dialogo viva ahi (unica instancia compartida):
   - Convertir a `forwardRef` y exponer `openCreatePost()` via `useImperativeHandle`
   - Estado `createPostOpen`; boton "Nueva publicacion" setea `true`
   - Renderiza `<CreatePostDialog open={createPostOpen} onClose={...} />`

6. Actualizar `app/page.tsx` (feed):
   - Convertir a client component o crear wrapper client que tenga el ref al Sidebar
   - El composer "Comparti un momento..." (actualmente `<a href="#">`) se vuelve `<button>` que llama `sidebarRef.current?.openCreatePost()`
   - Pasar `ref={sidebarRef}` al `<Sidebar>`

7. Ejecutar `pnpm run lint` y `npx tsc --noEmit`. Verificacion visual en multiples breakpoints contra la referencia.

## Acceptance criteria

- [ ] El feed (`/`) carga sin errores
- [ ] Click en "Nueva publicacion" del Sidebar abre el dialogo
- [ ] Click en "Comparti un momento..." del feed abre el mismo dialogo
- [ ] El dialogo coincide visualmente con la referencia: header (Cancelar / Nueva publicacion / Publicar), labels de seccion, pills, textarea, grid de fotos
- [ ] Los pills PARA muestran Mateo, Sofia, Benjamin (de `data/kids.ts`) + "Toda la sala"
- [ ] Mateo aparece seleccionado por defecto en PARA
- [ ] Los pills TIPO muestran las 7 categorias con sus colores de la referencia
- [ ] Seleccionar un pill TIPO lo resalta; solo uno puede estar activo
- [ ] La DESCRIPCION es un textarea prellenado con el texto de ejemplo, es opcional
- [ ] La seccion FOTOS muestra 3 thumbnails leidos desde `public/photos/` + boton "Agregar"
- [ ] Click en una foto la selecciona (marcada) y click de nuevo la deselecciona
- [ ] PARA y TIPO son obligatorios
- [ ] "Publicar" con PARA o TIPO faltante muestra borde rojo (`#D9583C`) en el campo faltante
- [ ] "Publicar" valido agrega el post al inicio del array `posts` con `category` correcta, recipient = nombre del nino o "" para "Toda la sala", content y photos
- [ ] Tras "Publicar", el nuevo post aparece arriba del feed
- [ ] "Publicar" cierra el dialogo y resetea el formulario
- [ ] "Cancelar" cierra el dialogo sin publicar y resetea
- [ ] Click en backdrop cierra el dialogo
- [ ] Escape cierra el dialogo
- [ ] Desktop (md+): dialogo es card centrada (max-width 580px) con backdrop negro 40% + blur
- [ ] Mobile (< md): dialogo es full-screen sheet
- [ ] El componente `Dialog` sigue siendo reutilizable (prop `maxWidth` no rompe usos previos)
- [ ] `components/PostCard.tsx` compila y muestra los posts existentes con la nueva estructura `category`/`photos`
- [ ] Sin errores de TypeScript (`npx tsc --noEmit` pasa)
- [ ] Sin errores de lint en el codigo de aplicacion
- [ ] Fredoka para el titulo del dialogo, Nunito para el texto del body
- [ ] Sin scroll horizontal en ningun viewport

## Decisions

- **Si:** Expandir `Post` a un tipo unico con `category` de 7 valores. Mas fiel al diseno que mapear a 3 tipos.
- **No:** Mantener la union discriminada de 3 tipos. No cubre las 7 categorias de la referencia.
- **Si:** Persistir el post en el array mock `posts` (mutandolo en sesion). El usuario lo pidio explicitamente ("grabala en el json original").
- **No:** Solo validar sin persistir. Contradice el requerimiento.
- **Si:** Crear fotos SVG placeholder en `public/photos/`. El usuario pidio "colocala en un folder aca mismo en proyecto para poderla leer".
- **No:** Usar solo divs de color como placeholders. El usuario quiere archivos leibles en el proyecto.
- **Si:** Unica instancia del dialogo en el Sidebar, expuesta via `forwardRef` + `useImperativeHandle` al feed. Evita duplicar dialogo y estado.
- **No:** Dos dialogos separados (Sidebar y feed). Duplicaria estado y podria abrir dos a la vez.
- **No:** Eventos custom `window.dispatchEvent`. Menos estandar que `forwardRef`.
- **Si:** Agregar prop `maxWidth` a `Dialog`. Permite 580px sin romper el default de 520px de specs previos.
- **No:** Hardcodear 580px dentro de `Dialog`. Perderia reusabilidad.
- **Si:** "Toda la sala" deja `recipient` vacio. Consistencia con el post tipo anuncio existente.
- **Si:** Seleccion unica en PARA y en TIPO. Mas simple y coincide con el diseno de pills.
- **Si:** "Publicar" cierra y resetea. Confirmado por el usuario.
- **Si:** Validacion muestra borde rojo solo, sin mensaje de texto. Coincide con el estilo minimo de la referencia y los specs 04/05.

## What is **not** in this spec

- Subida real de archivos o drag-and-drop de fotos
- Edicion o eliminacion de publicaciones
- Persistencia en backend o API real
- Notificaciones push a familiares
- Filtrado del feed por nino o tipo
- Comentarios y likes funcionales
- Vista previa antes de publicar

Cada uno de esos, si es necesario, va en su propio spec.
