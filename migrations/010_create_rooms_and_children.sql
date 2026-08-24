-- migrations/010_create_rooms_and_children.sql

-- 1. Enum child_status
create type public.child_status as enum ('active', 'archived');

-- 2. Tabla rooms
create table if not exists public.rooms (
  id         uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

-- 3. Tabla children
create table if not exists public.children (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references public.rooms(id) on delete cascade,
  full_name      text not null,
  birth_date     date not null,
  enrolled_at    date not null default current_date,
  medical_notes  text,
  allergy_tags   text[] not null default '{}',
  photo_consent  boolean not null default true,
  status         public.child_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 4. RLS
alter table public.rooms enable row level security;
alter table public.children enable row level security;

-- Políticas para rooms
create policy "Staff can read rooms in their daycare"
  on public.rooms for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'staff'
        and u.daycare_id = rooms.daycare_id
    )
  );

create policy "Staff can insert rooms in their daycare"
  on public.rooms for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'staff'
        and u.daycare_id = rooms.daycare_id
    )
  );

-- Políticas para children
create policy "Staff can read children in their daycare"
  on public.children for select
  using (
    exists (
      select 1 from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

create policy "Staff can insert children in their daycare"
  on public.children for insert
  with check (
    exists (
      select 1 from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

create policy "Staff can update children in their daycare"
  on public.children for update
  using (
    exists (
      select 1 from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  )
  with check (
    exists (
      select 1 from public.rooms r
      join public.users u on u.daycare_id = r.daycare_id
      where r.id = children.room_id
        and u.id = auth.uid()
        and u.role = 'staff'
    )
  );

-- 5. Seed de salas
insert into public.rooms (daycare_id, name)
values
  ((select id from public.daycares limit 1), 'Sala Soles'),
  ((select id from public.daycares limit 1), 'Jardín de Estrellas'),
  ((select id from public.daycares limit 1), 'Fuente de Arcoíris');
