"use client";

import Link from "next/link";
import { useState } from "react";

export function AdminForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    const res = await fetch("/api/admin/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Could not send reset code.");
      return;
    }
    setMsg(data.message);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form className="card form-card static admin-auth-card" onSubmit={onSubmit}>
        <h1 style={{ marginBottom: 8 }}>Reset admin password</h1>
        <p className="cell-sub" style={{ marginBottom: 16 }}>
          Enter your admin email. We&apos;ll send a 6-digit OTP if the account exists.
        </p>
        {msg && <div className="alert ok">{msg}</div>}
        {err && <div className="alert error">{err}</div>}
        <div className="field">
          <label>Admin email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@yourdomain.com"
          />
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy}>
          {busy ? "Sending…" : "Send OTP"}
        </button>
        {msg && (
          <Link
            className="btn btn-outline btn-block"
            style={{ marginTop: 10 }}
            href={`/admin/reset-password?email=${encodeURIComponent(email)}`}
          >
            Enter OTP &amp; new password →
          </Link>
        )}
        <p className="admin-auth-foot">
          <Link href="/admin/login">← Back to login</Link>
        </p>
      </form>
    </div>
  );
}
