import { revalidatePath, revalidateTag } from "next/cache";
import { resetCustomerQuote } from "@/lib/cart-quote";
import { prisma } from "@/lib/prisma";

/** Confirm payment received — update shipment, decrement stock, clear cart. */
export async function finalizeOrderPayment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shipment: true },
  });
  if (!order) return;

  if (order.shipment && order.shipment.status === "placed") {
    await prisma.shipment.update({
      where: { id: order.shipment.id },
      data: { status: "confirmed", note: "Payment received" },
    });
    await prisma.shipmentEvent.create({
      data: {
        shipmentId: order.shipment.id,
        status: "confirmed",
        note: "Payment received — order confirmed for processing",
      },
    });
  }

  for (const item of order.items) {
    if (item.kind === "product" && item.refId) {
      await prisma.product.update({
        where: { id: item.refId },
        data: { stock: { decrement: item.qty } },
      });
    }
  }

  if (order.userId) {
    await prisma.cartItem.deleteMany({ where: { userId: order.userId } });
    await resetCustomerQuote(order.userId);
    revalidateTag("carts");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/admin/customers");
  }
}
