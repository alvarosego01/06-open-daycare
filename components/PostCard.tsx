"use client";

import { useState, useCallback, useEffect, startTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import ConfirmPopover from "@/components/ConfirmPopover";
import CreatePostDialog from "@/components/CreatePostDialog";
import { deletePost, type PostWithRelations, type PostType } from "@/app/actions/posts";

type PostCardProps = {
  post: PostWithRelations;
  onDeleted?: () => void;
  onEdited?: () => void;
};

type BadgeConfig = {
  label: string;
  bgColor: string;
  dotColor: string;
  textColor: string;
};

const badgeConfig: Record<PostType, BadgeConfig> = {
  meal: {
    label: "COMIDA",
    bgColor: "bg-[#9A7B1E]",
    dotColor: "bg-[#FFFFFF]",
    textColor: "text-[#FFFFFF]",
  },
  nap: {
    label: "SIESTA",
    bgColor: "bg-[#E7DCF6]",
    dotColor: "bg-[#7B5FC0]",
    textColor: "text-[#7B5FC0]",
  },
  activity: {
    label: "ACTIVIDAD",
    bgColor: "bg-[#2E89A6]",
    dotColor: "bg-[#FFFFFF]",
    textColor: "text-[#FFFFFF]",
  },
  achievement: {
    label: "LOGRO",
    bgColor: "bg-[#CFEBD8]",
    dotColor: "bg-[#3E9B6C]",
    textColor: "text-[#3E9B6C]",
  },
  photo: {
    label: "FOTO",
    bgColor: "bg-[#FBD8CC]",
    dotColor: "bg-[#D9684A]",
    textColor: "text-[#D9684A]",
  },
  announcement: {
    label: "ANUNCIO",
    bgColor: "bg-[#CCD8F4]",
    dotColor: "bg-[#4E72C8]",
    textColor: "text-[#4E72C8]",
  },
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function getAuthorInitial(name: string): string {
  return name[0]?.toUpperCase() || "?";
}

export default function PostCard({ post, onDeleted, onEdited }: PostCardProps) {
  const badge = badgeConfig[post.type];
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        startTransition(() => {
          setIsAuthor(user.id === post.author_id);
        });
        supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              startTransition(() => {
                setIsAdmin(data.role === "admin");
              });
            }
          });
      }
    });
  }, [post.author_id, supabase]);

  useEffect(() => {
    if (post.photos.length === 0) {
      startTransition(() => {
        setPhotoUrls([]);
      });
      return;
    }
    const urls = post.photos.map((p) => {
      const { data } = supabase.storage.from("post-photos").getPublicUrl(p.url);
      return data.publicUrl;
    });
    startTransition(() => {
      setPhotoUrls(urls);
    });
  }, [post.photos, supabase]);

  const canEdit = isAuthor || isAdmin;

  const handleDelete = useCallback(async () => {
    const result = await deletePost(post.id);
    if ("success" in result) {
      onDeleted?.();
    }
  }, [post.id, onDeleted]);

  const handleEditClose = useCallback(() => {
    setEditOpen(false);
  }, []);

  const handleEdited = useCallback(() => {
    setEditOpen(false);
    onEdited?.();
  }, [onEdited]);

  const childrenNames = post.children.map((c) => c.full_name).join(", ");

  return (
    <>
      <article className="bg-card border border-border rounded-[20px] px-5 py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
        <div className="flex items-center gap-3 mb-3.5">
          {post.type === "announcement" ? (
            <div className="w-11 h-11 rounded-full flex items-center justify-center flex-none bg-[#CCD8F4] text-[#4E72C8]">
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 11 18-5v12L3 14v-3z" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              </svg>
            </div>
          ) : (
            <div className="w-11 h-11 rounded-full font-heading font-semibold text-[17px] flex items-center justify-center flex-none bg-[#F2937A] text-white">
              {getAuthorInitial(post.author.full_name)}
            </div>
          )}

          <div className="flex-1">
            <div className="font-heading font-semibold text-[16.5px] text-text-primary">
              {post.author.full_name}
            </div>
            <div className="text-[12.5px] text-[#A89A8B]">
              {formatTime(post.published_at)}
            </div>
          </div>

          <div
            className={`flex items-center gap-[7px] px-3 py-1.5 rounded-full ${badge.bgColor}`}
          >
            <span className={`w-2 h-2 rounded-full ${badge.dotColor}`} />
            <span
              className={`text-[12px] font-extrabold tracking-[0.5px] ${badge.textColor}`}
            >
              {badge.label}
            </span>
          </div>

          {canEdit && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Opciones"
                className="flex items-center justify-center w-8 h-8 rounded-[8px] hover:bg-[#F0E6D8] transition-colors text-[#94887B]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-40 w-[160px] bg-[#FBF4EC] border border-[#E7DAC8] rounded-[12px] shadow-[0_8px_24px_-8px_rgba(63,54,46,.3)] py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setEditOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[13.5px] font-semibold text-[#4A4038] hover:bg-[#F0E6D8] transition-colors"
                  >
                    Editar
                  </button>
                  <ConfirmPopover
                    trigger={
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-[13.5px] font-semibold text-[#D9583C] hover:bg-[#FBE6DF] transition-colors"
                      >
                        Eliminar
                      </button>
                    }
                    message="¿Confirmás que querés eliminar esta publicación? Esta acción no se puede deshacer."
                    confirmLabel="Eliminar"
                    onConfirm={handleDelete}
                    variant="danger"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {childrenNames && (
          <div className="text-[12.5px] text-[#A89A8B] mb-2.5">
            Para: {childrenNames}
          </div>
        )}

        {post.title && (
          <h3 className="font-heading font-semibold text-[16px] text-text-primary mb-1.5">
            {post.title}
          </h3>
        )}

        {post.body && (
          <p className="text-[15.5px] leading-[1.55] text-[#4A4038] m-0">
            {post.body}
          </p>
        )}

        {photoUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3.5">
            {photoUrls.map((url, i) => (
              <div
                key={i}
                className="rounded-[14px] overflow-hidden border border-[#E0D3C3]"
              >
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="w-full max-h-[300px] object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-[18px] mt-4 pt-3.5 border-t border-[#F0E6D8]">
          <span className="flex items-center gap-[7px] text-[#E0654A] font-bold text-[14px]">
            <svg
              aria-hidden="true"
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="#E0654A"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            0
          </span>
          <span className="flex items-center gap-[7px] text-[#94887B] font-bold text-[14px]">
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
            </svg>
            0
          </span>
        </div>
      </article>

      {editOpen && (
        <CreatePostDialog
          open={editOpen}
          onClose={handleEditClose}
          editMode
          post={post}
          onSaved={handleEdited}
        />
      )}
    </>
  );
}
