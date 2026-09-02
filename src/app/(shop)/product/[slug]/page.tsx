import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { breadcrumbSchema, productSchema, SeoJsonLd } from "@/components/seo-json-ld";
import { fetchPricedProductBySlug, fetchPricedProducts, toPricedCard } from "@/lib/catalog";
import { absoluteUrl, buildMetadata, SITE_NAME, truncateDescription } from "@/lib/seo";
import { mediaUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchPricedProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return buildMetadata({
    title: `${product.name} — Sivakasi Crackers Price`,
    description: truncateDescription(
      `${product.name} — ${product.category.name} crackers from Sivakasi. Sale price ₹${product.effectiveSale}. ${product.description} Buy online at ${SITE_NAME}.`
    ),
    path: `/product/${slug}`,
    image: mediaUrl(product.images[0]?.path),
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchPricedProductBySlug(slug);
  if (!product) notFound();

  const related = await fetchPricedProducts({
    categoryId: product.categoryId,
    id: { not: product.id },
  });

  const productUrl = absoluteUrl(`/product/${product.slug}`);
  const imageUrl = absoluteUrl(mediaUrl(product.images[0]?.path));

  return (
    <>
      <SeoJsonLd
        data={[
          productSchema({
            name: product.name,
            description: product.description,
            url: productUrl,
            image: imageUrl,
            sku: product.slug,
            category: product.category.name,
            price: product.effectiveSale,
            inStock: product.stock > 0,
            brand: SITE_NAME,
          }),
          breadcrumbSchema([
            { name: "Home", path: absoluteUrl("/") },
            { name: "Shop", path: absoluteUrl("/shop") },
            { name: product.category.name, path: absoluteUrl(`/category/${product.category.slug}`) },
            { name: product.name, path: productUrl },
          ]),
        ]}
      />
      <ProductDetail
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          cat: product.category.name,
          mrp: product.mrp,
          sale: product.effectiveSale,
          stock: product.stock,
          images: product.images.map((i) => ({ path: i.path, alt: i.alt || product.name })),
        }}
        related={related.slice(0, 4).map(toPricedCard)}
      />
    </>
  );
}
