"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/google-one-tap";
import { safeReturnTo } from "@/components/login-gate";

const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const params = useSearchParams();
  const from = safeReturnTo(params.get("from"));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const code = params.get("error");
    if (code === "CredentialsSignin") {
      setErr("Invalid phone/email or password");
    } else if (code === "AccessDenied") {
      setErr("Google sign-in was blocked for this account. Try phone login or contact support.");
    } else if (code === "OAuthAccountNotLinked") {
      setErr("This Google email is linked to another sign-in method. Use phone/password login.");
    }
  }, [params]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const fd = new FormData(e.currentTarget);

    if (mode === "register") {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Could not register");
        setBusy(false);
        return;
      }
    }

    const identifier = String(fd.get(mode === "login" ? "identifier" : "phone"));
    await signIn("credentials", {
      identifier,
      password: String(fd.get("password")),
      portal: "customer",
      callbackUrl: from,
    });
  }

  return (
    <div className="auth-wrap">
      <div className="card form-card static">
        <div className="eyebrow">{mode === "login" ? "Welcome back" : "Create account"}</div>
        <h1 style={{ margin: "10px 0 18px" }}>{mode === "login" ? "Customer Login" : "Register"}</h1>
        {err && <div className="alert error">{err}</div>}
        {from !== "/account" && (
          <p style={{ color: "var(--cream-dim)", marginBottom: 14, fontSize: "0.9rem" }}>
            Log in to add items to your cart, enquire on WhatsApp, and manage your orders.
          </p>
        )}

        {googleEnabled && (
          <>
            <GoogleSignInButton callbackUrl={from} />
            <div className="auth-divider">
              <span>or use phone</span>
            </div>
          </>
        )}

        <form className="form-row" onSubmit={onSubmit}>
          {mode === "register" && (
            <div className="field">
              <label>Full name</label>
              <input name="name" required placeholder="Your name" />
            </div>
          )}
          {mode === "login" ? (
            <div className="field">
              <label>Phone or email</label>
              <input name="identifier" required placeholder="98432… or you@email.com" autoComplete="username" />
            </div>
          ) : (
            <>
              <div className="field">
                <label>Mobile</label>
                <input name="phone" required placeholder="10-digit mobile" autoComplete="tel" />
              </div>
              <div className="field">
                <label>Email (optional)</label>
                <input name="email" type="email" placeholder="you@email.com" autoComplete="email" />
              </div>
            </>
          )}
          <div className="field">
            <label>Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: "0.85rem", color: "var(--cream-dim)" }}>
          {mode === "login" ? (
            <>New here? <Link href={`/register?from=${encodeURIComponent(from)}`}>Create an account</Link></>
          ) : (
            <>Already registered? <Link href={`/login?from=${encodeURIComponent(from)}`}>Log in</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
