"use client";

import { useRef } from "react";
import Sidebar, { type SidebarHandle } from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import { posts } from "@/data/posts";

export default function Home() {
  const sidebarRef = useRef<SidebarHandle>(null);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar ref={sidebarRef} activeItem="feed" />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[760px] w-full mx-auto px-5 py-8 md:px-10 md:py-[34px] pb-20">
          <div className="mb-6">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C] mb-1">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="font-heading font-semibold text-[30px] m-0 text-text-primary">
              Buenas, Caro
            </h1>
            <p className="mt-[5px] text-[#94887B] text-[14.5px]">
              12 niños · martes 17 jun
            </p>
          </div>

          <button
            type="button"
            onClick={() => sidebarRef.current?.openCreatePost()}
            className="flex items-center gap-3.5 w-full text-left bg-card border border-border rounded-[18px] px-[18px] py-3.5 mb-6 shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
          >
            <div className="w-10 h-10 rounded-full bg-[#F2937A] text-white font-heading font-semibold text-[16px] flex items-center justify-center flex-none">
              C
            </div>
            <span className="flex-1 text-[#A89A8B] text-[15px]">
              Compartí un momento…
            </span>
            <span className="w-[38px] h-[38px] rounded-xl bg-[#FBE3D8] text-[#E0654A] flex items-center justify-center">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
          </button>

          <div className="flex items-center gap-3.5 mb-3.5">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
              PUBLICADO HOY
            </span>
            <span className="flex-1 h-px bg-[#E7DAC8]" />
          </div>

          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
