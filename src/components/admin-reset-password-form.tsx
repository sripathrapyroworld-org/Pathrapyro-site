"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(params.get("email") || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    const res = await fetch("/api/admin/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, password, confirm }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Could not reset password.");
      return;
    }
    setMsg(data.message);
    window.setTimeout(() => router.push("/admin/login"), 1500);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form className="card form-card static admin-auth-card" onSubmit={onSubmit}>
        <h1 style={{ marginBottom: 8 }}>Set new password</h1>
        <p className="cell-sub" style={{ marginBottom: 16 }}>
          Enter the OTP from your email and choose a strong new password.
        </p>
        {msg && <div className="alert ok">{msg}</div>}
        {err && <div className="alert error">{err}</div>}
        <div className="form-row">
          <div className="field">
            <label>Admin email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Email OTP</label>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
            />
          </div>
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <p className="cell-sub" style={{ marginTop: 4 }}>
          Use 8+ characters with uppercase, lowercase, and a number.
        </p>
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
        <p className="admin-auth-foot">
          <Link href="/admin/forgot-password">Resend OTP</Link>
          {" · "}
          <Link href="/admin/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
}

export function AdminResetPasswordForm() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  );
}
