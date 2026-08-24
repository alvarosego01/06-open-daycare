# SPEC 11 — Vinculación padre-hijo: invitación por email y registro

> **Status:** Approved
> **Depends on:** SPEC 05, SPEC 09, SPEC 10
> **Date:** 2026-08-24
> **Objective:** Crear la tabla `invitations` en Supabase, integrar Resend para enviar emails de invitación con un código, y conectar los flujos de envío de invitación (dialog "Vincular padre") y registro del padre (página `/activate`) a datos reales.

## Scope

**In:**

- Crear la tabla `invitations` en Supabase según el schema de referencia (sección 6), con columnas: `id`, `child_id`, `invited_by`, `full_name`, `email`, `relationship`, `code` (UNIQUE), `status`, `expires_at`, `accepted_at`, `created_at`
- Crear la tabla `parent_children` en Supabase según el schema de referencia (sección 5), con columnas: `id`, `parent_id`, `child_id`, `relationship`, `created_at`, UNIQUE(`parent_id`, `child_id`)
- Habilitar RLS en ambas tablas con políticas para:
  - Staff puede crear invitaciones en su daycare (verificando que el niño pertenece a su daycare vía `rooms`)
  - Staff puede leer invitaciones de su daycare
  - El padre invitado puede leer su propia invitación aceptada (por `email` = `auth.jwt().email`)
- Instalar el paquete `resend` via `pnpm`
- La variable de entorno `RESEND_API_KEY` ya existe en `.env` (configurada previamente)
- Crear módulo `utils/email/resend.ts` con el cliente Resend y la función `sendInvitationEmail()`
- Crear Server Action `sendInvitation()` en `app/actions/invitations.ts`:
  - Recibe `childId`, `fullName`, `email`, `relationship`, `code`
  - Verifica que el staff tenga acceso al niño (mismo daycare vía `rooms`)
  - Inserta en `public.invitations` con `status = 'pending'` y `expires_at` = ahora + 7 días
  - Envía email vía Resend al email del padre con el código de invitación
  - Retorna `{ success: true }` o `{ error: string }`
- Crear Server Action `activateParent(formData)` en `app/actions/invitations.ts`:
  - Recibe `invitationCode`, `email`, `password`, `authorizedPhotos` del formData
  - Busca la invitación por código con `status = 'pending'`
  - Valida que no esté expirada (`expires_at > now()`)
  - Verifica que el email coincide con el de la invitación
  - Intenta crear el usuario en Supabase Auth (`signUp` con email + password)
  - Si el email ya existe en Auth, retorna `{ error: 'email_exists', message: 'Este email ya tiene una cuenta registrada' }`
  - Crea fila en `public.users` con `role = 'parent'`, `status = 'active'`, `daycare_id` obtenido de la invitación (vía `children` → `rooms` → `daycare_id`), `full_name` de la invitación
  - Crea fila en `public.parent_children` con `parent_id`, `child_id`, `relationship` de la invitación
  - Actualiza la invitación a `status = 'accepted'` y `accepted_at = now()`
  - Retorna `{ success: true }` o `{ error: string }`
- Modificar `LinkParentDialog` para que al hacer "Enviar invitación" llame a la Server Action `sendInvitation()` en lugar de la lógica mock
- El código de invitación sigue generándose client-side para mostrarlo en el dialog (el server lo acepta tal cual, con reintento si hay colisión UNIQUE)
- Después de enviar exitosamente, agregar el padre al estado local de `ParentsSection` con `status: "pending"` (comportamiento visual actual)
- Convertir `app/(auth)/activate/page.tsx` en Client Component con formulario funcional:
  - Campo "Código de invitación" editable (input, variant mono)
  - Campo "Email" editable (input type email)
  - Campo "Crear contraseña" (input type password)
  - Checkbox de autorización de fotos
  - Botón "Activar mi cuenta" que llama a `activateParent(formData)`
  - Estados de error: código inválido, código expirado, email no coincide, email ya existe, error de contraseña
  - Mostrar mensajes de error simples debajo del botón
  - Después de activar exitosamente, redirigir a `/login`
- Todo el texto visible en español, todo el código en inglés

**Out of scope (para futuros specs):**

- Reenviar invitación si el padre no la recibió
- Cancelar invitación pendiente desde la UI
- Leer la lista de padres en `ParentsSection` desde la DB (sigue con estado local)
- Página de login funcional (SPEC 03 la dejó visual)
- Recuperación de contraseña
- Edición de datos del padre
- Feed filtrado del padre
- Cron job para marcar invitaciones expiradas (la expiración se valida solo al usar)
- Plantilla de email con diseño elaborado (HTML rich)

## Data model

