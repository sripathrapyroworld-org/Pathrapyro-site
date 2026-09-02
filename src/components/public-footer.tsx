import Link from "next/link";
import type { SiteSettings } from "@/lib/settings";
import { WhatsAppCta } from "@/components/whatsapp-cta";

export function PublicFooter({
  settings,
  categories,
}: {
  settings: SiteSettings;
  categories: { name: string; slug: string }[];
}) {
  return (
    <footer>
      <div className="wrap footer-grid">
        <div>
          <div className="brand" style={{ marginBottom: 16 }}>
            <img className="brand-logo" src="/images/logo.png" alt={settings.businessName} />
            <div className="name">
              {settings.businessName}
              <small>{settings.tagline}</small>
            </div>
          </div>
          <p style={{ color: "var(--cream-dim)", fontSize: "0.86rem", lineHeight: 1.7 }}>
            Buy Sivakasi crackers online — retail &amp; wholesale fireworks with safe delivery across Tamil Nadu.
            Genuine Sivakasi crackers at direct factory rates. Licensed, tested, and trusted by families statewide.
          </p>
          <div className="social-row">
            <a className="icon-btn" href="#" aria-label="Facebook">f</a>
            <a className="icon-btn" href="#" aria-label="Instagram">in</a>
            <WhatsAppCta className="icon-btn">wa</WhatsAppCta>
          </div>
        </div>
        <div>
          <h5>Quick Links</h5>
          <ul>
            <li><Link href="/shop">Shop All</Link></li>
            <li><Link href="/quick-order">Quick Order</Link></li>
            <li><Link href="/combos">Combo Packs</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/track">Track Order</Link></li>
          </ul>
        </div>
        <div>
          <h5>Categories</h5>
          <ul>
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}><Link href={`/category/${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h5>Contact</h5>
          <ul>
            <li>📍 {settings.cityLine}</li>
            <li>📞 Customer care: {settings.phone}</li>
            <li>📞 Ganesh Kumar: {settings.phone2}{settings.phone3 ? ` · ${settings.phone3}` : ""}</li>
            <li>📞 Muthuram P: {settings.phone4}</li>
            <li>✉️ {settings.email}</li>
            <li><Link href="/legal">Legal & Compliance Info</Link></li>
          </ul>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} {settings.businessName}, Virudhunagar. All rights reserved.</span>
        <span>License No. {settings.license} · Licensed explosives dealer</span>
      </div>
    </footer>
  );
}
