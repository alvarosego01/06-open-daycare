import BrandHeroPanel from "@/components/auth/BrandHeroPanel";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function LoginPage() {
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

          <FormField label="EMAIL" type="email" />
          <FormField
            label="CONTRASEÑA"
            type="password"
            placeholder="••••••••"
          />

          <div className="text-right mb-5">
            <span className="text-[#C5503A] text-[13.5px] font-bold cursor-pointer">
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <PrimaryButton>Iniciar sesión</PrimaryButton>

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
