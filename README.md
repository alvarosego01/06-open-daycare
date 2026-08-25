# Open Daycare

Aplicacion web para la gestion de una guarderia/estancia infantil. Permite a padres y administradores gestionar ninos, publicaciones, avisos, perfiles y la comunicacion diaria (resumen del dia, fotos, etc.).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.0 (App Router) + React 19 |
| Styling | Tailwind CSS v4 |
| Backend / Auth / DB | Supabase (Postgres, Auth, Storage, Edge Functions, Realtime) |
| Email | Resend |
| Package manager | pnpm |

## Getting Started

```bash
pnpm install
pnpm dev        # http://localhost:3020
pnpm build      # production build
pnpm lint       # eslint
```

### Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

## Supabase

Client helpers in `utils/supabase/`:

| Helper | Path | Usage |
|---|---|---|
| Server client | `utils/supabase/server.ts` | Server Components, Route Handlers, Server Actions |
| Browser client | `utils/supabase/client.ts` | Client Components (`"use client"`) |
| Middleware client | `utils/supabase/middleware.ts` | `middleware.ts` at project root (session refresh) |

Schema migrations live in `migrations/`. Use `supabase db query` for iteration, then `supabase db pull` to generate migrations.

## MCP Servers

This project uses 3 MCP servers configured in `opencode.json` and globally:

| MCP | Type | Purpose |
|---|---|---|
| **Supabase** | Remote (`https://mcp.supabase.com/mcp`) | Database, auth, edge functions, storage, realtime, logs, branching. Project ref: `zokhoprlchxfteawzwkj` |
| **Playwright** | Local (`npx -y @playwright/mcp`) | Browser automation, screenshots, visual testing |
| **Context7** | Remote (`https://mcp.context7.com/mcp`) | Up-to-date framework/library documentation |

### Supabase MCP Auth

Validate or refresh Supabase MCP credentials:

```bash
opencode mcp auth supabase
```

This opens an OAuth flow in the browser. Once authenticated, credentials are stored locally and reused across sessions.

## Design

UI mockups are in `references/`:
- `references/pantallas/*.dc.html` — self-contained HTML mockups for every screen
- `references/screenshots/*.png` — screenshots of composed screens

Palette: warm cream/peach (`#F6ECDF` bg, `#FFFDF9` cards, `#F2937A`/`#EE8164` accents, `#3F362E` text). Fonts: **Fredoka** (headings), **Nunito** (body), **Geist** (loaded by default in `app/layout.tsx`).

## Spec-Driven Development

- `/spec` — create specifications
- `/spec-impl` — implement approved specs
- `/spec-rev` — verify acceptance criteria
