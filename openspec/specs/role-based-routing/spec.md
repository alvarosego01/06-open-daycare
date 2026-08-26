## Purpose

Handles routing users to the correct panel (staff or family) based on their role after login and when accessing the root URL.

## Requirements

### Requirement: Root page redirects by role

The root page (`/`) SHALL detect the current user's role and redirect them to the appropriate panel:
- `staff` or `admin` → `/staff/feed`
- `parent` → `/family/feed`

#### Scenario: Staff user accesses root
- **WHEN** a user with role `staff` or `admin` navigates to `/`
- **THEN** the system SHALL redirect to `/staff/feed`

#### Scenario: Parent user accesses root
- **WHEN** a user with role `parent` navigates to `/`
- **THEN** the system SHALL redirect to `/family/feed`

#### Scenario: Unauthenticated user accesses root
- **WHEN** an unauthenticated user navigates to `/`
- **THEN** the system SHALL redirect to `/login`

### Requirement: Login redirects by role

After successful login, the system SHALL query the user's role from the `users` table and redirect them to the appropriate panel:
- `staff` or `admin` → `/staff/feed`
- `parent` → `/family/feed`

#### Scenario: Staff user logs in
- **WHEN** a user with role `staff` completes login successfully
- **THEN** the system SHALL redirect to `/staff/feed`

#### Scenario: Parent user logs in
- **WHEN** a user with role `parent` completes login successfully
- **THEN** the system SHALL redirect to `/family/feed`
