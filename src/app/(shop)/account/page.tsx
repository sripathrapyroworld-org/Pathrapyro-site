import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountNav } from "@/components/account-nav";
import { ProfileForm } from "@/components/profile-form";
import { formatInr } from "@/lib/utils";
import { cartQuoteKey, quoteAppliesForCart } from "@/lib/cart-quote";
import { resolveCartLinesAdmin } from "@/lib/checkout";
import { cartTotals } from "@/lib/utils";
import { getSettings } from "@/lib/settings";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") redirect("/login?from=/account");
  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { cartItems: true },
    }),
    getSettings(),
  ]);
  if (!user) redirect("/login");

  const raw = user.cartItems
    .map((r) => {
      if (r.productId) return { kind: "product" as const, id: r.productId, qty: r.qty };
      if (r.comboId) return { kind: "combo" as const, id: r.comboId, qty: r.qty };
      return null;
    })
    .filter(Boolean) as { kind: "product" | "combo"; id: string; qty: number }[];
  const { lines } = raw.length ? await resolveCartLinesAdmin(raw) : { lines: [] };
  const cartKey = cartQuoteKey(raw);
  const quoteApplies = quoteAppliesForCart(user, cartKey);
  const totals = cartTotals(lines, {
    gstPercent: settings.gstPercent,
    feesPending: !quoteApplies,
    packingCharge: user.packingCharge,
    shippingCharge: user.shippingCharge,
  });

  return (
    <section>
      <div className="wrap account-grid">
        <AccountNav />
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card form-card static">
            <h2>My Account</h2>
            <p style={{ color: "var(--cream-dim)", margin: "10px 0 20px" }}>Hello, {user.name}</p>
            <ProfileForm
              name={user.name}
              phone={user.phone}
              email={user.email || ""}
              address={user.address || ""}
              pincode={user.pincode || ""}
            />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
              style={{ marginTop: 20 }}
            >
              <button className="btn btn-outline">Log out</button>
            </form>
          </div>
          <div className="card static" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Current cart</h3>
            {lines.length === 0 ? (
              <p style={{ color: "var(--cream-dim)" }}>
                Your cart is empty. <Link href="/shop">Browse products</Link>
              </p>
            ) : (
              <>
                <p style={{ color: "var(--cream-dim)", marginBottom: 10 }}>
                  {totals.count} items · {formatInr(totals.total)}
                  {totals.feesPending ? " (excl. packing & shipping)" : ""}
                </p>
                <ul style={{ marginBottom: 14, color: "var(--cream-dim)", fontSize: "0.9rem" }}>
                  {lines.slice(0, 5).map((l) => (
                    <li key={l.key}>
                      {l.name} × {l.qty}
                    </li>
                  ))}
                </ul>
                <Link className="btn btn-primary" href="/cart">
                  View cart
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
