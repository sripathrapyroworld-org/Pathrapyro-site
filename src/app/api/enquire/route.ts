import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { resetCustomerQuote } from "@/lib/cart-quote";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { cartTotals, formatInr, waLink } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Please log in to enquire." }, { status: 401 });
  }
  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    getSettings(),
  ]);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 401 });

  const body = await req.json();
  const kind = String(body.kind || "general");

  let interest = "WhatsApp enquiry";
  let notes = "";
  let source = "WhatsApp";
  const lines: string[] = [`Hi, this is ${user.name} (${user.phone}).`];

  if (kind === "cart") {
    const items = (body.items || []) as { name: string; qty: number; sale: number; mrp: number; cat?: string }[];
    if (!items.length) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    const totals = cartTotals(
      items.map((i, idx) => ({
        key: String(idx),
        kind: "product" as const,
        id: String(idx),
        name: i.name,
        cat: i.cat || "",
        mrp: i.mrp || i.sale,
        sale: i.sale,
        img: "",
        qty: i.qty,
      })),
      { gstPercent: settings.gstPercent, feesPending: true }
    );
    source = "Cart Enquiry";
    interest = `Cart enquiry · ${totals.count} items · ${formatInr(totals.subtotal)} (excl. packing & shipping)`;
    notes = items.map((i) => `${i.name} × ${i.qty} = ${formatInr(i.sale * i.qty)}`).join("\n");
    notes += `\nSubtotal ${formatInr(totals.subtotal)}`;
    if (totals.gstPercent) notes += `\nEst. GST ${totals.gstPercent}% ${formatInr(totals.gstAmount)}`;
    notes += `\nPacking & shipping: to be quoted by admin`;
    lines.push("I would like to enquire about the items in my cart:");
    for (const i of items) lines.push(`• ${i.name} × ${i.qty} — ${formatInr(i.sale * i.qty)}`);
    lines.push(`Subtotal: ${formatInr(totals.subtotal)}`);
    if (totals.gstAmount) lines.push(`Est. GST (${totals.gstPercent}%): ${formatInr(totals.gstAmount)}`);
    lines.push("Please share packing and shipping charges for my order.");
    await resetCustomerQuote(user.id);
  } else if (kind === "product") {
    const name = String(body.name || "Product").trim();
    const qty = Math.max(1, Number(body.qty) || 1);
    const sale = Number(body.sale) || 0;
    source = "Product Enquiry";
    interest = name;
    notes = `${name} × ${qty}${sale ? ` @ ${formatInr(sale)}` : ""}\nPacking & shipping: to be quoted by admin`;
    lines.push(`I would like to enquire about: ${name} (qty ${qty}${sale ? `, ${formatInr(sale)} each` : ""}).`);
    lines.push("Please share packing and shipping charges for this order.");
  } else {
    const message = String(body.message || "Hi, I want to enquire about crackers").trim();
    interest = message.slice(0, 180);
    notes = message;
    lines.push(message);
  }

  await prisma.lead.create({
    data: {
      userId: user.id,
      name: user.name,
      phone: user.phone,
      interest,
      source,
      status: "new",
      notes,
    },
  });
  revalidateTag("leads");
  revalidateTag("carts");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${user.id}`);
  revalidatePath("/account/enquiries");

  return NextResponse.json({
    ok: true,
    message: "Enquiry saved. Our team will confirm packing & shipping charges shortly.",
    url: waLink(settings.whatsapp, lines.join("\n")),
  });
}
