import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { resolveCartLines } from "@/lib/checkout";
import { cartQuoteKey, quoteAppliesForCart, resetCustomerQuote } from "@/lib/cart-quote";
import { prisma } from "@/lib/prisma";
import { getRazorpay, razorpayConfigured } from "@/lib/razorpay";
import { getSettings } from "@/lib/settings";
import { cartTotals, nextOrderNumber } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Please log in to checkout." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 401 });

  const body = await req.json();
  const customer = body.customer as {
    name: string;
    phone: string;
    email?: string;
    address: string;
    pincode: string;
  };
  const rawItems = (body.items || []) as { kind: "product" | "combo"; id: string; qty: number }[];
  if (!customer?.name || !customer?.phone || !customer?.address || !customer?.pincode) {
    return NextResponse.json({ error: "Please fill all delivery details." }, { status: 400 });
  }

  const cartKey = cartQuoteKey(rawItems);
  if (!quoteAppliesForCart(user, cartKey)) {
    return NextResponse.json(
      {
        error:
          "Please enquire about your current cart first. Our team must confirm packing and shipping for this order.",
      },
      { status: 403 }
    );
  }

  const { lines: items, error } = await resolveCartLines(rawItems);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const settings = await getSettings();
  const totals = cartTotals(items, {
    gstPercent: settings.gstPercent,
    packingCharge: user.packingCharge,
    shippingCharge: user.shippingCharge,
  });
  const last = await prisma.order.findFirst({ orderBy: { createdAt: "desc" }, select: { orderNumber: true } });
  const orderNumber = nextOrderNumber(last?.orderNumber);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: session.user.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || null,
      address: customer.address,
      pincode: customer.pincode,
      subtotal: totals.subtotal,
      savings: totals.savings,
      gstPercent: totals.gstPercent,
      gstAmount: totals.gstAmount,
      packingCharge: totals.packingCharge,
      shippingCharge: totals.shippingCharge,
      total: totals.total,
      paymentStatus: "pending",
      channel: "Website",
      items: {
        create: items.map((i) => ({
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
      shipment: {
        create: {
          status: "placed",
          events: { create: { status: "placed", note: "Order created, awaiting payment" } },
        },
      },
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: customer.name,
      address: customer.address,
      pincode: customer.pincode,
      ...(customer.email ? { email: customer.email } : {}),
    },
  });

  await resetCustomerQuote(session.user.id);
  revalidateTag("carts");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/admin/customers");

  const amountPaise = totals.total * 100;

  if (!razorpayConfigured()) {
    return NextResponse.json({
      demo: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: amountPaise,
    });
  }

  const rzp = getRazorpay();
  const rzOrder = await rzp.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: order.orderNumber,
  });
  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: rzOrder.id },
  });

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId: rzOrder.id,
    amount: rzOrder.amount,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
