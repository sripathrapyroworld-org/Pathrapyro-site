import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const host = req.headers.get("host") || "";
  const isAdminHost = host.startsWith("admin.");
  const path = nextUrl.pathname;
  const isLoggedIn = Boolean(req.auth);
  const role = req.auth?.user?.role;

  if (isAdminHost) {
    if (
      path.startsWith("/api") ||
      path.startsWith("/_next") ||
      path.startsWith("/placeholder")
    ) {
      return NextResponse.next();
    }
    if (!path.startsWith("/admin")) {
      const url = nextUrl.clone();
      url.pathname = path === "/" ? "/admin" : `/admin${path}`;
      return NextResponse.rewrite(url);
    }
  }

  const adminPublicPaths = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
  const adminPath = path.startsWith("/admin");
  if (adminPath && !adminPublicPaths.includes(path)) {
    if (!isLoggedIn || role !== "ADMIN") {
      const url = nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", path);
      return NextResponse.redirect(url);
    }
  }

  const needsCustomer =
    path.startsWith("/account") || path === "/cart" || path.startsWith("/checkout");
  if (needsCustomer && (!isLoggedIn || role !== "CUSTOMER")) {
    const url = nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", path + nextUrl.search);
    return NextResponse.redirect(url);
  }

  if ((path === "/login" || path === "/register") && isLoggedIn && role === "CUSTOMER") {
    const dest = nextUrl.searchParams.get("from") || "/account";
    const safe = dest.startsWith("/") && !dest.startsWith("//") ? dest : "/account";
    return NextResponse.redirect(new URL(safe, nextUrl));
  }

  if (path === "/admin/login" && isLoggedIn && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  if ((path === "/admin/forgot-password" || path === "/admin/reset-password") && isLoggedIn && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin/account", nextUrl));
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|placeholder.svg|images/|media/|api/auth).*)",
  ],
};
