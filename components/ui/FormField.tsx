type FormFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  variant?: "default" | "mono";
};

export default function FormField({
  label,
  type = "text",
  placeholder,
  value,
  variant = "default",
}: FormFieldProps) {
  return (
    <div className="mb-[18px]">
      <label className="block text-[12px] font-bold tracking-[0.7px] text-[#94887B] mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        readOnly
        className={`w-full py-[14px] px-4 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-text-primary ${
          variant === "mono"
            ? "font-heading text-[18px] tracking-[3px] font-bold"
            : ""
        }`}
      />
    </div>
  );
}
