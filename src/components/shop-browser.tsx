"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard, type ProductCardData } from "@/components/product-card";

const SORTS = [
  { value: "pop", label: "Popularity" },
  { value: "low", label: "Price: Low to High" },
  { value: "high", label: "Price: High to Low" },
  { value: "disc", label: "Biggest Discount" },
];

export function ShopBrowser({
  products,
  categories,
  initialCat,
  title,
  eyebrow,
  desc,
}: {
  products: ProductCardData[];
  categories: { name: string; slug: string; count: number }[];
  initialCat?: string;
  title: string;
  eyebrow: string;
  desc: string;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("pop");
  const [cat, setCat] = useState(initialCat || "all");
  const [sortOpen, setSortOpen] = useState(false);

  const list = useMemo(() => {
    let rows = products.filter((p) => {
      const okCat = cat === "all" || p.cat === cat;
      const okQ = p.name.toLowerCase().includes(q.toLowerCase());
      return okCat && okQ;
    });
    if (sort === "low") rows = [...rows].sort((a, b) => a.sale - b.sale);
    else if (sort === "high") rows = [...rows].sort((a, b) => b.sale - a.sale);
    else if (sort === "disc")
      rows = [...rows].sort((a, b) => b.mrp - b.sale - (a.mrp - a.sale));
    return rows;
  }, [products, q, sort, cat]);

  const sortLabel = SORTS.find((s) => s.value === sort)?.label || "Popularity";

  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <div className="crumb">
            Home / <span>{title}</span>
          </div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{desc}</p>
        </div>
      </div>
      <section style={{ paddingTop: 40 }}>
        <div className="wrap shop-layout">
          <aside className="shop-sidebar">
            <h4>Categories</h4>
            <div className="side-cat-list">
              <button className={cat === "all" ? "active" : ""} onClick={() => setCat("all")}>
                All Products <span className="c">{products.length}</span>
              </button>
              {categories.map((c) => (
                <button key={c.slug} className={cat === c.name ? "active" : ""} onClick={() => setCat(c.name)}>
                  {c.name} <span className="c">{c.count}</span>
                </button>
              ))}
            </div>
            <p className="range-note">Prices shown are festival sale rates. Stock updates live from the warehouse.</p>
            <p className="range-note" style={{ marginTop: 10 }}>
              <Link href="/shop">View all Sivakasi crackers online →</Link>
            </p>
          </aside>
          <div>
            <div className="shop-toolbar">
              <div className="search-box">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
              </div>
              <div className={`menu-select${sortOpen ? " open" : ""}`}>
                <button
                  type="button"
                  className="menu-select-btn"
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  onClick={() => setSortOpen((v) => !v)}
                >
                  {sortLabel}
                </button>
                {sortOpen && (
                  <ul className="menu-select-list" role="listbox">
                    {SORTS.map((s) => (
                      <li key={s.value}>
                        <button
                          type="button"
                          className={s.value === sort ? "active" : ""}
                          onClick={() => {
                            setSort(s.value);
                            setSortOpen(false);
                          }}
                        >
                          {s.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="result-count">{list.length} items</span>
            </div>
            {list.length === 0 ? (
              <p style={{ color: "var(--cream-dim)" }}>No products found.</p>
            ) : (
              <div className="grid-4">
                {list.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            )}
            <p className="center mt-40">
              <Link href="/quick-order" className="btn btn-outline">Prefer a spreadsheet? Use Quick Order →</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
