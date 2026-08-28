import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerQuoteForm } from "@/components/customer-quote-form";
import { LeadStatusForm } from "@/components/lead-status-form";
import { prisma } from "@/lib/prisma";
import { resolveCartLinesAdmin } from "@/lib/checkout";
import { cartQuoteKey, quoteAppliesForCart } from "@/lib/cart-quote";
import { getSettings } from "@/lib/settings";
import { cartTotals, formatInr, mediaUrl, waLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U"
  );
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer, settings] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: "CUSTOMER" },
      include: {
        cartItems: true,
        orders: { include: { items: true, shipment: true }, orderBy: { createdAt: "desc" } },
        leads: { orderBy: { createdAt: "desc" } },
      },
    }),
    getSettings(),
  ]);
  if (!customer) notFound();

  const raw = customer.cartItems
    .map((r) => {
      if (r.productId) return { kind: "product" as const, id: r.productId, qty: r.qty };
      if (r.comboId) return { kind: "combo" as const, id: r.comboId, qty: r.qty };
      return null;
    })
    .filter(Boolean) as { kind: "product" | "combo"; id: string; qty: number }[];

  const { lines, warnings } = raw.length ? await resolveCartLinesAdmin(raw) : { lines: [], warnings: [] };
  const cartKey = cartQuoteKey(raw);
  const quoteApplies = quoteAppliesForCart(customer, cartKey);
  const cartQty = customer.cartItems.reduce((s, i) => s + i.qty, 0);
  const totals = cartTotals(lines, {
    gstPercent: settings.gstPercent,
    packingCharge: customer.packingCharge,
    shippingCharge: customer.shippingCharge,
    feesPending: !quoteApplies,
  });
  const openEnquiries = customer.leads.filter((l) => l.status === "new" || l.status === "contacted").length;
  const paidOrders = customer.orders.filter((o) => o.paymentStatus === "paid").length;

  return (
    <div className="customer-detail">
      <Link href="/admin/customers" className="customer-back">
        ← Back to customers
      </Link>

      <section className="card panel static customer-hero">
        <div className="customer-hero-top">
          <div className="customer-hero-id">
            <div className="customer-avatar">{initials(customer.name)}</div>
            <div>
              <h2 className="customer-name">{customer.name}</h2>
              <p className="customer-contact">
                <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                {customer.email && (
                  <>
                    {" · "}
                    <a href={`mailto:${customer.email}`}>{customer.email}</a>
                  </>
                )}
              </p>
              <p className="cell-sub">
                {customer.address ? `${customer.address}${customer.pincode ? ` · ${customer.pincode}` : ""}` : "No address on file"}
              </p>
              <p className="cell-sub">Joined {customer.createdAt.toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          <a className="btn btn-wa btn-sm" href={waLink(customer.phone)} target="_blank" rel="noreferrer">
            WhatsApp customer
          </a>
        </div>
        <div className="customer-kpis">
          <div className="customer-kpi">
            <strong>{cartQty}</strong>
            <span>Cart items</span>
          </div>
          <div className="customer-kpi">
            <strong>{customer.orders.length}</strong>
            <span>Orders</span>
          </div>
          <div className="customer-kpi">
            <strong>{openEnquiries}</strong>
            <span>Open enquiries</span>
          </div>
          <div className="customer-kpi">
            <strong>{paidOrders}</strong>
            <span>Paid orders</span>
          </div>
        </div>
      </section>

      <section className="card panel static customer-section">
        <div className="customer-section-head">
          <h3>Quote &amp; checkout</h3>
          <span className={`pill ${quoteApplies ? "converted" : customer.quoteReady ? "contacted" : "new"}`}>
            {quoteApplies ? "Checkout enabled" : customer.quoteReady ? "Cart changed — re-approve" : "Awaiting quote"}
          </span>
        </div>
        <p className="cell-sub" style={{ marginBottom: 14 }}>
          Set packing and shipping for this customer after reviewing their enquiry. Enable checkout when the quote is
          confirmed.
        </p>
        <CustomerQuoteForm
          customer={{
            id: customer.id,
            packingCharge: customer.packingCharge,
            shippingCharge: customer.shippingCharge,
            quoteReady: quoteApplies,
          }}
          subtotal={totals.subtotal}
          gstPercent={totals.gstPercent}
          gstAmount={totals.gstAmount}
        />
      </section>

      <section className="card panel static customer-section">
        <div className="customer-section-head">
          <h3>Live cart</h3>
          {cartQty > 0 && <span className="pill new">{cartQty} items</span>}
        </div>

        {lines.length === 0 ? (
          <p className="cell-sub customer-empty">
            {cartQty > 0
              ? "Cart has saved items but they could not be loaded. Check the product catalogue."
              : "This customer has not added anything to their cart yet."}
          </p>
        ) : (
          <div className="customer-cart-layout">
            <div className="customer-cart-items">
              {warnings.length > 0 && (
                <div className="alert error customer-warn">{warnings.join(" · ")}</div>
              )}
              {lines.map((i) => (
                <div className="customer-cart-row" key={i.key}>
                  <img src={mediaUrl(i.img)} alt="" className="customer-cart-thumb" />
                  <div className="customer-cart-info">
                    <strong>{i.name}</strong>
                    <span className="cell-sub">{i.cat}</span>
                  </div>
                  <div className="customer-cart-qty">Qty {i.qty}</div>
                  <div className="customer-cart-amt">{formatInr(i.sale * i.qty)}</div>
                </div>
              ))}
            </div>
            <aside className="customer-cart-totals">
              <h4>Estimated total</h4>
              <div className="customer-total-rows">
                <div className="customer-total-row">
                  <span>{totals.count} items</span>
                  <span>{formatInr(totals.subtotal)}</span>
                </div>
                {totals.savings > 0 && (
                  <div className="customer-total-row">
                    <span>Savings</span>
                    <span>{formatInr(totals.savings)}</span>
                  </div>
                )}
                {totals.gstAmount > 0 && (
                  <div className="customer-total-row">
                    <span>GST ({totals.gstPercent}%)</span>
                    <span>{formatInr(totals.gstAmount)}</span>
                  </div>
                )}
                {totals.packingCharge > 0 && (
                  <div className="customer-total-row">
                    <span>Packing</span>
                    <span>{formatInr(totals.packingCharge)}</span>
                  </div>
                )}
                {totals.shippingCharge > 0 && (
                  <div className="customer-total-row">
                    <span>Shipping</span>
                    <span>{formatInr(totals.shippingCharge)}</span>
                  </div>
                )}
                {totals.feesPending && (
                  <div className="customer-total-row">
                    <span>Packing &amp; shipping</span>
                    <span className="cell-sub">Not quoted yet</span>
                  </div>
                )}
                <div className="customer-total-row grand">
                  <span>Grand total</span>
                  <strong>{formatInr(totals.total)}</strong>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>

      <div className="customer-split">
        <section className="card panel static customer-section">
          <div className="customer-section-head">
            <h3>Orders</h3>
            <span className="cell-sub">{customer.orders.length} total</span>
          </div>
          {customer.orders.length === 0 ? (
            <p className="cell-sub customer-empty">No orders yet.</p>
          ) : (
            <div className="customer-order-list">
              {customer.orders.map((o) => (
                <article className="customer-order-card" key={o.id}>
                  <div>
                    <strong>{o.orderNumber}</strong>
                    <div className="cell-sub">{o.createdAt.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="customer-order-meta">
                    <span>{formatInr(o.total)}</span>
                    <span className={`pill ${o.paymentStatus}`}>{o.paymentStatus}</span>
                    <span className={`pill ${o.shipment?.status || "placed"}`}>{o.shipment?.status || "placed"}</span>
                  </div>
                  <div className="customer-order-actions">
                    <Link className="btn btn-sm btn-outline" href={`/admin/orders/${o.id}`}>
                      View
                    </Link>
                    <a className="btn btn-sm btn-outline" href={`/api/orders/${o.id}/invoice`}>
                      Invoice
                    </a>
                    <a className="btn btn-sm btn-outline" href={`/api/admin/orders/${o.id}/checklist`}>
                      Checklist
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card panel static customer-section">
          <div className="customer-section-head">
            <h3>Enquiries</h3>
            <span className="cell-sub">{customer.leads.length} total</span>
          </div>
          {customer.leads.length === 0 ? (
            <p className="cell-sub customer-empty">No enquiries yet.</p>
          ) : (
            <div className="enquiry-cards">
              {customer.leads.map((l) => (
                <article className="enquiry-card" key={l.id}>
                  <div className="enquiry-card-head">
                    <span className={`pill ${l.status}`}>{l.source}</span>
                    <time className="cell-sub">{l.createdAt.toLocaleString("en-IN")}</time>
                  </div>
                  <h4 className="enquiry-title">{l.interest}</h4>
                  {l.notes && <pre className="enquiry-notes">{l.notes}</pre>}
                  <LeadStatusForm lead={l} />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
