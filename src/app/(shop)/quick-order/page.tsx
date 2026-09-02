import type { Metadata } from "next";
import { QuickOrderTable } from "@/components/quick-order-table";
import { breadcrumbSchema, SeoJsonLd } from "@/components/seo-json-ld";
import { fetchPricedProducts, toPricedCard } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Quick Order — Buy Sivakasi Crackers",
  description:
    "Fast bulk order table for Sivakasi crackers and fireworks. Enter quantities, add to cart, and enquire — buy Sivakasi crackers online with factory-direct Sivakasi crackers price.",
  path: "/quick-order",
});

export default async function QuickOrderPage() {
  const [products, cats] = await Promise.all([
    fetchPricedProducts(),
    prisma.category.findMany({
      where: { slug: { not: "combo-packs" } },
      orderBy: { sortOrder: "asc" },
      select: { name: true },
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
      <QuickOrderTable products={products.map(toPricedCard)} categories={cats.map((c) => c.name)} />
    </>
  );
}
