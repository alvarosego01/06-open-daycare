"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type ActiveItem = "feed" | "kids" | "notices" | "account";

type SidebarProps = {
  activeItem?: ActiveItem;
};

function formatDisplayName(fullName: string): { name: string; initial: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return {
    name: `${firstName}${lastInitial ? ` ${lastInitial}.` : ""}`,
    initial: firstName[0]?.toUpperCase() || "?",
  };
}

export default function Sidebar({ activeItem = "feed" }: SidebarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Usuario");
  const [avatarInitial, setAvatarInitial] = useState("U");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const fullName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Usuario";
      const { name, initial } = formatDisplayName(fullName);
      setDisplayName(name);
      setAvatarInitial(initial);
    });
  }, []);

  const navItems = [
    {
      key: "feed" as const,
      label: "Feed",
      href: "/",
      icon: (
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
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      ),
    },
    {
      key: "kids" as const,
      label: "Niños",
      href: "/kids",
      icon: (
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
          <circle cx="9" cy="7" r="3" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
        </svg>
      ),
    },
    {
      key: "notices" as const,
      label: "Avisos",
      href: "#",
      icon: (
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
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      ),
    },
    {
      key: "account" as const,
      label: "Mi cuenta",
      href: "#",
      icon: (
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
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const sidebarContent = (
    <>
      <a
        href="#"
        className="flex items-center gap-[11px] px-2 pt-1 pb-5"
      >
        <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-[#F8C3A8] to-[#F2937A] flex items-center justify-center flex-none">
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>
        <div>
          <div className="font-heading font-semibold text-[17px] text-text-primary leading-none">
            OpenDayCare
          </div>
          <div className="text-[11.5px] text-[#A89A8B] mt-0.5">Sala Soles</div>
        </div>
      </a>

      <a
        href="#"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)] mb-[18px]"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nueva publicación
      </a>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className={`flex items-center gap-3 py-[11px] px-3 rounded-xl text-[14.5px] ${
              activeItem === item.key
                ? "bg-[#FBE3D8] text-[#D9583C] font-extrabold"
                : "bg-transparent text-[#6E6359] font-semibold"
            }`}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      <div className="border-t border-border pt-3.5 mt-2.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <div className="w-[38px] h-[38px] rounded-full bg-[#F2937A] text-white font-heading font-semibold text-[16px] flex items-center justify-center flex-none">
            {avatarInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-[14px] text-text-primary">
              {displayName}
            </div>
            <div className="text-[12px] text-[#A89A8B]">Maestra · Soles</div>
          </div>
          <button
            type="button"
            title="Cerrar sesión"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="flex-none w-8 h-8 rounded-[10px] bg-cream text-[#94887B] flex items-center justify-center cursor-pointer hover:bg-[#EDE0D0] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-text-primary shadow-sm"
        aria-label="Abrir menú"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-[248px] bg-card border-r border-border flex flex-col py-6 px-4 transition-transform duration-200 ease-in-out md:sticky md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
