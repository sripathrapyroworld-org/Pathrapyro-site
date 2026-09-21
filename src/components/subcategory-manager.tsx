"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSubCategory, reorderSubCategories, saveSubCategory } from "@/app/admin/actions";
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
  const [editing, setEditing] = useState<Sub | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(subCategories);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    setItems([...subCategories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
  }, [subCategories]);

  function onSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("categoryId", categoryId);
    fd.set("name", name);
    fd.set("sortOrder", String(items.length));
    startTransition(async () => {
      const res = await saveSubCategory(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setName("");
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
    fd.set("sortOrder", String(editing.sortOrder));
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

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const from = items.findIndex((s) => s.id === dragId);
    const to = items.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDragId(null);
    setOverId(null);
    startTransition(async () => {
      await reorderSubCategories(
        categoryId,
        next.map((s) => s.id)
      );
      router.refresh();
    });
  }

  return (
    <div className="card panel static" style={{ marginBottom: 18 }}>
      {dialog}
      <h3 style={{ marginBottom: 12 }}>Subcategories</h3>
      <p className="dnd-hint">Drag rows to change subcategory order on the shop page.</p>
      {error && <div className="alert error">{error}</div>}
      <ul className="dnd-list">
        {items.map((s) => (
          <li
            key={s.id}
            className={`dnd-row${dragId === s.id ? " dragging" : ""}${overId === s.id ? " drag-over" : ""}`}
            draggable={!editing}
            onDragStart={() => setDragId(s.id)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverId(s.id);
            }}
            onDragLeave={() => setOverId((id) => (id === s.id ? null : id))}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(s.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
          >
            {editing?.id === s.id ? (
              <form onSubmit={saveEdit} style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
                <input name="name" defaultValue={s.name} required />
                <button className="btn btn-sm btn-primary" disabled={pending}>
                  Save
                </button>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <span className="dnd-handle" title="Drag to reorder">
                  ⠿
                </span>
                <strong>{s.name}</strong>
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
        {!items.length && <li className="cell-sub">No subcategories yet.</li>}
      </ul>
      <form onSubmit={onSave} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
        <div className="field" style={{ margin: 0, flex: 1, minWidth: 180 }}>
          <label>New subcategory</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kids special" required={!editing} />
        </div>
        <button className="btn btn-primary" disabled={pending || Boolean(editing)}>
          {pending ? <InlineSpinner label="Saving…" /> : "Add subcategory"}
        </button>
      </form>
    </div>
  );
}
