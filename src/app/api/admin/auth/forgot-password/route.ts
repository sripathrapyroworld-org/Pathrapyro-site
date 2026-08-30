import { NextResponse } from "next/server";
import {
  createAdminOtp,
  findAdminByEmail,
  normalizeAdminEmail,
} from "@/lib/admin-auth";
import { sendAdminOtpEmail } from "@/lib/mail";

export async function POST(req: Request) {
  const body = await req.json();
  const email = normalizeAdminEmail(String(body.email || ""));
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid admin email." }, { status: 400 });
  }

  const admin = await findAdminByEmail(email);
  if (admin) {
    const code = await createAdminOtp(email, "admin_reset_password");
    const sent = await sendAdminOtpEmail(email, code, "reset");
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    message: "If that email is registered as admin, a verification code was sent.",
  });
}
