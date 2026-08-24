<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Typecheck | `npx tsc --noEmit` |
| Verify spec | `/spec-rev` |

No test framework is configured.

## Toolchain

- **Next.js 16.3.0** with App Router + React 19 — consult `node_modules/next/dist/docs/` before writing any Next.js code
- **Tailwind CSS v4** — uses `@import "tailwindcss"` in `app/globals.css`; PostCSS plugin is `@tailwindcss/postcss` (not `autoprefixer`)
- **Path alias**: `@/*` maps to `./*` (root-level)
- **Fonts**: `app/layout.tsx` loads Geist; design mockups use **Fredoka** (headings) and **Nunito** (body)

## Design references

`references/` contains the source of truth for UI:
- `references/pantallas/*.dc.html` — self-contained HTML mockups for every screen (feed, ninos, login, mi-cuenta, etc.). Open these in a browser to see the intended design.
- `references/screenshots/*.png` — screenshots of composed screens

When implementing UI, match colors, spacing, and typography from the mockups. The palette is warm cream/peach (`#F6ECDF` bg, `#FFFDF9` cards, `#F2937A`/`#EE8164` accents, `#3F362E` text).

## MCPs

- **Playwright** — screenshots and browser automation output go in `.playwright-mcp/`
- **Context7** — use for up-to-date framework/library documentation
- **Supabase** — database, auth, edge functions, storage, realtime. Use `supabase` skill before any Supabase task

## Supabase

- **Project type**: Next.js 16 + React 19 with App Router
- **Packages**: `@supabase/supabase-js` and `@supabase/ssr` (installed via pnpm)
- **Client helpers**:
  - `utils/supabase/server.ts` — server-side client (Server Components, Route Handlers). Requires `cookies()` from `next/headers` passed as argument
  - `utils/supabase/client.ts` — browser client (Client Components with `"use client"`)
  - `utils/supabase/middleware.ts` — middleware client for session refresh
- **Middleware**: `middleware.ts` at project root refreshes Supabase sessions automatically on every request
- **Environment variables** (in `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Security**: Always enable RLS on public tables. Never use `user_metadata` in auth decisions. Use `app_metadata` for authorization data
- **Schema changes**: Use `supabase db query` for iteration, then `supabase db pull` to generate migrations. Never use `apply_migration` for local development
- **Best practices**: Load `supabase-postgres-best-practices` skill before writing SQL, designing schemas, or creating indexes

## Spec driven development
- /spec usaremos esta skill para crear las especificaciones
- /spec-impl usaremos esta skill para implementar las especificaciones creadas previamente con /spec
- /spec-rev usaremos este agente para verificar los criterios de aceptación del spec

## Supabase skills
- **supabase** — skill principal para cualquier tarea de Supabase (auth, RLS, edge functions, storage, schema, debugging)
- **supabase-postgres-best-practices** — guía de mejores prácticas de Postgres para schema design, queries, indexes, RLS y performance

## WARNING NOT DO!
- Está prohibido el uso de npm bajo ningún concepto, en su lugar usar ***pnpm***


## Reglas de código
-- Usar código limpio, nombres, funciones, variables, tipados, interfaces todo en ingles