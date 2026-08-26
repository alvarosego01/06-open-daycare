## Purpose

Provides the family-facing panel with a filtered feed showing only posts related to their children and announcements, plus an account page for managing preferences. Includes a dedicated sidebar and layout with role-based access protection.

## ADDED Requirements

### Requirement: Family routes under /family

The system SHALL expose the following routes exclusively for parent users:
- `/family/feed` — feed filtrado con posts de sus hijos y anuncios
- `/family/account` — página de cuenta con configuración de preferencias

#### Scenario: Parent user accesses /family/feed
- **WHEN** a user with role `parent` navigates to `/family/feed`
- **THEN** the system SHALL render the family feed page with FamilySidebar and posts filtered to their children plus announcements

#### Scenario: Parent user accesses /family/account
- **WHEN** a user with role `parent` navigates to `/family/account`
- **THEN** the system SHALL render the family account page with their profile, children list, and notification preferences

### Requirement: FamilySidebar navigation

The FamilySidebar SHALL display the following navigation items:
- Feed (`/family/feed`)
- Mi cuenta (`/family/account`)

The sidebar SHALL NOT include a "Nueva publicación" button. The sidebar subtitle SHALL display "Familia" instead of a room name. The user badge SHALL show their relationship to their children (e.g., "Mamá de Mateo").

#### Scenario: FamilySidebar renders correct navigation
- **WHEN** the family layout renders
- **THEN** the FamilySidebar SHALL display Feed and Mi cuenta items without a "Nueva publicación" button

#### Scenario: FamilySidebar shows correct subtitle
- **WHEN** the family layout renders
- **THEN** the sidebar subtitle SHALL display "Familia"

### Requirement: Family layout role protection

The family layout SHALL verify the current user's role before rendering children. If the user does not have role `parent`, the layout SHALL redirect them to `/staff/feed`.

#### Scenario: Staff user tries to access /family/feed
- **WHEN** a user with role `staff` navigates to `/family/feed`
- **THEN** the system SHALL redirect the user to `/staff/feed`

#### Scenario: Unauthenticated user tries to access /family/feed
- **WHEN** an unauthenticated user navigates to `/family/feed`
- **THEN** the system SHALL redirect the user to `/login`

### Requirement: Family feed displays filtered posts

The family feed SHALL display posts using the existing `getPosts()` server action, which already filters by `parent_children` for parent users. The feed header SHALL show "TU FAMILIA" as the label, "Hola, [nombre]" as the greeting, and "Así va el día de hoy" as the subtitle.

#### Scenario: Parent sees only their children's posts and announcements
- **WHEN** a parent user loads `/family/feed`
- **THEN** the feed SHALL display posts tagged to their children and announcement-type posts from their daycare

#### Scenario: Family feed shows personalized greeting
- **WHEN** a parent user loads `/family/feed`
- **THEN** the greeting SHALL display "Hola, [user's first name]"

### Requirement: Family account page

The family account page SHALL display:
- User profile card with avatar, name, email, and children summary
- "MIS HIJOS" section listing their children with photo consent toggles
- "NOTIFICACIONES" section with notification preference toggles
- Links for "Cambiar contraseña" and "Ayuda y soporte"
- "Cerrar sesión" button

#### Scenario: Parent sees their children in account page
- **WHEN** a parent user navigates to `/family/account`
- **THEN** the "MIS HIJOS" section SHALL list all children linked via `parent_children`

#### Scenario: Parent can toggle photo consent
- **WHEN** a parent user toggles the photo consent switch for a child
- **THEN** the system SHALL update the `photo_consent` field for that child
