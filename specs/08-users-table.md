# SPEC 08 — Tabla users, enums y trigger de auth

> **Status:** Implemented
> **Depends on:** SPEC 07
> **Date:** 2026-08-22
> **Objective:** Crear los enums `user_role` y `user_status`, la tabla `users` vinculada a `auth.users` via FK, el trigger de auto-creacion de perfil, politicas RLS basicas, y un usuario staff de seed para pruebas.

## Scope

**In:**

- Crear los enums `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`) en la base de datos
- Crear la tabla `users` con los campos del esquema de referencia: `id` (uuid PK, FK a `auth.users`), `daycare_id` (uuid FK a `daycares`), `role` (user_role), `status` (user_status, default `active`), `full_name` (text), `avatar_url` (text, nullable), `notify_on_post` (boolean, default true), `daily_summary_enabled` (boolean, default true), `created_at` / `updated_at` (timestamptz)
- Crear funcion `public.handle_new_user()` y trigger `on_auth_user_created` que se ejecuta `AFTER INSERT` en `auth.users`, creando automaticamente una fila en `public.users` usando `raw_user_meta_data` para `daycare_id`, `role` y `full_name`
- Habilitar RLS en la tabla `users` con politicas basicas:
  - Usuarios pueden leer su propio perfil (`auth.uid() = id`)
  - Staff puede leer todos los usuarios de su mismo daycare
  - Usuarios pueden actualizar su propio perfil
- Crear un usuario staff de seed con email `alvarosego01@gmail.com` y password `Abc12345@` para pruebas, vinculado al daycare existente
- Aplicar la migracion mediante `supabase_apply_migration` (tool del MCP de Supabase) con nombre `002_create_users`
- Crear el archivo `migrations/002_create_users.sql` con todo el DDL (enums, tabla, funcion, trigger, RLS, seed)
- Actualizar `migrations/README.md` documentando la nueva migracion
- Todo el codigo (nombres de tablas, columnas, funciones, enums) en ingles

**Out of scope (para futuros specs):**

- Creacion de otras tablas del esquema (`rooms`, `children`, `parent_children`, etc.)
- Politicas RLS mas granulares o basadas en roles complejos
- Integracion con la capa de aplicacion (Next.js / Supabase client) para login o signup
- UI de gestion de usuarios o perfiles
- Enums adicionales (`relationship_type`, `invitation_status`, `post_type`, `child_status`)
- Tabla intermedia `parent_children` o logica de vinculacion padre-hijo

## Data model

Segun la referencia `opendaycare-database-schema.md` (secciones 1-2):

```sql
-- migrations/002_create_users.sql

-- 1. Enums
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

-- 2. Tabla users
create table if not exists public.users (
  id                      uuid primary key references auth.users(id) on delete cascade,
  daycare_id              uuid not null references public.daycares(id) on delete cascade,
  role                    public.user_role not null,
  status                  public.user_status not null default 'active',
  full_name               text not null,
  avatar_url              text,
  notify_on_post          boolean not null default true,
  daily_summary_enabled   boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- 3. Funcion y trigger para auto-crear perfil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data->>'daycare_id')::uuid,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. RLS
alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Staff can read users in same daycare"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'staff'
        and u.daycare_id = users.daycare_id
    )
  );

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. Seed: usuario staff para pruebas
-- Nota: el signup de Supabase Auth se hace via la API, no via SQL directo.
-- Para el seed, insertamos directamente en auth.users y luego en public.users.
-- Esto requiere acceso con service role key.

-- Insertar en auth.users (Supabase Auth)
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token
)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'alvarosego01@gmail.com',
  crypt('Abc12345@', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"daycare_id": "<DAYCARE_ID>", "role": "staff", "full_name": "Alvaro Segovia"}',
  'authenticated',
  'authenticated',
  now(),
  now(),
  ''
);

-- Insertar en public.users (perfil de aplicacion)
insert into public.users (id, daycare_id, role, status, full_name)
values (
  (select id from auth.users where email = 'alvarosego01@gmail.com'),
  (select id from public.daycares limit 1),
  'staff',
  'active',
  'Alvaro Segovia'
);
```

Notas:

- `id`: FK a `auth.users(id)` con `ON DELETE CASCADE`. Mismo UUID que Supabase Auth.
- `daycare_id`: FK a `daycares(id)` con `ON DELETE CASCADE`.
- `role`: enum `user_role` (`staff`, `parent`, `admin`).
- `status`: enum `user_status` con default `active`.
- `full_name`: texto obligatorio.
- `avatar_url`: nullable.
- `notify_on_post` y `daily_summary_enabled`: booleanos con default `true`.
- `created_at` y `updated_at`: timestamps con zona horaria, default `now()`.
- El trigger `on_auth_user_created` lee `raw_user_meta_data` para extraer `daycare_id`, `role` y `full_name` durante el signup.
- El seed crea un usuario staff con email `alvarosego01@gmail.com` y password `Abc12345@` para pruebas.

## Implementation plan

