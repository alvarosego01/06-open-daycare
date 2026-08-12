import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { kids } from "@/data/kids";

export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar activeItem="kids" />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[880px] w-full mx-auto px-5 py-8 md:px-10 md:py-[34px] pb-20">
          <div className="flex items-end justify-between gap-4 mb-[22px]">
            <div>
              <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C] mb-1">
                GESTIÓN
              </div>
              <h1 className="font-heading font-semibold text-[30px] m-0 text-text-primary">
                Niños
              </h1>
            </div>
            <a
              href="#"
              className="flex items-center gap-2 py-[11px] px-[18px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
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
              Agregar niño
            </a>
          </div>

          <div className="flex items-center gap-[11px] bg-card border border-border rounded-[14px] py-3 px-4 mb-[22px]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B0A290"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              placeholder="Buscar niño…"
              className="flex-1 border-none bg-none text-[15px] text-text-primary placeholder:text-[#B6A99B] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 mb-3.5">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-text-primary">
              SALA SOLES
            </span>
            <span className="text-[13px] text-[#A89A8B]">{kids.length} niños</span>
            <span className="flex-1 h-px bg-[#E7DAC8]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {kids.map((kid) => (
              <Link
                key={kid.id}
                href={`/kids/${kid.id}`}
                className="flex items-center gap-3.5 min-w-0 bg-card border border-border rounded-[18px] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] hover:border-[#F2A78E] hover:-translate-y-0.5 transition-all duration-150"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-none font-heading font-semibold text-[19px]"
                  style={{
                    backgroundColor: kid.avatarBgColor,
                    color: kid.avatarTextColor,
                  }}
                >
                  {kid.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-[16px] text-text-primary">
                    {kid.name}
                  </div>
                  <div className="text-[13px] text-[#A89A8B]">
                    {kid.age} ·{" "}
                    {kid.parentCount === 0
                      ? "sin padres vinculados"
                      : `${kid.parentCount} padre${kid.parentCount > 1 ? "s" : ""} vinculado${kid.parentCount > 1 ? "s" : ""}`}
                  </div>
                </div>
                {kid.badges.length > 0 ? (
                  <div className="flex flex-none gap-2">
                    {kid.badges.map((badge) => (
                      <span
                        key={badge.label}
                        className="text-[11px] font-extrabold py-[5px] px-[9px] rounded-full"
                        style={{
                          backgroundColor: badge.bgColor,
                          color: badge.textColor,
                        }}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <svg
                    className="flex-none text-[#CBB89F]"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
