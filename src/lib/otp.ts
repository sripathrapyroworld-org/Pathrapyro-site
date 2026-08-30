import bcrypt from "bcryptjs";
import crypto from "crypto";

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

export async function hashOtp(code: string) {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}
