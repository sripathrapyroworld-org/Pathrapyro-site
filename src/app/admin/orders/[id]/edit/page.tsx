import Link from "next/link";
import { notFound } from "next/navigation";
import { ManualBillForm } from "@/components/manual-bill-form";
import { getActiveOffers, priceCombo, priceProduct } from "@/lib/offers";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { isOfflineOrder } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadCatalog() {
  const [products, combos, offers] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.comboPack.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    getActiveOffers(),
  ]);

  return [
    ...products.map((p) => {
      const priced = priceProduct(p, offers);
      return {
        kind: "product" as const,
        id: p.id,
        name: p.name,
        category: p.category.name,
        mrp: p.mrp,
        sale: priced.effectiveSale,
        stock: p.stock,
      };
    }),
    ...combos.map((c) => {
      const priced = priceCombo(c, offers);
      return {
        kind: "combo" as const,
        id: c.id,
        name: c.name,
        category: "Combo Pack",
        mrp: c.mrp,
        sale: priced.effectiveSale,
      };
    }),
  ];
}

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings, catalog] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: true },
    }),
    getSettings(),
    loadCatalog(),
  ]);
  if (!order) notFound();

  const lines = order.items.map((item) => ({
    kind: (item.kind === "combo" ? "combo" : "product") as "product" | "combo",
    id: item.refId || item.id,
    name: item.name,
    category: item.category,
    mrp: item.mrp,
    sale: item.salePrice,
    qty: item.qty,
  }));

  return (
    <div className="customer-detail">
      <Link href={`/admin/orders/${order.id}`} className="customer-back">
        ← Back to order
      </Link>
      <div className="panel-head" style={{ marginBottom: 8 }}>
        <h2 className="page-title" style={{ margin: 0 }}>
          Edit {isOfflineOrder(order.channel) ? "manual bill" : "order"} {order.orderNumber}
        </h2>
      </div>
      <p className="page-sub" style={{ marginBottom: 18 }}>
        Update customer details, products, rates, and charges. Invoice and checklist will reflect the saved changes.
      </p>
      <ManualBillForm
        catalog={catalog}
        gstPercent={settings.gstPercent}
        initial={{
          orderId: order.id,
          orderNumber: order.orderNumber,
          customer: {
            name: order.customerName,
            phone: order.customerPhone,
            email: order.customerEmail || "",
            address: order.address === "Counter sale / pickup" ? "" : order.address,
            pincode: order.pincode === "000000" ? "" : order.pincode,
          },
          lines,
          packingCharge: order.packingCharge,
          shippingCharge: order.shippingCharge,
          gstPercent: order.gstPercent,
          paymentStatus: order.paymentStatus === "pending" ? "pending" : "paid",
        }}
      />
    </div>
  );
}
