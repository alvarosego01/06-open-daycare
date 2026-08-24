"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { sendInvitationEmail } from "@/utils/email/resend";
import { generateInvitationCode } from "@/components/LinkParentDialog";

type SendInvitationParams = {
  childId: string;
  fullName: string;
  email: string;
  relationship: "father" | "mother" | "guardian";
  code: string;
};

export async function sendInvitation({
  childId,
  fullName,
  email,
  relationship,
  code,
}: SendInvitationParams): Promise<{ success?: boolean; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "No autorizado" };
  }

  const { data: staffUser, error: staffError } = await supabase
    .from("users")
    .select("daycare_id")
    .eq("id", user.id)
    .eq("role", "staff")
    .single();

  if (staffError || !staffUser) {
    return { error: "No autorizado" };
  }

  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, room_id, rooms!inner(daycare_id)")
    .eq("id", childId)
    .single();

  if (childError || !child) {
    return { error: "Niño no encontrado" };
  }

  const childRoom = child.rooms as unknown as { daycare_id: string };
  if (childRoom.daycare_id !== staffUser.daycare_id) {
    return { error: "No tienes acceso a este niño" };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  let currentCode = code;
  let maxAttempts = 3;
  let insertSuccess = false;

  while (maxAttempts > 0 && !insertSuccess) {
    const { error: insertError } = await supabase.from("invitations").insert({
      child_id: childId,
      invited_by: user.id,
      full_name: fullName,
      email,
      relationship,
      code: currentCode,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    });

    if (!insertError) {
      insertSuccess = true;
    } else if (
      insertError.code === "23505" &&
      maxAttempts > 1
    ) {
      currentCode = generateInvitationCode();
      maxAttempts--;
    } else {
      return { error: "Error al crear la invitación" };
    }
  }

  if (!insertSuccess) {
    return { error: "Error al crear la invitación" };
  }

  const { data: childData } = await supabase
    .from("children")
    .select("full_name")
    .eq("id", childId)
    .single();

  await sendInvitationEmail({
    to: email,
    parentName: fullName,
    childName: childData?.full_name || "tu hijo/a",
    code: currentCode,
  });

  return { success: true };
}

type ActivateParentParams = {
  invitationCode: string;
  email: string;
  password: string;
  authorizedPhotos: boolean;
};

export async function activateParent({
  invitationCode,
  email,
  password,
}: ActivateParentParams): Promise<{ success?: boolean; error?: string; message?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id, child_id, email, full_name, relationship, expires_at, status")
    .eq("code", invitationCode)
    .eq("status", "pending")
    .single();

  if (invitationError || !invitation) {
    return { error: "Código de invitación no válido" };
  }

  const expiresAt = new Date(invitation.expires_at);
  if (expiresAt < new Date()) {
    return { error: "La invitación ha expirado" };
  }

  if (invitation.email !== email) {
    return { error: "El email no coincide con la invitación" };
  }

  const { data: child } = await supabase
    .from("children")
    .select("room_id, rooms!inner(daycare_id)")
    .eq("id", invitation.child_id)
    .single();

  const childRoom = child?.rooms as unknown as { daycare_id: string } | undefined;
  const daycareId = childRoom?.daycare_id;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: invitation.full_name,
        daycare_id: daycareId,
      },
    },
  });

  if (signUpError) {
    if (
      signUpError.message?.includes("already") ||
      signUpError.message?.includes("registered")
    ) {
      return {
        error: "email_exists",
        message: "Este email ya tiene una cuenta registrada",
      };
    }
    return { error: signUpError.message || "Error al crear la cuenta" };
  }

  if (!signUpData.user) {
    return { error: "Error al crear el usuario" };
  }

  const { error: userInsertError } = await supabase.from("users").insert({
    id: signUpData.user.id,
    role: "parent",
    status: "active",
    daycare_id: daycareId,
    full_name: invitation.full_name,
  });

  if (userInsertError) {
    return { error: "Error al crear el perfil de usuario" };
  }

  const { error: parentChildrenError } = await supabase
    .from("parent_children")
    .insert({
      parent_id: signUpData.user.id,
      child_id: invitation.child_id,
      relationship: invitation.relationship,
    });

  if (parentChildrenError) {
    return { error: "Error al vincular con el niño" };
  }

  const { error: updateError } = await supabase
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  if (updateError) {
    return { error: "Error al actualizar la invitación" };
  }

  return { success: true };
}
