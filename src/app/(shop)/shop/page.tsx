import type { Metadata } from "next";
import { ShopBrowser } from "@/components/shop-browser";
import { breadcrumbSchema, itemListSchema, SeoJsonLd } from "@/components/seo-json-ld";
import { fetchPricedProducts, toPricedCard } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { mediaUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Buy Sivakasi Crackers Online",
  description:
    "Shop all Sivakasi crackers online at factory-direct prices. Crackers online Sivakasi — browse 500+ fireworks, check Sivakasi crackers price, enquire and order for Tamil Nadu delivery.",
  path: "/shop",
});

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    fetchPricedProducts(),
    prisma.category.findMany({
      where: { slug: { not: "combo-packs" } },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  const cards = products.map(toPricedCard);

  return (
    <>
      <SeoJsonLd
        data={[
          itemListSchema({
            name: "Sivakasi Crackers Online",
            url: absoluteUrl("/shop"),
            items: cards.map((p) => ({
              name: p.name,
              url: absoluteUrl(`/product/${p.slug}`),
              image: absoluteUrl(mediaUrl(p.img)),
            })),
          }),
          breadcrumbSchema([
            { name: "Home", path: absoluteUrl("/") },
            { name: "Shop", path: absoluteUrl("/shop") },
          ]),
        ]}
      />
      <ShopBrowser
        title="Sivakasi Crackers Online — Shop All Fireworks"
        eyebrow="Full Catalogue"
        desc="Buy Sivakasi crackers online at the best price. Browse original Sivakasi fireworks, filter by category, and add to cart — enquire for packing, shipping and final Sivakasi crackers price."
        products={cards}
        categories={categories.map((c) => ({ name: c.name, slug: c.slug, count: c._count.products }))}
      />
    </>
  );
}
