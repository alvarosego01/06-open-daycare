import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { kids } from "@/data/kids";

type KidProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function KidProfilePage({ params }: KidProfilePageProps) {
  const { id } = await params;
  const kid = kids.find((k) => k.id === id);

  if (!kid) {
    notFound();
  }

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
                    backgroundColor: kid.avatarBgColor,
                    color: kid.avatarTextColor,
                  }}
                >
                  {kid.initial}
                </div>
                <div className="flex-1">
                  <h1 className="font-heading font-semibold text-[28px] m-0 text-text-primary">
                    {kid.name}
                  </h1>
                  <p className="m-[3px]_0_0 text-[#94887B] text-[15px]">
                    {kid.age} · Sala {kid.room}
                  </p>
                </div>
                <a
                  href="#"
                  className="border-[1.5px] border-border bg-card text-[#6E6359] font-bold text-[14px] py-[9px] px-4 rounded-xl"
                >
                  Editar
                </a>
              </div>

              {kid.allergyNotes && (
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
                      Alergias y notas
                    </div>
                    <div className="text-[#B25249] text-[14.5px] leading-relaxed">
                      {kid.allergyNotes}
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
                    {kid.birthDate}
                  </span>
                </div>
                <div className="flex justify-between py-[15px] px-[18px] border-b border-[#F0E6D8]">
                  <span className="text-[#94887B] text-[14.5px]">Sala</span>
                  <span className="font-extrabold text-text-primary text-[14.5px]">
                    {kid.room}
                  </span>
                </div>
                <div className="flex justify-between py-[15px] px-[18px]">
                  <span className="text-[#94887B] text-[14.5px]">Ingreso</span>
                  <span className="font-extrabold text-text-primary text-[14.5px]">
                    {kid.enrollmentDate}
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

              <div className="bg-card border border-border rounded-2xl p-4 px-[18px]">
                <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D] mb-3.5">
                  PADRES VINCULADOS
                </div>
                <div className="flex flex-col gap-3.5">
                  {kid.parents.map((parent) => (
                    <div key={parent.id} className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full text-white font-heading font-semibold text-[16px] flex items-center justify-center flex-none"
                        style={{ backgroundColor: parent.avatarBgColor }}
                      >
                        {parent.initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-[14.5px] text-text-primary">
                          {parent.name}
                        </div>
                        <div className="text-[12.5px] text-[#A89A8B]">
                          {parent.role} ·{" "}
                          {parent.status === "active" ? "activa" : "invitación enviada"}
                        </div>
                      </div>
                      <span
                        className="flex-none text-[10.5px] font-extrabold py-1 px-[9px] rounded-full"
                        style={
                          parent.status === "active"
                            ? { backgroundColor: "#CFEBD8", color: "#3E9B6C" }
                            : { backgroundColor: "#F7E7A6", color: "#9A7B1E" }
                        }
                      >
                        {parent.status === "active" ? "ACTIVA" : "PENDIENTE"}
                      </span>
                    </div>
                  ))}
                  <a
                    href="#"
                    className="flex items-center gap-3 pt-2"
                  >
                    <span className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center text-[#B0A290] flex-none">
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
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                    <span className="font-extrabold text-[14.5px] text-[#C5503A]">
                      Vincular otro padre
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
