"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { kids as initialKids, type Kid } from "@/data/kids";
import AddKidDialog, { type AddKidFormData } from "@/components/AddKidDialog";

const AVATAR_COLORS = [
  { bg: "#A9D9E8", text: "#1F7A93" },
  { bg: "#F4B8CC", text: "#C44A7A" },
  { bg: "#B9DEC4", text: "#3E8B62" },
  { bg: "#F4DC8E", text: "#9A7B1E" },
  { bg: "#C9B6E8", text: "#7B5FC0" },
];

const ROOM_LABELS: Record<string, string> = {
  soles: "Soles",
  luna: "Luna",
  estrellas: "Estrellas",
};

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function parseBirthDate(input: string): { age: string; birthDate: string } {
  const match = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return { age: "—", birthDate: input };

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  const now = new Date();
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) age--;

  const monthLabel = MONTHS_SHORT[month - 1] ?? "—";
  return {
    age: `${age} años`,
    birthDate: `${day} ${monthLabel} ${year}`,
  };
}

function buildKidFromForm(data: AddKidFormData, index: number): Kid {
  const colorSet = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const { age, birthDate } = parseBirthDate(data.fecha);
  const slug = data.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const badges: Kid["badges"] = [];
  if (data.alergias.trim()) {
    const tags = data.alergias.split(",").map((t) => t.trim()).filter(Boolean);
    for (const tag of tags) {
      badges.push({
        label: tag.toUpperCase(),
        bgColor: "#FBD8CC",
        textColor: "#D9684A",
      });
    }
  }

  return {
    id: `${slug}-${Date.now()}`,
    name: data.nombre,
    initial: data.nombre.charAt(0).toUpperCase(),
    avatarBgColor: colorSet.bg,
    avatarTextColor: colorSet.text,
    age,
    parentCount: 0,
    badges,
    room: ROOM_LABELS[data.sala] ?? data.sala,
    birthDate,
    enrollmentDate: MONTHS_SHORT[new Date().getMonth()] + " " + new Date().getFullYear(),
    allergyNotes: data.notas.trim() || null,
    parents: [],
  };
}

export default function KidsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kids, setKids] = useState<Kid[]>(initialKids);

  const handleAddKid = (data: AddKidFormData) => {
    setKids((prev) => [...prev, buildKidFromForm(data, prev.length)]);
    setDialogOpen(false);
  };

  return (
    <>
      <AddKidDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleAddKid} />
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
              <button
                onClick={() => setDialogOpen(true)}
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
              </button>
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
    </>
  );
}
