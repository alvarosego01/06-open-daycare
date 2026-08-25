"use client";

type FormFieldProps = {
  id?: string;
  label: string;
  type?: string;
  placeholder?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  variant?: "default" | "mono";
  borderColor?: string;
  readOnly?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  rows?: number;
  renderAs?: "input" | "textarea" | "select";
  options?: { value: string; label: string }[];
};

export default function FormField({
  id,
  label,
  type = "text",
  placeholder,
  name,
  value,
  onChange,
  variant = "default",
  borderColor,
  readOnly = false,
  hasError = false,
  errorMessage,
  rows = 3,
  renderAs = "input",
  options = [],
}: FormFieldProps) {
  const baseClasses = `w-full rounded-[14px] border-[1.5px] bg-white text-[15px] text-text-primary transition-colors duration-150 ${
    hasError ? "border-[#D9583C]" : "border-[#EADFD0]"
  } ${
    variant === "mono"
      ? "font-heading text-[18px] tracking-[3px] font-bold"
      : ""
  }`;

  const inputPadding = "py-[13px] px-4";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    onChange?.(e.target.value);
  };

  const renderField = () => {
    switch (renderAs) {
      case "textarea":
        return (
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            readOnly={readOnly}
            rows={rows}
            style={{
              ...(borderColor ? { borderColor } : {}),
              minHeight: "90px",
              resize: "vertical",
            }}
            className={`${baseClasses} ${inputPadding}`}
          />
        );
      case "select":
        return (
          <div className="relative">
            <select
              id={id}
              name={name}
              value={value}
              onChange={handleChange}
              disabled={readOnly}
              style={borderColor ? { borderColor } : undefined}
              className={`${baseClasses} ${inputPadding} appearance-none pr-10 cursor-pointer`}
            >
              <option value="" disabled>
                {placeholder || "Seleccionar…"}
              </option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B0A290"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        );
      default:
        return (
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            readOnly={readOnly}
            style={borderColor ? { borderColor } : undefined}
            className={`${baseClasses} ${inputPadding}`}
          />
        );
    }
  };

  return (
    <div className="mb-[18px]">
      <label
        htmlFor={id}
        className="block text-[12px] font-bold tracking-[0.7px] text-[#94887B] mb-2"
      >
        {label}
      </label>
      {renderField()}
      {hasError && errorMessage && (
        <p className="mt-1 text-[12px] text-[#D9583C]">{errorMessage}</p>
      )}
    </div>
  );
}
