import type { Metadata } from "next";
import Link from "next/link";
import { ComboCard } from "@/components/combo-card";
import { Countdown } from "@/components/countdown";
import { ProductCard } from "@/components/product-card";
import {
  breadcrumbSchema,
  organizationSchema,
  SeoJsonLd,
  websiteSchema,
} from "@/components/seo-json-ld";
import { SparkCanvas } from "@/components/spark-canvas";
import { fetchPricedCombos, fetchPricedProducts, toPricedCard } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { comboItemsAsLabels } from "@/lib/combo-items";
import { mediaUrl } from "@/lib/utils";
import { WhatsAppCta } from "@/components/whatsapp-cta";

export const metadata: Metadata = buildMetadata({
  title: "Best Sivakasi Crackers Online",
  description:
    "Buy original Sivakasi crackers and fireworks online at factory-direct prices. Best crackers in Sivakasi — retail & wholesale, 500+ varieties, licensed dealer, Tamil Nadu delivery.",
  path: "/",
});

export default async function HomePage() {
  const [settings, featuredRaw, combos, categories] = await Promise.all([
    getSettings(),
    fetchPricedProducts({ featured: true }),
    fetchPricedCombos(),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  const featuredCards =
    featuredRaw.length > 0
      ? featuredRaw.slice(0, 8)
      : (await fetchPricedProducts()).slice(0, 8);

  return (
    <>
      <SeoJsonLd
        data={[
          organizationSchema({
            name: settings.businessName,
            url: absoluteUrl("/"),
            logo: absoluteUrl("/images/logo.png"),
            description:
              "Licensed Sivakasi crackers and fireworks dealer — retail and wholesale, factory-direct prices.",
            email: settings.email,
            phone: settings.phone,
          }),
          websiteSchema({
            name: settings.businessName,
            url: absoluteUrl("/"),
            description:
              "Buy Sivakasi crackers online — original fireworks, crackers wholesale Sivakasi, delivery across Tamil Nadu.",
          }),
          breadcrumbSchema([{ name: "Home", path: absoluteUrl("/") }]),
        ]}
      />
      <section className="hero" style={{ paddingBottom: 60 }}>
        <SparkCanvas />
        <div className="hero-bg-imgs">
          <img className="i1" src="/images/hero-fireworks-display.jpg" alt="Sivakasi fireworks display at night" />
          <img className="i2" src="/images/hero-sparkler-hand.jpg" alt="Hand holding a Sivakasi sparkler" />
        </div>
        <span className="float-deco" style={{ top: "18%", left: "6%" }}>🎇</span>
        <span className="float-deco" style={{ top: "65%", left: "14%", animationDelay: "1.4s" }}>🪔</span>
        <span className="float-deco" style={{ top: "38%", left: "2%", animationDelay: "2.6s" }}>✨</span>
        <div className="wrap">
          <div className="hero-copy">
            <div className="badge-strip">
              <span className="dot" /> Diwali 2026 Booking Open Now
            </div>
            <h1>
              Light Up This Diwali
              <br />
              with <span>Genuine Sivakasi</span> Crackers
            </h1>
            <p className="lead">
              Buy original Sivakasi crackers online at factory-direct prices. 500+ Sivakasi fireworks varieties —
              sparklers to sky shots — retail and wholesale, trusted across Tamil Nadu for over 15 years.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/shop">🛍️ Shop Crackers</Link>
              <Link className="btn btn-outline" href="/quick-order">⚡ Quick Order</Link>
              <WhatsAppCta className="btn btn-wa" text="Hi, I want to enquire about crackers">
                🟢 WhatsApp Enquiry
              </WhatsAppCta>
            </div>
            <div className="discount-pill">
              <div className="num">40–90%</div>
              <div className="txt">
                Flat discount on MRP
                <br />
                across all categories
              </div>
            </div>
          </div>
          {settings.countdownEnabled && (
            <div className="countdown-card">
              <div className="eyebrow">{settings.countdownEyebrow}</div>
              <h3>🎆 {settings.countdownHeading}</h3>
              <Countdown endsAt={settings.countdownEndsAt} />
              {settings.countdownNote && <p className="countdown-note">{settings.countdownNote}</p>}
              <div className="quick-order">
                <Link className="btn btn-primary btn-block" href="/quick-order">
                  {settings.countdownButtonLabel}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="wrap about-grid">
          <div className="about-imgs">
            <img className="a1" src="/images/about-diwali-celebration.jpg" alt="Diwali celebration with Sivakasi sparklers" />
            <img className="a2" src="/images/about-crowd-fireworks.jpg" alt="Crowd watching Sivakasi fireworks" />
          </div>
          <div className="about-copy">
            <div className="eyebrow">Welcome to {settings.businessName}</div>
            <h2>Virudhunagar&apos;s Trusted Name for All Kinds of Crackers & Fancy Varieties</h2>
            <p>
              Based in Kalayarkurichi, Purnachandrapuram, we supply premium Sivakasi crackers and fancy varieties
              directly to customers — cutting out middlemen so you get factory-fresh products at the lowest possible price.
            </p>
            <p>
              Shop online for retail orders or enquire for crackers wholesale Sivakasi — we deliver safely across Tamil
              Nadu. Every box that leaves our warehouse is tested for safety and packed with care.
            </p>
            <div className="stat-row">
              <div className="stat"><div className="n">15+</div><div className="l">Years Experience</div></div>
              <div className="stat"><div className="n">500+</div><div className="l">Cracker Varieties</div></div>
              <div className="stat"><div className="n">2 Lakh+</div><div className="l">Happy Customers</div></div>
              <div className="stat"><div className="n">100%</div><div className="l">Genuine Sivakasi</div></div>
            </div>
            <Link className="btn btn-outline mt-40" href="/about">More About Us →</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Handpicked For You</div>
            <h2>Featured Products</h2>
            <p>Our best-selling crackers this Diwali, loved for their brightness, sound and value.</p>
          </div>
          <div className="grid-4">
            {featuredCards.map((p) => (
              <ProductCard key={p.id} p={toPricedCard(p)} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Save More, Bundled</div>
            <h2>Popular Combo Packs</h2>
            <p>Ready-made assortments curated for every family size and budget.</p>
          </div>
          <div className="grid-3">
            {combos.slice(0, 3).map((c) => (
              <ComboCard
                key={c.id}
                c={{
                  id: c.id,
                  slug: c.slug,
                  tier: c.tier,
                  name: c.name,
                  items: comboItemsAsLabels(c.itemsJson),
                  mrp: c.mrp,
                  sale: c.effectiveSale,
                  img: c.imagePath,
                }}
              />
            ))}
          </div>
          <div className="center mt-40">
            <Link className="btn btn-primary" href="/combos">View All Combo Packs →</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Browse by Type</div>
            <h2>Popular Categories</h2>
            <p>Twelve carefully organised categories to help you find exactly what you need.</p>
          </div>
          <div className="cat-scroll">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={c.slug === "combo-packs" ? "/combos" : `/category/${c.slug}`}
                className="cat-tile"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(13,7,22,0.15), rgba(13,7,22,0.92)), url('${mediaUrl(c.coverPath)}')`,
                }}
              >
                <div className="emoji">{c.emoji}</div>
                <div className="name">{c.name}</div>
                <div className="count">{c._count.products || "10+"} items</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Our Promise</div>
            <h2>Why Choose {settings.businessName}</h2>
          </div>
          <div className="why-grid">
            <div className="card why-card"><div className="ic">🏭</div><h4>Direct Factory Rate</h4><p>No middlemen — you buy straight from our Sivakasi manufacturing unit at the lowest price.</p></div>
            <div className="card why-card"><div className="ic">✅</div><h4>Tested & Certified</h4><p>Every product is quality-checked and PESO compliant for safe home use.</p></div>
            <div className="card why-card"><div className="ic">🚚</div><h4>Safe Transport</h4><p>Licensed courier partners ensure secure, insured delivery across Tamil Nadu.</p></div>
            <div className="card why-card"><div className="ic">💬</div><h4>Personal Support</h4><p>Our team confirms every order over call or WhatsApp before dispatch.</p></div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Customer Highlights</div>
            <h2>What Families Say About Us</h2>
          </div>
          <div className="testi-grid">
            {[
              { q: "Ordered a family combo pack — arrived well packed and every item worked perfectly. Great rates!", n: "Ramesh Kumar", l: "Madurai", a: "R" },
              { q: "Quick order page saved so much time. Called to confirm and got delivery in 3 days.", n: "Priya S.", l: "Coimbatore", a: "P" },
              { q: "Best sparkler quality we've bought in years. Kids loved the fancy items box.", n: "Arun Vel", l: "Trichy", a: "A" },
            ].map((t) => (
              <div className="card testi-card" key={t.n}>
                <div className="stars">★★★★★</div>
                <p className="quote">&ldquo;{t.q}&rdquo;</p>
                <div className="testi-who">
                  <div className="av">{t.a}</div>
                  <div>
                    <div className="nm">{t.n}</div>
                    <div className="loc">{t.l}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap two-notices">
          <div className="notice-band">
            <div className="ic">🛡️</div>
            <div>
              <h4>Safety First, Always</h4>
              <p>Burst crackers only in open outdoor spaces, keep water/sand nearby, use one at a time, never relight a &quot;dud&quot;, and always supervise children. Follow local municipal timing rules.</p>
            </div>
          </div>
          <div className="notice-band">
            <div className="ic">⚖️</div>
            <div>
              <h4>Licensed Trade</h4>
              <p>We operate under Explosives License {settings.license} and GSTIN {settings.gstin}. Orders are placed online; payment is collected offline after confirmation. Check local bursting rules before use.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Delivery Network</div>
            <h2>Transport & Shipping Information</h2>
          </div>
          <div className="transport-grid">
            <div className="card why-card"><div className="ic">🚛</div><h4>Licensed Courier Only</h4><p>We ship strictly via government-approved explosive-goods transport partners.</p></div>
            <div className="card why-card"><div className="ic">📦</div><h4>Tamper-Proof Packing</h4><p>Double-layer sealed cartons prevent damage and moisture during transit.</p></div>
            <div className="card why-card"><div className="ic">📍</div><h4>Pan Tamil Nadu Delivery</h4><p>We currently deliver to all districts of Tamil Nadu, 3–7 working days.</p></div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="notice-band help-cta-band">
            <div className="help-cta-copy">
              <h4>Need Help Choosing Crackers?</h4>
              <p>Talk to our team directly — we&apos;ll help you build the perfect combo for your budget.</p>
            </div>
            <div className="help-cta-actions">
              <WhatsAppCta className="btn btn-wa">WhatsApp Us</WhatsAppCta>
              <a className="btn btn-primary" href={`tel:${settings.phone.replace(/\s/g, "")}`}>Call Now</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
