"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { TotalsBreakdown } from "@/components/totals-breakdown";
import { cartTotals, formatInr, mediaUrl } from "@/lib/utils";
import type { ProductCardData } from "@/components/product-card";

export function QuickOrderTable({
  products,
  categories,
}: {
  products: ProductCardData[];
  categories: string[];
}) {
  const { add, showToast, gstPercent, requireLogin } = useCart();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  const list = useMemo(
    () =>
      products.filter(
        (p) => (cat === "All" || p.cat === cat) && p.name.toLowerCase().includes(q.toLowerCase())
      ),
    [products, cat, q]
  );

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

  function setProductQty(id: string, next: number) {
    setQty((s) => ({ ...s, [id]: Math.max(0, next) }));
  }

  function bump(id: string, delta: number) {
    setProductQty(id, (qty[id] || 0) + delta);
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
    setCat(next);
    setFilterOpen(false);
  }

  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <div className="crumb">Home / <span>Quick Order</span></div>
          <div className="eyebrow">Fast Checkout</div>
          <h1>Quick Order — All Products, One List</h1>
          <p>Skip browsing category by category. Search, set quantities, and submit your whole order in minutes.</p>
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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all products..." />
            </div>
            <button
              type="button"
              className={`btn btn-outline qo-filter-btn${cat !== "All" ? " active" : ""}`}
              onClick={() => setFilterOpen(true)}
            >
              Filter{cat !== "All" ? `: ${cat}` : ""}
            </button>
            <div className="qo-cats desktop-cats">
              {["All", ...categories].map((c) => (
                <button key={c} type="button" className={`chip${c === cat ? " active" : ""}`} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {cat !== "All" && (
            <div className="qo-active-filter">
              <span>Showing: {cat}</span>
              <button type="button" onClick={() => setCat("All")}>
                Clear
              </button>
            </div>
          )}

          <div className="qo-layout">
            <div className="card static qo-list-card">
              <div className="qo-mobile-list">
                {list.map((p) => {
                  const n = qty[p.id] || 0;
                  return (
                    <article className={`qo-item${n > 0 ? " selected" : ""}`} key={p.id}>
                      <img src={mediaUrl(p.img)} alt="" />
                      <div className="qo-item-body">
                        <h4>{p.name}</h4>
                        <div className="qo-item-meta">
                          <span>{p.cat}</span>
                          <strong>{formatInr(p.sale)}</strong>
                        </div>
                        <div className="qo-qty">
                          <button type="button" aria-label="Decrease" onClick={() => bump(p.id, -1)} disabled={n <= 0}>
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={n}
                            onChange={(e) => setProductQty(p.id, parseInt(e.target.value) || 0)}
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
                {!list.length && <p className="qo-empty">No products match your search.</p>}
              </div>

              <div className="qo-desktop-table">
                <table className="qo-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => {
                      const n = qty[p.id] || 0;
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="qo-row-name">
                              <img src={mediaUrl(p.img)} alt="" />
                              <span>{p.name}</span>
                            </div>
                          </td>
                          <td>{p.cat}</td>
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
                                onChange={(e) => setProductQty(p.id, parseInt(e.target.value) || 0)}
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
            </div>

            <aside className="card summary-card qo-summary-desktop">
              <h4>Order Summary</h4>
              <TotalsBreakdown totals={summary} savingsLabel="Est. Discount Applied" />
              <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={pushToCart}>
                Order Now → Go to Cart
              </button>
              <Link href="/shop" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>
                Browse Shop
              </Link>
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
              {["All", ...categories].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={c === cat ? "active" : ""}
                  onClick={() => pickCategory(c)}
                >
                  {c}
                  {c === cat && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
