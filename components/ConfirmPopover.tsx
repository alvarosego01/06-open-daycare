"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";

type ConfirmPopoverProps = {
  trigger: ReactNode;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: "danger" | "primary";
};

export default function ConfirmPopover({
  trigger,
  message,
  confirmLabel,
  onConfirm,
  variant = "primary",
}: ConfirmPopoverProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const confirmBg =
    variant === "danger"
      ? "bg-[#D9583C] hover:bg-[#C54830]"
      : "bg-gradient-to-b from-[#F4977E] to-[#EE8164] hover:from-[#E88A72] hover:to-[#E27558]";

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-2 z-50 w-[260px] bg-[#FBF4EC] border border-[#E7DAC8] rounded-[14px] shadow-[0_12px_32px_-12px_rgba(63,54,46,.35)] p-4"
        >
          <p className="text-[13.5px] text-[#4A4038] mb-3.5 leading-[1.45]">
            {message}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2 px-3 rounded-[10px] text-[13px] font-semibold text-[#6E6359] bg-[#F0E6D8] hover:bg-[#E8DDD0] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`flex-1 py-2 px-3 rounded-[10px] text-[13px] font-bold text-white transition-colors ${confirmBg}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
