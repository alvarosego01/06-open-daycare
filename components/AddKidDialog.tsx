'use client';

import { useState, useCallback, useTransition } from 'react';
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

type FormErrors = {
  nombre: boolean;
  fecha: boolean;
  sala: boolean;
};

const emptyErrors: FormErrors = { nombre: false, fecha: false, sala: false };

export default function AddKidDialog({ open, onClose, rooms }: AddKidDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const update = (field: keyof typeof emptyForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleGuardar = () => {
    const nextErrors: FormErrors = {
      nombre: form.nombre.trim() === '',
      fecha: form.fecha.trim() === '',
      sala: form.sala === '',
    };
    setErrors(nextErrors);

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
        alert(`Error: ${result.error}`);
      } else {
        setForm(emptyForm);
        setErrors(emptyErrors);
        onClose();
        router.refresh();
      }
    });
  };

  const handleCancelar = useCallback(() => {
    setForm(emptyForm);
    setErrors(emptyErrors);
    onClose();
  }, [onClose]);

  const roomOptions = rooms.map((room) => ({ value: room.id, label: room.name }));

  return (
    <Dialog open={open} onClose={handleCancelar}>
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
        <FormField
          label="NOMBRE COMPLETO"
          renderAs="input"
          placeholder="Ej. Martina López"
          value={form.nombre}
          onChange={update('nombre')}
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
              onChange={update('fecha')}
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
              onChange={update('sala')}
              readOnly={false}
              hasError={errors.sala}
              options={roomOptions}
            />
          </div>
        </div>

        <FormField
          label="ALERGIAS (ETIQUETAS)"
          renderAs="input"
          placeholder="Ej. Maní, Lactosa"
          value={form.alergias}
          onChange={update('alergias')}
          readOnly={false}
        />

        <FormField
          label="NOTAS MÉDICAS"
          renderAs="textarea"
          placeholder="Indicaciones, medicación, contactos…"
          value={form.notas}
          onChange={update('notas')}
          readOnly={false}
        />
      </div>
    </Dialog>
  );
}
