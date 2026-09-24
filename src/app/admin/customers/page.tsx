import Link from "next/link";
import { CustomerRowActions } from "@/components/customer-editor";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/utils";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      cartItems: true,
      orders: { select: { id: true, total: true, paymentStatus: true } },
      leads: { select: { id: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <div className="toolbar">
        <form className="search-box2">
          <input name="q" defaultValue={q} placeholder="Search name, phone, or email…" />
        </form>
        <p className="cell-sub" style={{ margin: 0 }}>
          {customers.length} customers
        </p>
      </div>
      <div className="card table-wrap static">
        <table className="data">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Cart</th>
              <th>Last cart update</th>
              <th>Orders</th>
              <th>Enquiries</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const cartQty = c.cartItems.reduce((s, i) => s + i.qty, 0);
              let lastCart: Date | null = null;
              for (const item of c.cartItems) {
                if (!lastCart || item.updatedAt > lastCart) lastCart = item.updatedAt;
              }
              const openLeads = c.leads.filter((l) => l.status === "new" || l.status === "contacted").length;
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/customers/${c.id}`}>{c.name}</Link>
                    <div className="cell-sub">
                      {c.phone}
                      {c.email ? ` · ${c.email}` : ""}
                    </div>
                  </td>
                  <td>
                    {cartQty > 0 ? (
                      <span className="pill new">{cartQty} items</span>
                    ) : (
                      <span className="cell-sub">Empty</span>
                    )}
                  </td>
                  <td>
                    <span className="cell-sub">{lastCart ? lastCart.toLocaleString("en-IN") : "—"}</span>
                  </td>
                  <td>
                    {c.orders.length}
                    {c.orders.some((o) => o.paymentStatus === "paid") && (
                      <div className="cell-sub">
                        {formatInr(c.orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0))} paid
                      </div>
                    )}
                  </td>
                  <td>
                    {openLeads > 0 ? <span className="pill new">{openLeads} open</span> : c.leads.length || "—"}
                  </td>
                  <td>
                    <CustomerRowActions customer={{ id: c.id, name: c.name }} />
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6}>No customers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
