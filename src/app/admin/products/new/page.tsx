import { ProductEditor } from "@/components/product-editor";
import { prisma } from "@/lib/prisma";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const categories = await prisma.category.findMany({
    where: { slug: { not: "combo-packs" } },
    orderBy: { sortOrder: "asc" },
    include: { subCategories: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true } } },
  });
  return (
    <ProductEditor
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        subCategories: c.subCategories,
      }))}
      defaultCategoryId={cat && categories.some((c) => c.id === cat) ? cat : undefined}
    />
  );
}
