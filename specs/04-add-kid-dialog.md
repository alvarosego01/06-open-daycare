# SPEC 04 — Add kid modal dialog

> **Status:** Approved
> **Depends on:** SPEC 02
> **Date:** 2026-08-13
> **Objective:** Implement the "Agregar niño" modal dialog on the `/kids` page matching `references/pantallas/agregar-nino.dc.html`, with hardcoded mock data, field validation, and subtle fade animations.

## Scope

**In:**

- Implement modal dialog triggered by the "+ Agregar niño" button on `/kids`
- Match the visual design from `references/pantallas/agregar-nino.dc.html` exactly (colors, spacing, typography, border-radius)
- Dialog structure: header with "Cancelar" (left), "Agregar niño" title (center, Fredoka), "Guardar" (right, red)
- Form fields:
  - NOMBRE COMPLETO (text input, required)
  - FECHA DE NACIMIENTO (text input with placeholder "dd/mm/aaaa", required)
  - SALA (select dropdown with hardcoded options: Soles, Luna, Estrellas, required)
  - ALERGIAS (ETIQUETAS) (text input, optional)
  - NOTAS MÉDICAS (textarea, optional)
- Validation: required fields show red border (#D9583C) on "Guardar" click if empty
- "Cancelar" closes the dialog and resets form state
- "Guardar" triggers validation but does not persist data or close the dialog
- Responsive: full-screen sheet on mobile (< md), centered card with backdrop on desktop (md+)
- Backdrop: black 40% opacity with subtle blur
- Fade-in/fade-out animation (opacity + subtle scale)
- Reuse and extend `FormField` component to support editable inputs, textarea, and select variants
- All user-facing text in Spanish to match reference
- All code (variables, functions, types, interfaces) in English

**Out of scope (for future specs):**

- Actual data persistence or API calls
- Navigation after saving
- Dynamic room data loading
- Photo upload for kid avatar
- Edit existing kid functionality
- Toast/notification after "Guardar"
- Date picker component (plain text input with format hint)

## Data model

This spec introduces no new persistent data structures. It extends the existing form infrastructure:

```ts
// components/ui/FormField.tsx — extended props

type FormFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  variant?: "default" | "mono";
  borderColor?: string;
  readOnly?: boolean;       // default true (backward compat)
  hasError?: boolean;       // red border when true
  errorMessage?: string;    // shown below field when hasError
  rows?: number;            // for textarea variant
  renderAs?: "input" | "textarea" | "select";  // field type variant
  options?: { value: string; label: string }[]; // for select variant
};
```

Room options (hardcoded):

```ts
const ROOM_OPTIONS = [
  { value: "soles", label: "Soles" },
  { value: "luna", label: "Luna" },
  { value: "estrellas", label: "Estrellas" },
];
```

Conventions:

- Dialog colors: container bg `#FBF4EC`, border `#ECE0D0`, card shadow `0 20px 50px -24px rgba(63,54,46,.35)`
- Error border: `#D9583C` (same as "Guardar" text color in reference)
- Label style: 12px, font-weight 800, letter-spacing 0.7px, color `#94887B`
- Input style: padding 13px 16px, border-radius 14px, border 1.5px solid `#EADFD0`, bg white, font-size 15px
- Select shows chevron-down icon (same as reference)

## Implementation plan

1. Extend `components/ui/FormField.tsx` to support:
   - `readOnly` prop (default `true` for backward compatibility with login/activate pages)
   - `renderAs` prop: `"input"` (default), `"textarea"`, `"select"`
   - `options` prop for select variant
   - `rows` prop for textarea
   - `onChange` callback
   - `hasError` boolean for red border styling
   - `errorMessage` string shown below field when `hasError` is true
   - Verify existing usage in login/activate pages still works unchanged.

2. Create `components/Dialog.tsx` — reusable modal wrapper:
   - Props: `open: boolean`, `onClose: () => void`, `children: ReactNode`
   - Renders backdrop (fixed inset-0, bg-black/40, backdrop-blur-sm) with fade-in/fade-out via CSS transitions
   - Renders content container:
     - Desktop (md+): centered card, max-width 520px, border-radius 24px, bg `#FBF4EC`, border `#ECE0D0`, shadow
     - Mobile (< md): full-screen sheet (fixed inset-0), same bg color, no border-radius
   - Fade animation: opacity 0→1 + scale 0.97→1 on open, reverse on close (use CSS transitions with state management)
   - Trap focus inside dialog, close on Escape key press

3. Create `components/AddKidDialog.tsx` — the add-kid form dialog:
   - Uses `Dialog` as wrapper
   - Header: "Cancelar" button (left, color `#94887B`), "Agregar niño" title (center, Fredoka 600 18px), "Guardar" button (right, color `#D9583C`, font-weight 800)
   - Form body with extended `FormField` components:
     - NOMBRE COMPLETO: `renderAs="input"`, placeholder "Ej. Martina López"
     - FECHA DE NACIMIENTO + SALA: side-by-side row (flex, gap 14px). Fecha uses `renderAs="input"` placeholder "dd/mm/aaaa". Sala uses `renderAs="select"` with room options.
     - ALERGIAS (ETIQUETAS): `renderAs="input"`, placeholder "Ej. Maní, Lactosa"
     - NOTAS MÉDICAS: `renderAs="textarea"`, placeholder "Indicaciones, medicación, contactos…", min-height 90px
   - State: controlled form fields via `useState`
   - "Guardar" click: validates required fields (nombre, fecha, sala), sets `hasError` on empty ones. Does NOT close dialog or persist data.
   - "Cancelar" click: resets form state, calls `onClose`

4. Update `app/kids/page.tsx`:
   - Convert to client component (add `"use client"` directive) or extract interactive parts into a client wrapper component
   - Add `useState` for dialog open state
   - Change "+ Agregar niño" button from `<a href="#">` to `<button>` that sets dialog open to `true`
   - Render `<AddKidDialog>` conditionally

5. Run `pnpm run lint` and `npx tsc --noEmit`. Visual verification at multiple breakpoints against reference.

## Acceptance criteria

- [ ] `/kids` loads without errors
- [ ] Clicking "+ Agregar niño" button opens the modal dialog
- [ ] Dialog matches reference visual: header layout (Cancelar/Agregar niño/Guardar), field labels, input styling, spacing, colors
- [ ] FECHA DE NACIMIENTO and SALA are side-by-side in a row with 14px gap
- [ ] SALA field is a select with options: Soles, Luna, Estrellas (with chevron icon)
- [ ] NOTAS MÉDICAS is a textarea with min-height 90px and resize vertical
- [ ] "Cancelar" closes the dialog and resets all field values
- [ ] "Guardar" validates required fields: nombre completo, fecha de nacimiento, sala
- [ ] Empty required fields show red border (`#D9583C`) when "Guardar" is clicked
- [ ] "Guardar" does NOT close the dialog
- [ ] "Guardar" does NOT persist any data
- [ ] Desktop (md+): dialog is a centered card (max-width 520px) with backdrop (black 40% opacity + blur)
- [ ] Mobile (< md): dialog is full-screen sheet
- [ ] Fade-in animation on dialog open (opacity + subtle scale)
- [ ] Fade-out animation on dialog close
- [ ] Escape key closes the dialog
- [ ] Backdrop click closes the dialog
- [ ] Existing `FormField` usage in login/activate pages is unchanged (backward compatible)
- [ ] No TypeScript errors (`npx tsc --noEmit` passes)
- [ ] No lint errors in application code
- [ ] Fredoka for dialog title, Nunito for body text
- [ ] No horizontal scroll on any viewport

## Decisions

- **Yes:** Extend `FormField` with `readOnly`, `renderAs`, `hasError`, `onChange` props. Reuses existing component, avoids duplication.
- **No:** Create separate field components for modal. Would duplicate styling logic.
- **Yes:** `FormField.readOnly` defaults to `true`. Preserves existing behavior in login/activate pages.
- **No:** Default to `false`. Would break existing pages silently.
- **Yes:** `Dialog` as separate reusable component. Could be reused for other modals in future specs.
- **No:** Inline dialog in `AddKidDialog`. Would prevent reuse and make testing harder.
- **Yes:** Full-screen on mobile, centered card on desktop. Best UX across viewports.
- **No:** Same centered card at all sizes. Too small on mobile, poor touch targets.
- **Yes:** CSS transitions for fade animation. Simple, performant, no extra dependencies.
- **No:** framer-motion or animation library. Overengineering for a subtle effect.
- **Yes:** "Guardar" does not close dialog. User explicitly requested this behavior.
- **No:** "Guardar" closes dialog after validation. Contradicts user requirement.
- **Yes:** Convert kids page to client component. Modal requires interactive state.
- **No:** Separate client wrapper component. Adds indirection for minimal benefit; kids page is simple enough.
- **Yes:** 3 hardcoded room options (Soles, Luna, Estrellas). Makes the dropdown visually meaningful.
- **No:** Single fixed room value. Would not look like a real select.
- **Yes:** Validation shows red border only, no error message text. Matches the minimal visual style of the reference.
- **No:** Inline error messages below fields. Would change layout and deviate from reference.

## What is **not** in this spec

- Data persistence or API integration
- Navigation after saving
- Dynamic room data
- Photo upload
- Edit kid functionality
- Toast notifications
- Date picker (plain text input)
- Functional search on kids listing
- Any changes to kids profile page

Each one of those, if needed, goes in its own spec.
