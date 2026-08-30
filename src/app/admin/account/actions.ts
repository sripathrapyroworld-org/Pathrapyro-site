"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createAdminOtp,
  hashAdminPassword,
  normalizeAdminEmail,
  validateAdminPassword,
  verifyAdminOtp,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { sendAdminOtpEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

export type AdminAccountResult = { ok: true; message?: string } | { ok: false; error: string };

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function changeAdminPassword(formData: FormData): Promise<AdminAccountResult> {
  try {
    const session = await requireAdminSession();
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!currentPassword || !newPassword) {
      return { ok: false, error: "Current and new passwords are required." };
    }
    if (newPassword !== confirmPassword) {
      return { ok: false, error: "New passwords do not match." };
    }

    const policy = validateAdminPassword(newPassword);
    if (policy) return { ok: false, error: policy };

    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!admin?.passwordHash) return { ok: false, error: "Account not found." };

    const valid = await verifyAdminPassword(currentPassword, admin.passwordHash);
    if (!valid) return { ok: false, error: "Current password is incorrect." };

    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: await hashAdminPassword(newPassword) },
    });

    return { ok: true, message: "Password updated successfully." };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not update password.";
    return { ok: false, error: msg };
  }
}

export async function requestAdminEmailChange(formData: FormData): Promise<AdminAccountResult> {
  try {
    const session = await requireAdminSession();
    const newEmail = normalizeAdminEmail(String(formData.get("newEmail") || ""));
    const currentPassword = String(formData.get("currentPassword") || "");

    if (!newEmail.includes("@")) return { ok: false, error: "Enter a valid email address." };
    if (!currentPassword) return { ok: false, error: "Current password is required." };

    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!admin?.passwordHash || admin.role !== "ADMIN") {
      return { ok: false, error: "Account not found." };
    }
    if (admin.email === newEmail) {
      return { ok: false, error: "That is already your current email." };
    }

    const valid = await verifyAdminPassword(currentPassword, admin.passwordHash);
    if (!valid) return { ok: false, error: "Current password is incorrect." };

    const taken = await prisma.user.findFirst({
      where: { email: newEmail, NOT: { id: admin.id } },
    });
    if (taken) return { ok: false, error: "That email is already used on another account." };

    const code = await createAdminOtp(newEmail, "admin_change_email", { adminId: admin.id });
    const sent = await sendAdminOtpEmail(newEmail, code, "email_change");
    if (!sent.ok) return { ok: false, error: sent.error || "Could not send verification email." };

    return {
      ok: true,
      message: `Verification code sent to ${newEmail}. Enter it below to confirm the change.`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not start email change.";
    return { ok: false, error: msg };
  }
}

export async function confirmAdminEmailChange(formData: FormData): Promise<AdminAccountResult> {
  try {
    const session = await requireAdminSession();
    const newEmail = normalizeAdminEmail(String(formData.get("newEmail") || ""));
    const otp = String(formData.get("otp") || "").trim();

    if (!newEmail.includes("@") || !otp) {
      return { ok: false, error: "New email and OTP are required." };
    }

    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!admin || admin.role !== "ADMIN") return { ok: false, error: "Account not found." };

    const verified = await verifyAdminOtp(newEmail, "admin_change_email", otp);
    if (!verified.ok) return { ok: false, error: verified.error };

    let payloadAdminId = admin.id;
    if (verified.token.payload) {
      try {
        const parsed = JSON.parse(verified.token.payload) as { adminId?: string };
        if (parsed.adminId) payloadAdminId = parsed.adminId;
      } catch {
        /* ignore */
      }
    }
    if (payloadAdminId !== admin.id) {
      return { ok: false, error: "Email verification does not match your session." };
    }

    const taken = await prisma.user.findFirst({
      where: { email: newEmail, NOT: { id: admin.id } },
    });
    if (taken) return { ok: false, error: "That email is already used on another account." };

    await prisma.user.update({
      where: { id: admin.id },
      data: { email: newEmail },
    });

    revalidatePath("/admin/account");
    return { ok: true, message: "Admin email updated successfully." };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not confirm email change.";
    return { ok: false, error: msg };
  }
}
