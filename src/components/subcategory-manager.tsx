"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSubCategory, saveSubCategory } from "@/app/admin/actions";
import { useConfirm } from "@/components/confirm-dialog";
import { InlineSpinner } from "@/components/page-loader";

type Sub = { id: string; name: string; sortOrder: number; productCount: number };

export function SubCategoryManager({
  categoryId,
  subCategories,
}: {
  categoryId: string;
  subCategories: Sub[];
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [editing, setEditing] = useState<Sub | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    fd.set("categoryId", categoryId);
    fd.set("name", editing ? editing.name : name);
    fd.set("sortOrder", String(editing ? editing.sortOrder : sortOrder));
    if (editing) {
      /* name/sort from editing state updated via inputs below */
    }
    startTransition(async () => {
      const res = await saveSubCategory(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setName("");
      setSortOrder(0);
      setEditing(null);
      router.refresh();
    });
  }

  function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("id", editing.id);
    fd.set("categoryId", categoryId);
    startTransition(async () => {
      const res = await saveSubCategory(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  async function onDelete(sub: Sub) {
    const ok = await confirm({
      title: "Delete subcategory?",
      message: `Delete “${sub.name}”? Products will stay in the category without a subcategory.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteSubCategory(sub.id);
      router.refresh();
    });
  }

  return (
    <div className="card panel static" style={{ marginBottom: 18 }}>
      {dialog}
      <h3 style={{ marginBottom: 12 }}>Subcategories</h3>
      <p className="cell-sub" style={{ marginBottom: 12 }}>
        Shop page groups products under these headings. Lower display order appears first.
      </p>
      {error && <div className="alert error">{error}</div>}
      <ul style={{ listStyle: "none", display: "grid", gap: 8, marginBottom: 14 }}>
        {subCategories.map((s) => (
          <li key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {editing?.id === s.id ? (
              <form onSubmit={saveEdit} style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
                <input name="name" defaultValue={s.name} required />
                <input name="sortOrder" type="number" min={0} defaultValue={s.sortOrder} style={{ width: 90 }} />
                <button className="btn btn-sm btn-primary" disabled={pending}>
                  Save
                </button>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <strong>
                  #{s.sortOrder} {s.name}
                </strong>
                <span className="cell-sub">{s.productCount} products</span>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(s)} disabled={pending}>
                  Edit
                </button>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => onDelete(s)} disabled={pending}>
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
        {!subCategories.length && <li className="cell-sub">No subcategories yet.</li>}
      </ul>
      <form onSubmit={onSave} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
        <div className="field" style={{ margin: 0 }}>
          <label>New subcategory</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kids special" required={!editing} />
        </div>
        <div className="field" style={{ margin: 0, width: 110 }}>
          <label>Order</label>
          <input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} />
        </div>
        <button className="btn btn-primary" disabled={pending || Boolean(editing)}>
          {pending ? <InlineSpinner label="Saving…" /> : "Add subcategory"}
        </button>
      </form>
    </div>
  );
}
