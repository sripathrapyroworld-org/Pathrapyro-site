import { auth } from "@/auth";
import { CheckoutForm } from "@/components/checkout-form";
import { currentCustomerCartKey, quoteAppliesForCart } from "@/lib/cart-quote";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    redirect("/login?from=/checkout");
  }

  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      phone: true,
      email: true,
      address: true,
      pincode: true,
      quoteReady: true,
      quoteCartKey: true,
    },
  });
  if (!u) redirect("/login?from=/checkout");

  const cartKey = await currentCustomerCartKey(session.user.id);
  if (!quoteAppliesForCart(u, cartKey)) redirect("/cart?quote=pending");

  const prefill = {
    name: u.name,
    phone: u.phone || "",
    email: u.email || "",
    address: u.address || "",
    pincode: u.pincode || "",
  };

  return <CheckoutForm prefill={prefill} loggedIn />;
}
