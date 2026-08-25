-- migrations/014_create_comments.sql

-- 1. Tabla comments
CREATE TABLE IF NOT EXISTS public.comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- Staff puede leer comentarios en posts de su daycare
CREATE POLICY "Staff can read comments in their daycare"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.users u ON u.id = auth.uid()
      WHERE p.id = comments.post_id
        AND u.role = 'staff'
        AND (
          p.room_id IS NULL
          OR p.room_id IN (
            SELECT r.id FROM public.rooms r WHERE r.daycare_id = u.daycare_id
          )
        )
    )
  );

-- Padres pueden leer comentarios en posts etiquetados a sus hijos
CREATE POLICY "Parents can read comments on their children posts"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.post_children pc
      JOIN public.parent_children par ON par.child_id = pc.child_id
      WHERE pc.post_id = comments.post_id
        AND par.parent_id = auth.uid()
    )
  );

-- Usuarios autenticados pueden crear comentarios
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Usuarios pueden actualizar sus propios comentarios
CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Usuarios pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (author_id = auth.uid());
