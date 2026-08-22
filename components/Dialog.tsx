"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
};

export default function Dialog({
  open,
  onClose,
  children,
  maxWidth = "md:max-w-[520px]",
}: DialogProps) {
  const [mounted, setMounted] = useState(open);
  const [animating, setAnimating] = useState(open);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const mountId = requestAnimationFrame(() => {
        setMounted(true);
        requestAnimationFrame(() => setAnimating(true));
      });
      return () => cancelAnimationFrame(mountId);
    } else {
      const fadeId = requestAnimationFrame(() => setAnimating(false));
      const unmountId = setTimeout(() => setMounted(false), 200);
      return () => {
        cancelAnimationFrame(fadeId);
        clearTimeout(unmountId);
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const focusDialog = useCallback(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    focusDialog();
  }, [focusDialog]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          animating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative z-10 w-full transition-all duration-200 ease-out
          max-md:fixed max-md:inset-0 max-md:max-w-none max-md:rounded-none
          ${maxWidth} md:rounded-[24px] md:border md:border-border
          ${animating ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"}
        `}
        style={{
          backgroundColor: "#FBF4EC",
          boxShadow: "0 20px 50px -24px rgba(63,54,46,.35)",
          outline: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
