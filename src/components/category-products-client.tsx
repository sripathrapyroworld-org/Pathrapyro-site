"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct, reorderCategoryProducts } from "@/app/admin/actions";
import { useConfirm } from "@/components/confirm-dialog";
import { formatInr, mediaUrl, stockStatus } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
  mrp: number;
  salePrice: number;
  stock: number;
  cover: string | null;
  subCategoryId?: string | null;
  subCategoryName?: string | null;
  sortOrder?: number;
};

type Sub = { id: string; name: string; sortOrder: number };

type ZoneKey = string; // sub id or "__none__"

function zoneKey(subId: string | null | undefined): ZoneKey {
  return subId || "__none__";
}

export function CategoryProductsClient({
  category,
  products,
  subCategories,
}: {
  category: { id: string; name: string };
  products: ProductRow[];
  subCategories: Sub[];
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");
  const [pending, startTransition] = useTransition();
  const [zones, setZones] = useState<Record<ZoneKey, ProductRow[]>>({});
  const [dragProductId, setDragProductId] = useState<string | null>(null);
  const [overZone, setOverZone] = useState<ZoneKey | null>(null);
  const [overProductId, setOverProductId] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<ZoneKey, ProductRow[]> = { __none__: [] };
    for (const sub of subCategories) next[sub.id] = [];
    const sorted = [...products].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
    );
    for (const p of sorted) {
      const key = zoneKey(p.subCategoryId);
      if (!next[key]) next[key] = [];
      next[key].push(p);
    }
    setZones(next);
  }, [products, subCategories]);

  const zoneOrder = useMemo(() => {
    const ordered = [...subCategories]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((s) => s.id);
    return [...ordered, "__none__"];
  }, [subCategories]);

  const filteredZones = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return zones;
    const next: Record<ZoneKey, ProductRow[]> = {};
    for (const [key, list] of Object.entries(zones)) {
      next[key] = list.filter((p) => p.name.toLowerCase().includes(needle));
    }
    return next;
  }, [zones, q]);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2500);
  }

  function persist(nextZones: Record<ZoneKey, ProductRow[]>) {
    const groups = zoneOrder.map((key) => ({
      subCategoryId: key === "__none__" ? null : key,
      productIds: (nextZones[key] || []).map((p) => p.id),
    }));
    startTransition(async () => {
      const res = await reorderCategoryProducts(category.id, groups);
      flash(res.ok ? res.message || "Order saved." : res.error);
      router.refresh();
    });
  }

  function findProduct(id: string) {
    for (const [key, list] of Object.entries(zones)) {
      const idx = list.findIndex((p) => p.id === id);
      if (idx >= 0) return { key, idx, product: list[idx] };
    }
    return null;
  }

  function moveProduct(productId: string, targetZone: ZoneKey, beforeProductId: string | null) {
    const found = findProduct(productId);
    if (!found) return;
    const next: Record<ZoneKey, ProductRow[]> = {};
    for (const [key, list] of Object.entries(zones)) next[key] = [...list];
    next[found.key].splice(found.idx, 1);
    if (!next[targetZone]) next[targetZone] = [];
    let insertAt = next[targetZone].length;
    if (beforeProductId) {
      const i = next[targetZone].findIndex((p) => p.id === beforeProductId);
      if (i >= 0) insertAt = i;
    }
    next[targetZone].splice(insertAt, 0, {
      ...found.product,
      subCategoryId: targetZone === "__none__" ? null : targetZone,
      subCategoryName:
        targetZone === "__none__" ? null : subCategories.find((s) => s.id === targetZone)?.name || null,
    });
    setZones(next);
    persist(next);
  }

  async function onDelete(p: ProductRow) {
    const ok = await confirm({
      title: "Delete product?",
      message: `Delete “${p.name}”? This cannot be undone.`,
      confirmLabel: "Delete product",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteProduct(p.id);
      flash(res.ok ? res.message || "Deleted." : res.error);
      router.refresh();
    });
  }

  function zoneTitle(key: ZoneKey) {
    if (key === "__none__") return subCategories.length ? "Unassigned / Other items" : "All products";
    return subCategories.find((s) => s.id === key)?.name || "Subcategory";
  }

  return (
    <>
      {dialog}
      {toast && <div className="toast-banner ok">{toast}</div>}
      <div className="toolbar">
        <div>
          <Link href="/admin/products" className="back-link">
            ← All categories
          </Link>
          <h2 className="section-heading" style={{ marginTop: 8 }}>
            {category.name}
          </h2>
          <p className="dnd-hint">
            Drag products to reorder them, or drop into another subcategory group to assign them.
          </p>
        </div>
        <div className="toolbar-right">
          <div className="search-box2">
            <input placeholder="Search in category…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Link className="btn btn-primary" href={`/admin/products/new?cat=${category.id}`}>
            + Add Product
          </Link>
        </div>
      </div>

      {zoneOrder.map((key) => {
        const list = filteredZones[key] || [];
        if (q && !list.length && key !== "__none__") return null;
        return (
          <div
            key={key}
            className={`dnd-zone${overZone === key ? " drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverZone(key);
            }}
            onDragLeave={() => setOverZone((z) => (z === key ? null : z))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragProductId) moveProduct(dragProductId, key, overProductId);
              setDragProductId(null);
              setOverZone(null);
              setOverProductId(null);
            }}
          >
            <div className="dnd-zone-title">{zoneTitle(key)}</div>
            <div className="pm-grid">
              {list.map((p) => {
                const st = stockStatus(p.stock);
                return (
                  <div
                    className={`card pm-card static dnd-item${dragProductId === p.id ? " dragging" : ""}${
                      overProductId === p.id ? " drag-over" : ""
                    }`}
                    key={p.id}
                    draggable
                    onDragStart={() => setDragProductId(p.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOverZone(key);
                      setOverProductId(p.id);
                    }}
                    onDragLeave={() => setOverProductId((id) => (id === p.id ? null : id))}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragProductId) moveProduct(dragProductId, key, p.id);
                      setDragProductId(null);
                      setOverZone(null);
                      setOverProductId(null);
                    }}
                    onDragEnd={() => {
                      setDragProductId(null);
                      setOverZone(null);
                      setOverProductId(null);
                    }}
                  >
                    <Link href={`/admin/products/${p.id}`} className="pm-card-media">
                      <img src={mediaUrl(p.cover)} alt={p.name} />
                    </Link>
                    <div className="body">
                      <div className="cat">
                        <span className="dnd-handle">⠿</span> Drag to move
                      </div>
                      <h4>
                        <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                      </h4>
                      <div className="pm-price-row">
                        <span className="sale">{formatInr(p.salePrice)}</span>
                        <span className="mrp">{formatInr(p.mrp)}</span>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <span className={`pill ${st.key}`}>{st.label}</span>
                      </div>
                      <div className="pm-card-actions">
                        <Link className="icon-mini" href={`/admin/products/${p.id}`} title="Edit">
                          ✎
                        </Link>
                        <button
                          type="button"
                          className="icon-mini"
                          disabled={pending}
                          title="Delete"
                          onClick={() => onDelete(p)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!list.length && <p className="cell-sub">Drop products here.</p>}
          </div>
        );
      })}

      {!products.length && (
        <div className="card static empty-state">
          <p>No products in this category yet.</p>
          <Link className="btn btn-primary" href={`/admin/products/new?cat=${category.id}`}>
            Add the first product
          </Link>
        </div>
      )}
    </>
  );
}
