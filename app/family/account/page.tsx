"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface Child {
  id: string;
  full_name: string;
  photo_consent: boolean;
}

interface UserProfile {
  fullName: string;
  email: string;
  initial: string;
}

export default function FamilyAccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({ fullName: "Usuario", email: "", initial: "U" });
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    posts: true,
    announcements: true,
    reminders: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const fullName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Usuario";
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || "Usuario";
      const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : "";

      setProfile({
        fullName: `${firstName}${lastInitial ? ` ${lastInitial}.` : ""}`,
        email: user.email || "",
        initial: firstName[0]?.toUpperCase() || "?",
      });

      const { data: parentChildren } = await supabase
        .from("parent_children")
        .select("child_id, children(id, full_name, photo_consent)")
        .eq("parent_id", user.id);

      if (parentChildren) {
        const childList = parentChildren
          .map((pc) => pc.children as unknown as { id: string; full_name: string; photo_consent: boolean })
          .filter(Boolean);
        setChildren(childList);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handlePhotoConsentToggle = async (childId: string, currentValue: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("children")
      .update({ photo_consent: !currentValue })
      .eq("id", childId);

    if (!error) {
      setChildren((prev) =>
        prev.map((c) =>
          c.id === childId ? { ...c, photo_consent: !currentValue } : c
        )
      );
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[600px] w-full mx-auto px-5 py-8 md:px-10 md:py-[34px]">
          <div className="flex items-center justify-center py-12 text-[#A89A8B] text-[14px]">
            Cargando…
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 h-screen overflow-y-auto">
      <div className="max-w-[600px] w-full mx-auto px-5 py-8 md:px-10 md:py-[34px] pb-20">
        <div className="mb-6">
          <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C] mb-1">
            MI CUENTA
          </div>
          <h1 className="font-heading font-semibold text-[30px] m-0 text-text-primary">
            Mi cuenta
          </h1>
        </div>

        {/* Profile card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#F2937A] text-white font-heading font-semibold text-[24px] flex items-center justify-center flex-none">
              {profile.initial}
            </div>
            <div>
              <div className="font-heading font-semibold text-[18px] text-text-primary">
                {profile.fullName}
              </div>
              <div className="text-[14px] text-[#94887B]">
                {profile.email}
              </div>
              <div className="text-[13px] text-[#A89A8B] mt-0.5">
                {children.length} {children.length === 1 ? "hijo" : "hijos"} vinculado{children.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* MIS HIJOS section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3.5">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-text-primary">
              MIS HIJOS
            </span>
            <span className="flex-1 h-px bg-[#E7DAC8]" />
          </div>

          {children.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-5 text-center text-[#A89A8B]">
              No hay hijos vinculados
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FBE3D8] text-[#D9583C] font-heading font-semibold text-[16px] flex items-center justify-center flex-none">
                      {child.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-semibold text-[15px] text-text-primary">
                      {child.full_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[#94887B]">Fotos</span>
                    <button
                      type="button"
                      onClick={() => handlePhotoConsentToggle(child.id, child.photo_consent)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        child.photo_consent ? "bg-[#F2937A]" : "bg-[#DDD3C8]"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          child.photo_consent ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NOTIFICACIONES section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3.5">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-text-primary">
              NOTIFICACIONES
            </span>
            <span className="flex-1 h-px bg-[#E7DAC8]" />
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between py-[15px] px-[18px] border-b border-[#F0E6D8]">
              <span className="text-[14.5px] text-text-primary">Publicaciones nuevas</span>
              <button
                type="button"
                onClick={() => setNotifications((prev) => ({ ...prev, posts: !prev.posts }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  notifications.posts ? "bg-[#F2937A]" : "bg-[#DDD3C8]"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    notifications.posts ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between py-[15px] px-[18px] border-b border-[#F0E6D8]">
              <span className="text-[14.5px] text-text-primary">Anuncios</span>
              <button
                type="button"
                onClick={() => setNotifications((prev) => ({ ...prev, announcements: !prev.announcements }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  notifications.announcements ? "bg-[#F2937A]" : "bg-[#DDD3C8]"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    notifications.announcements ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between py-[15px] px-[18px]">
              <span className="text-[14.5px] text-text-primary">Recordatorios</span>
              <button
                type="button"
                onClick={() => setNotifications((prev) => ({ ...prev, reminders: !prev.reminders }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  notifications.reminders ? "bg-[#F2937A]" : "bg-[#DDD3C8]"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    notifications.reminders ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <a
            href="#"
            className="flex items-center justify-between py-[15px] px-[18px] border-b border-[#F0E6D8] hover:bg-[#FBF6F1] transition-colors"
          >
            <span className="text-[14.5px] text-text-primary">Cambiar contraseña</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94887B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
          <a
            href="#"
            className="flex items-center justify-between py-[15px] px-[18px] hover:bg-[#FBF6F1] transition-colors"
          >
            <span className="text-[14.5px] text-text-primary">Ayuda y soporte</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94887B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        </div>

        {/* Sign out button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-[13px] rounded-[14px] border-[1.5px] border-border bg-card text-[#D9583C] font-extrabold text-[15px] hover:bg-[#FBDAD6] transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
