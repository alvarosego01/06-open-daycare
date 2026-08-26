"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import PostCard from "@/components/PostCard";
import { getPosts, type PostWithRelations } from "@/app/actions/posts";

export default function FamilyFeedPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("Usuario");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const fullName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Usuario";
      const parts = fullName.trim().split(/\s+/);
      setFirstName(parts[0] || "Usuario");
    });
  }, []);

  const fetchPosts = useCallback(async () => {
    const data = await getPosts();
    startTransition(() => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <main className="flex-1 min-w-0 h-screen overflow-y-auto">
      <div className="max-w-[760px] w-full mx-auto px-5 py-8 md:px-10 md:py-[34px] pb-20">
        <div className="mb-6">
          <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C] mb-1">
            TU FAMILIA
          </div>
          <h1 className="font-heading font-semibold text-[30px] m-0 text-text-primary">
            Hola, {firstName}
          </h1>
          <p className="text-[#94887B] text-[15px] mt-1">
            Así va el día de hoy
          </p>
        </div>

        <div className="flex items-center gap-3.5 mb-3.5">
          <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
            PUBLICADO HOY
          </span>
          <span className="flex-1 h-px bg-[#E7DAC8]" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#A89A8B] text-[14px]">
            Cargando publicaciones…
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#A89A8B] text-[14px]">
            No hay publicaciones todavía
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDeleted={fetchPosts}
                onEdited={fetchPosts}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
