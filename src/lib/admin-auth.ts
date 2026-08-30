import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, hashOtp, verifyOtp } from "@/lib/otp";

export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;
export const OTP_EXPIRY_MINUTES = 10;
export const MAX_LOGIN_FAILURES = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

export type AdminOtpPurpose = "admin_reset_password" | "admin_change_email";

export function validateAdminPassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  return null;
}

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findAdminByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: normalizeAdminEmail(email), role: "ADMIN" },
  });
}

export async function isAdminLoginLocked(email: string) {
  const since = new Date(Date.now() - LOGIN_LOCKOUT_MINUTES * 60 * 1000);
  const failures = await prisma.adminLoginAttempt.count({
    where: {
      email: normalizeAdminEmail(email),
      success: false,
      createdAt: { gte: since },
    },
  });
  return failures >= MAX_LOGIN_FAILURES;
}

export async function recordAdminLoginAttempt(email: string, success: boolean) {
  await prisma.adminLoginAttempt.create({
    data: { email: normalizeAdminEmail(email), success },
  });
}

export async function createAdminOtp(email: string, purpose: AdminOtpPurpose, payload?: Record<string, string>) {
  const normalized = normalizeAdminEmail(email);
  await prisma.otpToken.updateMany({
    where: { email: normalized, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateOtpCode();
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpToken.create({
    data: {
      email: normalized,
      purpose,
      codeHash,
      payload: payload ? JSON.stringify(payload) : null,
      expiresAt,
    },
  });

  return code;
}

export async function verifyAdminOtp(email: string, purpose: AdminOtpPurpose, code: string) {
  const normalized = normalizeAdminEmail(email);
  const token = await prisma.otpToken.findFirst({
    where: {
      email: normalized,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) return { ok: false as const, error: "OTP expired or not found. Request a new code." };
  if (token.attempts >= 5) {
    return { ok: false as const, error: "Too many attempts. Request a new OTP." };
  }

  const valid = await verifyOtp(code.trim(), token.codeHash);
  await prisma.otpToken.update({
    where: { id: token.id },
    data: { attempts: { increment: 1 } },
  });
  if (!valid) return { ok: false as const, error: "Invalid OTP." };

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  return { ok: true as const, token };
}

export async function hashAdminPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyAdminPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
