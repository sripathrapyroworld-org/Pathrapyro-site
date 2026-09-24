"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { TotalsBreakdown } from "@/components/totals-breakdown";
import { cartTotals, formatInr, mediaUrl } from "@/lib/utils";
import type { ProductCardData } from "@/components/product-card";

export type ShopCatalogProduct = ProductCardData & {
  subCategoryId: string | null;
  subCategoryName: string | null;
  subCategorySort: number;
  sortOrder: number;
};

export type ShopCatalogCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  subCategories: { id: string; name: string; sortOrder: number }[];
};

export function ShopCatalog({
  products,
  categories,
  title = "Shop — Order by Category",
  eyebrow = "Full Catalogue",
  description = "Browse by category and subcategory, set quantities, review the running total, and place your order in one go.",
}: {
  products: ShopCatalogProduct[];
  categories: ShopCatalogCategory[];
  title?: string;
  eyebrow?: string;
  description?: string;
}) {
  const { add, showToast, gstPercent, requireLogin } = useCart();
  const [q, setQ] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [openCat, setOpenCat] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => !needle || p.name.toLowerCase().includes(needle));
  }, [products, q]);

  const sections = useMemo(() => {
    return categories
      .map((cat) => {
        const catProducts = filtered
          .filter((p) => p.cat === cat.name)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
        if (!catProducts.length) return null;

        const subMap = new Map<string, { id: string; name: string; sortOrder: number; products: ShopCatalogProduct[] }>();
        for (const sub of cat.subCategories) {
          subMap.set(sub.id, { ...sub, products: [] });
        }
        const ungrouped: ShopCatalogProduct[] = [];
        for (const p of catProducts) {
          if (p.subCategoryId && subMap.has(p.subCategoryId)) {
            subMap.get(p.subCategoryId)!.products.push(p);
          } else {
            ungrouped.push(p);
          }
        }
        const subs = [...subMap.values()]
          .filter((s) => s.products.length > 0)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

        return { cat, subs, ungrouped };
      })
      .filter(Boolean) as {
      cat: ShopCatalogCategory;
      subs: { id: string; name: string; sortOrder: number; products: ShopCatalogProduct[] }[];
      ungrouped: ShopCatalogProduct[];
    }[];
  }, [categories, filtered]);

  const visible = openCat === "all" ? sections : sections.filter((s) => s.cat.id === openCat);

  const summary = useMemo(() => {
    const lines = products
      .filter((p) => (qty[p.id] || 0) > 0)
      .map((p) => ({
        key: p.id,
        kind: "product" as const,
        id: p.id,
        name: p.name,
        cat: p.cat,
        mrp: p.mrp,
        sale: p.sale,
        img: p.img,
        qty: qty[p.id] || 0,
      }));
    return cartTotals(lines, { gstPercent, feesPending: true });
  }, [products, qty, gstPercent]);

  useEffect(() => {
    if (!filterOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filterOpen]);

  function setLineQty(id: string, next: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, next) }));
  }

  function bump(id: string, delta: number) {
    setLineQty(id, (qty[id] || 0) + delta);
  }

  function pushToCart() {
    if (!requireLogin()) return;
    let any = false;
    for (const p of products) {
      const n = qty[p.id] || 0;
      if (n <= 0) continue;
      add(
        {
          key: `product:${p.id}`,
          kind: "product",
          id: p.id,
          name: p.name,
          cat: p.cat,
          mrp: p.mrp,
          sale: p.sale,
          img: p.img,
          slug: p.slug,
        },
        n
      );
      any = true;
    }
    if (any) {
      setQty({});
      window.location.href = "/cart";
    } else {
      showToast("⚠️ Please add quantity to at least one item");
    }
  }

  function pickCategory(next: string) {
    setOpenCat(next);
    setFilterOpen(false);
  }

  const activeCatLabel =
    openCat === "all" ? "All" : categories.find((c) => c.id === openCat)?.name || "Filter";

  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <div className="crumb">
            Home / <span>Shop</span>
          </div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="shop-pricelist-row">
            <a className="btn btn-outline shop-pricelist-mobile" href="/api/pricelist">
              Download Price List PDF
            </a>
          </div>
        </div>
      </div>

      <section className={`qo-section${summary.count > 0 ? " has-summary" : ""}`}>
        {summary.count > 0 && (
          <div className="qo-mobile-summary">
            <div>
              <strong>{summary.count} items</strong>
              <span>{formatInr(summary.total)}</span>
            </div>
            <button type="button" className="btn btn-primary" onClick={pushToCart}>
              Order Now
            </button>
          </div>
        )}
        <div className="wrap">
          <div className="qo-toolbar">
            <div className="search-box qo-search">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search all products..."
              />
            </div>
            <button
              type="button"
              className={`btn btn-outline qo-filter-btn${openCat !== "all" ? " active" : ""}`}
              onClick={() => setFilterOpen(true)}
            >
              Filter{openCat !== "all" ? `: ${activeCatLabel}` : ""}
            </button>
            <div className="qo-cats desktop-cats">
              <button
                type="button"
                className={`chip${openCat === "all" ? " active" : ""}`}
                onClick={() => setOpenCat("all")}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip${openCat === c.id ? " active" : ""}`}
                  onClick={() => setOpenCat(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {openCat !== "all" && (
            <div className="qo-active-filter">
              <span>Showing: {activeCatLabel}</span>
              <button type="button" onClick={() => setOpenCat("all")}>
                Clear
              </button>
            </div>
          )}

          <div className="qo-layout">
            <div className="shop-catalog">
              {visible.map(({ cat, subs, ungrouped }) => (
                <div className="shop-cat-block card static" key={cat.id} id={`cat-${cat.slug}`}>
                  <div className="shop-cat-head">
                    <h2>{cat.name}</h2>
                  </div>

                  {subs.map((sub) => (
                    <div className="shop-sub-block" key={sub.id}>
                      <h3>{sub.name}</h3>
                      <ProductTable products={sub.products} qty={qty} bump={bump} setLineQty={setLineQty} />
                    </div>
                  ))}

                  {ungrouped.length > 0 && (
                    <div className="shop-sub-block">
                      {subs.length > 0 && <h3>Other items</h3>}
                      <ProductTable products={ungrouped} qty={qty} bump={bump} setLineQty={setLineQty} />
                    </div>
                  )}
                </div>
              ))}

              {!visible.length && <p className="qo-empty">No products match your search.</p>}
            </div>

            <aside className="card summary-card qo-summary-desktop">
              <h4>Order Summary</h4>
              <TotalsBreakdown totals={summary} savingsLabel="Est. Discount Applied" />
              <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={pushToCart}>
                Order Now → Go to Cart
              </button>
              <a className="btn btn-outline btn-block" style={{ marginTop: 10 }} href="/api/pricelist">
                Download Price List
              </a>
            </aside>
          </div>
        </div>
      </section>

      {filterOpen && (
        <div className="qo-filter-overlay" onClick={() => setFilterOpen(false)}>
          <div className="qo-filter-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Filter products">
            <div className="qo-filter-head">
              <h3>Filter by category</h3>
              <button type="button" className="icon-mini" onClick={() => setFilterOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="qo-filter-options">
              <button type="button" className={openCat === "all" ? "active" : ""} onClick={() => pickCategory("all")}>
                All
                {openCat === "all" && <span>✓</span>}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={openCat === c.id ? "active" : ""}
                  onClick={() => pickCategory(c.id)}
                >
                  {c.name}
                  {openCat === c.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProductTable({
  products,
  qty,
  bump,
  setLineQty,
}: {
  products: ShopCatalogProduct[];
  qty: Record<string, number>;
  bump: (id: string, delta: number) => void;
  setLineQty: (id: string, next: number) => void;
}) {
  return (
    <>
      <div className="qo-mobile-list">
        {products.map((p) => {
          const n = qty[p.id] || 0;
          return (
            <article className={`qo-item${n > 0 ? " selected" : ""}`} key={p.id}>
              <Link href={`/product/${p.slug}`}>
                <img src={mediaUrl(p.img)} alt="" />
              </Link>
              <div className="qo-item-body">
                <h4>
                  <Link href={`/product/${p.slug}`}>{p.name}</Link>
                </h4>
                <div className="qo-item-meta">
                  <span>
                    MRP {formatInr(p.mrp)} · <strong>{formatInr(p.sale)}</strong>
                  </span>
                </div>
                <div className="qo-qty">
                  <button type="button" aria-label="Decrease" onClick={() => bump(p.id, -1)} disabled={n <= 0}>
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={n}
                    onChange={(e) => setLineQty(p.id, Number(e.target.value) || 0)}
                  />
                  <button type="button" aria-label="Increase" onClick={() => bump(p.id, 1)}>
                    +
                  </button>
                </div>
                {n > 0 && <div className="qo-item-sub">Line total {formatInr(n * p.sale)}</div>}
              </div>
            </article>
          );
        })}
      </div>

      <div className="qo-desktop-table">
        <table className="qo-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>MRP</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const n = qty[p.id] || 0;
              return (
                <tr key={p.id}>
                  <td>
                    <div className="qo-row-name">
                      <Link href={`/product/${p.slug}`}>
                        <img src={mediaUrl(p.img)} alt="" />
                      </Link>
                      <Link href={`/product/${p.slug}`}>{p.name}</Link>
                    </div>
                  </td>
                  <td>{formatInr(p.mrp)}</td>
                  <td className="price-cell">{formatInr(p.sale)}</td>
                  <td>
                    <div className="qo-qty compact">
                      <button type="button" aria-label="Decrease" onClick={() => bump(p.id, -1)} disabled={n <= 0}>
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={n}
                        onChange={(e) => setLineQty(p.id, Number(e.target.value) || 0)}
                      />
                      <button type="button" aria-label="Increase" onClick={() => bump(p.id, 1)}>
                        +
                      </button>
                    </div>
                  </td>
                  <td className="price-cell">{formatInr(n * p.sale)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
