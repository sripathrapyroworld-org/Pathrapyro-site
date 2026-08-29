"use client";

import { useState } from "react";
import { updateProfile } from "@/app/(shop)/account/actions";

export function ProfileForm({
  name,
  phone,
  email,
  address,
  pincode,
}: {
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
}) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const phoneMissing = !phone;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setErr("");
    const res = await updateProfile(new FormData(e.currentTarget));
    setBusy(false);
    if (res.ok) setMsg("Profile saved.");
    else setErr(res.error);
  }

  return (
    <form className="form-row" onSubmit={onSubmit}>
      {msg && <div className="alert ok">{msg}</div>}
      {err && <div className="alert error">{err}</div>}
      <div className="field">
        <label>Name</label>
        <input name="name" required defaultValue={name} />
      </div>
      <div className="field">
        <label>Phone</label>
        {phoneMissing ? (
          <>
            <input name="phone" required placeholder="10-digit mobile" autoComplete="tel" />
            <p className="cell-sub" style={{ marginTop: 6 }}>
              Add your mobile for WhatsApp enquiries and delivery updates.
            </p>
          </>
        ) : (
          <input readOnly value={phone} />
        )}
      </div>
      <div className="field">
        <label>Email</label>
        <input name="email" type="email" defaultValue={email} placeholder="you@email.com" />
      </div>
      <div className="field">
        <label>Address</label>
        <textarea name="address" rows={2} defaultValue={address} placeholder="Delivery address" />
      </div>
      <div className="field">
        <label>Pincode</label>
        <input name="pincode" defaultValue={pincode} placeholder="626130" />
      </div>
      <button className="btn btn-primary" disabled={busy} style={{ marginTop: 8 }}>
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
