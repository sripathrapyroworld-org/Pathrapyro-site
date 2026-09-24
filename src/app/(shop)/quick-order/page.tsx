import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop-catalog";
import { breadcrumbSchema, SeoJsonLd } from "@/components/seo-json-ld";
import { fetchPricedProducts, toPricedCard } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Quick Order — Buy Sivakasi Crackers",
  description:
    "Fast bulk order table for Sivakasi crackers and fireworks. Enter quantities, add to cart, and place your order online.",
  path: "/quick-order",
});

export default async function QuickOrderPage() {
  const [products, categories] = await Promise.all([
    fetchPricedProducts(),
    prisma.category.findMany({
      where: { slug: { not: "combo-packs" } },
      orderBy: { sortOrder: "asc" },
      include: {
        subCategories: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, sortOrder: true } },
      },
    }),
  ]);

  return (
    <>
      <SeoJsonLd
        data={breadcrumbSchema([
          { name: "Home", path: absoluteUrl("/") },
          { name: "Quick Order", path: absoluteUrl("/quick-order") },
        ])}
      />
      <ShopCatalog
        products={products.map(toPricedCard)}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          sortOrder: c.sortOrder,
          subCategories: c.subCategories,
        }))}
        eyebrow="Fast Checkout"
        title="Quick Order — Shop All Products"
        description="Same categorized shop list with live totals. Set quantities and submit your whole order in minutes."
      />
    </>
  );
}
