"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomer, saveCustomer } from "@/app/admin/actions";
import { useConfirm } from "@/components/confirm-dialog";
import { InlineSpinner } from "@/components/page-loader";

type CustomerFields = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  pincode: string | null;
};

export function CustomerEditor({ customer }: { customer: CustomerFields }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [pending, startTransition] = useTransition();

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2500);
  }

  function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("id", customer.id);
    startTransition(async () => {
      const res = await saveCustomer(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(false);
      flash(res.message || "Customer updated.");
      router.refresh();
    });
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete customer?",
      message: `Delete “${customer.name}”? Their cart will be cleared. Past orders and enquiries stay in the system but are unlinked from this account.`,
      confirmLabel: "Delete customer",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteCustomer(customer.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/admin/customers");
      router.refresh();
    });
  }

  return (
    <div className="customer-editor">
      {dialog}
      {toast && <div className="toast-banner ok">{toast}</div>}
      <div className="customer-editor-actions">
        {!editing ? (
          <>
            <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={() => setEditing(true)}>
              Edit customer
            </button>
            <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={onDelete}>
              {pending ? <InlineSpinner label="Deleting…" /> : "Delete"}
            </button>
          </>
        ) : null}
      </div>

      {editing && (
        <form className="card panel static customer-edit-form" onSubmit={onSave}>
          <h3 style={{ marginBottom: 12 }}>Edit customer</h3>
          {error && <div className="alert error">{error}</div>}
          <div className="form-row two">
            <div className="field">
              <label htmlFor="cust-name">Name</label>
              <input id="cust-name" name="name" required defaultValue={customer.name} />
            </div>
            <div className="field">
              <label htmlFor="cust-phone">Phone</label>
              <input id="cust-phone" name="phone" defaultValue={customer.phone || ""} placeholder="10-digit mobile" />
            </div>
            <div className="field">
              <label htmlFor="cust-email">Email</label>
              <input id="cust-email" name="email" type="email" defaultValue={customer.email || ""} />
            </div>
            <div className="field">
              <label htmlFor="cust-pincode">Pincode</label>
              <input id="cust-pincode" name="pincode" defaultValue={customer.pincode || ""} />
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="cust-address">Address</label>
            <textarea id="cust-address" name="address" rows={2} defaultValue={customer.address || ""} />
          </div>
          <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
            <button type="button" className="btn btn-outline" disabled={pending} onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={pending}>
              {pending ? <InlineSpinner label="Saving…" /> : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function CustomerRowActions({
  customer,
}: {
  customer: { id: string; name: string };
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [pending, startTransition] = useTransition();

  async function onDelete() {
    const ok = await confirm({
      title: "Delete customer?",
      message: `Delete “${customer.name}”? Their cart will be cleared. Past orders stay in sales history unlinked.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteCustomer(customer.id);
      if (res.ok) {
        router.refresh();
      } else {
        window.alert(res.error);
      }
    });
  }

  return (
    <div className="row-actions">
      {dialog}
      <a className="icon-mini" href={`/admin/customers/${customer.id}`} title="View / Edit">
        ✎
      </a>
      <button type="button" className="icon-mini" title="Delete" disabled={pending} onClick={onDelete}>
        🗑
      </button>
    </div>
  );
}
