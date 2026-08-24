# SPEC 09 — Autenticacion real con Supabase y proteccion de rutas

> **Status:** Approved
> **Depends on:** SPEC 03, SPEC 08
> **Date:** 2026-08-24
> **Objective:** Conectar el formulario de login a Supabase Auth con email/password, agregar proteccion de rutas via middleware, y limpiar/recrear usuarios de prueba para verificacion manual.

## Scope

**In:**

- Convertir `app/(auth)/login/page.tsx` en un Client Component con estado para email y password
- Crear Server Action `app/(auth)/login/actions.ts` que llama a `supabase.auth.signInWithPassword()` y redirige a `/` con `redirect()`
- Validacion basica en cliente: email con formato valido (regex simple), password sin validacion de longitud
- Mostrar mensaje de error debajo del formulario cuando las credenciales sean incorrectas (ej: "Email o contrasena incorrectos")
- Estado de carga en el boton "Iniciar sesion" mientras se procesa la peticion
- Actualizar `middleware.ts` y `utils/supabase/middleware.ts` para proteger todas las rutas excepto `/login` y `/activate` (redirigir a `/login` si no hay sesion)
- Redirigir usuarios autenticados que visiten `/login` o `/activate` hacia `/`
- Desactivar confirmacion de email en Supabase Auth (configuracion del proyecto) para flujo sin verificacion por email
- Eliminar todos los usuarios existentes de `auth.users` y `public.users` (limpiar tabla)
- Crear un nuevo usuario staff de prueba con email `alvarosego01@gmail.com` y password `Abc12345@` via Supabase Auth API (no SQL directo) para probar el login manualmente con Playwright
- Verificar que el trigger `on_auth_user_created` crea automaticamente el perfil en `public.users` al hacer signup
- Todo el codigo en ingles, texto de UI en espanol

**Out of scope (para futuros specs):**

- Implementar la pagina `/activate` con logica real de signup (spec separado)
- Recuperacion de contrasena (forgot password)
- Logout / cerrar sesion (se hara en un spec posterior si es necesario)
- Politicas RLS adicionales o basadas en roles complejos
- UI de gestion de usuarios o perfiles
- Validacion avanzada de formularios con librerias externas (zod, react-hook-form)

## Data model

Este spec no introduce nuevas estructuras de datos. Utiliza las tablas y funciones existentes de SPEC 08 (`users`, `handle_new_user()`, trigger `on_auth_user_created`).

## Implementation plan

1. **Desactivar confirmacion de email en Supabase.** Ejecutar SQL para actualizar la configuracion de auth:
   ```sql
   UPDATE auth.config SET email_confirm_enabled = false;
   ```
   Si la tabla `auth.config` no existe o no tiene esa columna, desactivar via Supabase dashboard o API REST.

2. **Limpiar usuarios existentes.** Eliminar todos los usuarios de `auth.users` (el trigger y FK cascade eliminaran automaticamente los registros de `public.users`):
   ```sql
   DELETE FROM auth.users;
   ```
   Verificar que `public.users` queda vacia.

3. **Crear nuevo usuario staff de prueba.** Usar la API de Supabase Auth para crear el usuario con email y password, pasando metadata para el trigger:
   - Email: `alvarosego01@gmail.com`
   - Password: `Abc12345@`
   - Metadata: `{ "daycare_id": "<DAYCARE_ID>", "role": "staff", "full_name": "Alvaro Segovia" }`
   - Esto se hace via `supabase.auth.signUp()` desde un script o directamente desde la UI una vez implementado el login
   - Alternativamente, usar SQL directo con `crypt()` y `gen_salt('bf')` como en SPEC 08

