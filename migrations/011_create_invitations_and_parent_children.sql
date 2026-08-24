-- migrations/011_create_invitations_and_parent_children.sql

-- 0. Crear enums si no existen
do $$ begin
  if not exists (select 1 from pg_type where typname = 'relationship_type') then
    create type public.relationship_type as enum ('father', 'mother', 'guardian');
  end if;
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
  end if;
end $$;

-- 1. Tabla parent_children
create table if not exists public.parent_children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.users(id) on delete cascade,
  child_id     uuid not null references public.children(id) on delete cascade,
  relationship public.relationship_type not null,
  created_at   timestamptz not null default now(),
  unique (parent_id, child_id)
);

-- 2. Tabla invitations
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children(id) on delete cascade,
  invited_by  uuid not null references public.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  relationship public.relationship_type not null,
  code        text not null unique,
  status      public.invitation_status not null default 'pending',
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- 3. RLS
alter table public.parent_children enable row level security;
alter table public.invitations enable row level security;

-- Políticas para parent_children
create policy "Staff can read parent_children in their daycare"
  on public.parent_children for select
  using (
    exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      join public.users u on u.daycare_id = r.daycare_id
      where c.id = parent_children.child_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

create policy "Parents can read their own parent_children"
  on public.parent_children for select
  using (parent_id = auth.uid());

-- Políticas para invitations
create policy "Staff can read invitations in their daycare"
  on public.invitations for select
  using (
    exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      join public.users u on u.daycare_id = r.daycare_id
      where c.id = invitations.child_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

create policy "Staff can insert invitations in their daycare"
  on public.invitations for insert
  with check (
    exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      join public.users u on u.daycare_id = r.daycare_id
      where c.id = invitations.child_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

create policy "Invited parent can read their accepted invitation"
  on public.invitations for select
  using (email = auth.jwt() ->> 'email' and status = 'accepted');