```sql
-- migrations/011_create_invitations_and_parent_children.sql

-- 1. Tabla parent_children
create table if not exists public.parent_children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.users(id) on delete cascade,
  child_id     uuid not null references public.children(id) on delete cascade,
  relationship public.relationship_type not null,
  created_at   timestamptz not null default now(),
  unique (parent_id, child_id)
);

-- 2. Tabla invitations
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children(id) on delete cascade,
  invited_by  uuid not null references public.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  relationship public.relationship_type not null,
  code        text not null unique,
  status      public.invitation_status not null default 'pending',
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- 3. RLS
alter table public.parent_children enable row level security;
alter table public.invitations enable row level security;

-- Políticas para parent_children
create policy "Staff can read parent_children in their daycare"
  on public.parent_children for select
  using (
    exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      join public.users u on u.daycare_id = r.daycare_id
      where c.id = parent_children.child_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

create policy "Parents can read their own parent_children"
  on public.parent_children for select
  using (parent_id = auth.uid());

-- Políticas para invitations
create policy "Staff can read invitations in their daycare"
  on public.invitations for select
  using (
    exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      join public.users u on u.daycare_id = r.daycare_id
      where c.id = invitations.child_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

create policy "Staff can insert invitations in their daycare"
  on public.invitations for insert
  with check (
    exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      join public.users u on u.daycare_id = r.daycare_id
      where c.id = invitations.child_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

create policy "Invited parent can read their accepted invitation"
  on public.invitations for select
  using (email = auth.jwt() ->> 'email' and status = 'accepted');
```

Notas:

- Los enums `relationship_type` (`father`, `mother`, `guardian`) e `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`) ya existen en la base de datos (se crearon en migraciones anteriores).
- `invitations.code` es UNIQUE. Si hay colisión, la Server Action reintenta con un nuevo código.
- `invitations.expires_at` se setea a `now() + 7 days` al crear. No hay cron job; la expiración se valida al usar.
- `parent_children` tiene UNIQUE(`parent_id`, `child_id`) para evitar vínculos duplicados.
- Las políticas RLS de `invitations` verifican que el niño pertenece al daycare del staff.
- El padre invitado solo puede leer su invitación después de aceptarla (para verificar su estado).

## Implementation plan

1. **Instalar Resend.** Ejecutar `pnpm add resend`. Verificar que aparece en `dependencies` del `package.json`.

2. **Verificar variable de entorno.** La variable `RESEND_API_KEY` ya existe en `.env` con el valor configurado. No es necesario agregarla.

3. **Crear cliente Resend.** Crear `utils/email/resend.ts` con:
   - Instancia de `Resend` usando `process.env.RESEND_API_KEY`
   - Función `sendInvitationEmail(params: { to: string, parentName: string, childName: string, code: string })` que envía un email con asunto "Te invitaron a OpenDayCare" y body de texto simple: saludo por nombre, nombre del niño, código de invitación, instrucciones breves para activar la cuenta en `/activate`
   - From: `"OpenDayCare <onboarding@resend.dev>"` (dominio de prueba de Resend)

4. **Crear migración.** Crear `migrations/011_create_invitations_and_parent_children.sql` con el DDL del section Data model: tablas `parent_children` e `invitations`, RLS habilitado, políticas de acceso.

5. **Aplicar migración.** Ejecutar `supabase_apply_migration` con nombre `011_create_invitations_and_parent_children`. Verificar que las tablas y políticas se crearon correctamente.

6. **Crear Server Action `sendInvitation`.** Crear `app/actions/invitations.ts` con:
   - Obtiene el usuario actual y su `daycare_id`
   - Valida que el `child_id` pertenece a su daycare (vía `rooms`)
   - Inserta en `public.invitations` con los datos del formulario, `status = 'pending'`, `expires_at = now() + 7 days`
   - Si hay error de UNIQUE en `code`, genera un nuevo código y reintenta (max 3 intentos)
   - Llama a `sendInvitationEmail()` de Resend
   - Retorna `{ success: true }` o `{ error: string }`

7. **Crear Server Action `activateParent`.** Crear en `app/actions/invitations.ts`:
   - Extrae `invitationCode`, `email`, `password`, `authorizedPhotos` del formData
   - Busca invitación por `code` con `status = 'pending'`
   - Si no existe: retorna error "Código de invitación no válido"
   - Si `expires_at < now()`: retorna error "La invitación ha expirado"
   - Si `invitation.email !== email`: retorna error "El email no coincide con la invitación"
   - Intenta `supabase.auth.signUp({ email, password })` con `raw_user_meta_data: { full_name, daycare_id }` (el `daycare_id` se obtiene de la invitación: `children.room_id` → `rooms.daycare_id`)
   - Si Auth retorna error de "User already registered": retorna `{ error: 'email_exists', message: 'Este email ya tiene una cuenta registrada' }`
   - Inserta en `public.users` con `id = auth_user.id`, `role = 'parent'`, `status = 'active'`, `daycare_id`, `full_name`
   - Inserta en `public.parent_children` con `parent_id`, `child_id`, `relationship`
   - Actualiza invitación: `status = 'accepted'`, `accepted_at = now()`
   - Retorna `{ success: true }`

