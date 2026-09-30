"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatInr } from "@/lib/utils";

export type CatalogItem = {
  kind: "product" | "combo";
  id: string;
  name: string;
  category: string;
  mrp: number;
  sale: number;
  stock?: number;
};

type Line = CatalogItem & { qty: number };

export function ManualBillForm({
  catalog,
  gstPercent,
}: {
  catalog: CatalogItem[];
  gstPercent: number;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [packingCharge, setPackingCharge] = useState(0);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [gst, setGst] = useState(gstPercent);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  const [deductStock, setDeductStock] = useState(true);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return catalog.slice(0, 12);
    return catalog
      .filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term)
      )
      .slice(0, 20);
  }, [catalog, q]);

  function addItem(item: CatalogItem) {
    setLines((prev) => {
      const found = prev.find((l) => l.kind === item.kind && l.id === item.id);
      if (found) {
        const bumped = { ...found, qty: found.qty + 1 };
        const rest = prev.filter((l) => !(l.kind === item.kind && l.id === item.id));
        return [bumped, ...rest];
      }
      return [{ ...item, qty: 1 }, ...prev];
    });
    setQ("");
  }

  function setQty(kind: string, id: string, qty: number) {
    setLines((prev) =>
      prev.map((l) => (l.kind === kind && l.id === id ? { ...l, qty: Math.max(0, qty) } : l))
    );
  }

  function removeLine(kind: string, id: string) {
    setLines((prev) => prev.filter((l) => !(l.kind === kind && l.id === id)));
  }

  function normalizeQty(kind: string, id: string) {
    setLines((prev) =>
      prev.map((l) => (l.kind === kind && l.id === id ? { ...l, qty: Math.max(1, l.qty || 1) } : l))
    );
  }

  function setRate(kind: string, id: string, sale: number) {
    setLines((prev) => prev.map((l) => (l.kind === kind && l.id === id ? { ...l, sale: Math.max(0, sale) } : l)));
  }

  const subtotal = lines.reduce((s, l) => s + l.sale * l.qty, 0);
  const orig = lines.reduce((s, l) => s + l.mrp * l.qty, 0);
  const savings = Math.max(0, orig - subtotal);
  const gstAmount = Math.round(subtotal * Math.max(0, gst) / 100);
  const total = subtotal + gstAmount + Math.max(0, packingCharge) + Math.max(0, shippingCharge);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!lines.length) {
      setError("Add at least one product.");
      return;
    }
    const normalized = lines.map((l) => ({ ...l, qty: Math.max(1, l.qty || 1) }));
    setLines(normalized);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await fetch("/api/admin/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: String(fd.get("name") || ""),
            phone: String(fd.get("phone") || ""),
            email: String(fd.get("email") || ""),
            address: String(fd.get("address") || ""),
            pincode: String(fd.get("pincode") || ""),
          },
          packingCharge,
          shippingCharge,
          gstPercent: gst,
          paymentStatus,
          deductStock,
          items: normalized.map((l) => ({
            kind: l.kind,
            id: l.id,
            name: l.name,
            category: l.category,
            mrp: l.mrp,
            sale: l.sale,
            qty: l.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create bill.");
        return;
      }
      router.push(`/admin/orders/${data.orderId}?created=1`);
      router.refresh();
    });
  }

  return (
    <form className="manual-bill" onSubmit={onSubmit}>
      {error && <div className="alert error">{error}</div>}

      <section className="card panel static">
        <h3>Customer details</h3>
        <p className="cell-sub" style={{ margin: "6px 0 14px" }}>
          This bill is saved as an <strong>offline order</strong> in Sales Management.
        </p>
        <div className="form-row">
          <div className="form-row two">
            <div className="field">
              <label>Customer name</label>
              <input name="name" required placeholder="Walk-in customer" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input name="phone" required placeholder="10-digit mobile" />
            </div>
          </div>
          <div className="form-row two">
            <div className="field">
              <label>Email (optional)</label>
              <input name="email" type="email" placeholder="optional" />
            </div>
            <div className="field">
              <label>Pincode</label>
              <input name="pincode" placeholder="626130" />
            </div>
          </div>
          <div className="field">
            <label>Address (optional for counter sale)</label>
            <textarea name="address" rows={2} placeholder="Shop pickup / delivery address" />
          </div>
        </div>
      </section>

      <section className="card panel static">
        <h3>Add products</h3>
        <div className="search-box2" style={{ margin: "14px 0" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search catalogue by product or category…"
          />
        </div>
        {q.trim() && (
          <div className="manual-catalog">
            {filtered.length === 0 ? (
              <p className="cell-sub">No matching products.</p>
            ) : (
              filtered.map((item) => (
                <button type="button" className="manual-catalog-row" key={`${item.kind}:${item.id}`} onClick={() => addItem(item)}>
                  <span>
                    <strong>{item.name}</strong>
                    <div className="cell-sub">
                      {item.kind === "combo" ? "Combo" : item.category}
                      {typeof item.stock === "number" ? ` · stock ${item.stock}` : ""}
                    </div>
                  </span>
                  <span className="amt">{formatInr(item.sale)}</span>
                </button>
              ))
            )}
          </div>
        )}

        {lines.length === 0 ? (
          <p className="cell-sub">Search and tap a product to add it to this bill.</p>
        ) : (
          <div className="manual-lines">
            {lines.map((l) => (
              <div className="manual-line" key={`${l.kind}:${l.id}`}>
                <div className="manual-line-name">
                  <strong>{l.name}</strong>
                  <div className="cell-sub">{l.kind === "combo" ? "Combo Pack" : l.category}</div>
                </div>
                <div className="manual-line-qty">
                  <span className="manual-line-head">Qty</span>
                  <input
                    className="manual-num"
                    type="number"
                    min={1}
                    value={l.qty || ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setQty(l.kind, l.id, 0);
                        return;
                      }
                      setQty(l.kind, l.id, Number(raw) || 0);
                    }}
                    onBlur={() => normalizeQty(l.kind, l.id)}
                  />
                </div>
                <div className="manual-line-rate">
                  <span className="manual-line-head">Rate</span>
                  <input
                    className="manual-num"
                    type="number"
                    min={0}
                    value={l.sale}
                    onChange={(e) => setRate(l.kind, l.id, Number(e.target.value) || 0)}
                  />
                </div>
                <div className="manual-line-amt">
                  <span className="manual-line-head">Amount</span>
                  {formatInr(l.sale * l.qty)}
                </div>
                <div className="manual-line-remove">
                  <button type="button" className="icon-mini" onClick={() => removeLine(l.kind, l.id)} title="Remove product">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card panel static">
        <h3>Charges &amp; payment</h3>
        <div className="form-row two" style={{ marginTop: 14 }}>
          <div className="field">
            <label>GST %</label>
            <input type="number" min={0} step={0.01} value={gst} onChange={(e) => setGst(Number(e.target.value) || 0)} />
          </div>
          <div className="field">
            <label>Packing (₹)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={packingCharge}
              onChange={(e) => setPackingCharge(Math.max(0, Math.round(Number(e.target.value) || 0)))}
            />
          </div>
        </div>
        <div className="form-row two">
          <div className="field">
            <label>Shipping (₹)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={shippingCharge}
              onChange={(e) => setShippingCharge(Math.max(0, Math.round(Number(e.target.value) || 0)))}
            />
          </div>
          <div className="field">
            <label>Payment</label>
            <select className="admin-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as "paid" | "pending")}>
              <option value="paid">Paid (cash / UPI / bank)</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <label className="customer-quote-check" style={{ marginTop: 8 }}>
          <input type="checkbox" checked={deductStock} onChange={(e) => setDeductStock(e.target.checked)} />
          <span>Deduct product stock for this bill</span>
        </label>

        <div className="manual-totals">
          <div className="summary-line"><span>{lines.reduce((s, l) => s + l.qty, 0)} items</span><span className="amt">{formatInr(subtotal)}</span></div>
          {savings > 0 && <div className="summary-line"><span>You save</span><span className="amt">{formatInr(savings)}</span></div>}
          {gstAmount > 0 && <div className="summary-line"><span>GST ({gst}%)</span><span className="amt">{formatInr(gstAmount)}</span></div>}
          {packingCharge > 0 && <div className="summary-line"><span>Packing</span><span className="amt">{formatInr(packingCharge)}</span></div>}
          {shippingCharge > 0 && <div className="summary-line"><span>Shipping</span><span className="amt">{formatInr(shippingCharge)}</span></div>}
          <div className="summary-line total"><span>Grand total</span><span className="amt">{formatInr(total)}</span></div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={pending} style={{ marginTop: 18 }}>
          {pending ? "Creating bill…" : "Create offline bill"}
        </button>
      </section>
    </form>
  );
}
