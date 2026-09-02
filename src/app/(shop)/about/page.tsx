import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema, SeoJsonLd } from "@/components/seo-json-ld";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Original Sivakasi Crackers Wholesale",
  description:
    "About Sri Pathra Pyro World — original Sivakasi crackers wholesale and retail supplier. 15+ years manufacturing experience, licensed PESO dealer, crackers wholesale Sivakasi from Virudhunagar.",
  path: "/about",
});

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <>
      <SeoJsonLd
        data={breadcrumbSchema([
          { name: "Home", path: absoluteUrl("/") },
          { name: "About Us", path: absoluteUrl("/about") },
        ])}
      />
      <div
        className="page-hero page-hero-photo"
        style={{ backgroundImage: "url('/images/static-sparkler-sunset.jpg')" }}
      >
        <div className="wrap">
          <div className="crumb">Home / <span>About Us</span></div>
          <div className="eyebrow">Our Story</div>
          <h1>About {settings.businessName}</h1>
          <p>Original Sivakasi crackers — retail and wholesale fireworks from Virudhunagar to all of Tamil Nadu.</p>
        </div>
      </div>
      <section>
        <div className="wrap about-grid">
          <div className="about-imgs">
            <img className="a1" src="/images/about-diwali-celebration.jpg" alt="Diwali celebration with Sivakasi sparklers" />
            <img className="a2" src="/images/about-crowd-fireworks.jpg" alt="Crowd watching Sivakasi fireworks" />
          </div>
          <div className="about-copy">
            <div className="eyebrow">Company History</div>
            <h2>Rooted in Virudhunagar&apos;s Fireworks Legacy</h2>
            <p>
              What began as a small family workshop producing sparklers has grown into one of the region&apos;s trusted
              Sivakasi crackers wholesale suppliers, serving homes, event organisers and retailers across Tamil Nadu.
            </p>
            <p>
              We supply original Sivakasi crackers direct from our factory — crackers wholesale Sivakasi for bulk buyers,
              and retail packs for families. Every batch is hand-checked before dispatch.
            </p>
            <ul className="check-list">
              <li>15+ years of manufacturing experience</li>
              <li>Genuine Sivakasi-manufactured products only</li>
              <li>PESO-compliant safety testing on every batch</li>
              <li>Licensed under Tamil Nadu explosives regulations</li>
            </ul>
            <Link className="btn btn-outline mt-40" href="/shop">
              Shop Sivakasi crackers online →
            </Link>
          </div>
        </div>
      </section>
      <section style={{ paddingTop: 0 }}>
        <div className="wrap static-photo-row">
          <figure className="static-photo-card">
            <img src="/images/static-sparkler-heart.jpg" alt="Sivakasi sparkler light painting" />
          </figure>
          <figure className="static-photo-card">
            <img src="/images/static-fireworks-panorama.jpg" alt="Sivakasi fireworks panorama at night" />
          </figure>
          <figure className="static-photo-card">
            <img src="/images/static-firework-fountain.jpg" alt="Golden Sivakasi firework fountain" />
          </figure>
        </div>
      </section>
      <section style={{ paddingTop: 0 }}>
        <div className="wrap grid-3">
          <div className="card why-card"><div className="ic">🎯</div><h4>Our Mission</h4><p>To make celebration-ready, safety-tested fireworks accessible to every household at honest, factory-direct prices.</p></div>
          <div className="card why-card"><div className="ic">🔭</div><h4>Our Vision</h4><p>To be Tamil Nadu&apos;s most trusted name in fireworks — known equally for quality, safety and fair pricing.</p></div>
          <div className="card why-card"><div className="ic">🛡️</div><h4>Safety Standards</h4><p>Every product undergoes PESO-mandated testing before packing; batches failing inspection are destroyed, not sold.</p></div>
        </div>
      </section>
      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Why Trust Us</div>
            <h2>Why Customers Trust {settings.businessName}</h2>
          </div>
          <div className="why-grid">
            <div className="card why-card"><div className="ic">🏭</div><h4>Genuine Sivakasi Products</h4><p>Manufactured entirely within Sivakasi — India&apos;s fireworks capital.</p></div>
            <div className="card why-card"><div className="ic">👨‍👩‍👧‍👦</div><h4>Family Business</h4><p>Run by the same family for 3 generations — accountability you can call directly.</p></div>
            <div className="card why-card"><div className="ic">📜</div><h4>Fully Licensed</h4><p>License {settings.license} and GST {settings.gstin} on display.</p></div>
            <div className="card why-card"><div className="ic">⭐</div><h4>2 Lakh+ Customers</h4><p>Repeat customers across Tamil Nadu return to us every festive season.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
