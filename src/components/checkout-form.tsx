"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { TotalsBreakdown } from "@/components/totals-breakdown";
import { formatInr, mediaUrl } from "@/lib/utils";

type Prefill = { name: string; phone: string; email: string; address: string; pincode: string };

export function CheckoutForm({ prefill }: { prefill: Prefill; loggedIn?: boolean }) {
  const { items, totals, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!items.length) return;
    setBusy(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    const customer = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      address: String(fd.get("address") || ""),
      pincode: String(fd.get("pincode") || ""),
    };

    const res = await fetch("/api/checkout/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        items: items.map((i) => ({ kind: i.kind, id: i.id, qty: i.qty })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Could not place order");
      setBusy(false);
      return;
    }

    clear();
    router.push(`/order/success?id=${data.orderNumber}`);
  }

  if (!items.length) {
    return (
      <div className="wrap" style={{ padding: "60px 0" }}>
        <div className="empty-cart card static">
          <div className="emoji">🛒</div>
          <h3>Your cart is empty</h3>
          <Link className="btn btn-primary" href="/shop" style={{ marginTop: 16 }}>Go to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <div className="crumb">Home / Cart / <span>Place Order</span></div>
          <div className="eyebrow">Confirm Order</div>
          <h1>Place Your Order</h1>
          <p>
            Your quote is confirmed. Review delivery details and submit your order. Our team will share payment
            instructions — once payment is received, we will process and dispatch your order.
          </p>
        </div>
      </div>
      <section style={{ paddingTop: 40 }}>
        <div className="wrap cart-layout">
          <form className="card form-card static" onSubmit={placeOrder}>
            <h4 style={{ marginBottom: 16 }}>Delivery Details</h4>
            {err && <div className="alert error">{err}</div>}
            <div className="form-row">
              <div className="field">
                <label>Full Name</label>
                <input name="name" required defaultValue={prefill.name} placeholder="Your name" />
              </div>
              <div className="form-row two">
                <div className="field">
                  <label>Mobile Number</label>
                  <input name="phone" required defaultValue={prefill.phone} placeholder="10-digit mobile" />
                </div>
                <div className="field">
                  <label>Pincode</label>
                  <input name="pincode" required defaultValue={prefill.pincode} placeholder="626130" />
                </div>
              </div>
              <div className="field">
                <label>Email (optional)</label>
                <input name="email" type="email" defaultValue={prefill.email} placeholder="you@email.com" />
              </div>
              <div className="field">
                <label>Delivery Address</label>
                <textarea name="address" rows={3} required defaultValue={prefill.address} placeholder="Full address" />
              </div>
            </div>
            <p className="cart-checkout-hint" style={{ marginTop: 14 }}>
              Payment is collected offline (UPI / bank transfer / cash). You will receive a call or WhatsApp with
              payment details after placing the order.
            </p>
            <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} disabled={busy}>
              {busy ? "Placing order…" : `Place Order — ${formatInr(totals.total)}`}
            </button>
          </form>
          <div className="card summary-card">
            <h4>Order Summary</h4>
            {items.map((i) => (
              <div className="summary-line" key={i.key}>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <img src={mediaUrl(i.img)} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                  {i.name} × {i.qty}
                </span>
                <span className="amt">{formatInr(i.sale * i.qty)}</span>
              </div>
            ))}
            <TotalsBreakdown totals={totals} totalLabel="Order Total" />
          </div>
        </div>
      </section>
    </>
  );
}
