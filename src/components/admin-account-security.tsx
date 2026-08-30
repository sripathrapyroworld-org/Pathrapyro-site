"use client";

import { useState } from "react";
import {
  changeAdminPassword,
  confirmAdminEmailChange,
  requestAdminEmailChange,
} from "@/app/admin/account/actions";

export function AdminAccountSecurity({ email }: { email: string }) {
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  const [emailMsg, setEmailMsg] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  async function onPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwdBusy(true);
    setPwdMsg("");
    setPwdErr("");
    const res = await changeAdminPassword(new FormData(e.currentTarget));
    setPwdBusy(false);
    if (res.ok) {
      setPwdMsg(res.message || "Password updated.");
      e.currentTarget.reset();
    } else {
      setPwdErr(res.error);
    }
  }

  async function onEmailRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailBusy(true);
    setEmailMsg("");
    setEmailErr("");
    const fd = new FormData(e.currentTarget);
    const res = await requestAdminEmailChange(fd);
    setEmailBusy(false);
    if (res.ok) {
      setPendingEmail(String(fd.get("newEmail") || ""));
      setShowOtp(true);
      setEmailMsg(res.message || "Verification code sent.");
    } else {
      setEmailErr(res.error);
    }
  }

  async function onEmailConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailBusy(true);
    setEmailMsg("");
    setEmailErr("");
    const fd = new FormData(e.currentTarget);
    if (!fd.get("newEmail") && pendingEmail) fd.set("newEmail", pendingEmail);
    const res = await confirmAdminEmailChange(fd);
    setEmailBusy(false);
    if (res.ok) {
      setEmailMsg(res.message || "Email updated.");
      setShowOtp(false);
      setPendingEmail("");
      window.location.reload();
    } else {
      setEmailErr(res.error);
    }
  }

  return (
    <div className="admin-account-grid">
      <section className="card panel static admin-section">
        <h3>Change password</h3>
        <p className="cell-sub">Requires your current password. Use a strong unique password.</p>
        {pwdMsg && <div className="alert ok">{pwdMsg}</div>}
        {pwdErr && <div className="alert error">{pwdErr}</div>}
        <form className="form-row" onSubmit={onPasswordSubmit}>
          <div className="field">
            <label>Current password</label>
            <input name="currentPassword" type="password" required autoComplete="current-password" />
          </div>
          <div className="field">
            <label>New password</label>
            <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div className="field">
            <label>Confirm new password</label>
            <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <button className="btn btn-primary btn-sm" type="submit" disabled={pwdBusy}>
            {pwdBusy ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="card panel static admin-section">
        <h3>Change admin email</h3>
        <p className="cell-sub">
          Current email: <strong>{email}</strong>. A verification OTP will be sent to your new email.
        </p>
        {emailMsg && <div className="alert ok">{emailMsg}</div>}
        {emailErr && <div className="alert error">{emailErr}</div>}

        {!showOtp ? (
          <form className="form-row" onSubmit={onEmailRequest}>
            <div className="field">
              <label>New email</label>
              <input name="newEmail" type="email" required placeholder="new-admin@yourdomain.com" />
            </div>
            <div className="field">
              <label>Current password</label>
              <input name="currentPassword" type="password" required autoComplete="current-password" />
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={emailBusy}>
              {emailBusy ? "Sending OTP…" : "Send verification OTP"}
            </button>
          </form>
        ) : (
          <form className="form-row" onSubmit={onEmailConfirm}>
            <input type="hidden" name="newEmail" value={pendingEmail} />
            <div className="field">
              <label>OTP sent to {pendingEmail}</label>
              <input
                name="otp"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder="6-digit code"
              />
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={emailBusy}>
              {emailBusy ? "Confirming…" : "Confirm new email"}
            </button>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={() => {
                setShowOtp(false);
                setEmailErr("");
                setEmailMsg("");
              }}
            >
              Cancel
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
