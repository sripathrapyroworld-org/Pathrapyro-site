import { prisma } from "@/lib/prisma";

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

function googleClientIds() {
  return [process.env.GOOGLE_CLIENT_ID, process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID].filter(Boolean) as string[];
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!res.ok) throw new Error("Invalid Google credential");
  const data = (await res.json()) as {
    aud?: string;
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: string;
  };
  const allowed = googleClientIds();
  if (!data.aud || !allowed.includes(data.aud)) throw new Error("Google credential audience mismatch");
  if (!data.sub || !data.email) throw new Error("Google credential missing profile");
  if (data.email_verified === "false") throw new Error("Google email not verified");
  return {
    sub: data.sub,
    email: data.email.toLowerCase(),
    name: data.name || data.email.split("@")[0] || "Customer",
    picture: data.picture,
  };
}

export async function findOrCreateGoogleCustomer(profile: GoogleProfile) {
  const email = profile.email.toLowerCase();

  const admin = await prisma.user.findFirst({ where: { email, role: "ADMIN" } });
  if (admin) throw new Error("Admin accounts must use the admin login page.");

  const byGoogle = await prisma.user.findFirst({ where: { googleId: profile.sub } });
  if (byGoogle) {
    if (byGoogle.role !== "CUSTOMER") throw new Error("This Google account cannot sign in here.");
    return byGoogle;
  }

  const byEmail = await prisma.user.findFirst({ where: { email, role: "CUSTOMER" } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId: profile.sub, name: byEmail.name || profile.name },
    });
  }

  return prisma.user.create({
    data: {
      name: profile.name,
      email,
      googleId: profile.sub,
      role: "CUSTOMER",
    },
  });
}
