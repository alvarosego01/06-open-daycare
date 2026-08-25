-- migrations/015_create_daily_summaries_and_devices.sql

-- 1. Tabla daily_summaries
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  date             date NOT NULL,
  meals_count      int NOT NULL DEFAULT 0,
  sleep_minutes    int NOT NULL DEFAULT 0,
  activities_count int NOT NULL DEFAULT 0,
  mood             text,
  highlight        text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, date)
);

-- 2. Tabla devices (opcional — push notifications)
CREATE TABLE IF NOT EXISTS public.devices (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token      text NOT NULL,
  platform   text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- 4. Policies para daily_summaries

-- Staff puede leer/crear/editar resúmenes de niños en su daycare
CREATE POLICY "Staff can manage daily_summaries in their daycare"
  ON public.daily_summaries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.rooms r ON r.id = c.room_id
      JOIN public.users u ON u.daycare_id = r.daycare_id
      WHERE c.id = daily_summaries.child_id
        AND u.id = auth.uid()
        AND u.role = 'staff'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.rooms r ON r.id = c.room_id
      JOIN public.users u ON u.daycare_id = r.daycare_id
      WHERE c.id = daily_summaries.child_id
        AND u.id = auth.uid()
        AND u.role = 'staff'
    )
  );

-- Padres pueden leer resúmenes de sus hijos
CREATE POLICY "Parents can read daily_summaries of their children"
  ON public.daily_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.parent_id = auth.uid()
        AND pc.child_id = daily_summaries.child_id
    )
  );

-- 5. Policies para devices

-- Usuarios pueden gestionar sus propios dispositivos
CREATE POLICY "Users can manage their own devices"
  ON public.devices FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
