'use client';

import { useState } from 'react';
import Link from 'next/link';
import AddKidDialog from '@/components/AddKidDialog';
import { archiveChild } from './actions';
import { useRouter } from 'next/navigation';

const AVATAR_COLORS = [
  { bg: '#A9D9E8', text: '#1F7A93' },
  { bg: '#F4B8CC', text: '#C44A7A' },
  { bg: '#B9DEC4', text: '#3E8B62' },
  { bg: '#F4DC8E', text: '#9A7B1E' },
  { bg: '#C9B6E8', text: '#7B5FC0' },
];

function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} años`;
}

interface Child {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[];
  photo_consent: boolean;
  room_id: string;
  room_name: string;
}

interface KidsListClientProps {
  children: Child[];
  rooms: { id: string; name: string }[];
}

export default function KidsListClient({ children: childList, rooms }: KidsListClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const groupedByRoom = childList.reduce((acc, child) => {
    if (!acc[child.room_name]) {
      acc[child.room_name] = [];
    }
    acc[child.room_name].push(child);
    return acc;
  }, {} as Record<string, Child[]>);

  const sortedRoomNames = Object.keys(groupedByRoom).sort();

  const handleArchive = async (childId: string, childName: string) => {
    if (!confirm(`¿Estás seguro de archivar a ${childName}?`)) {
      return;
    }

    const result = await archiveChild(childId);
    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      router.refresh();
    }
  };

  return (
    <>
      <AddKidDialog open={dialogOpen} onClose={() => setDialogOpen(false)} rooms={rooms} />
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

      {sortedRoomNames.length === 0 ? (
        <div className="text-center py-12 text-[#A89A8B]">
          No hay niños activos registrados
        </div>
      ) : (
        sortedRoomNames.map((roomName) => {
          const roomChildren = groupedByRoom[roomName];
          return (
            <div key={roomName} className="mb-8">
              <div className="flex items-center gap-3 mb-3.5">
                <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-text-primary">
                  {roomName.toUpperCase()}
                </span>
                <span className="text-[13px] text-[#A89A8B]">
                  {roomChildren.length} {roomChildren.length === 1 ? 'niño' : 'niños'}
                </span>
                <span className="flex-1 h-px bg-[#E7DAC8]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {roomChildren.map((child, index) => {
                  const colorSet = AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const initial = child.full_name.charAt(0).toUpperCase();
                  const age = calculateAge(child.birth_date);

                  return (
                    <div
                      key={child.id}
                      className="flex items-center gap-3.5 min-w-0 bg-card border border-border rounded-[18px] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] hover:border-[#F2A78E] hover:-translate-y-0.5 transition-all duration-150"
                    >
                      <Link
                        href={`/staff/kids/${child.id}`}
                        className="flex items-center gap-3.5 min-w-0 flex-1"
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-none font-heading font-semibold text-[19px]"
                          style={{
                            backgroundColor: colorSet.bg,
                            color: colorSet.text,
                          }}
                        >
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-heading font-semibold text-[16px] text-text-primary">
                            {child.full_name}
                          </div>
                          <div className="text-[13px] text-[#A89A8B]">
                            {age} · sin padres vinculados
                          </div>
                        </div>
                      </Link>
                      {child.allergy_tags.length > 0 ? (
                        <div className="flex flex-none gap-2">
                          {child.allergy_tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] font-extrabold py-[5px] px-[9px] rounded-full"
                              style={{
                                backgroundColor: '#FBD8CC',
                                color: '#D9684A',
                              }}
                            >
                              {tag.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleArchive(child.id, child.full_name)}
                          className="flex-none text-[#CBB89F] hover:text-[#D9583C] transition-colors"
                          title="Archivar niño"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
