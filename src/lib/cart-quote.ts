import type { CartLine } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export type CartQuoteInput = { kind: string; id: string; qty: number };

export function cartQuoteKey(items: CartQuoteInput[]) {
  return items
    .filter((i) => i.qty > 0)
    .map((i) => `${i.kind}:${i.id}:${i.qty}`)
    .sort()
    .join("|");
}

export function cartQuoteKeyFromLines(items: CartLine[]) {
  return cartQuoteKey(items.map((i) => ({ kind: i.kind, id: i.id, qty: i.qty })));
}

export function quoteAppliesForCart(
  user: { quoteReady: boolean; quoteCartKey: string },
  cartKey: string
) {
  return Boolean(user.quoteReady && user.quoteCartKey && cartKey && user.quoteCartKey === cartKey);
}

export async function resetCustomerQuote(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      quoteReady: false,
      packingCharge: 0,
      shippingCharge: 0,
      quoteCartKey: "",
    },
  });
}

export async function getCustomerCartQuoteInputs(userId: string): Promise<CartQuoteInput[]> {
  const rows = await prisma.cartItem.findMany({ where: { userId } });
  return rows
    .map((r) => {
      if (r.productId) return { kind: "product", id: r.productId, qty: r.qty };
      if (r.comboId) return { kind: "combo", id: r.comboId, qty: r.qty };
      return null;
    })
    .filter(Boolean) as CartQuoteInput[];
}

export async function currentCustomerCartKey(userId: string) {
  return cartQuoteKey(await getCustomerCartQuoteInputs(userId));
}