8. **Modificar `LinkParentDialog` para usar Server Action.** Cambiar el componente:
   - Importar `sendInvitation` de `app/actions/invitations`
   - Agregar estado `submitting: boolean` para deshabilitar el botón durante el envío
   - En `handleSubmit`: después de validar campos, llamar a `sendInvitation({ childId: kidId, fullName: form.name, email: form.email, relationship: mapRelationship(form.relationship), code: invitationCode })`
   - `mapRelationship` convierte las labels de la UI a valores DB: "Mamá" → `mother`, "Papá" → `father`, "Tutor/a" → `guardian`
   - Si la acción retorna error, mostrar un mensaje simple (alert o texto rojo debajo del botón)
   - Si retorna success, ejecutar el comportamiento actual (agregar padre al estado local, cerrar dialog)

9. **Convertir `activate/page.tsx` en Client Component funcional.** Reescribir la página:
   - Agregar directiva `"use client"`
   - Estado para: `code`, `email`, `password`, `authorized`, `error`, `loading`
   - Los campos `code` y `email` ahora son inputs editables (no solo display)
   - El checkbox de autorización es funcional (toggle)
   - Al hacer submit: llamar a `activateParent(formData)`
   - Mostrar estados de error con texto rojo debajo del botón
   - Después de éxito: `router.push('/login')`
   - Mantener el diseño visual actual (colores, espaciado, tipografía)

10. **Actualizar `migrations/README.md`.** Documentar la migración `011_create_invitations_and_parent_children`.

11. **Ejecutar `pnpm run lint` y `npx tsc --noEit`.** Verificar que no hay errores.

## Acceptance criteria

- [ ] Existe `migrations/011_create_invitations_and_parent_children.sql` con el DDL completo
- [ ] La migración se aplicó sin errores via `supabase_apply_migration`
- [ ] La tabla `invitations` existe con todas las columnas del schema de referencia
- [ ] La tabla `parent_children` existe con todas las columnas del schema de referencia
- [ ] `invitations.code` tiene restricción UNIQUE
- [ ] `parent_children` tiene UNIQUE(`parent_id`, `child_id`)
- [ ] RLS está habilitado en ambas tablas
- [ ] Existen políticas RLS para que staff lea e inserte invitaciones de su daycare
- [ ] Existe política RLS para que el padre lea su invitación aceptada
- [ ] Existen políticas RLS para `parent_children` (staff lee las de su daycare, padres leen las propias)
- [ ] El paquete `resend` está instalado en `dependencies`
- [ ] Existe `RESEND_API_KEY` en `.env` (ya configurada)
- [ ] Existe `utils/email/resend.ts` con la función `sendInvitationEmail()`
- [ ] Existe `app/actions/invitations.ts` con Server Actions `sendInvitation()` y `activateParent()`
- [ ] `LinkParentDialog` llama a `sendInvitation()` al hacer "Enviar invitación"
- [ ] "Enviar invitación" inserta una fila en `public.invitations` con `status = 'pending'`
- [ ] "Enviar invitación" envía un email vía Resend al email del padre con el código
- [ ] El email contiene el código de invitación de 5 caracteres y el nombre del niño
- [ ] Si el código ya existe en DB, se reintenta con un nuevo código (max 3 intentos)
- [ ] `app/(auth)/activate/page.tsx` es un Client Component con formulario funcional
- [ ] El campo "Código de invitación" es editable en `/activate`
- [ ] El campo "Email" es editable en `/activate`
- [ ] El campo "Crear contraseña" es funcional (input type password)
- [ ] El checkbox de autorización de fotos es funcional
- [ ] Al activar con un código válido: se crea el usuario en Auth, `public.users`, y `public.parent_children`
- [ ] La invitación cambia a `status = 'accepted'` y `accepted_at` se setea
- [ ] Si el email ya existe en Auth: se muestra mensaje "Este email ya tiene una cuenta registrada" y se cancela
- [ ] Si el código es inválido: se muestra mensaje de error
- [ ] Si el código está expirado: se muestra mensaje de error
- [ ] Si el email no coincide con la invitación: se muestra mensaje de error
- [ ] Después de activar exitosamente, se redirige a `/login`
- [ ] `ParentsSection` sigue mostrando el padre agregado con `status: "pending"` después de enviar invitación
- [ ] `pnpm run lint` pasa sin errores
- [ ] `npx tsc --noEmit` pasa sin errores

