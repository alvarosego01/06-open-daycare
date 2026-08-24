-- migrations/002_create_users.sql

-- 1. Enums (guard: create type does not support IF NOT EXISTS)
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role' and n.nspname = 'public'
  ) then
    create type public.user_role as enum ('staff', 'parent', 'admin');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_status' and n.nspname = 'public'
  ) then
    create type public.user_status as enum ('pending', 'active');
  end if;
end $$;

-- 2. Table users
create table if not exists public.users (
  id                      uuid primary key references auth.users(id) on delete cascade,
  daycare_id              uuid not null references public.daycares(id) on delete cascade,
  role                    public.user_role not null,
  status                  public.user_status not null default 'active',
  full_name               text not null,
  avatar_url              text,
  notify_on_post          boolean not null default true,
  daily_summary_enabled   boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- 3. Function and trigger to auto-create profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data->>'daycare_id')::uuid,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. RLS
alter table public.users enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "Staff can read users in same daycare" on public.users;
create policy "Staff can read users in same daycare"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'staff'
        and u.daycare_id = users.daycare_id
    )
  );

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. Seed: staff user for testing
-- The profile in public.users is created automatically by the
-- on_auth_user_created trigger when the row is inserted into auth.users.
do $$
declare
  v_daycare_id uuid;
  v_existing auth.users;
begin
  select id into v_daycare_id from public.daycares limit 1;

  select * into v_existing from auth.users where email = 'alvarosego01@gmail.com';

  if v_existing.id is null then
    insert into auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token
    )
    values (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'alvarosego01@gmail.com',
      crypt('Abc12345@', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object(
        'daycare_id', v_daycare_id::text,
        'role', 'staff',
        'full_name', 'Alvaro Segovia'
      ),
      'authenticated',
      'authenticated',
      now(),
      now(),
      ''
    );
  end if;
end $$;
