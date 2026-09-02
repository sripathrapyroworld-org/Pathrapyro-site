import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeOrderPayment } from "@/lib/order-payment";
import { razorpayConfigured, verifyRazorpaySignature } from "@/lib/razorpay";

/** Legacy Razorpay verification — kept for any in-flight online payments. New orders use offline payment + admin confirmation. */
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
    if (order.paymentStatus !== "paid") {
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "paid" } });
      await finalizeOrderPayment(order.id);
    }
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
  await finalizeOrderPayment(order.id);
  return NextResponse.json({ orderNumber: order.orderNumber });
}
