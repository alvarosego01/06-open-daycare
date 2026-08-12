# SPEC 01 — Feed home page visual implementation

> **Status:** Implemented
> **Depends on:** (none)
> **Date:** 2026-08-11
> **Objective:** Replicate the visual design of `references/pantallas/feed.dc.html` as the home page at `/` using Tailwind CSS and hardcoded mock data, with responsive adaptation and no authentication or database.

## Scope

**In:**

- Implement the complete feed page layout matching the reference design in `references/pantallas/feed.dc.html`
- Use Tailwind CSS utility classes for all visual styling (no inline styles or custom CSS classes)
- Create a responsive layout: desktop shows sidebar (248px) + main content; mobile/tablet adapts appropriately
- Create a sidebar component with responsive behavior: visible on desktop, collapsible/hidden on mobile with hamburger menu
- Create a main content area with greeting header, "Compartí un momento" box, and post feed
- Implement three post type variants: achievement, activity, and announcement with distinct visual badges
- Use hardcoded mock data for posts (3 example posts)
- Load and apply Fredoka (headings) and Nunito (body) fonts from Google Fonts
- Apply the warm cream/peach color palette using Tailwind config (#F6ECDF background, #FFFDF9 cards, #F2937A/#EE8164 accents, #3F362E text)
- Decompose UI into reusable components: Sidebar, PostCard, and main page composition
- Ensure all spacing, typography, and colors scale appropriately across breakpoints

**Out of scope (for future specs):**

- Functional navigation links (links will be non-functional placeholders)
- Interactive reactions (heart buttons, comment counts will be visual only)
- Authentication or user session management
- Database integration or dynamic data loading
- "Nueva publicación" button functionality
- "Editar" button functionality on posts
- Photo upload or display in activity posts (placeholder shown)

## Data model

```ts
// data/posts.ts

type PostAuthor = {
  name: string;
  initial: string;
  bgColor: string;
  textColor: string;
};

type PostBase = {
  id: string;
  author: PostAuthor;
  timestamp: string;
  publishedBy: string;
  recipient: string;
  content: string;
  likes: number;
  comments: number;
};

type PostAchievement = PostBase & {
  type: "achievement";
};

type PostActivity = PostBase & {
  type: "activity";
  photoPlaceholder?: string;
};

type PostAnnouncement = PostBase & {
  type: "announcement";
  author: {
    name: string;
    icon: "megaphone";
    bgColor: string;
    textColor: string;
  };
};

type Post = PostAchievement | PostActivity | PostAnnouncement;

export const posts: Post[] = [
  // 3 hardcoded example posts: 1 achievement, 1 activity, 1 announcement
];
```

Conventions:

- Post types use discriminated union on `type` field
- Colors match the reference: achievement badge green (#3E9B6C), activity badge blue (#2E89A6), announcement badge purple (#4E72C8)
- Author initials rendered in circular avatars with background colors from reference
- All user-facing text (post content, labels, buttons, navigation) must be in Spanish to match the reference design
- Internal code terminology (type names, variables, functions) must be in English

## Implementation plan

1. Update `tailwind.config.ts` (create if needed) to define custom colors matching the reference palette: `cream` (#F6ECDF), `card` (#FFFDF9), `border` (#ECE0D0), `accent` (#F2937A/#EE8164), `text-primary` (#3F362E), and badge colors (achievement green, activity blue, announcement purple). Configure Fredoka and Nunito as custom font families.

2. Update `app/globals.css` to import Tailwind CSS and define base styles. Remove dark mode styles. Set base font-family to Nunito using Tailwind's `@apply` directive.

3. Update `app/layout.tsx` to load Fredoka and Nunito fonts from Google Fonts. Remove Geist font imports. Update metadata title to "OpenDayCare - Sala Soles". Apply base Tailwind classes to `<body>`.

4. Create `data/posts.ts` with the mock data structure containing 3 hardcoded posts: one achievement (Mateo - potty training), one activity (Mateo - painting with tempera), and one general announcement. All user-facing text content must be in Spanish to match the reference:
   - Achievement post content: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso."
   - Activity post content: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores."
   - Announcement post content: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua."
   - Badge labels in UI: "LOGRO", "ACTIVIDAD", "ANUNCIO" (Spanish)

5. Create `components/Sidebar.tsx` with the complete sidebar structure using Tailwind classes: OpenDayCare logo/branding, "Nueva publicación" button, navigation links (Feed, Niños, Avisos, Mi cuenta), and user profile section at the bottom. Implement responsive behavior:
   - Desktop (md+): Fixed 248px sidebar, visible always
   - Mobile (<md): Hidden by default, toggle with hamburger menu button
   - Use Tailwind responsive prefixes (`md:flex`, `hidden md:block`, etc.)
   - Include mobile menu overlay with slide-in animation

6. Create `components/PostCard.tsx` that renders a single post card using Tailwind classes. Accept a `Post` prop and conditionally render the correct badge (achievement/activity/announcement) based on `post.type`. Include the author avatar, timestamp, recipient, content, and reaction counts (visual only). Ensure card padding, margins, and typography scale with breakpoints.

7. Update `app/page.tsx` to import Sidebar and PostCard components, and the mock posts data. Compose the full responsive feed layout:
   - Desktop: Sidebar fixed left (248px) + main content scrollable right
   - Mobile: Full-width main content with hamburger menu to toggle sidebar
   - Include greeting header, "Compartí un momento" box, "PUBLICADO HOY" divider, and list of PostCard components
   - Use Tailwind flexbox/grid utilities for layout

8. Run `npm run lint` and `npx tsc --noEmit` to verify no errors. Open the dev server and test at multiple breakpoints (mobile 375px, tablet 768px, desktop 1280px). Visually compare against `references/pantallas/feed.dc.html` to ensure exact match at desktop size and proper adaptation at smaller sizes.

## Acceptance criteria

- [ ] The page at `/` loads without errors
- [ ] All styling uses Tailwind CSS utility classes (no inline styles or custom CSS)
- [ ] Desktop layout (1280px+): sidebar (248px, sticky, left) + main content (scrollable, right)
- [ ] Tablet layout (768px-1024px): sidebar collapses or adapts appropriately
- [ ] Mobile layout (<768px): sidebar hidden, hamburger menu visible, main content full-width
- [ ] Hamburger menu toggles sidebar visibility on mobile with smooth transition
- [ ] Sidebar contains: OpenDayCare logo with gradient, "Sala Soles" subtitle, "Nueva publicación" button with gradient, 4 navigation links (Feed active, Niños, Avisos, Mi cuenta), and user profile section with "Caro Giménez"
- [ ] Main content shows: "GUARDERÍA · SALA SOLES" label, "Buenas, Caro" heading, "12 niños · martes 17 jun" subtitle
- [ ] "Compartí un momento..." box is visible with camera icon
- [ ] "PUBLICADO HOY" divider appears before posts
- [ ] Three posts render in order: achievement (Mateo - potty training), activity (Mateo - tempera painting), announcement (general). All post content text displayed in Spanish as per reference.
- [ ] Each post has correct badge: achievement (green #3E9B6C, label "LOGRO"), activity (blue #2E89A6, label "ACTIVIDAD"), announcement (purple #4E72C8, label "ANUNCIO")
- [ ] Color palette matches reference: background #F6ECDF, cards #FFFDF9, borders #ECE0D0, accent gradients #F2937A/#EE8164
- [ ] Fredoka font used for headings (OpenDayCare, post author names, main heading)
- [ ] Nunito font used for body text (post content, timestamps, labels)
- [ ] Post cards have rounded corners (rounded-2xl or rounded-3xl), subtle shadows, and proper spacing that scales with breakpoints
- [ ] Reaction counts (hearts, comments) are visible but non-functional
- [ ] Typography scales appropriately: headings smaller on mobile, body text readable at all sizes
- [ ] Padding and margins adjust for mobile (less padding on small screens)
- [ ] No horizontal scroll on any viewport size
- [ ] No console errors or TypeScript errors
- [ ] Visual comparison with `references/pantallas/feed.dc.html` shows exact match at desktop size (1280px+)
- [ ] Layout adapts gracefully at tablet (768px) and mobile (375px) sizes without breaking

## Decisions

- **Yes:** Tailwind CSS for all styling. Consistent with project setup, faster development, easier maintenance.
- **No:** Inline styles or custom CSS classes. Would duplicate Tailwind's capabilities and make responsive design harder.
- **Yes:** Responsive design with mobile hamburger menu. User requirement for proper adaptation across devices.
- **No:** Desktop-only layout. Would break on mobile devices and provide poor UX.
- **Yes:** Custom Tailwind config for color palette. Ensures consistency and makes theme changes easier.
- **No:** Hardcode colors in components. Would make theming and updates difficult.
- **Yes:** Component decomposition (Sidebar, PostCard). Improves maintainability and reusability for future specs.
- **No:** Keep everything in page.tsx. Would make the file too large and harder to modify.
- **Yes:** Separate mock data file (`data/posts.ts`). Clean separation between data and presentation.
- **No:** Inline hardcoded data in component. Would mix concerns and make updates harder.
- **Yes:** Non-functional navigation links (`href="#"`). This spec is purely visual; functionality belongs in separate specs.
- **No:** Create placeholder pages for navigation targets. Out of scope for this spec.
- **Yes:** Visual-only reactions and buttons. No interactivity needed per user requirement.
- **No:** Interactive heart buttons or comment links. Out of scope for visual implementation.
- **Yes:** Fredoka + Nunito fonts from Google Fonts. Matches the reference design exactly.
- **No:** Use Geist font (already loaded in layout). Would not match the reference design.
- **Yes:** Discriminated union for post types. Type-safe way to handle different post variants.
- **No:** Single generic Post type with optional fields. Would be less type-safe and harder to extend.
- **Yes:** Mobile-first responsive approach with Tailwind breakpoints. Modern best practice, easier to test.
- **No:** Desktop-first with media queries for mobile. More complex and less maintainable.

## What is **not** in this spec

- Functional navigation between pages
- Interactive reactions (likes, comments)
- Authentication or user sessions
- Database or API integration
- "Nueva publicación" form or functionality
- Photo upload or display
- Edit post functionality
- Any dynamic data loading
- Complex animations or transitions (only mobile menu slide-in)

Each one of those, if needed, goes in its own spec.
