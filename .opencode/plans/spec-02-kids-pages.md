# SPEC 02 — Kids listing and profile pages

> **Status:** Draft
> **Depends on:** SPEC 01
> **Date:** 2026-08-12
> **Objective:** Implement the kids listing page at `/kids` and kid profile page at `/kids/{id}` using mock data, matching the visual design from `references/pantallas/ninos.dc.html` and `references/pantallas/perfil-nino.dc.html`.

## Scope

**In:**

- Implement kids listing page at `/kids` matching `references/pantallas/ninos.dc.html`
- Implement kid profile page at `/kids/{id}` matching `references/pantallas/perfil-nino.dc.html`
- Create mock data structure for 8 kids with all required fields (name, age, room, badges, parents, etc.)
- Display 2-column grid of kid cards on desktop, single column on mobile/tablet
- Show badges on kid cards: allergy badges (MANÍ, LACTOSA), VINCULAR badge (when no parents linked), or chevron arrow
- Badges can coexist: a kid can have both an allergy badge AND the VINCULAR badge
- Implement search bar on listing page (visual only, no filtering functionality)
- Display "SALA SOLES" section header with kid count
- Show "Agregar niño" button (visual only, non-functional link)
- Display kid profile with: large avatar, name, age/room, "Editar" button (non-functional), allergies/notes alert box, info card (birth date, room, enrollment date), "Resumen del día" button (non-functional), parents panel with status badges
- Reuse existing `Sidebar` component with active state set to "Niños"
- Responsive design: desktop (2-column grid for listing, side-by-side layout for profile), mobile/tablet (single column, stacked layout)
- Use Tailwind CSS for all styling
- All user-facing text in Spanish to match references
- All code (variables, functions, types, interfaces) in English

**Out of scope (for future specs):**

- Search functionality (filtering kids by name)
- "Agregar niño" form or page
- Edit kid functionality
- "Resumen del día" page or functionality
- "Vincular otro padre" page or functionality
- Functional navigation to other pages (Avisos, Mi cuenta remain as `#` placeholders)
- Database integration or dynamic data loading
- Authentication or user session management

## Data model

```ts
// data/kids.ts

type KidBadge = {
  label: string;
  bgColor: string;
  textColor: string;
};

type Parent = {
  id: string;
  name: string;
  initial: string;
  role: string;
  avatarBgColor: string;
  status: "active" | "pending";
};

type Kid = {
  id: string;
  name: string;
  initial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  age: string;
  parentCount: number;
  badges: KidBadge[];
  room: string;
  birthDate: string;
  enrollmentDate: string;
  allergyNotes: string | null;
  parents: Parent[];
};

export const kids: Kid[] = [
  // 8 hardcoded kids:
  // Mateo Fernández: 3 años, 2 padres, MANÍ badge, 2 parents (1 activa, 1 pendiente)
  // Sofía Méndez: 2 años, 1 padre, no badges
  // Benjamín Ruiz: 3 años, 2 padres, no badges
  // Valentina Soto: 2 años, 0 padres, VINCULAR badge
  // Tomás Díaz: 3 años, 1 padre, LACTOSA badge
  // Emma Castro: 2 años, 1 padre, no badges
  // Lucas Romero: 3 años, 1 padre, no badges
  // Olivia Vega: 2 años, 1 padre, no badges
];
```

