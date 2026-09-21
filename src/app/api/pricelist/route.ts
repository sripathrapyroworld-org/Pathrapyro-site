import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getActiveOffers, priceProduct } from "@/lib/offers";

export const dynamic = "force-dynamic";

function ascii(str: string) {
  return str.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

function inferContent(name: string, description: string) {
  const src = `${name} ${description}`.toLowerCase();
  if (/\bpkt\b|\bpacket\b/.test(src)) return "1 Pkt";
  if (/\bbox\b/.test(src)) return "1 Box";
  if (/\bdozen\b/.test(src)) return "1 Doz";
  if (/\bpiece\b|\bpcs\b|\bno\b/.test(src)) return "1 Pcs";
  return "1 Box";
}

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
        },
      },
    }),
    getActiveOffers(),
  ]);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize = { width: 595.28, height: 841.89 };
  const margin = 28;
  const tableLeft = margin;
  const tableRight = pageSize.width - margin;
  const cols = {
    code: 28,
    name: 52,
    content: 220,
    rate: 268,
    discount: 318,
    final: 378,
    qty: 438,
    amount: 488,
  };
  const colEnds = [cols.name, cols.content, cols.rate, cols.discount, cols.final, cols.qty, cols.amount, tableRight];

  let logo;
  try {
    const logoBytes = await readFile(path.join(process.cwd(), "public", "images", "logo.png"));
    logo = await pdf.embedPng(logoBytes);
  } catch {
    logo = undefined;
  }

  let page = pdf.addPage([pageSize.width, pageSize.height]);
  let y = pageSize.height - 36;
  let code = 1;

  const black = rgb(0.08, 0.08, 0.08);
  const headerBg = rgb(0.72, 0.72, 0.72);
  const catBg = rgb(0.82, 0.8, 0.92);
  const line = rgb(0.15, 0.15, 0.15);

  function newPage() {
    page = pdf.addPage([pageSize.width, pageSize.height]);
    y = pageSize.height - 36;
    drawHeader();
    drawTableHead();
  }

  function ensure(space: number) {
    if (y < space) newPage();
  }

  function drawText(str: string, x: number, size: number, f = font, color = black) {
    page.drawText(ascii(str), { x, y, size, font: f, color });
  }

  function drawHeader() {
    if (logo) {
      const maxH = 46;
      const scale = maxH / logo.height;
      const w = logo.width * scale;
      const h = logo.height * scale;
      page.drawImage(logo, { x: margin, y: y - h + 8, width: w, height: h });
    }

    const centerX = pageSize.width / 2;
    const title = ascii(settings.businessName).toUpperCase();
    const titleSize = 16;
    const titleWidth = bold.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
      x: centerX - titleWidth / 2,
      y: y - 2,
      size: titleSize,
      font: bold,
      color: black,
    });
    y -= 18;

    const address = ascii(settings.address);
    const addrSize = 8;
    const addrWidth = font.widthOfTextAtSize(address, addrSize);
    page.drawText(address, {
      x: Math.max(margin + 70, centerX - addrWidth / 2),
      y,
      size: addrSize,
      font,
      color: black,
    });
    y -= 12;

    const contact = ascii(`E-mail: ${settings.email}    Phone: ${settings.phone}`);
    const contactWidth = font.widthOfTextAtSize(contact, 8);
    page.drawText(contact, {
      x: Math.max(margin + 70, centerX - contactWidth / 2),
      y,
      size: 8,
      font,
      color: black,
    });
    y -= 16;

    page.drawLine({
      start: { x: margin, y: y + 6 },
      end: { x: tableRight, y: y + 6 },
      thickness: 1,
      color: line,
    });
    const pl = "PRICE LIST";
    const plW = bold.widthOfTextAtSize(pl, 12);
    page.drawText(pl, { x: centerX - plW / 2, y: y - 4, size: 12, font: bold, color: black });
    page.drawLine({
      start: { x: margin, y: y - 10 },
      end: { x: tableRight, y: y - 10 },
      thickness: 1,
      color: line,
    });
    y -= 22;

    const meta = ascii(
      `GSTIN: ${settings.gstin}   ·   License: ${settings.license}   ·   Date: ${new Date().toLocaleDateString("en-IN")}`
    );
    page.drawText(meta, { x: margin, y, size: 7.5, font, color: black });
    y -= 14;
  }

  function drawTableHead() {
    const rowH = 18;
    page.drawRectangle({
      x: tableLeft,
      y: y - rowH + 4,
      width: tableRight - tableLeft,
      height: rowH,
      color: headerBg,
      borderColor: line,
      borderWidth: 0.6,
    });
    const headers: [string, number][] = [
      ["Product Code", cols.code],
      ["Product Name", cols.name],
      ["Content", cols.content],
      ["Rate / Qty", cols.rate],
      ["Discount", cols.discount],
      ["Final Rate", cols.final],
      ["Quantity", cols.qty],
      ["Amount", cols.amount],
    ];
    for (const [label, x] of headers) {
      page.drawText(label, { x: x + 3, y: y - 8, size: 7, font: bold, color: black });
    }
    // vertical lines
    for (const x of colEnds) {
      page.drawLine({
        start: { x, y: y + 4 },
        end: { x, y: y - rowH + 4 },
        thickness: 0.5,
        color: line,
      });
    }
    y -= rowH;
  }

  function drawCategoryRow(label: string) {
    ensure(36);
    const rowH = 16;
    page.drawRectangle({
      x: tableLeft,
      y: y - rowH + 4,
      width: tableRight - tableLeft,
      height: rowH,
      color: catBg,
      borderColor: line,
      borderWidth: 0.6,
    });
    const text = ascii(label);
    const w = bold.widthOfTextAtSize(text, 8);
    page.drawText(text, {
      x: (pageSize.width - w) / 2,
      y: y - 7,
      size: 8,
      font: bold,
      color: black,
    });
    y -= rowH;
  }

  function drawProductRow(opts: {
    code: number;
    name: string;
    content: string;
    rate: number;
    discount: number;
    final: number;
  }) {
    ensure(22);
    const rowH = 14;
    page.drawRectangle({
      x: tableLeft,
      y: y - rowH + 4,
      width: tableRight - tableLeft,
      height: rowH,
      borderColor: line,
      borderWidth: 0.5,
    });
    for (const x of colEnds) {
      page.drawLine({
        start: { x, y: y + 4 },
        end: { x, y: y - rowH + 4 },
        thickness: 0.4,
        color: line,
      });
    }
    const cells: [string, number, boolean?][] = [
      [String(opts.code), cols.code + 6],
      [ascii(opts.name).slice(0, 34), cols.name + 3],
      [opts.content, cols.content + 6],
      [String(opts.rate), cols.rate + 8],
      [String(opts.discount), cols.discount + 10],
      [String(opts.final), cols.final + 10],
      ["", cols.qty],
      ["", cols.amount],
    ];
    for (const [text, x] of cells) {
      if (!text) continue;
      page.drawText(text, { x, y: y - 6, size: 7, font, color: black });
    }
    y -= rowH;
  }

  drawHeader();
  drawTableHead();

  for (const cat of categories) {
    if (!cat.products.length) continue;
    const groups: { title: string; products: typeof cat.products }[] = [];
    for (const sub of cat.subCategories) {
      const list = cat.products.filter((p) => p.subCategoryId === sub.id);
      if (list.length) groups.push({ title: `${cat.name} / ${sub.name}`, products: list });
    }
    const rest = cat.products.filter(
      (p) => !p.subCategoryId || !cat.subCategories.some((s) => s.id === p.subCategoryId)
    );
    if (rest.length) {
      groups.push({
        title: groups.length ? `${cat.name} / Other items` : cat.name,
        products: rest,
      });
    }

    for (const group of groups) {
      const sample = group.products[0];
      const pricedSample = sample ? priceProduct(sample, offers) : null;
      const pct =
        pricedSample && pricedSample.mrp > 0
          ? Math.round(((pricedSample.mrp - pricedSample.effectiveSale) / pricedSample.mrp) * 100)
          : 0;
      drawCategoryRow(pct > 0 ? `${group.title} (${pct}% Discount)` : group.title);

      for (const raw of group.products) {
        const priced = priceProduct(raw, offers);
        const discountAmt = Math.max(0, priced.mrp - priced.effectiveSale);
        drawProductRow({
          code: code++,
          name: priced.name,
          content: inferContent(priced.name, priced.description || ""),
          rate: priced.mrp,
          discount: discountAmt,
          final: priced.effectiveSale,
        });
      }
    }
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sri-pathra-pyro-pricelist.pdf"`,
    },
  });
}
