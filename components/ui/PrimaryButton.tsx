import type { ReactNode } from "react";

type PrimaryButtonProps = {
  children: ReactNode;
  href?: string;
};

export default function PrimaryButton({ children, href }: PrimaryButtonProps) {
  const baseClasses =
    "block text-center w-full py-[15px] rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[16px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]";

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={baseClasses}>
      {children}
    </button>
  );
}
