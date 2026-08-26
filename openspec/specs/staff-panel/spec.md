## Purpose

Provides the staff-facing panel with routes for feed, kids management, and kid detail. Includes a dedicated sidebar and layout with role-based access protection.

## Requirements

### Requirement: Staff routes under /staff

The system SHALL expose the following routes exclusively for staff and admin users:
- `/staff/feed` — feed de publicaciones de la sala
- `/staff/kids` — lista de niños agrupados por sala
- `/staff/kids/[id]` — detalle de un niño

#### Scenario: Staff user accesses /staff/feed
- **WHEN** a user with role `staff` or `admin` navigates to `/staff/feed`
- **THEN** the system SHALL render the staff feed page with StaffSidebar and all posts from their daycare rooms

#### Scenario: Staff user accesses /staff/kids
- **WHEN** a user with role `staff` or `admin` navigates to `/staff/kids`
- **THEN** the system SHALL render the kids list page grouped by room with search and add functionality

#### Scenario: Staff user accesses kid detail
- **WHEN** a user with role `staff` or `admin` navigates to `/staff/kids/[id]`
- **THEN** the system SHALL render the kid detail page for that child

### Requirement: StaffSidebar navigation

The StaffSidebar SHALL display the following navigation items:
- Feed (`/staff/feed`)
- Niños (`/staff/kids`)
- Avisos (placeholder `#`)
- Mi cuenta (placeholder `#`)

The sidebar SHALL include a "Nueva publicación" button and display the user's name with a badge showing their role and room (e.g., "Maestra · Soles").

#### Scenario: StaffSidebar renders correct navigation
- **WHEN** the staff layout renders
- **THEN** the StaffSidebar SHALL display all four navigation items with correct hrefs and the "Nueva publicación" button

#### Scenario: Active navigation item is highlighted
- **WHEN** the user is on `/staff/feed`
- **THEN** the Feed navigation item SHALL be visually highlighted as active

### Requirement: Staff layout role protection

The staff layout SHALL verify the current user's role before rendering children. If the user does not have role `staff` or `admin`, the layout SHALL redirect them to `/family/feed`.

#### Scenario: Parent user tries to access /staff/feed
- **WHEN** a user with role `parent` navigates to `/staff/feed`
- **THEN** the system SHALL redirect the user to `/family/feed`

#### Scenario: Unauthenticated user tries to access /staff/feed
- **WHEN** an unauthenticated user navigates to `/staff/feed`
- **THEN** the system SHALL redirect the user to `/login`

### Requirement: Staff files migrated from root

All existing files currently at `app/page.tsx`, `app/kids/` SHALL be moved to `app/staff/feed/page.tsx`, `app/staff/kids/` respectively. Internal references (hrefs, revalidatePath) SHALL be updated to reflect the new paths.

#### Scenario: KidsListClient links to correct kid detail
- **WHEN** a staff user clicks on a kid card in `/staff/kids`
- **THEN** the link SHALL navigate to `/staff/kids/[id]`

#### Scenario: Kids actions revalidate correct path
- **WHEN** a staff user adds or archives a kid
- **THEN** the system SHALL revalidate `/staff/kids`
