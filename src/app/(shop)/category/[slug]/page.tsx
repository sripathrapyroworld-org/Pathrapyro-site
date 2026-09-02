import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopBrowser } from "@/components/shop-browser";
import { breadcrumbSchema, itemListSchema, SeoJsonLd } from "@/components/seo-json-ld";
import { fetchPricedProducts, toPricedCard } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, buildMetadata, truncateDescription } from "@/lib/seo";
import { mediaUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Category Not Found" };

  return buildMetadata({
    title: `${category.name} Crackers Sivakasi`,
    description: truncateDescription(
      `${category.description} Buy ${category.name.toLowerCase()} crackers online from Sivakasi at factory-direct Sivakasi crackers price.`
    ),
    path: `/category/${slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const products = await fetchPricedProducts({ categoryId: category.id });
  const cards = products.map(toPricedCard);
  const categoryUrl = absoluteUrl(`/category/${category.slug}`);

  return (
    <>
      <SeoJsonLd
        data={[
          itemListSchema({
            name: `${category.name} — Sivakasi Crackers`,
            url: categoryUrl,
            items: cards.map((p) => ({
              name: p.name,
              url: absoluteUrl(`/product/${p.slug}`),
              image: absoluteUrl(mediaUrl(p.img)),
            })),
          }),
          breadcrumbSchema([
            { name: "Home", path: absoluteUrl("/") },
            { name: "Shop", path: absoluteUrl("/shop") },
            { name: category.name, path: categoryUrl },
          ]),
        ]}
      />
      <ShopBrowser
        title={category.name}
        eyebrow="Category"
        desc={`${category.description} Browse all Sivakasi crackers online at our shop for more fireworks and price options.`}
        initialCat={category.name}
        products={cards}
        categories={[{ name: category.name, slug: category.slug, count: products.length }]}
      />
    </>
  );
}
