'use client';

import { useState, useCallback, useMemo, useTransition } from 'react';
import Dialog from '@/components/Dialog';
import FormField from '@/components/ui/FormField';
import { addChild } from '@/app/kids/actions';
import { useRouter } from 'next/navigation';

type AddKidDialogProps = {
  open: boolean;
  onClose: () => void;
  rooms: { id: string; name: string }[];
};

const emptyForm = {
  nombre: '',
  fecha: '',
  sala: '',
  alergias: '',
  notas: '',
};

type FormFieldName = keyof typeof emptyForm;

type FormErrors = {
  nombre: boolean;
  fecha: boolean;
  sala: boolean;
};

const emptyErrors: FormErrors = { nombre: false, fecha: false, sala: false };

const errorMessages: Record<keyof FormErrors, string> = {
  nombre: 'El nombre es obligatorio',
  fecha: 'La fecha de nacimiento es obligatoria',
  sala: 'Seleccioná una sala',
};

export default function AddKidDialog({ open, onClose, rooms }: AddKidDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const update = useCallback((field: FormFieldName, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  }, []);

  const handleGuardar = useCallback(() => {
    const nextErrors: FormErrors = {
      nombre: form.nombre.trim() === '',
      fecha: form.fecha.trim() === '',
      sala: form.sala === '',
    };
    setErrors(nextErrors);
    setServerError(null);

    if (nextErrors.nombre || nextErrors.fecha || nextErrors.sala) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('full_name', form.nombre);
      formData.append('birth_date', form.fecha);
      formData.append('room_id', form.sala);
      formData.append('allergy_tags', form.alergias);
      formData.append('medical_notes', form.notas);

      const result = await addChild(formData);

      if (result.error) {
        setServerError(result.error);
      } else {
        setForm(emptyForm);
        setErrors(emptyErrors);
        onClose();
        router.refresh();
      }
    });
  }, [form, onClose, router]);

  const handleCancelar = useCallback(() => {
    setForm(emptyForm);
    setErrors(emptyErrors);
    setServerError(null);
    onClose();
  }, [onClose]);

  const roomOptions = useMemo(
    () => rooms.map((room) => ({ value: room.id, label: room.name })),
    [rooms]
  );

  return (
    <Dialog open={open} onClose={handleCancelar} ariaLabel="Agregar niño">
      <div
        className="flex items-center justify-between px-[26px] py-5"
        style={{ borderBottom: '1px solid #ECE0D0' }}
      >
        <button
          onClick={handleCancelar}
          className="text-[15px] font-bold text-[#94887B]"
          disabled={isPending}
        >
          Cancelar
        </button>
        <span className="font-heading font-semibold text-[18px] text-text-primary">
          Agregar niño
        </span>
        <button
          onClick={handleGuardar}
          className="text-[15px] font-extrabold text-[#D9583C]"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="px-[26px] py-6">
        {serverError && (
          <p
            role="alert"
            className="mb-4 text-[13.5px] font-bold text-[#D9583C] bg-[#FBE6DF] border border-[#F0C3B5] rounded-[12px] px-4 py-3"
          >
            {serverError}
          </p>
        )}

        <FormField
          id="kid-nombre"
          label="NOMBRE COMPLETO"
          renderAs="input"
          placeholder="Ej. Martina López"
          value={form.nombre}
          onChange={(value) => update('nombre', value)}
          hasError={errors.nombre}
          errorMessage={errors.nombre ? errorMessages.nombre : undefined}
        />

        <div className="flex gap-[14px] mb-[18px]">
          <div className="flex-1">
            <FormField
              id="kid-fecha"
              label="FECHA DE NACIMIENTO"
              renderAs="input"
              placeholder="dd/mm/aaaa"
              value={form.fecha}
              onChange={(value) => update('fecha', value)}
              hasError={errors.fecha}
              errorMessage={errors.fecha ? errorMessages.fecha : undefined}
            />
          </div>
          <div className="flex-1">
            <FormField
              id="kid-sala"
              label="SALA"
              renderAs="select"
              placeholder="Seleccionar…"
              value={form.sala}
              onChange={(value) => update('sala', value)}
              hasError={errors.sala}
              errorMessage={errors.sala ? errorMessages.sala : undefined}
              options={roomOptions}
            />
          </div>
        </div>

        <FormField
          id="kid-alergias"
          label="ALERGIAS (ETIQUETAS)"
          renderAs="input"
          placeholder="Ej. Maní, Lactosa"
          value={form.alergias}
          onChange={(value) => update('alergias', value)}
        />

        <FormField
          id="kid-notas"
          label="NOTAS MÉDICAS"
          renderAs="textarea"
          placeholder="Indicaciones, medicación, contactos…"
          value={form.notas}
          onChange={(value) => update('notas', value)}
        />
      </div>
    </Dialog>
  );
}
