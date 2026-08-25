"use client";

import { useState } from "react";
import BrandHeroPanel from "@/components/auth/BrandHeroPanel";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { login } from "./actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!emailRegex.test(email)) {
      setError("Ingresa un email valido");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("Email o contrasena incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <BrandHeroPanel />

      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[392px]">
          <h2 className="font-heading font-semibold text-[30px] mb-1.5 text-text-primary">
            Iniciar sesión
          </h2>
          <p className="mb-7 text-[#94887B] text-[15px]">
            Ingresá para ver el día de hoy.
          </p>

          <form onSubmit={handleSubmit}>
            <FormField
              label="EMAIL"
              type="email"
              name="email"
              value={email}
              onChange={setEmail}
            />
            <FormField
              label="CONTRASEÑA"
              type="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />

            <div className="text-right mb-5">
              <span className="text-[#C5503A] text-[13.5px] font-bold cursor-pointer">
                ¿Olvidaste tu contraseña?
              </span>
            </div>

            <PrimaryButton type="submit">
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </PrimaryButton>
          </form>

          {error && (
            <p className="mt-4 text-center text-[14px] text-[#D9583C] font-semibold">
              {error}
            </p>
          )}

          <p className="text-center mt-6 text-[#94887B] text-[14.5px]">
            ¿Te invitó la guardería?{" "}
            <a
              href="/activate"
              className="text-[#C5503A] font-extrabold"
            >
              Activá tu cuenta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
