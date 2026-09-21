import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatInr, formatOrderChannel, isOfflineOrder, mediaUrl, SHIPMENT_STEPS } from "@/lib/utils";
import { updateShipment } from "@/app/admin/actions";
import { PaymentStatusForm } from "@/components/payment-status-form";
import { OrderChargesForm } from "@/components/order-charges-form";
import { OrderWhatsAppButton } from "@/components/order-whatsapp-button";
import Link from "next/link";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      shipment: { include: { events: { orderBy: { createdAt: "asc" } }, photos: { orderBy: { createdAt: "desc" } } } },
    },
  });
  if (!order) notFound();
  const status = order.shipment?.status || "placed";

  return (
    <div style={{ display: "grid", gap: 22, gridTemplateColumns: "1.1fr 0.9fr" }} className="editor-split">
      <div>
        <div className="card panel static">
          <div className="panel-head">
            <h3>{order.orderNumber}</h3>
            <div className="order-doc-actions">
              <OrderWhatsAppButton
                order={{
                  orderNumber: order.orderNumber,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  total: order.total,
                  packingCharge: order.packingCharge,
                  shippingCharge: order.shippingCharge,
                  paymentStatus: order.paymentStatus,
                  items: order.items.map((i) => ({
                    name: i.name,
                    qty: i.qty,
                    salePrice: i.salePrice,
                  })),
                }}
              />
              <a className="btn btn-sm btn-primary" href={`/api/orders/${order.id}/invoice`}>
                Invoice PDF
              </a>
              <a className="btn btn-sm btn-outline" href={`/api/admin/orders/${order.id}/checklist`}>
                Checklist PDF
              </a>
              <Link href={`/admin/orders/${order.id}/invoice`} className="btn btn-sm btn-outline">
                Preview
              </Link>
            </div>
          </div>
          <p>{order.customerName} · {order.customerPhone}</p>
          <p className="cell-sub">{order.address}, {order.pincode}</p>
          <p style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className={`pill ${order.paymentStatus}`}>{order.paymentStatus}</span>
            <span className={`pill ${isOfflineOrder(order.channel) ? "contacted" : "new"}`}>
              {formatOrderChannel(order.channel)}
            </span>
          </p>
          <PaymentStatusForm orderId={order.id} current={order.paymentStatus} />
          <OrderChargesForm
            orderId={order.id}
            packingCharge={order.packingCharge}
            shippingCharge={order.shippingCharge}
            subtotal={order.subtotal}
            gstAmount={order.gstAmount}
          />
          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table className="data">
              <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}<div className="cell-sub">{i.category}</div></td>
                    <td>{i.qty}</td>
                    <td>{formatInr(i.salePrice * i.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="summary-line" style={{ marginTop: 12 }}>
            <span>Subtotal</span><span className="amt">{formatInr(order.subtotal)}</span>
          </div>
          {order.gstAmount > 0 && (
            <div className="summary-line">
              <span>GST ({order.gstPercent}%)</span><span className="amt">{formatInr(order.gstAmount)}</span>
            </div>
          )}
          <div className="summary-line">
            <span>Packing</span><span className="amt">{formatInr(order.packingCharge)}</span>
          </div>
          <div className="summary-line">
            <span>Shipping</span><span className="amt">{formatInr(order.shippingCharge)}</span>
          </div>
          <div className="summary-line total">
            <span>Total</span><span className="amt">{formatInr(order.total)}</span>
          </div>
        </div>
        <div className="card panel static" style={{ marginTop: 18 }}>
          <h3>Tracking photos</h3>
          <div className="track-photos">
            {order.shipment?.photos.map((p) => (
              <figure key={p.id}>
                <img src={mediaUrl(p.path)} alt={p.caption} />
                <figcaption>{p.caption || p.stage}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
      <form
        className="card form-card static"
        action={async (fd) => {
          "use server";
          await updateShipment(fd);
        }}
      >
        <h3>Update delivery</h3>
        <input type="hidden" name="orderId" value={order.id} />
        <p className="cell-sub" style={{ margin: "8px 0 14px" }}>Current: {status.replace("_", " ")}</p>
        <div className="stepper">
          {SHIPMENT_STEPS.map((s) => (
            <label key={s.key} className={`chip-f${status === s.key ? " active" : ""}`} style={{ cursor: "pointer" }}>
              <input type="radio" name="status" value={s.key} defaultChecked={status === s.key} style={{ display: "none" }} />
              {s.label}
            </label>
          ))}
          <label className={`chip-f${status === "cancelled" ? " active" : ""}`}>
            <input type="radio" name="status" value="cancelled" defaultChecked={status === "cancelled"} style={{ display: "none" }} />
            Cancelled
          </label>
        </div>
        <div className="field">
          <label>Note</label>
          <textarea name="note" rows={2} placeholder="Courier name, AWB, packing remarks…" />
        </div>
        <div className="field">
          <label>Photo caption</label>
          <input name="caption" placeholder="Packaging / courier docket / vehicle" />
        </div>
        <div className="field">
          <label>Upload images (packaging, courier, etc.)</label>
          <input type="file" name="photos" accept="image/*" multiple />
        </div>
        <button className="btn btn-primary" style={{ marginTop: 12 }}>Save tracking update</button>
      </form>
    </div>
  );
}
