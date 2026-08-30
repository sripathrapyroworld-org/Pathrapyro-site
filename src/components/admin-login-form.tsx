"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

export function AdminLoginForm() {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      identifier: String(fd.get("identifier")),
      password: String(fd.get("password")),
      portal: "admin",
      redirect: false,
    });
    if (result?.error) {
      setErr("Invalid email or password. Too many failures will temporarily lock the account.");
      setBusy(false);
      return;
    }
    window.location.href = "/admin";
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form className="card form-card static admin-auth-card" onSubmit={onSubmit}>
        <div className="brand" style={{ marginBottom: 18 }}>
          <img className="brand-logo" src="/images/logo.png" alt="Sri Pathra Pyro World" />
          <div className="name">
            Admin Console
            <small>SRI PATHRA PYRO WORLD</small>
          </div>
        </div>
        {err && <div className="alert error">{err}</div>}
        <div className="form-row">
          <div className="field">
            <label>Admin email</label>
            <input name="identifier" type="email" required autoComplete="username" placeholder="admin@yourdomain.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
          </div>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy}>
          {busy ? "Signing in…" : "Sign in securely"}
        </button>
        <p className="admin-auth-foot">
          <Link href="/admin/forgot-password">Forgot password?</Link>
        </p>
        <p className="cell-sub admin-auth-note">
          Admin access is email-only, rate-limited, and uses an 8-hour session for security.
        </p>
      </form>
    </div>
  );
}