1. Crear `migrations/002_create_users.sql` con el DDL completo: enums, tabla `users`, funcion `handle_new_user()`, trigger `on_auth_user_created`, habilitacion de RLS, politicas basicas y seed del usuario staff.
2. Ejecutar la migracion contra Supabase usando `supabase_apply_migration` con nombre `002_create_users` y el contenido del punto 1.
3. Verificar que los enums fueron creados: consultar `pg_type` para confirmar `user_role` y `user_status`.
4. Verificar que la tabla `users` fue creada con las columnas correctas: `id`, `daycare_id`, `role`, `status`, `full_name`, `avatar_url`, `notify_on_post`, `daily_summary_enabled`, `created_at`, `updated_at`.
5. Verificar que el trigger `on_auth_user_created` existe y esta asociado a `auth.users`.
6. Verificar que RLS esta habilitado en `users` y que las tres politicas fueron creadas.
7. Verificar que el usuario staff fue creado: consultar `auth.users` y `public.users` para confirmar que existe `alvarosego01@gmail.com` con rol `staff`.
8. Actualizar `migrations/README.md` documentando la migracion `002_create_users` (numero, nombre, descripcion, estado `applied`).
9. Ejecutar `pnpm run lint` y `npx tsc --noEmit` para asegurar que no hay regresiones en el proyecto.

## Acceptance criteria

- [x] Existe `migrations/002_create_users.sql` con el DDL completo
- [x] La migracion `002_create_users` se aplico sin errores via `supabase_apply_migration`
- [x] El enum `user_role` existe con valores `staff`, `parent`, `admin`
- [x] El enum `user_status` existe con valores `pending`, `active`
- [x] La tabla `users` existe con las columnas: `id` (uuid, PK, FK a auth.users), `daycare_id` (uuid, FK a daycares), `role` (user_role), `status` (user_status, default active), `full_name` (text), `avatar_url` (text, nullable), `notify_on_post` (boolean, default true), `daily_summary_enabled` (boolean, default true), `created_at` (timestamptz), `updated_at` (timestamptz)
- [x] `id` tiene FK a `auth.users(id)` con `ON DELETE CASCADE`
- [x] `daycare_id` tiene FK a `daycares(id)` con `ON DELETE CASCADE`
- [x] La funcion `handle_new_user()` existe y es `SECURITY DEFINER`
- [x] El trigger `on_auth_user_created` existe y se ejecuta `AFTER INSERT` en `auth.users`
- [x] RLS esta habilitado en la tabla `users`
- [x] Existe la politica "Users can read own profile" que permite a usuarios leer su propio perfil
- [x] Existe la politica "Staff can read users in same daycare" que permite a staff leer usuarios de su daycare
- [x] Existe la politica "Users can update own profile" que permite a usuarios actualizar su propio perfil
- [x] El usuario staff `alvarosego01@gmail.com` existe en `auth.users` con password `Abc12345@`
- [x] El usuario staff existe en `public.users` con rol `staff`, status `active`, full_name `Alvaro Segovia`, vinculado al daycare existente
- [x] Existe `migrations/README.md` actualizado con la migracion `002_create_users` documentada
- [x] `pnpm run lint` pasa sin errores (o los errores son pre-existentes y no relacionados con este spec)
- [x] `npx tsc --noEmit` pasa sin errores

## Decisions

- **Si:** Crear enums `user_role` y `user_status` en este spec. Son dependencia directa de la tabla `users`.
- **No:** Crear los enums en un spec separado. Agregaria complejidad innecesaria y los enums no tienen uso sin la tabla.
- **Si:** Incluir trigger `AFTER INSERT` en `auth.users` para auto-crear perfil. Es la forma correcta de sincronizar auth.users con public.users.
- **No:** Dejar el trigger para un spec posterior. Sin trigger, no hay forma de crear usuarios automaticamente durante el signup.
- **Si:** Incluir seed del usuario staff en la migracion. El usuario lo pidio explicitamente para pruebas.
- **No:** Crear el usuario staff manualmente via UI de Supabase. El usuario pidio un seed reproducible.
- **Si:** RLS con politicas basicas (leer propio perfil, staff lee usuarios de su daycare, actualizar propio perfil). Sentando la base de seguridad.
- **No:** RLS sin politicas (como en SPEC 07). La tabla `users` necesita politicas minimas para que los usuarios puedan acceder a sus datos.
- **No:** Politicas RLS mas granulares o basadas en roles complejos. Se agregan en specs posteriores cuando se necesiten.
- **Si:** Todo en un solo archivo de migracion `002_create_users.sql`. El usuario lo pidio explicitamente.
- **No:** Separar en multiples archivos de migracion. Agregaria complejidad sin beneficio en este caso.
- **Si:** Nombre de migracion `002_create_users` (numerado, kebab-case). Sigue el patron de SPEC 07.
- **Si:** `created_at` y `updated_at` con default `now()`. Sigue la convencion del esquema.
- **Si:** Funcion `handle_new_user()` con `SECURITY DEFINER` y `search_path = ''`. Buena practica de seguridad para funciones que acceden a multiples schemas.

## Identified risks

- **Seed con password en plaintext:** El password `Abc12345@` queda en el archivo de migracion. Es aceptable para un entorno de desarrollo/pruebas, pero no debe usarse en produccion. Para produccion, el password debe ingresarse via UI de Supabase o variables de entorno.
- **Trigger con `raw_user_meta_data`:** Si el signup no incluye `daycare_id`, `role` o `full_name` en `raw_user_meta_data`, el trigger fallara o creara un perfil incompleto. La capa de aplicacion (signup en Next.js) debe asegurar que estos campos se pasen correctamente.
- **RLS con subquery en politica de staff:** La politica "Staff can read users in same daycare" usa un `exists` con subquery. Puede tener impacto en performance si hay muchos usuarios, pero es aceptable para el volumen esperado de una guarderia.
