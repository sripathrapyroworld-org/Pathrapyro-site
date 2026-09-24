import { notFound } from "next/navigation";
import { CategoryProductsClient } from "@/components/category-products-client";
import { SubCategoryManager } from "@/components/subcategory-manager";
import { coverPath } from "@/lib/product-map";
import { prisma } from "@/lib/prisma";

export default async function CategoryProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!category) notFound();

  const [products, subCategories] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: id },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        subCategory: { select: { id: true, name: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.subCategory.findMany({
      where: { categoryId: id },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  return (
    <>
      <SubCategoryManager
        categoryId={category.id}
        subCategories={subCategories.map((s) => ({
          id: s.id,
          name: s.name,
          sortOrder: s.sortOrder,
          productCount: s._count.products,
        }))}
      />
      <CategoryProductsClient
        category={category}
        subCategories={subCategories.map((s) => ({
          id: s.id,
          name: s.name,
          sortOrder: s.sortOrder,
        }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          mrp: p.mrp,
          salePrice: p.salePrice,
          stock: p.stock,
          cover: coverPath(p),
          subCategoryId: p.subCategoryId,
          subCategoryName: p.subCategory?.name || null,
          sortOrder: p.sortOrder,
        }))}
      />
    </>
  );
}
