import type { ReactNode } from "react";

type PrimaryButtonProps = {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-busy"?: boolean;
};

export default function PrimaryButton({
  children,
  href,
  type = "button",
  disabled,
  "aria-busy": ariaBusy,
}: PrimaryButtonProps) {
  const baseClasses =
    "block text-center w-full py-[15px] rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[16px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={baseClasses} disabled={disabled} aria-busy={ariaBusy}>
      {children}
    </button>
  );
}
