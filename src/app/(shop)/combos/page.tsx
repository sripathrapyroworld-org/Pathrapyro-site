import type { Metadata } from "next";
import Link from "next/link";
import { ComboCard } from "@/components/combo-card";
import { breadcrumbSchema, SeoJsonLd } from "@/components/seo-json-ld";
import { fetchPricedCombos } from "@/lib/catalog";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { comboItemsAsLabels } from "@/lib/combo-items";

export const metadata: Metadata = buildMetadata({
  title: "Sivakasi Crackers Combo Packs",
  description:
    "Sivakasi crackers combo packs at bulk value prices. Curated Diwali assortments — ideal for families and wholesale enquiries. Buy Sivakasi fireworks online in bundled packs.",
  path: "/combos",
});

export default async function CombosPage() {
  const combos = await fetchPricedCombos();
  return (
    <>
      <SeoJsonLd
        data={breadcrumbSchema([
          { name: "Home", path: absoluteUrl("/") },
          { name: "Combo Packs", path: absoluteUrl("/combos") },
        ])}
      />
      <div className="page-hero">
        <div className="wrap">
          <div className="crumb">Home / <span>Combo Packs</span></div>
          <div className="eyebrow">Bundled & Best Value</div>
          <h1>Sivakasi Crackers Combo Packs</h1>
          <p>
            Curated tiers built for every family size and budget — bulk value for retail and wholesale enquiries.
            Each pack shows exactly what&apos;s included.{" "}
            <Link href="/shop">Shop individual Sivakasi fireworks online</Link>.
          </p>
        </div>
      </div>
      <section style={{ paddingTop: 40 }}>
        <div className="wrap grid-3">
          {combos.map((c) => (
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
      </section>
    </>
  );
}
