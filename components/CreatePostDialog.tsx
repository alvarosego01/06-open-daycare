"use client";

import { useState, useCallback } from "react";
import Dialog from "@/components/Dialog";
import FormField from "@/components/ui/FormField";

type CreatePostDialogProps = {
  open: boolean;
  onClose: () => void;
};

const emptyForm = {
  title: "",
  content: "",
};

export default function CreatePostDialog({ open, onClose }: CreatePostDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setForm(emptyForm);
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement post creation action
      // const result = await createPost({ title: form.title, content: form.content });
      // if (result.error) {
      //   setError(result.error);
      //   return;
      // }
      setForm(emptyForm);
      onClose();
    } catch {
      setError("Error al crear la publicación");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} ariaLabel="Crear publicación">
      <div
        className="flex items-center justify-between px-[26px] py-5"
        style={{ borderBottom: "1px solid #ECE0D0" }}
      >
        <span className="font-heading font-semibold text-[18px] text-text-primary">
          Nueva publicación
        </span>
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
        {error && (
          <p
            role="alert"
            className="mb-4 text-[13.5px] font-bold text-[#D9583C] bg-[#FBE6DF] border border-[#F0C3B5] rounded-[12px] px-4 py-3"
          >
            {error}
          </p>
        )}

        <FormField
          id="post-title"
          label="TÍTULO"
          renderAs="input"
          placeholder="Ej. Recordatorio para la próxima semana"
          value={form.title}
          onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
        />

        <FormField
          id="post-content"
          label="CONTENIDO"
          renderAs="textarea"
          placeholder="Escribí tu publicación aquí..."
          value={form.content}
          onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-[9px] w-full py-[14px] rounded-[14px] text-white font-extrabold text-[15.5px]"
          style={{
            background: isSubmitting
              ? "linear-gradient(180deg,#D4B8A8,#C4A898)"
              : "linear-gradient(180deg,#F4977E,#EE8164)",
            boxShadow: "0 10px 22px -8px rgba(238,129,100,.7)",
            opacity: isSubmitting ? 0.7 : 1,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Publicando..." : "Publicar"}
        </button>
      </div>
    </Dialog>
  );
}
