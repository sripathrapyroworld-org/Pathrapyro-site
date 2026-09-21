"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "./cart-provider";
import { AccountMenu } from "@/components/account-menu";
import type { SiteSettings } from "@/lib/settings";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/combos", label: "Combo Packs" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/legal", label: "Legal Info" },
];

export function PublicHeader({
  settings,
  userName,
}: {
  settings: SiteSettings;
  userName?: string | null;
}) {
  const path = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  function active(href: string) {
    if (href === "/") return path === "/";
    return path.startsWith(href);
  }

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <div className="marquee">
            <span>{settings.marquee}</span>
          </div>
          <div className="links">
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>📞 {settings.phone}</a>
            <span>GSTIN: {settings.gstin}</span>
          </div>
        </div>
      </div>
      <header className="nav">
        <div className="wrap">
          <Link href="/" className="brand">
            <img className="brand-logo" src="/images/logo.png" alt={settings.businessName} />
            <div className="name">
              {settings.businessName}
              <small>{settings.tagline}</small>
            </div>
          </Link>
          <nav className={`links${open ? " open" : ""}`} id="navLinks">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`navlink${active(n.href) ? " active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <a className="nav-pricelist" href="/api/pricelist" title="Download full price list PDF">
              ⬇ Price List
            </a>
            <Link href="/shop" className="icon-btn" title="Search">
              ⌕
            </Link>
            <AccountMenu userName={userName} />
            <Link href="/cart" className="icon-btn" title="Cart">
              🛒<span className="cart-count">{count}</span>
            </Link>
            <button className="burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              ☰
            </button>
          </div>
        </div>
      </header>
      {settings.license && (
        <div className="license-bar">
          <div className="wrap">License No: {settings.license}</div>
        </div>
      )}
      <div className="strip">
        <div className="track">
          <span>🎆 DIWALI MEGA SALE — FLAT {settings.discountBadgePercent} OFF</span>
          <span>🚚 SAFE PARCEL DELIVERY ALL OVER TAMIL NADU</span>
          <span>🏭 100% GENUINE SIVAKASI FACTORY PRODUCTS</span>
          <span>📜 LICENSED DEALER · GOVT APPROVED</span>
          <span>🎆 DIWALI MEGA SALE — FLAT {settings.discountBadgePercent} OFF</span>
          <span>🚚 SAFE PARCEL DELIVERY ALL OVER TAMIL NADU</span>
          <span>🏭 100% GENUINE SIVAKASI FACTORY PRODUCTS</span>
          <span>📜 LICENSED DEALER · GOVT APPROVED</span>
        </div>
      </div>
    </>
  );
}
