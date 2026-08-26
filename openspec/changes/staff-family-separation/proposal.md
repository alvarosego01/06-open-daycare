## Why

Actualmente toda la app corre como un solo panel de staff. No existe separación entre la experiencia del staff (que gestiona niños, crea publicaciones, ve la sala) y la experiencia de la familia (que ve un feed filtrado por sus hijos y su cuenta). Los mockups de referencia ya definen ambas experiencias (`feed.dc.html` vs `familia-feed.dc.html`, `mi-cuenta.dc.html` vs `familia-cuenta.dc.html`), pero la implementación no las refleja. Es necesario separar rutas, layouts y sidebars para que cada rol tenga su propio panel.

## What Changes

- **BREAKING**: Las rutas existentes (`/`, `/kids`, `/kids/[id]`) se mueven a `/staff/feed`, `/staff/kids`, `/staff/kids/[id]`
- Se crean nuevas rutas `/family/feed` y `/family/account` para el panel de familia
- Se divide `components/Sidebar.tsx` en `components/staff/StaffSidebar.tsx` y `components/family/FamilySidebar.tsx`
- Cada panel tiene su propio layout con protección de rutas basada en `users.role`
- La página root (`app/page.tsx`) se convierte en un redirect según el role del usuario
- El login (`app/(auth)/login/actions.ts`) redirige a `/staff/feed` o `/family/feed` según el role
- El family feed reutiliza `getPosts()` (que ya filtra por parent) pero con greeting y header distintos
- El family account muestra "Mis hijos" con toggles de fotos y configuración de notificaciones

## Capabilities

### New Capabilities

- `staff-panel`: Rutas del staff (`/staff/feed`, `/staff/kids`, `/staff/kids/[id]`), `StaffSidebar` con nav completo (Feed, Niños, Avisos, Mi cuenta), layout con protección de role (staff/admin), y migración de archivos existentes desde `app/kids/` a `app/staff/kids/`
- `family-panel`: Rutas de familia (`/family/feed`, `/family/account`), `FamilySidebar` con nav reducido (Feed, Mi cuenta) y sin botón "Nueva publicación", layout con protección de role (parent)
- `role-based-routing`: Página root como redirect según role, y actualización del redirect post-login para enviar a cada panel según `users.role`

### Modified Capabilities

(ninguna — no hay specs previos en `openspec/specs/` que modifiquen comportamiento a nivel de requisito)

## Impact

- **Rutas**: Todas las rutas existentes cambian de path. Cualquier bookmark o link externo a `/` o `/kids` dejará de funcionar (el redirect del root mitiga esto para `/`)
- **Componentes**: `components/Sidebar.tsx` se depreca; se crean dos nuevos sidebars. `PostCard` no cambia. `KidsListClient` se mueve y se actualizan sus hrefs internos
- **Server Actions**: `app/kids/actions.ts` se mueve a `app/staff/kids/actions.ts` con `revalidatePath` actualizado. `app/actions/posts.ts` no cambia (ya filtra por role)
- **Login**: `app/(auth)/login/actions.ts` necesita consultar `users.role` antes de redirigir
- **Middleware**: No requiere cambios (la protección se hace en los layouts)
- **Dependencias**: Ninguna nueva
