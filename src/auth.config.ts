import type { NextAuthConfig } from "next-auth";

// Long-lived customer sessions — refreshed daily while the user is active.
const CUSTOMER_SESSION_MAX_AGE = 90 * 24 * 60 * 60;

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: CUSTOMER_SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    signIn({ user }) {
      return Boolean(user);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.role = String(token.role || "CUSTOMER");
        session.user.phone = token.phone as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
