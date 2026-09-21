import { prisma } from "@/lib/prisma";
import { getActiveOffers, priceCombo, priceProduct } from "@/lib/offers";
import { coverPath, type ProductWithRelations } from "@/lib/product-map";

const productListInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  category: true,
  subCategory: true,
};

const productDetailInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  category: true,
  subCategory: true,
};

export async function fetchPricedProducts(extraWhere: Record<string, unknown> = {}) {
  const [products, offers] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, ...extraWhere },
      include: productListInclude,
      orderBy: [{ sortOrder: "asc" }, { popularity: "desc" }],
    }),
    getActiveOffers(),
  ]);
  return products.map((p) => priceProduct(p, offers));
}

export async function fetchPricedProductBySlug(slug: string) {
  const [product, offers] = await Promise.all([
    prisma.product.findUnique({ where: { slug }, include: productDetailInclude }),
    getActiveOffers(),
  ]);
  if (!product || !product.active) return null;
  return priceProduct(product, offers);
}

export async function fetchPricedCombos(extraWhere: Record<string, unknown> = {}) {
  const [combos, offers] = await Promise.all([
    prisma.comboPack.findMany({
      where: { active: true, ...extraWhere },
      orderBy: { sortOrder: "asc" },
    }),
    getActiveOffers(),
  ]);
  return combos.map((c) => priceCombo(c, offers));
}

export function toPricedCard(
  p: ProductWithRelations & {
    effectiveSale: number;
    subCategoryId?: string | null;
    subCategory?: { name: string; sortOrder: number } | null;
    sortOrder?: number;
  }
) {
  const cover = p.images.find((i) => i.isCover) || p.images[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    cat: p.category.name,
    mrp: p.mrp,
    sale: p.effectiveSale,
    img: cover?.path || "",
    subCategoryId: p.subCategoryId ?? null,
    subCategoryName: p.subCategory?.name || null,
    subCategorySort: p.subCategory?.sortOrder ?? 9999,
    sortOrder: p.sortOrder ?? 0,
  };
}

export { coverPath };
