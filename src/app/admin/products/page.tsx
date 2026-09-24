import { CategoryManager } from "@/components/category-manager";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const categories = await prisma.category.findMany({
    where: { slug: { not: "combo-packs" } },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      coverPath: true,
      sortOrder: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <CategoryManager
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        coverPath: c.coverPath,
        sortOrder: c.sortOrder,
        productCount: c._count.products,
      }))}
    />
  );
}
