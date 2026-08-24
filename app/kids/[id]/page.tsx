import { notFound } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import ParentsSection from '@/components/ParentsSection';
import { getChildById } from '../actions';
import ArchiveButton from './ArchiveButton';
import type { Parent } from '@/data/kids';

type KidProfilePageProps = {
  params: Promise<{ id: string }>;
};

const MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

function formatBirthDate(birthDate: string): string {
  const birth = new Date(birthDate);
  const day = birth.getDate();
  const month = MONTHS_SHORT[birth.getMonth()];
  const year = birth.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatEnrollmentDate(enrolledAt: string): string {
  const enrolled = new Date(enrolledAt);
  const month = MONTHS_SHORT[enrolled.getMonth()];
  const year = enrolled.getFullYear();
  return `${month} ${year}`;
}

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

const AVATAR_COLORS = [
  { bg: '#A9D9E8', text: '#1F7A93' },
  { bg: '#F4B8CC', text: '#C44A7A' },
  { bg: '#B9DEC4', text: '#3E8B62' },
  { bg: '#F4DC8E', text: '#9A7B1E' },
  { bg: '#C9B6E8', text: '#7B5FC0' },
];

export default async function KidProfilePage({ params }: KidProfilePageProps) {
  const { id } = await params;
  const child = await getChildById(id);

  if (!child) {
    notFound();
  }

  const initial = child.full_name.charAt(0).toUpperCase();
  const colorIndex = child.full_name.charCodeAt(0) % AVATAR_COLORS.length;
  const colorSet = AVATAR_COLORS[colorIndex];
  const age = calculateAge(child.birth_date);
  const birthDateFormatted = formatBirthDate(child.birth_date);
  const enrollmentDateFormatted = formatEnrollmentDate(child.enrolled_at);

  const mockParents: Parent[] = [];

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar activeItem="kids" />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[820px] w-full mx-auto px-5 py-8 md:px-10 md:py-[34px] pb-20">
          <Link
            href="/kids"
            className="flex items-center gap-[7px] text-[#94887B] font-bold text-[14px] mb-5"
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
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver a Niños
          </Link>

          <div className="flex gap-[26px] items-start flex-wrap">
            <div className="flex-1 min-w-[300px] flex flex-col gap-[18px]">
              <div className="flex items-center gap-[18px]">
                <div
                  className="w-[84px] h-[84px] rounded-full flex items-center justify-center flex-none font-heading font-semibold text-[34px]"
                  style={{
                    backgroundColor: colorSet.bg,
                    color: colorSet.text,
                  }}
                >
                  {initial}
                </div>
                <div className="flex-1">
                  <h1 className="font-heading font-semibold text-[28px] m-0 text-text-primary">
                    {child.full_name}
                  </h1>
                  <p className="m-[3px]_0_0 text-[#94887B] text-[15px]">
                    {age} · {child.room_name}
                  </p>
                </div>
                <ArchiveButton childId={child.id} childName={child.full_name} />
              </div>

              {child.medical_notes && (
                <div className="flex gap-3.5 bg-[#FBDAD6] rounded-2xl p-4 px-[18px]">
                  <div className="w-10 h-10 rounded-[11px] bg-[#F4A8A0] flex items-center justify-center flex-none">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-extrabold text-[#C5413A] text-[15px] mb-0.5">
                      Notas médicas
                    </div>
                    <div className="text-[#B25249] text-[14.5px] leading-relaxed">
                      {child.medical_notes}
                    </div>
                  </div>
                </div>
              )}

              {child.allergy_tags.length > 0 && (
                <div className="flex gap-3.5 bg-[#FBDAD6] rounded-2xl p-4 px-[18px]">
                  <div className="w-10 h-10 rounded-[11px] bg-[#F4A8A0] flex items-center justify-center flex-none">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-extrabold text-[#C5413A] text-[15px] mb-0.5">
                      Alergias
                    </div>
                    <div className="text-[#B25249] text-[14.5px] leading-relaxed">
                      {child.allergy_tags.map((tag: string) => tag.toUpperCase()).join(', ')}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex justify-between py-[15px] px-[18px] border-b border-[#F0E6D8]">
                  <span className="text-[#94887B] text-[14.5px]">
                    Fecha de nacimiento
                  </span>
                  <span className="font-extrabold text-text-primary text-[14.5px]">
                    {birthDateFormatted}
                  </span>
                </div>
                <div className="flex justify-between py-[15px] px-[18px] border-b border-[#F0E6D8]">
                  <span className="text-[#94887B] text-[14.5px]">Sala</span>
                  <span className="font-extrabold text-text-primary text-[14.5px]">
                    {child.room_name}
                  </span>
                </div>
                <div className="flex justify-between py-[15px] px-[18px]">
                  <span className="text-[#94887B] text-[14.5px]">Ingreso</span>
                  <span className="font-extrabold text-text-primary text-[14.5px]">
                    {enrollmentDateFormatted}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-[300px] flex-none flex flex-col gap-3.5 max-md:w-full">
              <a
                href="#"
                className="flex items-center justify-center gap-[9px] w-full py-[13px] rounded-[14px] bg-text-primary text-white font-extrabold text-[15px]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
                Resumen del día
              </a>

              <ParentsSection kidId={child.id} initialParents={mockParents} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
