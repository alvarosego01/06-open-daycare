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

      <main className="flex items-center justify-center p-10">
        <div className="w-full max-w-[392px]">
          <h1 className="font-heading font-semibold text-[30px] mb-1.5 text-text-primary">
            Iniciar sesión
          </h1>
          <p className="mb-7 text-[#7A6F64] text-[15px]">
            Ingresá para ver el día de hoy.
          </p>

          <form onSubmit={handleSubmit} aria-label="Formulario de inicio de sesión">
            <FormField
              id="login-email"
              label="EMAIL"
              type="email"
              name="email"
              value={email}
              onChange={setEmail}
            />
            <FormField
              id="login-password"
              label="CONTRASEÑA"
              type="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />

            <div className="text-right mb-5">
              <a
                href="/forgot-password"
                className="text-[#B5442E] text-[13.5px] font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <PrimaryButton type="submit" disabled={loading} aria-busy={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </PrimaryButton>
          </form>

          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-4 text-center text-[14px] text-[#D9583C] font-semibold"
            >
              {error}
            </p>
          )}

          <p className="text-center mt-6 text-[#7A6F64] text-[14.5px]">
            ¿Te invitó la guardería?{" "}
            <a
              href="/activate"
              className="text-[#C5503A] font-extrabold focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
            >
              Activá tu cuenta
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
