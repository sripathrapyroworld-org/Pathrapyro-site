import { NextResponse } from "next/server";
import {
  findAdminByEmail,
  hashAdminPassword,
  normalizeAdminEmail,
  validateAdminPassword,
  verifyAdminOtp,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const email = normalizeAdminEmail(String(body.email || ""));
  const otp = String(body.otp || "").trim();
  const password = String(body.password || "");
  const confirm = String(body.confirm || "");

  if (!email.includes("@") || !otp || !password) {
    return NextResponse.json({ error: "Email, OTP, and new password are required." }, { status: 400 });
  }
  if (password !== confirm) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const policy = validateAdminPassword(password);
  if (policy) return NextResponse.json({ error: policy }, { status: 400 });

  const admin = await findAdminByEmail(email);
  if (!admin) {
    return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
  }

  const verified = await verifyAdminOtp(email, "admin_reset_password", otp);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash: await hashAdminPassword(password) },
  });

  return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
}
