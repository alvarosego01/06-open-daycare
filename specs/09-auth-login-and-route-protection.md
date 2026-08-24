# SPEC 09 — Autenticacion real con Supabase y proteccion de rutas

> **Status:** Approved
> **Depends on:** SPEC 03, SPEC 08
> **Date:** 2026-08-24
> **Objective:** Conectar la pagina de login existente con Supabase Auth para autenticacion real por email/password, y proteger todas las rutas de la aplicacion excepto `/login` y `/activate` mediante middleware.

## Scope

**In:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr` como dependencias del proyecto
- Crear `lib/supabase/client.ts` — cliente de Supabase para el navegador (componentes cliente)
- Crear `lib/supabase/server.ts` — cliente de Supabase para server components y server actions (usa cookies de `next/headers`)
- Crear `lib/supabase/proxy.ts` — helper que crea el cliente de Supabase dentro del proxy (usa `request.cookies.getAll()` directamente)
- Crear `proxy.ts` en la raiz del proyecto — intercepta requests, refresca la sesion de Supabase y redirige a `/login` si el usuario no esta autenticado en rutas protegidas (reemplaza `middleware.ts` que esta deprecado en Next.js 16)
- Crear server action `login` en `app/actions/auth.ts` que llama a `supabase.auth.signInWithPassword()` y redirige a `/` en caso de exito
- Agregar prop `name` al componente `FormField` para que funcione con FormData
- Agregar prop `type` al componente `PrimaryButton` para permitir `type="submit"`
- Crear `components/auth/LoginForm.tsx` como client component que usa `useActionState` de React 19 para manejar el estado del server action (errores de login)
- Modificar `app/(auth)/login/page.tsx` para integrar `LoginForm` funcional manteniendo el diseno visual existente
- Validacion minima de formulario: email con formato valido (HTML5 `type="email"` + `required`), password `required`
- Mostrar mensaje de error "Email o contrasena incorrectos" debajo del formulario cuando el login falla
- Todas las rutas excepto `/login` y `/activate` quedan protegidas (redirect a `/login` si no hay sesion)
- Redirect a `/` (feed home) despues de login exitoso
- Variables de entorno: usar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ya existen en `.env`)
- Codigo en ingles, textos de usuario en espanol

**Out of scope (para futuros specs):**

- Logout (boton, server action, redirect)
- Activacion de cuenta funcional (`/activate`)
- Recuperacion de contrasena ("¿Olvidaste tu contrasena?")
- Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) para operaciones privilegiadas
- Signup o registro de nuevos usuarios
- Validacion avanzada de formulario (longitud de password, etc.)
- UI de gestion de sesion o perfil de usuario
- Proteccion basada en roles (staff vs parent)
- Persistencia de sesion personalizada (Supabase maneja las cookies automaticamente)

## Data model

Este feature no introduce nuevas estructuras de datos en la base de datos. Reutiliza la tabla `users` y `auth.users` creadas en SPEC 08.

Las variables de entorno utilizadas son:

```
NEXT_PUBLIC_SUPABASE_URL=https://zokhoprlchxfteawzwkj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SLJXowwJi7mzDIEkKT3aAg_TYap8Ziy
```

El usuario de prueba existente es `alvarosego01@gmail.com` con password `Abc12345@` (seed de SPEC 08).

## Implementation plan

1. Instalar dependencias ejecutando `pnpm add @supabase/supabase-js @supabase/ssr` desde la raiz del proyecto. Verificar que ambas aparecen en `package.json`.

2. Crear `lib/supabase/client.ts` — cliente para el navegador:
   - Exportar funcion `createBrowserSupabase()` que retorna un `SupabaseClient`
   - Usar `createBrowserClient` de `@supabase/ssr` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Este cliente se usa en componentes cliente (`"use client"`)

3. Crear `lib/supabase/server.ts` — cliente para server components y server actions:
   - Exportar funcion `createServerSupabase()` que retorna un `SupabaseClient`
   - Usar `createServerClient` de `@supabase/ssr` con las mismas variables de entorno
   - Configurar cookies usando `cookies()` de `next/headers` con `getAll()` y `setAll()`
   - `getAll()`: parsear cookies del cookie store de Next.js
   - `setAll()`: escribir cookies en el cookie store de Next.js

4. Crear `lib/supabase/proxy.ts` — helper para proxy:
   - Exportar funcion `updateSession(request: NextRequest)` que retorna `NextResponse`
   - Crear `NextResponse.next({ request })` inicial
   - Usar `createServerClient` de `@supabase/ssr` con cookies:
     - `getAll()`: usar `request.cookies.getAll()` directamente
     - `setAll()`: iterar cookies, setear en `request.cookies`, recrear `NextResponse.next({ request })`, luego setear cookies y headers en el response
   - Este patron oficial de Supabase asegura que las cookies se propaguen correctamente
   - Llamar `supabase.auth.getClaims()` para verificar sesion (mas eficiente que `getUser()`, no hace round-trip a DB)
   - Si no hay claims y la ruta no empieza con `/login` o `/activate`, redirigir a `/login`
   - Retornar el `supabaseResponse` (no crear un nuevo `NextResponse`)

5. Crear `proxy.ts` en la raiz del proyecto:
   - Importar `updateSession` de `@/lib/supabase/proxy`
   - Exportar funcion `proxy(request: NextRequest)` que retorna `updateSession(request)`
   - Definir matcher: excluir `_next/static`, `_next/image`, `favicon.ico` y extensiones de imagenes (`.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`)
   - Exportar `config.matcher`
   - Nota: `middleware.ts` esta deprecado en Next.js 16, usar `proxy.ts` con funcion `proxy`

6. Agregar prop `name?: string` al componente `FormField`:
   - Agregar `name` al tipo `FormFieldProps`
   - Pasar `name` al `<input>`, `<textarea>` y `<select>` internos
   - No romper componentes existentes que no pasan `name` (es opcional)

7. Agregar prop `type?: "button" | "submit" | "reset"` al componente `PrimaryButton`:
   - Default `"button"` para mantener compatibilidad con uso actual
   - Pasar `type` al `<button>` interno
   - No afectar el caso `href` (renderiza `<a>`)

8. Crear `app/actions/auth.ts` — server action de login:
   - `"use server"` al inicio del archivo
   - Exportar funcion `loginAction(prevState: AuthState, formData: FormData): Promise<AuthState>`
   - `AuthState` es un tipo `{ error?: string }`
   - Extraer `email` y `password` de `formData`
   - Crear server client con `createServerSupabase()`
   - Llamar `supabase.auth.signInWithPassword({ email, password })`
   - Si error: retornar `{ error: "Email o contrasena incorrectos" }`
   - Si exito: `redirect("/")` de `next/navigation`

9. Crear `components/auth/LoginForm.tsx` — client component del formulario:
   - `"use client"` al inicio
   - Usar `useActionState(loginAction, { error: undefined })` de React 19
   - Renderizar `<form action={loginAction}>` con:
     - `FormField` para email con `name="email"`, `type="email"`, `readOnly={false}`, `required`
     - `FormField` para password con `name="password"`, `type="password"`, `readOnly={false}`, `required`, `placeholder="••••••••"`
     - Link "¿Olvidaste tu contrasena?" (no funcional, igual que SPEC 03)
     - `PrimaryButton` con `type="submit"` texto "Iniciar sesion"
     - Mensaje de error condicional: si `state.error` existe, mostrar texto rojo "Email o contrasena incorrectos"
   - Link a `/activate` en el footer

10. Modificar `app/(auth)/login/page.tsx`:
    - Importar `LoginForm` en lugar de renderizar los campos directamente
    - Mantener `BrandHeroPanel`, el layout grid, el heading "Iniciar sesion" y el subtitle
    - Reemplazar los `FormField` y `PrimaryButton` inline con `<LoginForm />`
    - Mantener el link "¿Te invito la guarderia? Activate tu cuenta" en el footer de la pagina

11. Ejecutar `pnpm run lint` y `npx tsc --noEmit` para verificar que no hay errores. Probar manualmente: iniciar dev server, navegar a `/` sin sesion (debe redirigir a `/login`), hacer login con `alvarosego01@gmail.com` / `Abc12345@`, verificar redirect a `/`, probar login con credenciales incorrectas y verificar mensaje de error.

## Acceptance criteria

- [ ] `@supabase/supabase-js` y `@supabase/ssr` estan en `package.json` como dependencias
- [ ] Existe `lib/supabase/client.ts` que exporta `createBrowserSupabase()`
- [ ] Existe `lib/supabase/server.ts` que exporta `createServerSupabase()` usando cookies de `next/headers`
- [ ] Existe `lib/supabase/proxy.ts` que exporta `updateSession(request)` usando `request.cookies.getAll()` directamente
- [ ] El proxy usa `supabase.auth.getClaims()` para verificar sesion (no `getUser()`)
- [ ] Existe `proxy.ts` en la raiz del proyecto (no `middleware.ts` que esta deprecado)
- [ ] El proxy exporta una funcion `proxy(request)` que retorna `updateSession(request)`
- [ ] El proxy redirige a `/login` cuando un usuario no autenticado accede a cualquier ruta protegida
- [ ] El proxy NO redirige cuando un usuario no autenticado accede a `/login` o `/activate`
- [ ] El proxy permite el acceso a rutas protegidas cuando el usuario tiene una sesion valida
- [ ] El matcher del proxy excluye `_next/static`, `_next/image` y `favicon.ico`
- [ ] Existe `app/actions/auth.ts` con `loginAction` como server action
- [ ] `loginAction` llama a `supabase.auth.signInWithPassword()` con email y password del formData
- [ ] `loginAction` redirige a `/` despues de login exitoso
- [ ] `loginAction` retorna `{ error: "Email o contrasena incorrectos" }` cuando las credenciales son invalidas
- [ ] `FormField` acepta prop `name` y la pasa al input interno
- [ ] `PrimaryButton` acepta prop `type` y la pasa al button interno (default `"button"`)
- [ ] Existe `components/auth/LoginForm.tsx` como client component
- [ ] `LoginForm` usa `useActionState` de React 19 con `loginAction`
- [ ] El campo email tiene `type="email"`, `name="email"`, `readOnly={false}` y `required`
- [ ] El campo password tiene `type="password"`, `name="password"`, `readOnly={false}` y `required`
- [ ] El boton de submit tiene `type="submit"`
- [ ] Se muestra mensaje de error "Email o contrasena incorrectos" cuando el login falla
- [ ] Login exitoso con `alvarosego01@gmail.com` / `Abc12345@` redirige a `/` (feed home)
- [ ] La pagina `/login` mantiene el diseno visual del SPEC 03 (hero panel, layout, colores, tipografia)
- [ ] `pnpm run lint` pasa sin errores nuevos
- [ ] `npx tsc --noEmit` pasa sin errores nuevos

## Decisions

- **Si:** Instalar `@supabase/supabase-js` y `@supabase/ssr`. Son las librerias oficiales de Supabase para integracion con Next.js App Router.
- **No:** Implementar auth manual con JWT custom. Supabase ya maneja sesiones, cookies y refresh tokens automaticamente.
- **Si:** Usar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (la que ya existe en `.env`). Es la key moderna recomendada por Supabase, reemplaza a la anon key.
- **No:** Agregar `NEXT_PUBLIC_SUPABASE_ANON_KEY` como alias. La publishable key es suficiente y es el enfoque actual.
- **Si:** Proxy en la raiz (`proxy.ts`) para proteccion de rutas. Es el patron estandar de Next.js 16 (reemplaza `middleware.ts`) y corre en el edge.
- **No:** `middleware.ts` deprecado. Next.js 16 usa `proxy.ts` con funcion `proxy` exportada.
- **No:** Proteccion de rutas con HOC o wrappers en cada pagina. Seria repetitivo y facil de olvidar en nuevas rutas.
- **Si:** Server action para login (`"use server"`). Patron nativo de Next.js App Router, no requiere API routes.
- **No:** API route (`/api/auth/login`). Innecesario con server actions; anade complejidad sin beneficio.
- **Si:** `useActionState` de React 19 para manejar errores de login en el cliente. Es el patron moderno de React para forms con server actions.
- **No:** Estado local con `useState` para errores. `useActionState` es mas limpio y maneja el estado de pending automaticamente.
- **Si:** Crear tres clientes de Supabase separados (browser, server, middleware). Cada uno tiene requisitos de cookies diferentes y mezclarlos causa bugs.
- **No:** Un solo cliente compartido. El cliente de middleware no puede usar `cookies()` de `next/headers`, y el browser client no puede usarse en el servidor.
- **Si:** Agregar `name` prop a `FormField` existente. Es el cambio minimo para hacerlo compatible con FormData de server actions.
- **No:** Crear un nuevo componente `AuthFormField`. Duplicaria codigo; el `FormField` existente ya tiene `hasError`, `errorMessage`, `onChange`.
- **Si:** Agregar `type` prop a `PrimaryButton` existente. Cambio minimo, default `"button"` mantiene compatibilidad.
- **No:** Cambiar el default de `type` a `"submit"`. Romperia otros usos existentes del componente.
- **Si:** `LoginForm` como client component separado dentro de la pagina server component. Mantiene la pagina como server component (mejor performance) y solo la parte interactiva es cliente.
- **No:** Convertir toda la pagina de login a client component. Perderia las ventajas de server component para el layout y hero panel.
- **Si:** Proteger todas las rutas excepto `/login` y `/activate`. El usuario lo confirmo explicitamente.
- **No:** Lista blanca de rutas protegidas. Mas fragile; cualquier ruta nueva olvidada quedaria desprotegida.
- **Si:** Redirect a `/` post-login. El usuario lo confirmo como recomendado.
- **No:** Redirect a una pagina de dashboard o perfil. No existe aun; `/` es el feed home.
- **No:** Incluir logout en este spec. El usuario lo dejo para otro spec.
- **No:** Incluir activacion de cuenta funcional. El usuario la dejo fuera.
- **No:** Incluir recuperacion de contrasena. El usuario la dejo fuera.
- **No:** Incluir Service Role Key. El usuario la dejo para despues.

## What is **not** in this spec

- Logout (boton, server action, redirect)
- Activacion de cuenta funcional (`/activate`)
- Recuperacion de contrasena
- Signup o registro de usuarios
- Service Role Key
- UI de perfil o gestion de sesion
- Proteccion basada en roles
- Validacion avanzada de contrasena

Cada uno de esos, si se necesita, va en su propio spec.
