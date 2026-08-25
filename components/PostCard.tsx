import type { Post, PostCategory } from "@/data/posts";
import Link from "next/link";

interface PostCardProps {
  post: Post;
}

type BadgeConfig = {
  label: string;
  bgColor: string;
  dotColor: string;
  textColor: string;
};

const badgeConfig: Record<PostCategory, BadgeConfig> = {
  comida: {
    label: "COMIDA",
    bgColor: "bg-[#9A7B1E]",
    dotColor: "bg-[#FFFFFF]",
    textColor: "text-[#FFFFFF]",
  },
  siesta: {
    label: "SIESTA",
    bgColor: "bg-[#E7DCF6]",
    dotColor: "bg-[#7B5FC0]",
    textColor: "text-[#7B5FC0]",
  },
  actividad: {
    label: "ACTIVIDAD",
    bgColor: "bg-[#2E89A6]",
    dotColor: "bg-[#FFFFFF]",
    textColor: "text-[#FFFFFF]",
  },
  logro: {
    label: "LOGRO",
    bgColor: "bg-[#CFEBD8]",
    dotColor: "bg-[#3E9B6C]",
    textColor: "text-[#3E9B6C]",
  },
  animo: {
    label: "ÁNIMO",
    bgColor: "bg-[#F9D2DE]",
    dotColor: "bg-[#C56486]",
    textColor: "text-[#C56486]",
  },
  foto: {
    label: "FOTO",
    bgColor: "bg-[#FBD8CC]",
    dotColor: "bg-[#D9684A]",
    textColor: "text-[#D9684A]",
  },
  anuncio: {
    label: "ANUNCIO",
    bgColor: "bg-[#CCD8F4]",
    dotColor: "bg-[#4E72C8]",
    textColor: "text-[#4E72C8]",
  },
};

export default function PostCard({ post }: PostCardProps) {
  const badge = badgeConfig[post.category];

  return (
    <article className="bg-card border border-border rounded-[20px] px-5 py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <div className="flex items-center gap-3 mb-3.5">
        {post.category === "anuncio" ? (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-none"
            style={{
              backgroundColor: post.author.bgColor,
              color: post.author.textColor,
            }}
          >
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
          <div
            className="w-11 h-11 rounded-full font-heading font-semibold text-[17px] flex items-center justify-center flex-none"
            style={{
              backgroundColor: post.author.bgColor,
              color: post.author.textColor,
            }}
          >
            {post.author.initial}
          </div>
        )}

        <div className="flex-1">
          <div className="font-heading font-semibold text-[16.5px] text-text-primary">
            {post.author.name}
          </div>
          <div className="text-[12.5px] text-[#A89A8B]">
            {post.timestamp} · {post.publishedBy}
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
      </div>

      {post.recipient && (
        <div className="text-[12.5px] text-[#A89A8B] mb-2.5">
          Para: {post.recipient}
        </div>
      )}

      <p className="text-[15.5px] leading-[1.55] text-[#4A4038] m-0">
        {post.content}
      </p>

      {post.photos && post.photos.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-2 mt-3.5 border border-dashed border-[#DBCDBA] rounded-[16px] bg-[#F4ECE1] h-[200px] text-[#B0A290]">
          <svg
            aria-hidden="true"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
          </svg>
          <span className="text-[13.5px]">Foto · {post.category}</span>
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
          {post.likes}
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
          {post.comments}
        </span>
        <span className="flex-1" />
        <Link
          href="#"
          aria-label={`Editar publicación de ${post.author.name}`}
          className="text-[#C5503A] font-extrabold text-[14px]"
        >
          Editar
        </Link>
      </div>
    </article>
  );
}
