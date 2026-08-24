"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import { activateParent } from "@/app/actions/invitations";

export default function ActivatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!code.trim()) {
      setError("Ingresa el código de invitación");
      return;
    }
    if (!email.trim()) {
      setError("Ingresa tu email");
      return;
    }
    if (!password) {
      setError("Crea una contraseña");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    const result = await activateParent({
      invitationCode: code.trim().toUpperCase(),
      email: email.trim(),
      password,
      authorizedPhotos: authorized,
    });

    setLoading(false);

    if (result.error) {
      if (result.error === "email_exists") {
        setError(result.message || "Este email ya tiene una cuenta registrada");
      } else {
        setError(result.error);
      }
      return;
    }

    if (result.success) {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF4EC] p-10">
      <div className="w-full max-w-[440px]">
        <div className="w-[58px] h-[58px] rounded-[18px] bg-gradient-to-br from-[#F8C3A8] to-[#F2937A] flex items-center justify-center mb-[22px] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>

        <h1 className="font-heading font-semibold text-[32px] leading-[1.15] mb-2 text-text-primary">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[#94887B] text-[15.5px] leading-[1.55]">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <FormField
          label="CÓDIGO DE INVITACIÓN"
          variant="mono"
          value={code}
          onChange={setCode}
          placeholder="Ej. 7K4P9"
          readOnly={false}
        />
        <FormField
          label="EMAIL"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="tu@email.com"
          readOnly={false}
        />
        <FormField
          label="CREAR CONTRASEÑA"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Mínimo 6 caracteres"
          readOnly={false}
        />

        <label
          className="flex items-start gap-3 bg-[#FBF1D6] rounded-[14px] p-[14px_16px] mb-6 cursor-pointer"
          onClick={() => setAuthorized(!authorized)}
        >
          <span
            className={`flex-none w-6 h-6 rounded-[8px] flex items-center justify-center mt-[1px] transition-colors ${
              authorized ? "bg-[#5FB97E]" : "bg-[#E8DFD0]"
            }`}
          >
            {authorized && (
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
          <span className="text-[14px] text-[#8A7234] leading-[1.45]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
            de la app.
          </span>
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-[14px] rounded-[14px] text-white font-extrabold text-[15.5px]"
          style={{
            background: loading
              ? "linear-gradient(180deg,#D4B8A8,#C4A898)"
              : "linear-gradient(180deg,#F4977E,#EE8164)",
            boxShadow: "0 10px 22px -8px rgba(238,129,100,.7)",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Activando..." : "Activar mi cuenta"}
        </button>

        {error && (
          <p className="mt-3 text-center text-[13px] text-[#D9583C] font-medium">
            {error}
          </p>
        )}

        <p className="text-center mt-[22px] text-[#94887B] text-[14.5px]">
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className="text-[#C5503A] font-extrabold">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  );
}
