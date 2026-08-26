"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// --- Types -------------------------------------------------------------------

export type PostType = "meal" | "nap" | "activity" | "achievement" | "photo" | "announcement";

export type RoomChild = {
  id: string;
  full_name: string;
  room_id: string;
  room_name: string;
};

export type Room = {
  id: string;
  name: string;
};

export type PostPhoto = {
  id: string;
  url: string;
  position: number;
};

export type PostChild = {
  child_id: string;
  full_name: string;
};

export type PostWithRelations = {
  id: string;
  author_id: string;
  room_id: string | null;
  type: PostType;
  title: string | null;
  body: string | null;
  published_at: string;
  author: {
    full_name: string;
    avatar_url: string | null;
  };
  children: PostChild[];
  photos: PostPhoto[];
};

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { error: string };

// --- Helpers -----------------------------------------------------------------

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function validateFiles(files: File[]): string | null {
  if (files.length > MAX_FILES) {
    return `Máximo ${MAX_FILES} fotos permitidas`;
  }
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Formato no válido: ${file.name}. Solo JPG y PNG.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Archivo muy grande: ${file.name}. Máximo 10MB.`;
    }
  }
  return null;
}

async function getCurrentUser(supabase: ReturnType<typeof createClient>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("id, role, daycare_id, room_id")
    .eq("id", user.id)
    .single();

  return userData;
}

// --- Server Actions ----------------------------------------------------------

export async function getRoomChildren(): Promise<RoomChild[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user || !user.daycare_id) return [];

  const { data, error } = await supabase
    .from("children")
    .select(`
      id,
      full_name,
      room_id,
      rooms!inner(name)
    `)
    .eq("rooms.daycare_id", user.daycare_id)
    .eq("status", "active")
    .order("full_name");

  if (error || !data) return [];

  return data.map((child) => {
    const room = child.rooms as unknown as { name: string };
    return {
      id: child.id,
      full_name: child.full_name,
      room_id: child.room_id,
      room_name: room.name,
    };
  });
}

export async function getRooms(): Promise<Room[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user || !user.daycare_id) return [];

  const { data, error } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("daycare_id", user.daycare_id)
    .order("name");

  if (error || !data) return [];
  return data;
}

export async function createPost({
  title,
  type,
  body,
  childIds,
  wholeRoom,
  files,
}: {
  title?: string;
  type: PostType;
  body?: string;
  childIds: string[];
  wholeRoom: boolean;
  files?: File[];
}): Promise<ActionResult<PostWithRelations>> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user || !user.room_id) {
    return { error: "No autorizado" };
  }

  if (body && body.length > 1000) {
    return { error: "La descripción no puede superar 1000 caracteres" };
  }

  if (files && files.length > 0) {
    const fileError = validateFiles(files);
    if (fileError) return { error: fileError };
  }

  let targetChildIds = childIds;

  if (wholeRoom) {
    const { data: roomChildren } = await supabase
      .from("children")
      .select("id")
      .eq("room_id", user.room_id)
      .eq("status", "active");

    targetChildIds = roomChildren?.map((c) => c.id) ?? [];
  } else {
    const { data: validChildren } = await supabase
      .from("children")
      .select("id")
      .eq("room_id", user.room_id)
      .in("id", childIds)
      .eq("status", "active");

    if (!validChildren || validChildren.length !== childIds.length) {
      return { error: "Uno o más niños no pertenecen a tu sala" };
    }
  }

  if (targetChildIds.length === 0) {
    return { error: "Debes seleccionar al menos un niño" };
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      room_id: user.room_id,
      type,
      title: title || null,
      body: body || null,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (postError || !post) {
    return { error: "Error al crear la publicación" };
  }

  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `posts/${post.id}/${i}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("post-photos")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        continue;
      }

      await supabase.from("post_photos").insert({
        post_id: post.id,
        url: path,
        position: i,
      });
    }
  }

  const childRows = targetChildIds.map((childId) => ({
    post_id: post.id,
    child_id: childId,
  }));

  const { error: childrenError } = await supabase
    .from("post_children")
    .insert(childRows);

  if (childrenError) {
    return { error: "Error al vincular niños" };
  }

  const { data: fullPost } = await supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(full_name, avatar_url),
      children:post_children(child_id, children(full_name)),
      photos:post_photos(id, url, position)
    `)
    .eq("id", post.id)
    .single();

  if (!fullPost) {
    return { success: true, data: post as unknown as PostWithRelations };
  }

  const result: PostWithRelations = {
    id: fullPost.id,
    author_id: fullPost.author_id,
    room_id: fullPost.room_id,
    type: fullPost.type,
    title: fullPost.title,
    body: fullPost.body,
    published_at: fullPost.published_at,
    author: {
      full_name: (fullPost.author as unknown as { full_name: string }).full_name,
      avatar_url: (fullPost.author as unknown as { avatar_url: string | null }).avatar_url,
    },
    children: (fullPost.children as unknown as Array<{ child_id: string; children: { full_name: string } }>).map(
      (pc) => ({
        child_id: pc.child_id,
        full_name: pc.children.full_name,
      })
    ),
    photos: (fullPost.photos as unknown as PostPhoto[]).sort(
      (a, b) => a.position - b.position
    ),
  };

  return { success: true, data: result };
}

export async function updatePost({
  postId,
  title,
  type,
  body,
  childIds,
  wholeRoom,
  newFiles,
  existingPhotoIds: _existingPhotoIds,
  removedPhotoIds,
}: {
  postId: string;
  title?: string;
  type: PostType;
  body?: string;
  childIds: string[];
  wholeRoom: boolean;
  newFiles?: File[];
  existingPhotoIds: string[];
  removedPhotoIds: string[];
}): Promise<ActionResult<PostWithRelations>> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user) return { error: "No autorizado" };

  const { data: existingPost } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (!existingPost || existingPost.author_id !== user.id) {
    return { error: "No tienes permiso para editar esta publicación" };
  }

  if (body && body.length > 1000) {
    return { error: "La descripción no puede superar 1000 caracteres" };
  }

  if (newFiles && newFiles.length > 0) {
    const fileError = validateFiles(newFiles);
    if (fileError) return { error: fileError };
  }

  let targetChildIds = childIds;

  if (wholeRoom && user.room_id) {
    const { data: roomChildren } = await supabase
      .from("children")
      .select("id")
      .eq("room_id", user.room_id)
      .eq("status", "active");

    targetChildIds = roomChildren?.map((c) => c.id) ?? [];
  }

  const { error: updateError } = await supabase
    .from("posts")
    .update({
      title: title || null,
      type,
      body: body || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (updateError) return { error: "Error al actualizar la publicación" };

  await supabase.from("post_children").delete().eq("post_id", postId);

  if (targetChildIds.length > 0) {
    const childRows = targetChildIds.map((childId) => ({
      post_id: postId,
      child_id: childId,
    }));
    await supabase.from("post_children").insert(childRows);
  }

  if (removedPhotoIds.length > 0) {
    const { data: photosToRemove } = await supabase
      .from("post_photos")
      .select("url")
      .in("id", removedPhotoIds);

    if (photosToRemove) {
      const paths = photosToRemove.map((p) => p.url);
      await supabase.storage.from("post-photos").remove(paths);
    }

    await supabase.from("post_photos").delete().in("id", removedPhotoIds);
  }

  if (newFiles && newFiles.length > 0) {
    const { data: currentPhotos } = await supabase
      .from("post_photos")
      .select("position")
      .eq("post_id", postId)
      .order("position", { ascending: false })
      .limit(1);

    let nextPosition = currentPhotos && currentPhotos.length > 0
      ? currentPhotos[0].position + 1
      : 0;

    for (const file of newFiles) {
      const path = `posts/${postId}/${nextPosition}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("post-photos")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (!uploadError) {
        await supabase.from("post_photos").insert({
          post_id: postId,
          url: path,
          position: nextPosition,
        });
      }

      nextPosition++;
    }
  }

  const { data: fullPost } = await supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(full_name, avatar_url),
      children:post_children(child_id, children(full_name)),
      photos:post_photos(id, url, position)
    `)
    .eq("id", postId)
    .single();

  if (!fullPost) {
    return { success: true };
  }

  const result: PostWithRelations = {
    id: fullPost.id,
    author_id: fullPost.author_id,
    room_id: fullPost.room_id,
    type: fullPost.type,
    title: fullPost.title,
    body: fullPost.body,
    published_at: fullPost.published_at,
    author: {
      full_name: (fullPost.author as unknown as { full_name: string }).full_name,
      avatar_url: (fullPost.author as unknown as { avatar_url: string | null }).avatar_url,
    },
    children: (fullPost.children as unknown as Array<{ child_id: string; children: { full_name: string } }>).map(
      (pc) => ({
        child_id: pc.child_id,
        full_name: pc.children.full_name,
      })
    ),
    photos: (fullPost.photos as unknown as PostPhoto[]).sort(
      (a, b) => a.position - b.position
    ),
  };

  return { success: true, data: result };
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user) return { error: "No autorizado" };

  const { data: existingPost } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (!existingPost) return { error: "Publicación no encontrada" };

  if (existingPost.author_id !== user.id && user.role !== "admin") {
    return { error: "No tienes permiso para eliminar esta publicación" };
  }

  const { data: photos } = await supabase
    .from("post_photos")
    .select("url")
    .eq("post_id", postId);

  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.url);
    await supabase.storage.from("post-photos").remove(paths);
  }

  await supabase.from("post_photos").delete().eq("post_id", postId);
  await supabase.from("post_children").delete().eq("post_id", postId);

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (deleteError) return { error: "Error al eliminar la publicación" };

  return { success: true };
}

export async function getPosts(): Promise<PostWithRelations[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const user = await getCurrentUser(supabase);
  if (!user || !user.daycare_id) return [];

  let query = supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(full_name, avatar_url),
      children:post_children(child_id, children(full_name)),
      photos:post_photos(id, url, position)
    `)
    .order("published_at", { ascending: false });

  if (user.role === "parent") {
    const { data: parentChildren } = await supabase
      .from("parent_children")
      .select("child_id")
      .eq("parent_id", user.id);

    const childIds = parentChildren?.map((pc) => pc.child_id) ?? [];

    if (childIds.length > 0) {
      query = query.or(
        `type.eq.announcement,children.child_id.in.(${childIds.join(",")})`
      );
    } else {
      query = query.eq("type", "announcement");
    }
  } else {
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id")
      .eq("daycare_id", user.daycare_id);

    const roomIds = rooms?.map((r) => r.id) ?? [];

    if (roomIds.length > 0) {
      query = query.in("room_id", roomIds);
    }
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((post) => ({
    id: post.id,
    author_id: post.author_id,
    room_id: post.room_id,
    type: post.type,
    title: post.title,
    body: post.body,
    published_at: post.published_at,
    author: {
      full_name: (post.author as unknown as { full_name: string }).full_name,
      avatar_url: (post.author as unknown as { avatar_url: string | null }).avatar_url,
    },
    children: (post.children as unknown as Array<{ child_id: string; children: { full_name: string } }>).map(
      (pc) => ({
        child_id: pc.child_id,
        full_name: pc.children.full_name,
      })
    ),
    photos: (post.photos as unknown as PostPhoto[]).sort(
      (a, b) => a.position - b.position
    ),
  }));
}
