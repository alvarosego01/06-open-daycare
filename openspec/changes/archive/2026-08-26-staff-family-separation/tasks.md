## 1. Directory Structure and Sidebar Components

- [x] 1.1 Create directory structure `app/staff/`, `app/family/`, `components/staff/`, `components/family/` and verify directories exist
- [x] 1.2 Create `components/staff/StaffSidebar.tsx` based on current `components/Sidebar.tsx` with updated nav hrefs (`/staff/feed`, `/staff/kids`) and verify it renders without errors
- [x] 1.3 Create `components/family/FamilySidebar.tsx` with nav items Feed (`/family/feed`) and Mi cuenta (`/family/account`), no "Nueva publicación" button, subtitle "Familia", and verify it renders without errors

## 2. Staff Panel Routes

- [x] 2.1 Create `app/staff/layout.tsx` with role protection (redirect to `/family/feed` if role is not `staff` or `admin`) and render StaffSidebar, then verify accessing `/staff/feed` as staff shows the layout
- [x] 2.2 Move `app/page.tsx` to `app/staff/feed/page.tsx` and update import paths, then verify `/staff/feed` displays the feed correctly
- [x] 2.3 Move `app/kids/page.tsx` to `app/staff/kids/page.tsx` and update Sidebar import to StaffSidebar, then verify `/staff/kids` displays the kids list
- [x] 2.4 Move `app/kids/actions.ts` to `app/staff/kids/actions.ts` and update `revalidatePath` calls from `/kids` to `/staff/kids`, then verify adding/archiving a kid revalidates the correct path
- [x] 2.5 Move `app/kids/KidsListClient.tsx` to `app/staff/kids/KidsListClient.tsx` and update kid detail href from `/kids/[id]` to `/staff/kids/[id]`, then verify clicking a kid card navigates to `/staff/kids/[id]`
- [x] 2.6 Move `app/kids/[id]/page.tsx` to `app/staff/kids/[id]/page.tsx` and update Sidebar import to StaffSidebar, then verify kid detail page renders
- [x] 2.7 Move `app/kids/[id]/ArchiveButton.tsx` to `app/staff/kids/[id]/ArchiveButton.tsx` and verify archive functionality works

## 3. Family Panel Routes

- [x] 3.1 Create `app/family/layout.tsx` with role protection (redirect to `/staff/feed` if role is not `parent`) and render FamilySidebar, then verify accessing `/family/feed` as parent shows the layout
- [x] 3.2 Create `app/family/feed/page.tsx` as client component with greeting "Hola, [nombre]", subtitle "TU FAMILIA" / "Así va el día de hoy", calls `getPosts()`, and renders PostCard list, then verify parent sees filtered posts
- [x] 3.3 Create `app/family/account/page.tsx` with user profile card, "MIS HIJOS" section (fetch from `parent_children`), "NOTIFICACIONES" section with toggles, and "Cerrar sesión" button, then verify page renders with user data

## 4. Root and Login Redirects

- [x] 4.1 Replace `app/page.tsx` with server component that queries user role and redirects: `staff`/`admin` → `/staff/feed`, `parent` → `/family/feed`, unauthenticated → `/login`, then verify each role redirects correctly
- [x] 4.2 Update `app/(auth)/login/actions.ts` to query `users.role` after successful login and redirect to `/staff/feed` or `/family/feed` based on role, then verify login redirects to correct panel

## 5. Cleanup and Verification

- [x] 5.1 Delete old `app/kids/` directory and verify no references to old paths remain
- [x] 5.2 Deprecate `components/Sidebar.tsx` by adding a comment at the top indicating it's deprecated and should use `components/staff/StaffSidebar.tsx` or `components/family/FamilySidebar.tsx` instead
- [x] 5.3 Run `pnpm run lint` and verify no lint errors
- [x] 5.4 Run `npx tsc --noEmit` and verify no type errors
- [x] 5.5 Test complete flow: login as staff → verify redirect to `/staff/feed` → navigate to `/staff/kids` → verify kids list loads; login as parent → verify redirect to `/family/feed` → navigate to `/family/account` → verify account page loads
