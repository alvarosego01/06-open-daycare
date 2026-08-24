# Migrations

Control file for database migrations applied to Supabase.

| #   | Name                  | Description                                      | Status  |
| --- | --------------------- | ------------------------------------------------ | ------- |
| 001 | 001_create_daycares   | Create the `daycares` table with RLS enabled.    | applied |
| 002 | 002_create_users      | Create `user_role`/`user_status` enums, the `users` table linked to `auth.users`, the `handle_new_user()` trigger, RLS policies, and a staff seed user. | applied |
