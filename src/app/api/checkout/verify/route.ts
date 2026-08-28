import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { resetCustomerQuote } from "@/lib/cart-quote";
import { prisma } from "@/lib/prisma";
import { razorpayConfigured, verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  const body = await req.json();
  const order = await prisma.order.findUnique({
    where: { id: body.orderId },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (body.demo) {
    if (razorpayConfigured()) {
      return NextResponse.json({ error: "Demo pay is disabled when Razorpay keys are set." }, { status: 400 });
    }
    await markPaid(order.id, order.userId, order.items);
    return NextResponse.json({ orderNumber: order.orderNumber });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "failed" } });
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    },
  });
  await markPaid(order.id, order.userId, order.items);
  return NextResponse.json({ orderNumber: order.orderNumber });
}

async function markPaid(
  orderId: string,
  userId: string,
  items: { kind: string; refId: string | null; qty: number }[]
) {
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "paid" } });
  const shipment = await prisma.shipment.findUnique({ where: { orderId } });
  if (shipment) {
    await prisma.shipment.update({ where: { id: shipment.id }, data: { status: "confirmed" } });
    await prisma.shipmentEvent.create({
      data: { shipmentId: shipment.id, status: "confirmed", note: "Payment received" },
    });
  }
  for (const item of items) {
    if (item.kind === "product" && item.refId) {
      await prisma.product.update({
        where: { id: item.refId },
        data: { stock: { decrement: item.qty } },
      });
    }
  }
  await prisma.cartItem.deleteMany({ where: { userId } });
  await resetCustomerQuote(userId);
  revalidateTag("carts");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/admin/customers");
}
