## Context

See proposal.md for motivation. The app currently has a single panel (staff view) at root routes. We need to separate into two panels: `/staff/*` for staff users and `/family/*` for parent users. The existing `getPosts()` server action already filters by role, so the family feed can reuse it.

## Goals / Non-Goals

**Goals:**
- Clear separation of staff and family experiences via distinct URL namespaces
- Role-based route protection at the layout level
- Reuse existing components (PostCard) and server actions where possible
- Minimal changes to data layer (no schema changes required)

**Non-Goals:**
- Functional child-filter pills in family feed (visual only for now)
- "Resumen del día" page (exists in mockups but deferred)
- Mobile-specific sidebar behavior changes (keep current behavior)
- Changes to authentication flow (only redirect logic changes)

## Decisions

### 1. Route structure: real segments vs route groups

**Decision**: Use real route segments (`app/staff/`, `app/family/`) instead of route groups (`app/(staff)/`, `app/(family)/`).

**Rationale**: Route groups with parentheses don't create URL segments. Since we need distinct URLs (`/staff/feed` vs `/family/feed`), we must use real segments. Route groups would cause path collisions.

**Alternatives considered**:
- Route groups with different internal paths — rejected because URLs would collide at `/feed`
- Single route with conditional rendering — rejected because it makes layouts harder and loses URL clarity

### 2. Role protection location

**Decision**: Protect routes in each panel's layout.tsx (server-side check + redirect).

**Rationale**: Layouts are the natural place for route protection in Next.js App Router. Server-side check avoids client-side flash. Each layout is self-contained.

**Alternatives considered**:
- Middleware-based protection — rejected because it adds complexity to middleware.ts and the check is simple enough for layouts
- Per-page protection — rejected because it would duplicate the check on every page

### 3. Sidebar component organization

**Decision**: Create `components/staff/StaffSidebar.tsx` and `components/family/FamilySidebar.tsx` as separate components. Deprecate the existing `components/Sidebar.tsx`.

**Rationale**: The two sidebars have different navigation items, different subtitles, and different buttons. Sharing code via a generic Sidebar component would add complexity without benefit. Separate components are clearer and easier to maintain.

**Alternatives considered**:
- Single Sidebar with props for configuration — rejected because the differences are substantial (different nav items, different buttons, different badges)
- Keep using Sidebar.tsx and conditionally render — rejected because it mixes concerns

### 4. Root page redirect implementation

**Decision**: Convert `app/page.tsx` to a server component that reads the user's role and calls `redirect()`.

**Rationale**: Server-side redirect is fast and avoids client-side flash. The role check requires a database query, which is fine for a server component.

**Alternatives considered**:
- Client-side redirect with useEffect — rejected because it causes a flash and is slower
- Middleware redirect — rejected because middleware runs on every request and this only applies to `/`

### 5. Login redirect implementation

**Decision**: After successful `signInWithPassword`, query `users.role` and redirect to the appropriate panel.

**Rationale**: The login server action is the natural place to handle post-login redirect. Querying the role from `users` table is a simple select.

**Alternatives considered**:
- Store role in user_metadata and read from session — rejected because it duplicates data and can get out of sync
- Redirect to `/` and let the root page handle it — rejected because it adds an extra redirect hop

### 6. Family feed data fetching

**Decision**: Reuse the existing `getPosts()` server action, which already filters by `parent_children` for parent users.

**Rationale**: The server action already has the correct filtering logic. No need to create a separate action.

**Alternatives considered**:
- Create a new `getFamilyPosts()` action — rejected because it would duplicate logic

## Risks / Trade-offs

**[Risk] Breaking existing URLs** → Users with bookmarks to `/` or `/kids` will need to use new URLs. Mitigation: root redirect handles `/`. For `/kids`, we could add a redirect in middleware, but it's low priority since the app is not yet in production use.

**[Risk] Role query on every root visit** → The root page queries the database on every visit. Mitigation: This is acceptable for a root page; the query is fast and cached by Supabase. If performance becomes an issue, we could add middleware caching.

**[Trade-off] Layout-level protection vs middleware** → Layout protection is simpler but runs after the page component starts rendering. Middleware would be earlier but adds complexity. We accept the trade-off because the redirect is fast and the user won't see a flash.

**[Trade-off] Separate sidebar components vs shared** → Separate components mean some code duplication (icons, mobile menu logic). We accept this because the sidebars are different enough that a shared component would be complex and hard to maintain.
