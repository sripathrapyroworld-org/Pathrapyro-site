import type { Metadata } from "next";
import { auth } from "@/auth";
import { CheckoutForm } from "@/components/checkout-form";
import { prisma } from "@/lib/prisma";
import { privatePageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata: Metadata = privatePageMetadata;

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
    },
  });
  if (!u) redirect("/login?from=/checkout");

  const prefill = {
    name: u.name,
    phone: u.phone || "",
    email: u.email || "",
    address: u.address || "",
    pincode: u.pincode || "",
  };

  return <CheckoutForm prefill={prefill} loggedIn />;
}
