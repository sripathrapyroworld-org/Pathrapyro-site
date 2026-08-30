import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { findCustomerByIdentifier } from "@/lib/customer-auth";
import {
  ADMIN_SESSION_SECONDS,
  findAdminByEmail,
  isAdminLoginLocked,
  recordAdminLoginAttempt,
} from "@/lib/admin-auth";
import { findOrCreateGoogleCustomer, verifyGoogleCredential } from "@/lib/google-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    phone?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      phone?: string | null;
    };
  }
}

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email || !account.providerAccountId) return false;
        try {
          const dbUser = await findOrCreateGoogleCustomer({
            sub: account.providerAccountId,
            email: user.email,
            name: user.name || user.email,
            picture: user.image || undefined,
          });
          user.id = dbUser.id;
          user.role = dbUser.role;
          user.phone = dbUser.phone;
          user.name = dbUser.name;
          user.email = dbUser.email;
          return dbUser.role === "CUSTOMER";
        } catch (error) {
          console.error("Google sign-in failed:", error);
          return false;
        }
      }
      return Boolean(user);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        if (user.role === "ADMIN") {
          token.exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.role = String(token.role || "CUSTOMER");
        session.user.phone = (token.phone as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      id: "google-onetap",
      name: "Google One Tap",
      credentials: {
        credential: { label: "Credential", type: "text" },
      },
      async authorize(credentials) {
        try {
          const credential = String(credentials?.credential || "");
          if (!credential) return null;
          const profile = await verifyGoogleCredential(credential);
          const user = await findOrCreateGoogleCustomer(profile);
          if (user.role !== "CUSTOMER") return null;
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
          };
        } catch (error) {
          console.error("Google One Tap authorize failed:", error);
          return null;
        }
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        password: { label: "Password", type: "password" },
        portal: { label: "Portal", type: "text" },
      },
      async authorize(credentials) {
        try {
          const identifier = String(credentials?.identifier || "").trim();
          const password = String(credentials?.password || "");
          const portal = String(credentials?.portal || "customer");
          if (!identifier || !password) return null;

          if (portal === "admin") {
            if (!identifier.includes("@")) return null;
            const email = identifier.toLowerCase();
            if (await isAdminLoginLocked(email)) return null;

            const user = await findAdminByEmail(email);
            if (!user?.passwordHash) {
              await recordAdminLoginAttempt(email, false);
              return null;
            }
            const ok = await bcrypt.compare(password, user.passwordHash);
            if (!ok) {
              await recordAdminLoginAttempt(email, false);
              return null;
            }
            await recordAdminLoginAttempt(email, true);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              phone: user.phone,
            };
          }

          const user = await findCustomerByIdentifier(identifier);
          if (!user?.passwordHash) return null;
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;
          if (portal === "customer" && user.role !== "CUSTOMER") return null;
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
          };
        } catch (error) {
          console.error("Credentials authorize failed:", error);
          return null;
        }
      },
    }),
  ],
});
