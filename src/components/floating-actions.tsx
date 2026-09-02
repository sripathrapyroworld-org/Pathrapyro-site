"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { WhatsAppCta } from "@/components/whatsapp-cta";

export function FloatingActions({ phone, license }: { phone: string; whatsapp?: string; license?: string }) {
  const { count } = useCart();
  return (
    <>
      <Link href="/quick-order" className="quick-order-fab">
        ⚡ QUICK ORDER
      </Link>
      {license && (
        <div className="license-fab" aria-label={`License No. ${license}`}>
          License No: {license}
        </div>
      )}
      <div className="float-btns">
        <Link href="/cart" className="fab cart-fab desktop-only-fab" aria-label="Cart">
          🛒
          {count > 0 && <span className="cart-count">{count}</span>}
        </Link>
        <a className="fab call" href={`tel:${phone.replace(/\s/g, "")}`} aria-label="Call">
          📞
        </a>
        <WhatsAppCta className="fab wa" text="Hi, I want to order crackers" aria-label="WhatsApp">
          <span className="ping" />
          💬
        </WhatsAppCta>
      </div>
    </>
  );
}
