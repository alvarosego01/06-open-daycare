# SPEC 03 — Login and activate account pages

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-08-13
> **Objective:** Implement the login page at `/login` and account activation page at `/activate` as static visual replicas of the reference mockups, using reusable form components and an auth route group with no Sidebar.

## Scope

**In:**

- Implement login page at `/login` matching `references/pantallas/login.dc.html` (without the "Personal/Familia" role toggle)
- Implement activate account page at `/activate` matching `references/pantallas/activar-cuenta.dc.html`
- Create `(auth)` route group with its own layout (no Sidebar, just `{children}`)
- Create reusable `FormField` component (label + styled input) shared by both pages
- Create reusable `PrimaryButton` component (gradient CTA) shared by both pages
- Login page: split layout with brand hero panel (left, desktop only) + form (right)
- Activate page: centered card with logo, invite info, code/email/password inputs, authorization checkbox, CTA
- Hero panel hidden on mobile (form-only centered view)
- Use Tailwind CSS for all styling
- All user-facing text in Spanish to match references
- All code in English

**Out of scope (for future specs):**

- Authentication logic or session management
- Form validation or error states
- Password recovery flow ("¿Olvidaste tu contraseña?" is a non-functional link)
- Role selection (Personal/Familia toggle explicitly excluded by user)
- Database integration
- Navigation guards (login redirect, protected routes)
- Sidebar or main layout integration on auth pages

## Data model

This feature introduces no new data structures. All values (email, invitation code, child name, room) are hardcoded display strings matching the reference mockups.

## Implementation plan

1. Create `components/ui/FormField.tsx` — reusable labeled input component:
   - Props: `label` (string), `type` (input type, default `"text"`), `placeholder` (optional), `value` (optional, for display), `variant` (optional, `"default" | "mono"`, for invitation code styling)
   - Renders uppercase label (font-size 12px, weight 700, letter-spacing 0.7px, color `#94887B`) + input (padding 14px 16px, border-radius 14px, border 1.5px solid `#EADFD0`, bg white, font-size 15px)
   - `variant="mono"` uses Fredoka font, larger text (18px), letter-spacing 3px, bold (for invitation code)
   - All Tailwind classes

2. Create `components/ui/PrimaryButton.tsx` — reusable gradient CTA:
   - Props: `children` (ReactNode), `href` (optional string, renders `<a>` if provided, `<button>` otherwise)
   - Full-width, padding 15px, border-radius 15px, gradient background `from-[#F4977E] to-[#EE8164]`, white text, font-weight 800, font-size 16px, shadow
   - All Tailwind classes

3. Create `app/(auth)/layout.tsx` — auth route group layout:
   - Renders `{children}` directly inside a minimal container (no Sidebar, no extra padding)
   - Inherits fonts from root layout (Fredoka + Nunito already loaded)

4. Create `components/auth/BrandHeroPanel.tsx` — login hero panel:
   - Gradient background (155deg, `#F6A98E` → `#F2937A` → `#EC7E62`)
   - Decorative circles (absolute positioned, semi-transparent white)
   - Logo: rounded-square icon + "OpenDayCare" text
   - Headline: "El día de cada niño, compartido con su familia."
   - Subtitle: "Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar."
   - Footer: "🌿 Guardería Sala Soles"
   - Only visible on desktop (`hidden lg:flex`)

5. Create `app/(auth)/login/page.tsx` — login page:
   - Desktop: grid layout (1.05fr 1fr) with `BrandHeroPanel` left + form right
   - Mobile: centered form only (hero hidden)
   - Form content: "Iniciar sesión" heading (Fredoka 30px), subtitle "Ingresá para ver el día de hoy.", email `FormField`, password `FormField` (with placeholder "••••••••"), "¿Olvidaste tu contraseña?" link (color `#C5503A`, non-functional), `PrimaryButton` "Iniciar sesión", footer link "¿Te invitó la guardería? Activá tu cuenta" linking to `/activate`
   - All hardcoded values, no state management

