import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { privatePageMetadata } from "@/lib/seo";
import { AdminLogout } from "@/components/admin-logout";
import { AdminShell } from "@/components/admin-shell";

export const metadata = privatePageMetadata;

const getNewLeadCount = unstable_cache(
  async () => prisma.lead.count({ where: { status: "new" } }),
  ["admin-new-leads"],
  { revalidate: 30, tags: ["leads"] }
);

const getCartCustomerCount = unstable_cache(
  async () =>
    prisma.user.count({
      where: { role: "CUSTOMER", cartItems: { some: {} } },
    }),
  ["admin-cart-customers"],
  { revalidate: 15, tags: ["carts"] }
);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, leadCount, cartCustomerCount] = await Promise.all([
    auth(),
    getNewLeadCount(),
    getCartCustomerCount(),
  ]);
  return (
    <AdminShell
      adminName={session?.user?.name || "Admin"}
      leadCount={leadCount}
      cartCustomerCount={cartCustomerCount}
      logout={<AdminLogout />}
    >
      {children}
    </AdminShell>
  );
}
