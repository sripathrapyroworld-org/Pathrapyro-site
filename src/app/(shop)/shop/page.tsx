import { ShopCatalog } from "@/components/shop-catalog";
import { breadcrumbSchema, SeoJsonLd } from "@/components/seo-json-ld";
import { fetchPricedProducts } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Buy Sivakasi Crackers Online",
  description:
    "Shop all Sivakasi crackers online at factory-direct prices. Browse by category and subcategory, check Sivakasi crackers price, and place your order.",
  path: "/shop",
});

export default async function ShopPage() {
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

  const catalogProducts = products.map((p) => {
    const cover = p.images.find((i) => i.isCover) || p.images[0];
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      cat: p.category.name,
      mrp: p.mrp,
      sale: p.effectiveSale,
      img: cover?.path || "",
      subCategoryId: p.subCategoryId,
      subCategoryName: p.subCategory?.name || null,
      subCategorySort: p.subCategory?.sortOrder ?? 9999,
      sortOrder: p.sortOrder,
    };
  });

  return (
    <>
      <SeoJsonLd
        data={breadcrumbSchema([
          { name: "Home", path: absoluteUrl("/") },
          { name: "Shop", path: absoluteUrl("/shop") },
        ])}
      />
      <ShopCatalog
        products={catalogProducts}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          sortOrder: c.sortOrder,
          subCategories: c.subCategories,
        }))}
      />
    </>
  );
}