4. **Convertir login page a Client Component.** Modificar `app/(auth)/login/page.tsx`:
   - Agregar `"use client"` al inicio
   - Agregar estado con `useState` para `email`, `password`, `error`, `loading`
   - Convertir `FormField` de email a controlado: `value={email}`, `onChange={setEmail}`, `readOnly={false}`
   - Convertir `FormField` de password a controlado: `value={password}`, `onChange={setPassword}`, `readOnly={false}`
   - Agregar validacion basica de email antes de enviar (regex simple: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
   - Mostrar mensaje de error si la validacion falla o si el servidor retorna error
   - Mostrar estado de carga en el boton (spinner o texto "Iniciando sesion...")
   - Llamar a la Server Action `login(formData)` al hacer submit del formulario
   - Envolver los campos en un `<form>` con `action={login}`

5. **Crear Server Action para login.** Crear `app/(auth)/login/actions.ts`:
   - `"use server"` al inicio
   - Importar `createClient` de `@/utils/supabase/server`
   - Importar `cookies` de `next/headers` y `redirect` de `next/navigation`
   - Funcion `login(formData: FormData)` que:
     - Extrae `email` y `password` del formData
     - Crea el cliente de Supabase con `createClient(await cookies())`
     - Llama a `supabase.auth.signInWithPassword({ email, password })`
     - Si hay error, retorna `{ error: "Email o contrasena incorrectos" }`
     - Si es exitoso, llama a `redirect("/")`

6. **Actualizar `PrimaryButton` para soportar submit.** Modificar `components/ui/PrimaryButton.tsx`:
   - Agregar prop `type?: "button" | "submit"` (default `"button"` para mantener compatibilidad)
   - Usar `type` en el `<button>`

7. **Actualizar `FormField` para ser controlado.** El componente ya soporta `value` y `onChange`, pero `readOnly` default es `true`. Necesitamos:
   - Cambiar el default de `readOnly` a `false` cuando se pasa `onChange`
   - O explicitamente pasar `readOnly={false}` desde el login page
   - La solucion mas limpia: en el login page, pasar `readOnly={false}` explicitamente

8. **Actualizar middleware para proteccion de rutas.** Modificar `utils/supabase/middleware.ts`:
   - Despues de crear el cliente de Supabase, llamar a `supabase.auth.getUser()` para obtener el usuario actual
   - Definir rutas publicas: `["/login", "/activate"]`
   - Si la ruta NO es publica Y no hay usuario autenticado, redirigir a `/login`
   - Si la ruta ES publica Y hay usuario autenticado, redirigir a `/`
   - Usar `request.nextUrl.pathname.startsWith()` para matching de rutas

9. **Verificar que el middleware actualiza cookies correctamente.** El middleware debe:
   - Refrescar la sesion si es necesario (Supabase SSR maneja esto automaticamente con `getUser()`)
   - Setear las cookies actualizadas en la respuesta

10. **Probar manualmente con Playwright.**
    - Navegar a `/login`
    - Intentar login con credenciales incorrectas -> verificar que muestra mensaje de error
    - Intentar login con credenciales correctas (`alvarosego01@gmail.com` / `Abc12345@`) -> verificar que redirige a `/`
    - Verificar que `/` carga correctamente (feed visible)
    - Cerrar sesion manualmente (limpiar cookies) o abrir ventana de incognito
    - Intentar acceder a `/` sin sesion -> verificar que redirige a `/login`
    - Intentar acceder a `/kids` sin sesion -> verificar que redirige a `/login`

11. **Ejecutar `pnpm run lint` y `npx tsc --noEmit`** para asegurar que no hay errores.

## Acceptance criteria

- [ ] La confirmacion de email esta desactivada en Supabase Auth
- [ ] Todos los usuarios anteriores fueron eliminados de `auth.users` y `public.users`
- [ ] Existe un nuevo usuario staff en `auth.users` con email `alvarosego01@gmail.com` y password `Abc12345@`
- [ ] El nuevo usuario tiene un perfil correspondiente en `public.users` con rol `staff`, status `active`, full_name `Alvaro Segovia`
- [ ] `app/(auth)/login/page.tsx` es un Client Component (`"use client"`)
- [ ] El formulario de login tiene estado para `email` y `password`
- [ ] Los campos de email y password son controlados (no readOnly)
- [ ] Existe validacion basica de formato de email en el cliente
- [ ] Se muestra mensaje de error cuando las credenciales son incorrectas
- [ ] El boton muestra estado de carga mientras se procesa el login
- [ ] Existe `app/(auth)/login/actions.ts` con Server Action `login(formData)`
- [ ] La Server Action llama a `supabase.auth.signInWithPassword()`
- [ ] La Server Action redirige a `/` en caso de exito
- [ ] La Server Action retorna error en caso de fallo
- [ ] `PrimaryButton` soporta prop `type="submit"`
- [ ] El formulario de login usa `<form action={login}>` con metodo POST
- [ ] El middleware protege todas las rutas excepto `/login` y `/activate`
- [ ] Usuarios no autenticados que visitan `/` son redirigidos a `/login`
- [ ] Usuarios no autenticados que visitan `/kids` son redirigidos a `/login`
- [ ] Usuarios autenticados que visitan `/login` son redirigidos a `/`
- [ ] Login con credenciales correctas redirige a `/` y muestra el feed
- [ ] Login con credenciales incorrectas muestra mensaje de error
- [ ] `pnpm run lint` pasa sin errores (o los errores son pre-existentes y no relacionados con este spec)
- [ ] `npx tsc --noEmit` pasa sin errores

## Decisions

- **Si:** Server Action para login. Es el patron recomendado de Next.js 16 + Supabase SSR.
- **No:** API Route (`/api/auth/login`). Agregaria complejidad innecesaria y no es el patron moderno de Next.js App Router.
- **Si:** Validacion basica de email en cliente (regex simple). Suficiente para evitar errores obvios.
- **No:** Validacion avanzada con zod o react-hook-form. Over-engineering para este spec.
- **Si:** Password sin validacion de longitud en cliente. Supabase Auth valida internamente (minimo 6 caracteres).
- **No:** Validar longitud de password en cliente. Supabase ya lo hace, no duplicamos logica.
- **Si:** Mensaje de error debajo del formulario. Simple, visible, no intrusivo.
- **No:** Toast o notificacion temporal. Agregaria complejidad sin beneficio significativo.
- **Si:** Desactivar confirmacion de email. Simplifica el flujo de pruebas y es aceptable para desarrollo.
- **No:** Mantener confirmacion de email. Complicaria las pruebas manuales y el flujo de activacion (spec separado).
- **Si:** Proteger todas las rutas excepto `/login` y `/activate`. Patron estandar de proteccion.
- **No:** Lista explicita de rutas protegidas. Mas fragil y dificil de mantener.
- **Si:** Redirigir usuarios autenticados desde `/login` a `/`. Evita confusion y mejora UX.
- **No:** Mostrar login a usuarios autenticados. No tiene sentido mostrar login si ya estan autenticados.
- **Si:** Reutilizar el usuario staff de SPEC 08 (`alvarosego01@gmail.com`). Ya existe la infraestructura para crearlo.
- **No:** Crear un usuario diferente. El usuario especifico usar el ya creado.
- **Si:** Limpiar todos los usuarios antes de crear el nuevo. El usuario lo pidio explicitamente.
- **No:** Mantener los usuarios existentes. El usuario pidio limpiar la tabla.
- **Si:** Usar `supabase.auth.getUser()` en middleware para verificar sesion. Patron oficial de Supabase SSR.
- **No:** Verificar sesion con `getClaims()` o decodificar JWT manualmente. `getUser()` es mas seguro y maneja refresh automaticamente.
- **Si:** `/activate` sigue siendo visual (out of scope). Spec separado para implementar signup real.
- **No:** Implementar signup real en `/activate` en este spec. El usuario lo especifico como spec separado.

## Identified risks

- **Desactivar confirmacion de email:** Es aceptable para desarrollo/pruebas, pero no debe hacerse en produccion. Para produccion, la confirmacion de email es una medida de seguridad importante.
- **Password en el archivo de migracion:** El password `Abc12345@` queda en el archivo de migracion SQL. Es aceptable para desarrollo, pero no para produccion.
- **Middleware en cada request:** `getUser()` hace una llamada a Supabase en cada request. Puede tener impacto en performance si hay muchas rutas protegidas. Para el volumen esperado de una guarderia, es aceptable.
- **Trigger con metadata:** Si el signup no incluye `daycare_id`, `role` o `full_name` en `raw_user_meta_data`, el trigger fallara o creara un perfil incompleto. La capa de aplicacion debe asegurar que estos campos se pasen correctamente.
- **RLS con politicas basicas:** Las politicas actuales permiten a usuarios leer su propio perfil y a staff leer usuarios de su daycare. Puede ser insuficiente para casos de uso mas complejos, pero es aceptable para este spec.
