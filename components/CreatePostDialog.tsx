"use client";

import { useState } from "react";
import Dialog from "@/components/Dialog";
import { kids } from "@/data/kids";
import {
  posts,
  POST_CATEGORY_META,
  type Post,
  type PostAuthor,
  type PostCategory,
} from "@/data/posts";

const MOCK_PHOTOS = [
  "/photos/painting.svg",
  "/photos/playground.svg",
  "/photos/snack.svg",
];

const GENERAL_AUTHOR: PostAuthor = {
  name: "Sala Soles",
  initial: "S",
  bgColor: "#F2937A",
  textColor: "#FFFFFF",
};

const RECIPIENT_KIDS = kids.filter((kid) =>
  ["mateo-fernandez", "sofia-mendez", "benjamin-ruiz"].includes(kid.id)
);

function buildAuthorFor(recipientId: string): PostAuthor {
  if (recipientId === "") return GENERAL_AUTHOR;
  const kid = kids.find((k) => k.id === recipientId);
  if (!kid) return GENERAL_AUTHOR;
  return {
    name: kid.name,
    initial: kid.initial,
    bgColor: kid.avatarBgColor,
    textColor: kid.avatarTextColor,
  };
}

function currentTimestamp(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function nextPostId(): string {
  const maxId = posts.reduce((max, post) => {
    const numeric = Number(post.id);
    return Number.isNaN(numeric) ? max : Math.max(max, numeric);
  }, 0);
  return String(maxId + 1);
}

type CreatePostDialogProps = {
  open: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
};

export default function CreatePostDialog({
  open,
  onClose,
  onPostCreated,
}: CreatePostDialogProps) {
  const [recipient, setRecipient] = useState<string>("mateo-fernandez");
  const [category, setCategory] = useState<PostCategory | null>(null);
  const [content, setContent] = useState<string>(
    "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón."
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [recipientError, setRecipientError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);

  function resetForm() {
    setRecipient("mateo-fernandez");
    setCategory(null);
    setContent(
      "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón."
    );
    setPhotos([]);
    setRecipientError(false);
    setCategoryError(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function togglePhoto(photo: string) {
    setPhotos((current) =>
      current.includes(photo)
        ? current.filter((p) => p !== photo)
        : [...current, photo]
    );
  }

  function handlePublish() {
    const recipientMissing = recipient === "";
    const categoryMissing = category === null;

    setRecipientError(recipientMissing);
    setCategoryError(categoryMissing);

    if (recipientMissing || categoryMissing) return;

    const author = buildAuthorFor(recipient);
    const kid = kids.find((k) => k.id === recipient);

    const newPost: Post = {
      id: nextPostId(),
      category,
      author,
      timestamp: currentTimestamp(),
      publishedBy: "publicado por vos",
      recipient: kid ? kid.name : "",
      content,
      photos: photos.length > 0 ? [...photos] : undefined,
      likes: 0,
      comments: 0,
    };

    posts.unshift(newPost);
    onPostCreated?.(newPost);
    handleClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md:max-w-[580px]">
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-[26px] py-5 border-b border-[#ECE0D0]">
          <button
            type="button"
            onClick={handleClose}
            className="text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span className="font-heading font-semibold text-[18px] text-[#3F362E]">
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={handlePublish}
            className="text-[15px] font-extrabold text-[#D9583C]"
          >
            Publicar
          </button>
        </div>

        <div className="overflow-y-auto px-[26px] py-6">
          <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2.5">
            PARA
          </div>
          <div className="flex flex-wrap gap-2.5 mb-6">
            {RECIPIENT_KIDS.map((kid) => {
              const selected = recipient === kid.id;
              return (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() => {
                    setRecipient(kid.id);
                    setRecipientError(false);
                  }}
                  className={`flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border-[1.5px] text-[14px] font-bold ${
                    selected
                      ? "border-[#3F362E] bg-[#3F362E] text-white"
                      : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                  } ${recipientError && !selected ? "border-[#D9583C]" : ""}`}
                >
                  <span
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-heading font-semibold text-[13px]"
                    style={{
                      backgroundColor: kid.avatarBgColor,
                      color: kid.avatarTextColor,
                    }}
                  >
                    {kid.initial}
                  </span>
                  {kid.name.split(" ")[0]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setRecipient("");
                setRecipientError(false);
              }}
              className={`px-4 py-1.5 rounded-full border-[1.5px] text-[14px] font-bold ${
                recipient === ""
                  ? "border-[#3F362E] bg-[#3F362E] text-white"
                  : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
              } ${recipientError && recipient !== "" ? "border-[#D9583C]" : ""}`}
            >
              Toda la sala
            </button>
          </div>

          <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2.5">
            TIPO
          </div>
          <div className="flex flex-wrap gap-2.5 mb-6">
            {(Object.keys(POST_CATEGORY_META) as PostCategory[]).map((key) => {
              const meta = POST_CATEGORY_META[key];
              const selected = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setCategory(key);
                    setCategoryError(false);
                  }}
                  className={`px-4 py-2 rounded-full text-[13.5px] font-extrabold ${
                    categoryError && !selected ? "ring-2 ring-[#D9583C]" : ""
                  }`}
                  style={{
                    backgroundColor: meta.bg,
                    color: meta.text,
                    outline: selected ? "2.5px solid #3F362E" : "none",
                    outlineOffset: "1px",
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2.5">
            DESCRIPCIÓN
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contá cómo le fue hoy…"
            className="w-full min-h-[120px] resize-y p-[14px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-[#3F362E] leading-[1.5] mb-6"
          />

          <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2.5">
            FOTOS
          </div>
          <div className="flex flex-wrap gap-3">
            {MOCK_PHOTOS.map((photo) => {
              const selected = photos.includes(photo);
              return (
                <button
                  key={photo}
                  type="button"
                  onClick={() => togglePhoto(photo)}
                  className={`w-24 h-24 rounded-[14px] overflow-hidden border flex items-center justify-center ${
                    selected
                      ? "border-[2.5px] border-[#D9583C]"
                      : "border border-[#ECE0D0]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
            <button
              type="button"
              className="w-24 h-24 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] flex flex-col items-center justify-center gap-1.5 text-[#B0A290]"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C5503A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-[12px]">Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
