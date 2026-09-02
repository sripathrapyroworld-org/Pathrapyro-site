"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { EnquireButton } from "@/components/enquire-button";
import { TotalsBreakdown } from "@/components/totals-breakdown";
import { formatInr, mediaUrl } from "@/lib/utils";

export default function CartPage() {
  const { items, setQty, remove, totals, quoteReady } = useCart();

  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <div className="crumb">Home / <span>Cart</span></div>
          <div className="eyebrow">Review &amp; Enquire</div>
          <h1>Your Cart</h1>
          <p>
            Review your items and send an enquiry. Our team will confirm packing and shipping charges for your order
            before you place it.
          </p>
        </div>
      </div>
      <section style={{ paddingTop: 40 }}>
        <div className="wrap cart-layout">
          <div className="card static" id="cartItemsBox">
            {items.length === 0 ? (
              <div className="empty-cart">
                <div className="emoji">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Browse our shop and add some sparkle to your Diwali!</p>
                <Link className="btn btn-primary" style={{ marginTop: 20 }} href="/shop">
                  Start Shopping
                </Link>
              </div>
            ) : (
              items.map((c) => (
                <div className="cart-item" key={c.key}>
                  <img src={mediaUrl(c.img)} alt="" />
                  <div>
                    <div className="cat">{c.cat}</div>
                    <h5>{c.name}</h5>
                    <div className="price">
                      {formatInr(c.sale)} × {c.qty} = {formatInr(c.sale * c.qty)}
                    </div>
                  </div>
                  <div className="qty-selector">
                    <button onClick={() => setQty(c.key, c.qty - 1)}>−</button>
                    <span className="val">{c.qty}</span>
                    <button onClick={() => setQty(c.key, c.qty + 1)}>+</button>
                  </div>
                  <button className="remove-btn" onClick={() => remove(c.key)}>
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
          <div>
            <div className="card summary-card">
              <h4>Cart Summary</h4>
              {items.length > 0 && (
                <div className="cart-enquire-note">
                  <strong>Enquire before ordering</strong>
                  <p>
                    Packing and shipping depend on your location and order size. Please enquire first — our team will
                    apply the correct charges to your account and notify you when your order quote is ready.
                  </p>
                </div>
              )}
              <TotalsBreakdown totals={totals} totalLabel={quoteReady ? "Grand Total" : "Estimated total"} />
              {items.length > 0 && (
                <EnquireButton className="btn btn-wa btn-block" payload={{ kind: "cart" }} style={{ marginTop: 18 }}>
                  Enquire about these items
                </EnquireButton>
              )}
              {quoteReady ? (
                <Link
                  className="btn btn-primary btn-block"
                  href="/checkout"
                  style={{
                    marginTop: 10,
                    pointerEvents: items.length === 0 ? "none" : "auto",
                    opacity: items.length === 0 ? 0.5 : 1,
                  }}
                >
                  Place Order →
                </Link>
              ) : (
                items.length > 0 && (
                  <p className="cart-checkout-hint">
                    Order placement unlocks after our team confirms packing &amp; shipping for your cart.
                  </p>
                )
              )}
              <Link className="btn btn-outline btn-block" href="/shop" style={{ marginTop: 10 }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