## Decisions

- **Sí:** Integrar Resend desde Server Action de Next.js. El usuario confirmó la recomendación.
- **No:** Edge Function de Supabase para enviar emails. Agrega complejidad innecesaria.
- **Sí:** Crear tabla `invitations` en este spec. Es el corazón del flujo de invitación.
- **No:** Dejar `invitations` para otro spec. Sin tabla no hay flujo real.
- **Sí:** Crear tabla `parent_children` en este spec. Es necesaria para el vínculo padre-hijo al activar.
- **No:** Dejar `parent_children` para otro spec. SPEC 10 la diferió explícitamente; este es el spec correcto para crearla.
- **Sí:** Generar código de invitación client-side (en `ParentsSection`) y pasarlo al server. Permite mostrarlo en el dialog antes de enviar.
- **No:** Generar código solo server-side. El staff no vería el código antes de enviar.
- **Sí:** Verificar email existente solo al activar, no al enviar invitación. Más simple y cubre el caso correctamente.
- **No:** Verificar al enviar invitación. Agrega complejidad y no cubre el caso de cuenta creada entre envío y activación.
- **Sí:** Validar expiración solo al usar (sin cron job). Más simple, suficiente para el volumen esperado.
- **No:** Cron job que marca invitaciones expiradas. Over-engineering para este caso.
- **Sí:** Email con solo el código + instrucciones breves (texto simple). El usuario confirmó opción A.
- **No:** Email con link directo a `/activate?code=XXX`. El usuario prefirió solo el código.
- **No:** Email con diseño HTML elaborado (rich template). Over-engineering para la versión actual.
- **Sí:** Convertir `/activate` en Client Component funcional. Necesario para el flujo de registro interactivo.
- **No:** Mantener `/activate` como Server Component estático. El usuario confirmó que debe ser funcional.
- **Sí:** Campos de código y email editables en `/activate`. El usuario puede copiar el código del email y escribir su email.
- **No:** Campos pre-rellenados. No hay forma de pasar los datos del dialog al email de manera segura.
- **Sí:** Mapear labels de UI a valores DB: "Mamá" → `mother`, "Papá" → `father`, "Tutor/a" → `guardian`.
- **No:** Guardar labels de UI en DB. El schema usa enum `relationship_type` con valores en inglés.
- **Sí:** Manejo de error `email_exists` con mensaje sencillo. El usuario confirmó opción A.
- **No:** Flujo complejo de recuperación o vinculación de cuenta existente.
- **Sí:** Ambas tablas en un solo archivo de migración `011_create_invitations_and_parent_children.sql`. Sigue el patrón de SPEC 10.
- **No:** Separar en dos archivos de migración. Están directamente relacionadas y crearlas juntas es más eficiente.
- **Sí:** From address `onboarding@resend.dev` (dominio de prueba de Resend). Suficiente para desarrollo.
- **No:** Dominio personalizado. Se configura cuando se despliegue a producción.
- **Sí:** Manejo de errores secuencial sin rollback transaccional. Si la creación de Auth falla, no hay datos parciales. Si falla después, el usuario puede reintentar.
- **No:** Rollback manual complejo. El footprint de datos es mínimo y el caso es raro.

## Identified risks

- **Resend en modo test:** Con la API key de test, los emails solo se envían a addresses verificadas en el dashboard de Resend. Para desarrollo, el usuario debe verificar los emails de prueba o usar el dominio `resend.dev`.
- **Sin transacciones reales:** Si `signUp` funciona pero la inserción en `public.users` falla, queda un usuario huérfano en Auth. Mitigación: el usuario puede reintentar y el check de "email exists" lo detecta.
- **Código de invitación visible en el dialog:** El código se genera client-side y se muestra antes de enviar. Si el staff no envía, el código no existe en DB. Esto es aceptable: el código solo es válido si existe en la tabla `invitations`.
- **Email delivery en desarrollo:** Los emails pueden no llegar o ir a spam. Para testing, se puede verificar en los logs de Resend o usar `console.log` como fallback.

## What is **not** in this spec

- Reenviar invitación si el padre no la recibió.
- Cancelar invitación pendiente desde la UI.
- Leer la lista de padres en `ParentsSection` desde la DB.
- Página de login funcional.
- Recuperación de contraseña.
- Edición de datos del padre.
- Feed filtrado del padre.
- Cron job para marcar invitaciones expiradas.
- Plantilla de email con diseño HTML elaborado.

Cada uno de esos, si es necesario, va en su propio spec.
