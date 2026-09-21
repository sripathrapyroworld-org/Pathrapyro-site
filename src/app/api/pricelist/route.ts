import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getActiveOffers, priceProduct } from "@/lib/offers";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, categories, offers] = await Promise.all([
    getSettings(),
    prisma.category.findMany({
      where: { slug: { not: "combo-packs" } },
      orderBy: { sortOrder: "asc" },
      include: {
        subCategories: { orderBy: { sortOrder: "asc" } },
        products: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: { images: { take: 1 } },
        },
      },
    }),
    getActiveOffers(),
  ]);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize = { width: 595.28, height: 841.89 };
  let page = pdf.addPage([pageSize.width, pageSize.height]);
  let y = pageSize.height - 48;
  const left = 40;
  const maroon = rgb(0.48, 0.08, 0.15);
  const dark = rgb(0.12, 0.1, 0.14);
  const muted = rgb(0.35, 0.32, 0.38);

  function newPage() {
    page = pdf.addPage([pageSize.width, pageSize.height]);
    y = pageSize.height - 48;
  }

  function ensure(space: number) {
    if (y < space) newPage();
  }

  function text(str: string, x: number, size: number, f = font, color = dark) {
    page.drawText(str, { x, y, size, font: f, color });
  }

  text(settings.businessName, left, 16, bold, maroon);
  y -= 18;
  text("Product Price List", left, 12, bold);
  y -= 14;
  text(`Generated ${new Date().toLocaleDateString("en-IN")} · GST ${settings.gstPercent}% · License ${settings.license}`, left, 9, font, muted);
  y -= 22;

  for (const cat of categories) {
    if (!cat.products.length) continue;
    ensure(60);
    text(`${cat.emoji} ${cat.name}`.replace(/[^\x00-\x7F]/g, ""), left, 12, bold, maroon);
    y -= 16;

    const groups: { title: string; products: typeof cat.products }[] = [];
    for (const sub of cat.subCategories) {
      const list = cat.products.filter((p) => p.subCategoryId === sub.id);
      if (list.length) groups.push({ title: sub.name, products: list });
    }
    const rest = cat.products.filter((p) => !p.subCategoryId || !cat.subCategories.some((s) => s.id === p.subCategoryId));
    if (rest.length) groups.push({ title: groups.length ? "Other items" : "", products: rest });

    for (const group of groups) {
      if (group.title) {
        ensure(40);
        text(group.title, left, 10, bold);
        y -= 14;
      }
      for (const raw of group.products) {
        const priced = priceProduct(raw, offers);
        ensure(18);
        const name = priced.name.slice(0, 42);
        text(name, left, 9);
        text(`MRP ${priced.mrp}`, left + 280, 9, font, muted);
        text(`Rs.${priced.effectiveSale}`, left + 360, 9, bold);
        y -= 14;
      }
      y -= 8;
    }
    y -= 8;
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sri-pathra-pyro-pricelist.pdf"`,
    },
  });
}