6. Create `app/(auth)/activate/page.tsx` — activate account page:
   - Centered layout (max-width 440px, vertical centering)
   - Logo icon: gradient box (58px, rounded-18px) with sun SVG
   - "Bienvenida a OpenDayCare" heading (Fredoka 32px)
   - Subtitle: "Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta."
   - Invite info card: avatar circle (initial "M", bg `#A9D9E8`) + "Te invitaron a seguir a" / "Mateo · Sala Soles"
   - "Código de invitación" `FormField` with `variant="mono"`, value "7K4P9"
   - "Email" `FormField`, value "lucia.fernandez@gmail.com"
   - "Crear contraseña" `FormField` (type password, value "contraseña")
   - Authorization checkbox: yellow bg card (`#FBF1D6`), green check icon, text "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app."
   - `PrimaryButton` "Activar mi cuenta"
   - Footer link: "¿Ya tenés cuenta? Iniciar sesión" linking to `/login`

7. Run `pnpm run lint` and `npx tsc --noEmit` to verify no errors. Open dev server and visually compare both pages against reference HTML at desktop (1280px) and mobile (375px) breakpoints.

## Acceptance criteria

- [ ] `/login` loads without errors
- [ ] `/activate` loads without errors
- [ ] Login page has split layout on desktop (hero left, form right)
- [ ] Login hero panel is hidden on mobile (`hidden lg:flex`)
- [ ] Login hero panel matches reference: gradient, decorative circles, logo, headline, subtitle, footer text
- [ ] Login form has: "Iniciar sesión" heading, subtitle, email field, password field, forgot password link, submit button, activate account link
- [ ] Login page does NOT contain "Personal/Familia" role toggle
- [ ] Activate page is centered with max-width 440px
- [ ] Activate page has: logo icon, heading, subtitle, invite info card, code input, email input, password input, authorization checkbox, submit button, login link
- [ ] Invite info card shows: avatar "M" (bg `#A9D9E8`), "Te invitaron a seguir a", "Mateo · Sala Soles"
- [ ] Authorization checkbox area has yellow background (`#FBF1D6`) with green check icon
- [ ] `FormField` component is reused on both pages (email, password, code fields)
- [ ] `PrimaryButton` component is reused on both pages
- [ ] Auth route group `(auth)` exists with its own layout (no Sidebar)
- [ ] "Activá tu cuenta" link on login navigates to `/activate`
- [ ] "Iniciar sesión" link on activate navigates to `/login`
- [ ] Color palette matches reference: background `#FBF4EC` (note: login bg is `#FBF4EC` not `#F6ECDF`), cards white, borders `#EADFD0`, accent `#F2937A`/`#EE8164`
- [ ] Fredoka for headings, Nunito for body text
- [ ] No horizontal scroll on any viewport
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No lint errors (`pnpm run lint`)
- [ ] Visual match with reference HTML at desktop (1280px+)

## Decisions

- **Yes:** `(auth)` route group with own layout. Clean separation from main app layout, avoids conditional Sidebar logic.
- **No:** Conditional Sidebar in main layout. Would complicate the existing layout for auth pages.
- **Yes:** `FormField` and `PrimaryButton` as shared components. Both appear identically on both pages.
- **No:** `AuthFooterLink` as shared component. Text varies per page; extracting adds complexity without value.
- **No:** `BrandHeroPanel` as shared component. Only used on login page.
- **No:** `Logo` as shared component. Login logo is inside the hero panel (white on gradient); activate logo is standalone (gradient box). Different presentations.
- **Yes:** Hero panel hidden on mobile. Standard pattern for split auth layouts; mobile shows form only.
- **No:** Stacked hero + form on mobile. Would require scrolling past decorative content to reach the form.
- **Yes:** Routes `/login` and `/activate`. Standard, descriptive paths.
- **No:** `/auth/login` and `/auth/activate`. Adds unnecessary nesting; URL bar shows `/(auth)/login` internally but the route group is transparent to the URL.
- **Yes:** Role toggle removed from login. Explicit user requirement.
- **No:** Keep role toggle as visual-only. User explicitly said not to include it.
- **Yes:** Background color `#FBF4EC` for auth pages (slightly different from feed `#F6ECDF`). Matches the reference mockups exactly.

## What is **not** in this spec

- Authentication or session management
- Form validation or error handling
- Password recovery flow
- Role selection (Personal/Familia)
- Database integration
- Navigation guards or protected routes
- Sidebar on auth pages
- Any functional form submission

Each one of those, if needed, goes in its own spec.