Conventions:
- Badge labels in Spanish: "MANÍ", "LACTOSA", "VINCULAR"
- Parent roles in Spanish: "Mamá", "Papá"
- Parent status badges: "ACTIVA" (green #CFEBD8/#3E9B6C), "PENDIENTE" (yellow #F7E7A6/#9A7B1E)
- Allergy notes alert box: pink background (#FBDAD6) with warning icon
- Avatar colors: blue (#A9D9E8/#1F7A93), pink (#F4B8CC/#C44A7A), green (#B9DEC4/#3E8B62), yellow (#F4DC8E/#9A7B1E), purple (#C9B6E8/#7B5FC0)

## Implementation plan

1. Create `data/kids.ts` with type definitions (`Kid`, `KidBadge`, `Parent`) and 8 hardcoded kids. Include full profile data for Mateo Fernández (birthDate: "12 mar 2022", enrollmentDate: "feb 2025", allergyNotes: "Alergia al maní..."). Other kids can have minimal profile data.

2. Update `components/Sidebar.tsx` to accept optional `activeItem` prop (`'feed' | 'kids' | 'notices' | 'account'`, default `'feed'`). Update navItems to use this prop for active state. Update hrefs: Feed → `/`, Niños → `/kids`, Avisos → `#`, Mi cuenta → `#`.

3. Update `app/page.tsx` to pass `activeItem="feed"` to Sidebar.

4. Create `app/kids/page.tsx` — kids listing:
   - Sidebar with `activeItem="kids"`
   - "GESTIÓN" label + "Niños" heading
   - "Agregar niño" button (gradient, non-functional)
   - Search bar (visual only)
   - "SALA SOLES" section header with count
   - Responsive grid: 1 col mobile, 2 cols md+
   - Kid cards with avatar, name, age/parentCount, badges, hover effect
   - Each card links to `/kids/{kid.id}`

5. Create `app/kids/[id]/page.tsx` — kid profile:
   - Sidebar with `activeItem="kids"`
   - Look up kid by `params.id` from data
   - "Volver a Niños" back link
   - Large avatar + name + age/room + "Editar" button
   - Allergy alert box (if notes exist)
   - Info card (birthDate, room, enrollmentDate)
   - "Resumen del día" button (non-functional)
   - Parents panel with status badges
   - "Vincular otro padre" link (non-functional)
   - Responsive: side-by-side on desktop, stacked on mobile

6. Run `pnpm run lint` and `npx tsc --noEmit`. Visual verification at multiple breakpoints.

## Acceptance criteria

- [ ] `/kids` loads without errors
- [ ] `/kids/{id}` loads without errors for valid kid IDs
- [ ] All styling uses Tailwind CSS (inline styles allowed only for dynamic data-driven colors)
- [ ] Desktop (1280px+): 2-column kid grid, side-by-side profile layout
- [ ] Mobile (<768px): single-column grid, stacked profile
- [ ] Sidebar shows "Niños" as active item (bg #FBE3D8, text #D9583C)
- [ ] Kids listing: "GESTIÓN" label, "Niños" heading, "Agregar niño" button
- [ ] Search bar visible with placeholder "Buscar niño…" (no functionality)
- [ ] "SALA SOLES" section header with "8 niños" count
- [ ] 8 kid cards with correct data, badges, and hover effect
- [ ] Badges can coexist (allergy + VINCULAR)
- [ ] Each card links to `/kids/{kid.id}`
- [ ] Profile: back link, avatar, name, age/room, "Editar" button
- [ ] Allergy alert box shown when notes exist
- [ ] Info card: birth date, room, enrollment
- [ ] "Resumen del día" button visible (non-functional)
- [ ] Parents panel with ACTIVA/PENDIENTE status badges
- [ ] "Vincular otro padre" link visible (non-functional)
- [ ] Colors match reference palette
- [ ] Fredoka for headings, Nunito for body
- [ ] No horizontal scroll on any viewport
- [ ] No TypeScript or lint errors
- [ ] Visual match with reference HTML at 1280px+

## Decisions

- **Yes:** Single spec for both pages. They share data model and are conceptually linked.
- **No:** Separate specs. Would split a cohesive feature.
- **Yes:** Search bar visual only. User requirement.
- **No:** Client-side search filtering. Out of scope.
- **Yes:** Reuse Sidebar with `activeItem` prop. Consistency.
- **No:** Separate sidebar for kids pages. Duplication.
- **Yes:** Badges can coexist. User confirmed.
- **No:** Exclusive badge logic. Would not match reference.
- **Yes:** Responsive design. Consistent with SPEC 01.
- **No:** Desktop-only. Would break on mobile.
- **Yes:** Non-functional buttons/links. Visual spec.
- **No:** Implement forms/pages. Out of scope.
- **Yes:** Full profile for Mateo only. Matches reference.
- **No:** Full data for all kids. Unnecessary work.
- **Yes:** Real hrefs for Feed (/) and Niños (/kids). Enables testing.
- **No:** All `#` placeholders. Would prevent navigation testing.

## What is **not** in this spec

- Search functionality
- "Agregar niño" form/page
- Edit kid functionality
- "Resumen del día" page
- "Vincular otro padre" page
- Functional navigation to Avisos/Mi cuenta
- Database or API integration
- Authentication
- Photo upload/display

Each one of those, if needed, goes in its own spec.
