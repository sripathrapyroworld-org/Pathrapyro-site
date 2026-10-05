import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cartTotals, type CartLine } from "@/lib/utils";

type ManualItem = {
  kind: "product" | "combo";
  id: string;
  name?: string;
  category?: string;
  mrp?: number;
  sale?: number;
  qty: number;
};

async function buildLines(rawItems: ManualItem[], deductStock: boolean) {
  const lines: CartLine[] = [];
  for (const item of rawItems) {
    const qty = Math.max(1, Math.round(Number(item.qty) || 0));
    if (!qty) continue;
    if (item.kind === "combo") {
      const combo = await prisma.comboPack.findUnique({ where: { id: item.id } });
      if (!combo) {
        return { error: `Combo not found: ${item.name || item.id}` as string };
      }
      lines.push({
        kind: "combo",
        id: combo.id,
        name: combo.name,
        cat: "Combo Pack",
        mrp: combo.mrp,
        sale: Math.max(0, Math.round(Number(item.sale ?? combo.salePrice) || 0)),
        img: combo.imagePath || "",
        qty,
        key: `combo:${combo.id}`,
      });
      continue;
    }

    const product = await prisma.product.findUnique({
      where: { id: item.id },
      include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) {
      // Keep custom/orphaned line from existing bill
      const name = String(item.name || "").trim();
      if (!name) return { error: `Product not found: ${item.id}` as string };
      lines.push({
        kind: "product",
        id: item.id,
        name,
        cat: String(item.category || "Product"),
        mrp: Math.max(0, Math.round(Number(item.mrp) || 0)),
        sale: Math.max(0, Math.round(Number(item.sale) || 0)),
        img: "",
        qty,
        key: `product:${item.id}`,
      });
      continue;
    }
    if (deductStock && product.stock < qty) {
      // Stock check against absolute qty is done after delta calc in PUT; for POST keep as-is
    }
    lines.push({
      kind: "product",
      id: product.id,
      name: product.name,
      cat: product.category.name,
      mrp: product.mrp,
      sale: Math.max(0, Math.round(Number(item.sale ?? product.salePrice) || 0)),
      img: product.images.find((i) => i.isCover)?.path || product.images[0]?.path || "",
      qty,
      key: `product:${product.id}`,
    });
  }
  if (!lines.length) return { error: "Add at least one product." as string };
  return { lines };
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const body = await req.json();
  const customer = body.customer as {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    pincode?: string;
  };
  const rawItems = (body.items || []) as ManualItem[];
  const name = String(customer?.name || "").trim();
  const phone = String(customer?.phone || "").trim();
  if (!name || !phone) {
    return NextResponse.json({ error: "Customer name and phone are required." }, { status: 400 });
  }
  if (!rawItems.length) {
    return NextResponse.json({ error: "Add at least one product." }, { status: 400 });
  }

  const deductStock = Boolean(body.deductStock);
  const paymentStatus = body.paymentStatus === "pending" ? "pending" : "paid";
  const packingCharge = Math.max(0, Math.round(Number(body.packingCharge) || 0));
  const shippingCharge = Math.max(0, Math.round(Number(body.shippingCharge) || 0));
  const gstPercent = Math.max(0, Number(body.gstPercent) || 0);

  const built = await buildLines(rawItems, deductStock);
  if ("error" in built && built.error) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }
  const lines = built.lines!;

  if (deductStock) {
    const prevQty = new Map<string, number>();
    for (const item of existing.items) {
      if (item.kind !== "product" || !item.refId) continue;
      prevQty.set(item.refId, (prevQty.get(item.refId) || 0) + item.qty);
    }
    const nextQty = new Map<string, number>();
    for (const line of lines) {
      if (line.kind !== "product") continue;
      nextQty.set(line.id, (nextQty.get(line.id) || 0) + line.qty);
    }
    const ids = new Set([...prevQty.keys(), ...nextQty.keys()]);
    for (const productId of ids) {
      const delta = (nextQty.get(productId) || 0) - (prevQty.get(productId) || 0);
      if (delta <= 0) continue;
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, stock: true } });
      if (!product) continue;
      if (product.stock < delta) {
        return NextResponse.json(
          { error: `${product.name} needs ${delta} more units but only ${product.stock} in stock.` },
          { status: 400 }
        );
      }
    }
  }

  const totals = cartTotals(lines, { gstPercent, packingCharge, shippingCharge });
  const address = String(customer?.address || "").trim() || existing.address || "Counter sale / pickup";
  const pincode = String(customer?.pincode || "").trim() || existing.pincode || "000000";

  const prevQty = new Map<string, number>();
  for (const item of existing.items) {
    if (item.kind !== "product" || !item.refId) continue;
    prevQty.set(item.refId, (prevQty.get(item.refId) || 0) + item.qty);
  }
  const nextQty = new Map<string, number>();
  for (const line of lines) {
    if (line.kind !== "product") continue;
    nextQty.set(line.id, (nextQty.get(line.id) || 0) + line.qty);
  }

  await prisma.orderItem.deleteMany({ where: { orderId: id } });
  await prisma.order.update({
    where: { id },
    data: {
      customerName: name,
      customerPhone: phone,
      customerEmail: String(customer?.email || "").trim() || null,
      address,
      pincode,
      subtotal: totals.subtotal,
      savings: totals.savings,
      gstPercent: totals.gstPercent,
      gstAmount: totals.gstAmount,
      packingCharge: totals.packingCharge,
      shippingCharge: totals.shippingCharge,
      total: totals.total,
      paymentStatus,
      items: {
        create: lines.map((i) => ({
          kind: i.kind,
          refId: i.id,
          name: i.name,
          category: i.cat,
          imagePath: i.img,
          mrp: i.mrp,
          salePrice: i.sale,
          qty: i.qty,
        })),
      },
    },
  });

  if (deductStock) {
    const ids = new Set([...prevQty.keys(), ...nextQty.keys()]);
    for (const productId of ids) {
      const delta = (nextQty.get(productId) || 0) - (prevQty.get(productId) || 0);
      if (!delta) continue;
      const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (!exists) continue;
      await prisma.product.update({
        where: { id: productId },
        data: { stock: delta > 0 ? { decrement: delta } : { increment: Math.abs(delta) } },
      });
    }
  }

  revalidatePath("/admin/sales");
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/admin/orders/${id}/edit`);

  return NextResponse.json({ ok: true, orderId: id, orderNumber: existing.orderNumber });
}
