-- migrations/012_post_rls_and_storage.sql

-- 1. Drop existing policies to replace with updated ones (including admin role)
DROP POLICY IF EXISTS "Staff can read posts in their daycare" ON public.posts;
DROP POLICY IF EXISTS "Staff can create posts" ON public.posts;
DROP POLICY IF EXISTS "Staff can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Parents can read posts tagged to their children" ON public.posts;
DROP POLICY IF EXISTS "Staff can read post_children in their daycare" ON public.post_children;
DROP POLICY IF EXISTS "Staff can insert post_children" ON public.post_children;
DROP POLICY IF EXISTS "Parents can read post_children of their children" ON public.post_children;
DROP POLICY IF EXISTS "Staff can read post_photos in their daycare" ON public.post_photos;
DROP POLICY IF EXISTS "Staff can insert post_photos" ON public.post_photos;
DROP POLICY IF EXISTS "Parents can read post_photos of their children posts" ON public.post_photos;

-- 2. RLS para tabla posts (updated policies with admin role)

-- Staff/admin pueden leer posts de su daycare
CREATE POLICY "Staff can read posts in their daycare"
  ON public.posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.id = posts.author_id
        AND u.role IN ('staff', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.rooms r ON r.daycare_id = u.daycare_id
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND posts.room_id = r.id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.post_children pc
      JOIN public.parent_children pcn ON pcn.child_id = pc.child_id
      WHERE pc.post_id = posts.id
        AND pcn.parent_id = auth.uid()
    )
    OR
    (posts.type = 'announcement'
     AND EXISTS (
       SELECT 1 FROM public.users u
       JOIN public.rooms r ON r.daycare_id = u.daycare_id
       WHERE u.id = auth.uid()
         AND u.role = 'parent'
         AND posts.room_id = r.id
     ))
  );

-- Staff/admin pueden insertar posts
CREATE POLICY "Staff can insert posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.id = posts.author_id
        AND u.role IN ('staff', 'admin')
    )
  );

-- Staff/admin pueden actualizar sus propios posts
CREATE POLICY "Staff can update own posts"
  ON public.posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.id = posts.author_id
        AND u.role IN ('staff', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.id = posts.author_id
        AND u.role IN ('staff', 'admin')
    )
  );

-- Staff/admin pueden eliminar sus propios posts
CREATE POLICY "Staff can delete own posts"
  ON public.posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.id = posts.author_id
        AND u.role IN ('staff', 'admin')
    )
  );

-- 3. RLS para tabla post_children

-- Staff/admin pueden gestionar post_children de sus posts
CREATE POLICY "Staff can manage post_children in their daycare"
  ON public.post_children FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.users u ON u.id = p.author_id
      WHERE p.id = post_children.post_id
        AND u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.users u ON u.id = p.author_id
      WHERE p.id = post_children.post_id
        AND u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
    )
  );

-- Parents pueden leer post_children de posts que pueden ver
CREATE POLICY "Parents can read post_children of visible posts"
  ON public.post_children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = post_children.child_id
        AND pc.parent_id = auth.uid()
    )
  );

-- 4. RLS para tabla post_photos

-- Staff/admin pueden gestionar post_photos de sus posts
CREATE POLICY "Staff can manage post_photos of their posts"
  ON public.post_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_photos.post_id
        AND p.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_photos.post_id
        AND p.author_id = auth.uid()
    )
  );

-- Parents pueden leer post_photos de posts que pueden ver
CREATE POLICY "Parents can read post_photos of visible posts"
  ON public.post_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.post_children pc
      JOIN public.parent_children pcn ON pcn.child_id = pc.child_id
      WHERE pc.post_id = post_photos.post_id
        AND pcn.parent_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.users u ON u.role = 'parent'
      WHERE p.id = post_photos.post_id
        AND p.type = 'announcement'
        AND u.id = auth.uid()
    )
  );

-- 5. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-photos', 'post-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Políticas de Storage

-- Staff/admin pueden subir fotos
CREATE POLICY "Staff can upload post photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-photos'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
    )
  );

-- Staff/admin pueden eliminar sus fotos
CREATE POLICY "Staff can delete own post photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-photos'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
    )
  );

-- Lectura pública (las fotos son públicas)
CREATE POLICY "Post photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-photos');
