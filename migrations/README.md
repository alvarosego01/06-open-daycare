# Migrations

Control file for database migrations applied to Supabase.

| #   | Name                  | Description                                      | Status  |
| --- | --------------------- | ------------------------------------------------ | ------- |
| 001 | 001_create_daycares   | Create the `daycares` table with RLS enabled.    | applied |
| 002 | 002_create_users      | Create `user_role`/`user_status` enums, the `users` table linked to `auth.users`, the `handle_new_user()` trigger, RLS policies, and a staff seed user. | applied |
| 010 | 010_create_rooms_and_children | Create `child_status` enum, `rooms` and `children` tables with RLS policies for staff access, and seed three rooms. | applied |
| 011 | 011_create_invitations_and_parent_children | Create `relationship_type` and `invitation_status` enums, `parent_children` and `invitations` tables with RLS policies for staff and parent access. | applied |
| 012 | 012_create_posts_and_children | Create `post_type` enum, `posts` and `post_children` tables with RLS policies for staff and parent access. | applied |
| 013 | 013_create_post_photos_and_reactions | Create `post_photos` and `reactions` tables with RLS policies. | applied |
| 014 | 014_create_comments | Create `comments` table with RLS policies. | applied |
| 015 | 015_create_daily_summaries_and_devices | Create `daily_summaries` and `devices` tables with RLS policies. | applied |
