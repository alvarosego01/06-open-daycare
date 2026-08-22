# SPEC 07 — Crear tabla daycares con patrón de migraciones

> **Status:** Draft  
> **Depends on:** (none)  
> **Date:** 2026-08-22  
> **Objective:** Crear la tabla `daycares` en Supabase siguiendo el patrón de migraciones imperativas con Supabase CLI, incluyendo setup inicial de la herramienta, seed data de prueba y verificación manual en la plataforma.

## Scope

**In:**

- Configurar Supabase CLI localmente (`supabase init`, link al proyecto remoto)
- Crear la tabla `daycares` con la estructura definida en el schema de referencia:
  - `id` uuid PK (default `gen_random_uuid()`)
  - `name` text NOT NULL
  - `created_at` timestamptz default `now()`
- Crear todos los ENUMs definidos en el schema de referencia (aunque `daycares` no los use todavía):
  - `user_role`, `user_status`, `relationship_type`, `invitation_status`, `post_type`, `child_status`
- Insertar seed data: 2-3 daycares de ejemplo (ej. "Guardería Sala Soles", "Guardería Arcoíris")
- Generar archivo de migración con `supabase db pull` después de iterar con `supabase db query`
- Documentar el patrón de migraciones para specs futuros

**Out of scope (para futuros specs):**

- Row Level Security (RLS) en `daycares` — se aplicará cuando existan roles de usuario
- Políticas de acceso (SELECT, INSERT, UPDATE, DELETE)
- Triggers o funciones de base de datos
- UI para gestionar daycares
- Integración con la tabla `users` o cualquier otra tabla dependiente

## Data model

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_daycares_table.sql

-- ENUMs (aunque daycares no los use, se crean ahora para el futuro)
CREATE TYPE user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active');
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
CREATE TYPE post_type AS ENUM ('meal', 'nap', 'activity', 'achievement', 'photo', 'announcement');
CREATE TYPE child_status AS ENUM ('active', 'archived');

-- Tabla daycares
CREATE TABLE daycares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed data
INSERT INTO daycares (name) VALUES
  ('Guardería Sala Soles'),
  ('Guardería Arcoíris'),
  ('Guardería Pequeños Exploradores');
```

## Implementation plan

1. **Verificar Supabase CLI instalado.** Ejecutar `supabase --version`. Si no está instalado, documentar el comando de instalación (macOS: `brew install supabase/tap/supabase-cli`, Linux: script oficial, Windows: scoop).

2. **Inicializar Supabase CLI en el proyecto.** Ejecutar `supabase init` en la raíz del proyecto. Esto crea la carpeta `supabase/` con estructura base.

3. **Link al proyecto remoto.** Ejecutar `supabase link --project-ref <project-ref>` usando el project ref de Supabase. Esto requiere las variables de entorno `SUPABASE_ACCESS_TOKEN` (personal access token).

4. **Iterar el schema con SQL directo.** Usar `supabase db query` para ejecutar el SQL de creación de ENUMs y tabla `daycares` sin crear migración todavía. Esto permite iterar rápidamente si hay errores.

5. **Insertar seed data.** Ejecutar `supabase db query` con el INSERT de los 3 daycares de ejemplo.

6. **Verificar manualmente.** El usuario verifica en el Dashboard de Supabase (Table Editor o SQL Editor) que:
   - La tabla `daycares` existe con las columnas correctas
   - Los ENUMs fueron creados
   - Los 3 rows de seed data están presentes

7. **Generar archivo de migración.** Una vez verificado, ejecutar `supabase db pull create-daycares-table --local --yes`. Esto genera un archivo en `supabase/migrations/` con el SQL necesario para recrear el estado actual.

8. **Revisar el archivo de migración generado.** Leer el archivo para confirmar que contiene el CREATE TYPE, CREATE TABLE e INSERT esperados.

9. **Confirmar que la migración está trackeada.** Ejecutar `supabase migration list --local` para ver que la migración aparece en la lista.

10. **Documentar el patrón en AGENTS.md.** Agregar una sección breve en AGENTS.md explicando el flujo de migraciones para futuros specs:
    - Iterar con `supabase db query`
    - Verificar manualmente o con queries
    - Generar migración con `supabase db pull <name> --local --yes`
    - Commitear el archivo de migración generado

## Acceptance criteria

- [ ] Supabase CLI está instalado y accesible desde la línea de comandos
- [ ] La carpeta `supabase/` existe en la raíz del proyecto con estructura válida
- [ ] El proyecto está linkeado al proyecto remoto de Supabase
- [ ] La tabla `daycares` existe en Supabase con columnas `id` (uuid PK), `name` (text), `created_at` (timestamptz)
- [ ] Los 6 ENUMs (`user_role`, `user_status`, `relationship_type`, `invitation_status`, `post_type`, `child_status`) existen en la base de datos
- [ ] Al menos 2 daycares de ejemplo están insertados en la tabla `daycares`
- [ ] Existe un archivo de migración en `supabase/migrations/` con nombre descriptivo (ej. `YYYYMMDDHHMMSS_create_daycares_table.sql`)
- [ ] El archivo de migración contiene el SQL completo para recrear ENUMs, tabla y seed data
- [ ] `supabase migration list --local` muestra la migración como aplicada
- [ ] AGENTS.md incluye documentación del patrón de migraciones

## Decisions taken and discarded

- **Crear ENUMs ahora vs. cuando se necesiten.** Decisión: crearlos todos ahora. Justificación: el schema de referencia los define todos, y crearlos en migraciones futuras requeriría migraciones adicionales que podrían complicar el historial. Mejor tenerlos listos desde el inicio.

- **Aplicar RLS en daycares ahora.** Decisión: NO aplicar RLS todavía. Justificación: sin usuarios ni roles definidos, las políticas de RLS no tienen sentido. Se aplicará en el spec que cree la tabla `users` con los roles correspondientes.

- **Usar `supabase db push` vs. `supabase db pull`.** Decisión: usar `supabase db pull` (generar migración desde el estado actual). Justificación: el patrón del proyecto es iterar con SQL directo y luego generar la migración, no escribir migraciones a mano. Esto es más rápido y menos propenso a errores.

- **Seed data: cuántos daycares.** Decisión: 3 daycares de ejemplo. Justificación: suficiente para testing y demostración, sin llenar la base de datos con datos innecesarios.

- **Verificación automatizada vs. manual.** Decisión: verificación manual en el Dashboard de Supabase. Justificación: para una sola tabla y seed data, no vale la pena crear scripts de verificación. El usuario puede verificar rápidamente en el Table Editor.

## Identified risks

- **Supabase CLI no instalado o versión antigua.** Si el usuario no tiene Supabase CLI instalado, el spec no puede proceder. Mitigación: el primer paso del plan es verificar la instalación y documentar el comando de instalación.

- **Permisos de Supabase.** El usuario necesita un Personal Access Token con permisos de escritura en el proyecto. Si no lo tiene, `supabase link` fallará. Mitigación: documentar cómo generar el token en Supabase Dashboard.

- **Conflicto con cambios manuales previos.** Si el usuario ya creó la tabla `daycares` manualmente en Supabase (sin migración), `supabase db pull` podría generar una migración vacía o con conflictos. Mitigación: antes de empezar, verificar que la tabla no existe. Si existe, dropearla o adaptar el flujo.

- **Pérdida de datos en seed.** Si el usuario ya tiene datos en la tabla `daycares`, el INSERT podría fallar por conflicto de IDs o duplicados. Mitigación: usar INSERT sin especificar `id` (dejar que se genere automáticamente) y verificar que los nombres no duplican.
