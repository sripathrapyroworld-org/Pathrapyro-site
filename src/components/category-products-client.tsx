"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/app/admin/actions";
import { useConfirm } from "@/components/confirm-dialog";
import { formatInr, mediaUrl, stockStatus } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
  mrp: number;
  salePrice: number;
  stock: number;
  cover: string | null;
  subCategoryName?: string | null;
  sortOrder?: number;
};

export function CategoryProductsClient({
  category,
  products,
}: {
  category: { id: string; name: string; emoji: string };
  products: ProductRow[];
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");
  const [pending, startTransition] = useTransition();

  const list = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [products, q]
  );

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
      setToast(res.ok ? res.message || "Deleted." : res.error);
      window.setTimeout(() => setToast(""), 2500);
      router.refresh();
    });
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
            {category.emoji} {category.name}
          </h2>
          <p className="page-sub">{list.length} product{list.length === 1 ? "" : "s"}</p>
        </div>
        <div className="toolbar-right">
          <div className="search-box2">
            <input
              placeholder="Search in category…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Link className="btn btn-primary" href={`/admin/products/new?cat=${category.id}`}>
            + Add Product
          </Link>
        </div>
      </div>
      <div className="pm-grid">
        {list.map((p) => {
          const st = stockStatus(p.stock);
          return (
            <div className="card pm-card static" key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="pm-card-media">
                <img src={mediaUrl(p.cover)} alt={p.name} />
              </Link>
              <div className="body">
                <h4>
                  <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                </h4>
                <p className="cell-sub">
                  {p.subCategoryName ? `${p.subCategoryName} · ` : ""}Order #{p.sortOrder ?? 0}
                </p>
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
      {!list.length && (
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
