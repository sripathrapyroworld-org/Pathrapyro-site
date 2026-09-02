import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { breadcrumbSchema, localBusinessSchema, SeoJsonLd } from "@/components/seo-json-ld";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { auth } from "@/auth";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sivakasi Crackers Shop — Contact Us",
  description:
    "Contact Sri Pathra Pyro World — your Sivakasi crackers shop in Virudhunagar. Customer care, wholesale enquiries, delivery across Tamil Nadu. Call, WhatsApp or visit us.",
  path: "/contact",
});

export default async function ContactPage() {
  const [s, session] = await Promise.all([getSettings(), auth()]);
  const loggedIn = session?.user?.role === "CUSTOMER";
  return (
    <>
      <SeoJsonLd
        data={[
          localBusinessSchema({
            name: s.businessName,
            url: absoluteUrl("/contact"),
            description:
              "Sivakasi crackers shop — buy original Sivakasi crackers and fireworks online. Retail and wholesale, licensed dealer.",
            address: s.address,
            cityLine: s.cityLine,
            phone: s.phone,
            email: s.email,
            hours: s.hours,
            license: s.license,
            gstin: s.gstin,
            image: absoluteUrl("/images/logo.png"),
          }),
          breadcrumbSchema([
            { name: "Home", path: absoluteUrl("/") },
            { name: "Contact", path: absoluteUrl("/contact") },
          ]),
        ]}
      />
      <div
        className="page-hero page-hero-photo"
        style={{ backgroundImage: "url('/images/static-sparkler-heart.jpg')" }}
      >
        <div className="wrap">
          <div className="crumb">Home / <span>Contact Us</span></div>
          <div className="eyebrow">Get In Touch</div>
          <h1>Sivakasi Crackers Shop — Contact Us</h1>
          <p>Reach out for retail orders, Sivakasi crackers wholesale, combo customisation, or delivery queries.</p>
        </div>
      </div>
      <section>
        <div className="wrap contact-grid">
          <div>
            <div className="contact-info-list">
              <div className="contact-info-item"><div className="ic">📍</div><div><h5>Address</h5><p>{s.businessName}, {s.address}</p></div></div>
              <div className="contact-info-item"><div className="ic">📞</div><div><h5>Customer Care</h5><p><a href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a></p></div></div>
              <div className="contact-info-item"><div className="ic">👤</div><div><h5>Ganesh Kumar K</h5><p><a href={`tel:${s.phone2.replace(/\s/g, "")}`}>{s.phone2}</a>{s.phone3 ? <> · <a href={`tel:${s.phone3.replace(/\s/g, "")}`}>{s.phone3}</a></> : null}</p></div></div>
              <div className="contact-info-item"><div className="ic">👤</div><div><h5>Muthuram P</h5><p><a href={`tel:${s.phone4.replace(/\s/g, "")}`}>{s.phone4}</a></p></div></div>
              <div className="contact-info-item"><div className="ic">✉️</div><div><h5>Email</h5><p>{s.email}</p></div></div>
              <div className="contact-info-item"><div className="ic">🕒</div><div><h5>Working Hours</h5><p>{s.hours}</p></div></div>
              <div className="contact-info-item"><div className="ic">🟢</div><div><h5>WhatsApp</h5><p>{s.whatsapp} — fastest response for order enquiries</p></div></div>
            </div>
            <div className="cta-row" style={{ marginTop: 24 }}>
              <WhatsAppCta className="btn btn-wa">Message on WhatsApp</WhatsAppCta>
              <a className="btn btn-primary" href={`tel:${s.phone.replace(/\s/g, "")}`}>Call Now</a>
            </div>
          </div>
          <div className="map-box">
            <iframe src={s.mapEmbed} loading="lazy" title="Sri Pathra Pyro World location map" />
          </div>
        </div>
      </section>
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <ContactForm
            loggedIn={loggedIn}
            name={loggedIn ? session?.user?.name || "" : ""}
            phone={loggedIn ? session?.user?.phone || "" : ""}
          />
        </div>
      </section>
    </>
  );
}
