"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/admin", label: "Dashboard", ic: "📊", group: "Overview" },
  { href: "/admin/customers", label: "Customers", ic: "👥", group: "Operations" },
  { href: "/admin/leads", label: "Lead Management", ic: "🧾", group: "Operations" },
  { href: "/admin/products", label: "Product Management", ic: "🎆", group: "Operations" },
  { href: "/admin/combos", label: "Combo Packs", ic: "📦", group: "Operations" },
  { href: "/admin/offers", label: "Offer Management", ic: "🏷️", group: "Operations" },
  { href: "/admin/sales", label: "Sales Management", ic: "💰", group: "Operations" },
  { href: "/admin/settings", label: "Settings", ic: "⚙️", group: "System" },
  { href: "/admin/account", label: "Account security", ic: "🔐", group: "System" },
];

export function AdminShell({
  children,
  adminName,
  leadCount,
  cartCustomerCount,
  logout,
}: {
  children: React.ReactNode;
  adminName: string;
  leadCount: number;
  cartCustomerCount?: number;
  logout?: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  if (path === "/admin/login" || path === "/admin/forgot-password" || path === "/admin/reset-password") {
    return <>{children}</>;
  }
  const current = LINKS.find((l) => (l.href === "/admin" ? path === "/admin" : path.startsWith(l.href)));

  return (
    <div className="admin-app">
      <div className={`sb-backdrop${open ? " show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sb-brand">
          <img className="brand-logo" src="/images/logo.png" alt="Sri Pathra Pyro" style={{ width: 42, height: 42 }} />
          <div className="txt">
            <b>Sri Pathra Pyro</b>
            <small>ADMIN CONSOLE</small>
          </div>
        </div>
        {["Overview", "Operations", "System"].map((g) => (
          <div className="sb-group" key={g}>
            <div className="sb-label">{g}</div>
            {LINKS.filter((l) => l.group === g).map((l) => {
              const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href} className={`sb-link${active ? " active" : ""}`} onClick={() => setOpen(false)}>
                  <span className="ic">{l.ic}</span> {l.label}
                  {l.href === "/admin/leads" && leadCount > 0 && <span className="sb-badge">{leadCount}</span>}
                  {l.href === "/admin/customers" && (cartCustomerCount || 0) > 0 && (
                    <span className="sb-badge">{cartCustomerCount}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>
      <div>
        <div className="admin-main">
          <div className="admin-topbar">
            <div className="left" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button className="menu-btn" onClick={() => setOpen((v) => !v)}>☰</button>
              <div>
                <div className="page-title">{current?.label || "Admin"}</div>
                <div className="page-sub">Sri Pathra Pyro World operations</div>
              </div>
            </div>
            <div className="admin-chip">
              <div className="av">{adminName.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="nm">{adminName}</div>
                <div className="rl">Store Admin</div>
              </div>
            </div>
            {logout}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
