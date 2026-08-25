-- migrations/012_create_posts_and_children.sql

-- 0. Crear enum post_type si no existe
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
    CREATE TYPE public.post_type AS ENUM ('meal', 'nap', 'activity', 'achievement', 'photo', 'announcement');
  END IF;
END $$;

-- 1. Tabla posts
CREATE TABLE IF NOT EXISTS public.posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id      uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  type         public.post_type NOT NULL,
  title        text,
  body         text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabla post_children (PK compuesta)
CREATE TABLE IF NOT EXISTS public.post_children (
  post_id  uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, child_id)
);

-- 3. RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_children ENABLE ROW LEVEL SECURITY;

-- 4. Policies para posts

-- Staff puede leer posts de su daycare (vía room_id o author_id)
CREATE POLICY "Staff can read posts in their daycare"
  ON public.posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'staff'
        AND (
          posts.room_id IS NULL
          OR posts.room_id IN (
            SELECT r.id FROM public.rooms r WHERE r.daycare_id = u.daycare_id
          )
        )
    )
  );

-- Staff puede crear posts
CREATE POLICY "Staff can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'staff'
        AND u.id = posts.author_id
    )
  );

-- Staff puede actualizar sus propios posts
CREATE POLICY "Staff can update their own posts"
  ON public.posts FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Padres pueden leer posts etiquetados a sus hijos + anuncios de su sala
CREATE POLICY "Parents can read posts tagged to their children"
  ON public.posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.parent_id = auth.uid()
        AND pc.child_id IN (
          SELECT pc2.child_id FROM public.post_children pc2 WHERE pc2.post_id = posts.id
        )
    )
    OR (
      posts.type = 'announcement'
      AND posts.room_id IN (
        SELECT c.room_id FROM public.children c
        JOIN public.parent_children pc ON pc.child_id = c.id
        WHERE pc.parent_id = auth.uid()
      )
    )
  );

-- 5. Policies para post_children

-- Staff puede leer post_children de su daycare
CREATE POLICY "Staff can read post_children in their daycare"
  ON public.post_children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.rooms r ON r.id = c.room_id
      JOIN public.users u ON u.daycare_id = r.daycare_id
      WHERE c.id = post_children.child_id
        AND u.id = auth.uid()
        AND u.role = 'staff'
    )
  );

-- Staff puede insertar post_children
CREATE POLICY "Staff can insert post_children"
  ON public.post_children FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'staff'
    )
  );

-- Padres pueden leer post_children de sus hijos
CREATE POLICY "Parents can read post_children of their children"
  ON public.post_children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.parent_id = auth.uid()
        AND pc.child_id = post_children.child_id
    )
  );
