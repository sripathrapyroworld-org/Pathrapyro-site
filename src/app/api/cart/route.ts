import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { resolveCartLines } from "@/lib/checkout";
import { cartQuoteKey, resetCustomerQuote } from "@/lib/cart-quote";
import { prisma } from "@/lib/prisma";
import type { CartLine } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ items: [] });
  }
  const rows = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { images: true, category: true } } },
  });
  const raw = rows
    .map((r) => {
      if (r.product) return { kind: "product" as const, id: r.product.id, qty: r.qty };
      if (r.comboId) return { kind: "combo" as const, id: r.comboId, qty: r.qty };
      return null;
    })
    .filter(Boolean) as { kind: "product" | "combo"; id: string; qty: number }[];

  const { lines } = await resolveCartLines(raw);
  return NextResponse.json({ items: lines });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ ok: true });
  }
  const { items } = (await req.json()) as { items: CartLine[] };
  const nextKey = cartQuoteKey(
    (items || []).map((i) => ({
      kind: i.kind,
      id: i.id,
      qty: i.qty,
    }))
  );

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { quoteReady: true, quoteCartKey: true },
  });
  if (user?.quoteReady && user.quoteCartKey && user.quoteCartKey !== nextKey) {
    await resetCustomerQuote(session.user.id);
  }

  await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
  for (const i of items || []) {
    await prisma.cartItem.create({
      data: {
        userId: session.user.id,
        productId: i.kind === "product" ? i.id : null,
        comboId: i.kind === "combo" ? i.id : null,
        qty: i.qty,
      },
    });
  }
  revalidateTag("carts");
  revalidatePath("/admin/customers");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return NextResponse.json({ ok: true });
}
