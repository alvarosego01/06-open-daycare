"use client";

import { useState, useCallback } from "react";
import Dialog from "@/components/Dialog";
import FormField from "@/components/ui/FormField";

type AddKidDialogProps = {
  open: boolean;
  onClose: () => void;
};

const ROOM_OPTIONS = [
  { value: "soles", label: "Soles" },
  { value: "luna", label: "Luna" },
  { value: "estrellas", label: "Estrellas" },
];

const emptyForm = {
  nombre: "",
  fecha: "",
  sala: "",
  alergias: "",
  notas: "",
};

type FormErrors = {
  nombre: boolean;
  fecha: boolean;
  sala: boolean;
};

const emptyErrors: FormErrors = { nombre: false, fecha: false, sala: false };

export default function AddKidDialog({ open, onClose }: AddKidDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);

  const update = (field: keyof typeof emptyForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleGuardar = () => {
    const nextErrors: FormErrors = {
      nombre: form.nombre.trim() === "",
      fecha: form.fecha.trim() === "",
      sala: form.sala === "",
    };
    setErrors(nextErrors);
  };

  const handleCancelar = useCallback(() => {
    setForm(emptyForm);
    setErrors(emptyErrors);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleCancelar}>
      <div
        className="flex items-center justify-between px-[26px] py-5"
        style={{ borderBottom: "1px solid #ECE0D0" }}
      >
        <button
          onClick={handleCancelar}
          className="text-[15px] font-bold text-[#94887B]"
        >
          Cancelar
        </button>
        <span className="font-heading font-semibold text-[18px] text-text-primary">
          Agregar niño
        </span>
        <button
          onClick={handleGuardar}
          className="text-[15px] font-extrabold text-[#D9583C]"
        >
          Guardar
        </button>
      </div>

      <div className="px-[26px] py-6">
        <FormField
          label="NOMBRE COMPLETO"
          renderAs="input"
          placeholder="Ej. Martina López"
          value={form.nombre}
          onChange={update("nombre")}
          readOnly={false}
          hasError={errors.nombre}
        />

        <div className="flex gap-[14px] mb-[18px]">
          <div className="flex-1">
            <FormField
              label="FECHA DE NACIMIENTO"
              renderAs="input"
              placeholder="dd/mm/aaaa"
              value={form.fecha}
              onChange={update("fecha")}
              readOnly={false}
              hasError={errors.fecha}
            />
          </div>
          <div className="flex-1">
            <FormField
              label="SALA"
              renderAs="select"
              placeholder="Seleccionar…"
              value={form.sala}
              onChange={update("sala")}
              readOnly={false}
              hasError={errors.sala}
              options={ROOM_OPTIONS}
            />
          </div>
        </div>

        <FormField
          label="ALERGIAS (ETIQUETAS)"
          renderAs="input"
          placeholder="Ej. Maní, Lactosa"
          value={form.alergias}
          onChange={update("alergias")}
          readOnly={false}
        />

        <FormField
          label="NOTAS MÉDICAS"
          renderAs="textarea"
          placeholder="Indicaciones, medicación, contactos…"
          value={form.notas}
          onChange={update("notas")}
          readOnly={false}
        />
      </div>
    </Dialog>
  );
}
