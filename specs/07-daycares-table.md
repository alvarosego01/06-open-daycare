# SPEC 07 — Tabla daycares (migracion inicial)

> **Status:** Approved
> **Depends on:** none
> **Date:** 2026-08-22
> **Objective:** Crear la primera tabla del esquema (`daycares`) en Supabase aplicando el patron de migraciones SQL versionadas con su archivo de control, sentando la base para las tablas posteriores.

## Scope

**In:**

- Crear la tabla `daycares` en Supabase con los campos del esquema de referencia: `id` (uuid PK), `name` (text), `created_at` (timestamptz)
- Aplicar la migracion mediante `supabase_apply_migration` (tool del MCP de Supabase)
- Crear la carpeta `migrations/` con el archivo `001_create_daycares.sql` que contiene el DDL
- Crear un archivo de control de migraciones (`migrations/README.md`) que liste las migraciones aplicadas con su numero, nombre, descripcion y estado
- Habilitar RLS (Row Level Security) en la tabla `daycares` sin definir politicas especificas en este spec
- Convencion de idioma: los datos persistidos van en ingles (aunque `name` es texto libre ingresado por el usuario, sin enum)
- Todo el codigo (nombres de tablas, columnas, funciones) en ingles

**Out of scope (para futuros specs):**

- Creacion de enums (`user_role`, `user_status`, `relationship_type`, etc.)
- Definicion de politicas RLS especificas para `daycares`
- Creacion de otras tablas del esquema (`users`, `rooms`, `children`, etc.)
- Triggers, funciones de base de datos o seed data
- Integracion con la capa de aplicacion (Next.js / Supabase client)
- Relaciones FK hacia otras tablas

## Data model

Tabla unica segun la referencia `opendaycare-database-schema.md` (seccion 1):

```sql
-- migrations/001_create_daycares.sql

create table if not exists public.daycares (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Habilitar RLS (sin politicas por ahora; se agregan en specs posteriores)
alter table public.daycares enable row level security;
```

Notas:

- `id`: UUID generado por `gen_random_uuid()` (Postgres 13+)
- `name`: texto obligatorio, ej. "Guarderia Sala Soles"
- `created_at`: timestamp con zona horaria, default `now()`
- No se definen enums ni FKs en este spec

## Implementation plan

1. Crear la carpeta `migrations/` en la raiz del proyecto.
2. Crear `migrations/001_create_daycares.sql` con el DDL de la tabla `daycares` y la habilitacion de RLS (ver Data model).
3. Ejecutar la migracion contra Supabase usando `supabase_apply_migration` con nombre `001_create_daycares` y el contenido del punto 2.
4. Verificar que la tabla fue creada: listar tablas del esquema y confirmar `daycares` con sus 3 columnas (`id`, `name`, `created_at`).
5. Verificar que RLS esta habilitado en `daycares` (sin politicas).
6. Crear `migrations/README.md` como archivo de control de migraciones, documentando la migracion `001_create_daycares` (numero, nombre, descripcion, estado `applied`).
7. Ejecutar `pnpm run lint` y `npx tsc --noEmit` para asegurar que no hay regresiones en el proyecto (este spec solo toca archivos SQL, pero se valida el repo).

## Acceptance criteria

- [ ] Existe la carpeta `migrations/` en la raiz del proyecto
- [ ] Existe `migrations/001_create_daycares.sql` con el DDL de la tabla `daycares`
- [ ] La migracion `001_create_daycares` se aplico sin errores via `supabase_apply_migration`
- [ ] La tabla `daycares` existe en Supabase con las columnas: `id` (uuid, PK), `name` (text), `created_at` (timestamptz)
- [ ] `id` tiene default `gen_random_uuid()`
- [ ] `created_at` tiene default `now()`
- [ ] RLS esta habilitado en la tabla `daycares` (sin politicas definidas)
- [ ] Existe `migrations/README.md` como archivo de control de migraciones
- [ ] `migrations/README.md` documenta la migracion `001_create_daycares` con numero, nombre, descripcion y estado `applied`
- [ ] No se crearon enums en este spec
- [ ] No se crearon otras tablas en este spec
- [ ] `pnpm run lint` pasa sin errores
- [ ] `npx tsc --noEmit` pasa sin errores

## Decisions

- **Si:** Patchron de migraciones con carpeta `migrations/` + archivo de control. Primera migracion del proyecto.
- **No:** Aplicar DDL directo sin control de versiones. El usuario pidio el patron de migraciones.
- **Si:** Solo la tabla `daycares` sin enums. El usuario explicito "solo tabla sencilla, no hay roles".
- **No:** Crear los enums del esquema en este spec. Van en specs posteriores cuando se necesiten.
- **Si:** Habilitar RLS sin politicas. Sentando la base de seguridad; las politicas vienen con los roles.
- **No:** Definir politicas RLS especificas ahora. No hay roles ni dependencias en este spec.
- **Si:** Nombre de migracion `001_create_daycares` (numerado, kebab-case).
- **Si:** `created_at` default `now()` y `id` default `gen_random_uuid()` segun convencion del esquema.

## Identified risks

- **RLS sin politicas:** Al habilitar RLS sin politicas, ningun rol podra leer/escribir hasta que se definan. Es intencional para este spec base; las politicas se agregan en specs posteriores. No afecta el desarrollo de la app mock actual (que no usa Supabase).
