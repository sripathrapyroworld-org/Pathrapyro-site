"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatInr, mediaUrl } from "@/lib/utils";
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
  emoji: string;
  sortOrder: number;
  subCategories: { id: string; name: string; sortOrder: number }[];
};

export function ShopCatalog({
  products,
  categories,
}: {
  products: ShopCatalogProduct[];
  categories: ShopCatalogCategory[];
}) {
  const { add, requireLogin } = useCart();
  const [q, setQ] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [openCat, setOpenCat] = useState<string>("all");

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

  function setLineQty(id: string, next: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, next) }));
  }

  function addLine(p: ShopCatalogProduct) {
    if (!requireLogin()) return;
    const n = qty[p.id] || 1;
    if (n < 1) return;
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
      },
      n
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <div className="crumb">
            Home / <span>Shop</span>
          </div>
          <div className="eyebrow">Full Catalogue</div>
          <h1>Sivakasi Crackers Online — Shop All Fireworks</h1>
          <p>
            Browse by category and subcategory, set quantities, and add to cart — the same fast flow as Quick Order.
          </p>
          <div className="shop-pricelist-row">
            <a className="btn btn-outline" href="/api/pricelist">
              Download Price List PDF
            </a>
            <Link className="btn btn-primary" href="/quick-order">
              Open Quick Order →
            </Link>
          </div>
        </div>
      </div>

      <section className="qo-section">
        <div className="wrap">
          <div className="qo-toolbar">
            <div className="search-box qo-search">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products..."
              />
            </div>
            <div className="qo-cats">
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
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="shop-catalog">
            {visible.map(({ cat, subs, ungrouped }) => (
              <div className="shop-cat-block" key={cat.id} id={`cat-${cat.slug}`}>
                <div className="shop-cat-head">
                  <h2>
                    {cat.emoji} {cat.name}
                  </h2>
                </div>

                {subs.map((sub) => (
                  <div className="shop-sub-block" key={sub.id}>
                    <h3>{sub.name}</h3>
                    <ProductTable
                      products={sub.products}
                      qty={qty}
                      setLineQty={setLineQty}
                      addLine={addLine}
                    />
                  </div>
                ))}

                {ungrouped.length > 0 && (
                  <div className="shop-sub-block">
                    {subs.length > 0 && <h3>Other items</h3>}
                    <ProductTable
                      products={ungrouped}
                      qty={qty}
                      setLineQty={setLineQty}
                      addLine={addLine}
                    />
                  </div>
                )}
              </div>
            ))}

            {!visible.length && <p className="qo-empty">No products match your search.</p>}
          </div>
        </div>
      </section>
    </>
  );
}

function ProductTable({
  products,
  qty,
  setLineQty,
  addLine,
}: {
  products: ShopCatalogProduct[];
  qty: Record<string, number>;
  setLineQty: (id: string, next: number) => void;
  addLine: (p: ShopCatalogProduct) => void;
}) {
  return (
    <>
      <div className="qo-mobile-list">
        {products.map((p) => {
          const n = qty[p.id] || 0;
          return (
            <article className={`qo-item${n > 0 ? " selected" : ""}`} key={p.id}>
              <img src={mediaUrl(p.img)} alt="" />
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
                  <button type="button" onClick={() => setLineQty(p.id, n - 1)} disabled={n <= 0}>
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={n}
                    onChange={(e) => setLineQty(p.id, Number(e.target.value) || 0)}
                  />
                  <button type="button" onClick={() => setLineQty(p.id, n + 1)}>
                    +
                  </button>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => addLine(p)}>
                    Add
                  </button>
                </div>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const n = qty[p.id] || 0;
              return (
                <tr key={p.id}>
                  <td>
                    <div className="qo-row-name">
                      <img src={mediaUrl(p.img)} alt="" />
                      <Link href={`/product/${p.slug}`}>{p.name}</Link>
                    </div>
                  </td>
                  <td>{formatInr(p.mrp)}</td>
                  <td className="price-cell">{formatInr(p.sale)}</td>
                  <td>
                    <div className="qo-qty compact">
                      <button type="button" onClick={() => setLineQty(p.id, n - 1)} disabled={n <= 0}>
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={n}
                        onChange={(e) => setLineQty(p.id, Number(e.target.value) || 0)}
                      />
                      <button type="button" onClick={() => setLineQty(p.id, n + 1)}>
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => addLine(p)}>
                      Add
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
