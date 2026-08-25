-- migrations/013_create_post_photos_and_reactions.sql

-- 1. Tabla post_photos
CREATE TABLE IF NOT EXISTS public.post_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url        text NOT NULL,
  width      int,
  height     int,
  position   int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabla reactions
CREATE TABLE IF NOT EXISTS public.reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       text NOT NULL DEFAULT 'love',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- 3. RLS
ALTER TABLE public.post_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- 4. Policies para post_photos

-- Staff puede leer fotos de posts de su daycare
CREATE POLICY "Staff can read post_photos in their daycare"
  ON public.post_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.users u ON u.id = auth.uid()
      WHERE p.id = post_photos.post_id
        AND u.role = 'staff'
        AND (
          p.room_id IS NULL
          OR p.room_id IN (
            SELECT r.id FROM public.rooms r WHERE r.daycare_id = u.daycare_id
          )
        )
    )
  );

-- Staff puede insertar fotos en sus posts
CREATE POLICY "Staff can insert post_photos"
  ON public.post_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_photos.post_id
        AND p.author_id = auth.uid()
    )
  );

-- Padres pueden leer fotos de posts etiquetados a sus hijos
CREATE POLICY "Parents can read post_photos of their children posts"
  ON public.post_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.post_children pc
      JOIN public.parent_children par ON par.child_id = pc.child_id
      WHERE pc.post_id = post_photos.post_id
        AND par.parent_id = auth.uid()
    )
  );

-- 5. Policies para reactions

-- Usuarios autenticados pueden leer reacciones de posts accesibles
CREATE POLICY "Authenticated users can read reactions"
  ON public.reactions FOR SELECT
  TO authenticated
  USING (true);

-- Usuarios pueden crear sus propias reacciones
CREATE POLICY "Users can create their own reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Usuarios pueden eliminar sus propias reacciones
CREATE POLICY "Users can delete their own reactions"
  ON public.reactions FOR DELETE
  USING (user_id = auth.uid());
