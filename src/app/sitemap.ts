import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, PUBLIC_STATIC_ROUTES } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      select: { slug: true, products: { where: { active: true }, select: { updatedAt: true } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_STATIC_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/shop" ? 0.9 : 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/product/${p.slug}`),
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug !== "combo-packs")
    .map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      lastModified: c.products.reduce(
        (latest, p) => (p.updatedAt > latest ? p.updatedAt : latest),
        new Date(0)
      ),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
