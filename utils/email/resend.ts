import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendInvitationEmailParams = {
  to: string;
  parentName: string;
  childName: string;
  code: string;
};

export async function sendInvitationEmail({
  to,
  parentName,
  childName,
  code,
}: SendInvitationEmailParams) {
  const subject = "Te invitaron a OpenDayCare";
  const text = `Hola ${parentName},

${childName} te invitó a seguir su día en la guardería a través de OpenDayCare.

Tu código de invitación es: ${code}

Para activar tu cuenta, ingresá a la app y usá este código en la pantalla de activación.

¡Te esperamos!
El equipo de OpenDayCare`;

  const result = await resend.emails.send({
    from: "OpenDayCare <onboarding@resend.dev>",
    to,
    subject,
    text,
  });

  return result;
}
