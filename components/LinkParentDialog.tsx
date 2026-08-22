"use client";

import { useState } from "react";
import Dialog from "@/components/Dialog";
import FormField from "@/components/ui/FormField";

const PARENT_AVATAR_COLORS = [
  "#C9B6E8", // purple
  "#A9C7E8", // blue
  "#F4B8CC", // pink
  "#B9DEC4", // green
  "#F4DC8E", // yellow
  "#A9D9E8", // cyan
];

const RELATIONSHIP_OPTIONS = ["Mamá", "Papá", "Tutor/a"];

export function generateInvitationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I,O,0,1 para evitar confusión
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type LinkParentDialogProps = {
  open: boolean;
  onClose: () => void;
  kidName: string;
  kidId: string;
  invitationCode: string;
  onParentAdded: (parent: {
    id: string;
    name: string;
    initial: string;
    role: string;
    avatarBgColor: string;
    status: "active" | "pending";
  }) => void;
};

const emptyForm = {
  name: "",
  email: "",
  relationship: null as string | null,
};

export default function LinkParentDialog({
  open,
  onClose,
  kidName,
  invitationCode,
  onParentAdded,
}: LinkParentDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    relationship: false,
  });

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({ name: false, email: false, relationship: false });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    const nextErrors = {
      name: form.name.trim() === "",
      email: form.email.trim() === "",
      relationship: form.relationship === null,
    };
    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.email || nextErrors.relationship) return;

    const newParent = {
      id: slugify(form.name),
      name: form.name.trim(),
      initial: form.name.trim().charAt(0).toUpperCase(),
      role: form.relationship as string,
      avatarBgColor:
        PARENT_AVATAR_COLORS[
          Math.floor(Math.random() * PARENT_AVATAR_COLORS.length)
        ],
      status: "pending" as const,
    };

    onParentAdded(newParent);
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <div
        className="flex items-center justify-between px-[26px] py-5"
        style={{ borderBottom: "1px solid #ECE0D0" }}
      >
        <div>
          <div className="font-heading font-semibold text-[18px] text-text-primary">
            Vincular padre
          </div>
          <div className="text-[13px] text-[#A89A8B]">a {kidName}</div>
        </div>
        <button
          onClick={handleClose}
          aria-label="Cerrar"
          className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
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
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-[26px] py-6">
        <div
          className="flex gap-[11px] rounded-[14px] p-4 px-4 mb-5"
          style={{ backgroundColor: "#E3ECFB" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4E72C8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-none mt-[1px]"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span className="text-[13.5px] leading-[1.45]" style={{ color: "#3F5694" }}>
            Le enviaremos un correo con un código para que active su cuenta. Solo
            verá el feed de {kidName}.
          </span>
        </div>

        <FormField
          label="NOMBRE DEL PADRE/MADRE"
          type="text"
          placeholder="Ej. Diego Fernández"
          value={form.name}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, name: value }))
          }
          readOnly={false}
          hasError={errors.name}
        />

        <FormField
          label="EMAIL"
          type="email"
          placeholder="correo@ejemplo.com"
          value={form.email}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, email: value }))
          }
          readOnly={false}
          hasError={errors.email}
        />

        <div className="mb-[18px]">
          <label className="block text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2.5">
            PARENTESCO
          </label>
          <div className="flex gap-[9px]">
            {RELATIONSHIP_OPTIONS.map((option) => {
              const selected = form.relationship === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, relationship: option }));
                    setErrors((prev) => ({ ...prev, relationship: false }));
                  }}
                  className="flex-1 py-[11px] rounded-full text-[14px] font-extrabold transition-colors duration-150"
                  style={
                    selected
                      ? {
                          backgroundColor: "#CCD8F4",
                          border: "1.5px solid #9FB8EC",
                          color: "#4E72C8",
                        }
                      : {
                          backgroundColor: "#FFFDF9",
                          border: "1.5px solid #ECE0D0",
                          color: "#6E6359",
                        }
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-2xl p-[18px] text-center mb-5"
          style={{
            backgroundColor: "#FBF1D6",
            border: "1.5px dashed #E6D08A",
          }}
        >
          <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#A88526] mb-2">
            CÓDIGO DE INVITACIÓN
          </div>
          <div
            className="font-heading font-semibold text-[34px]"
            style={{ letterSpacing: "7px", color: "#8A7234" }}
          >
            {invitationCode}
          </div>
          <div className="text-[13px] mt-1.5" style={{ color: "#A88526" }}>
            Vence en 7 días
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="flex items-center justify-center gap-[9px] w-full py-[14px] rounded-[14px] text-white font-extrabold text-[15.5px]"
          style={{
            background: "linear-gradient(180deg,#F4977E,#EE8164)",
            boxShadow: "0 10px 22px -8px rgba(238,129,100,.7)",
          }}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m22 2-7 20-4-9-9-4z" />
            <path d="M22 2 11 13" />
          </svg>
          Enviar invitación
        </button>
      </div>
    </Dialog>
  );
}
