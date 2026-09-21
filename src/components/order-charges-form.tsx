import { updateOrderCharges } from "@/app/admin/actions";
import { formatInr } from "@/lib/utils";

export function OrderChargesForm({
  orderId,
  packingCharge,
  shippingCharge,
  subtotal,
  gstAmount,
}: {
  orderId: string;
  packingCharge: number;
  shippingCharge: number;
  subtotal: number;
  gstAmount: number;
}) {
  const preview = subtotal + gstAmount + packingCharge + shippingCharge;
  return (
    <form
      className="payment-status-form"
      action={async (fd) => {
        "use server";
        await updateOrderCharges(fd);
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <strong style={{ display: "block", marginBottom: 6 }}>Packing &amp; shipping</strong>
      <p className="cell-sub" style={{ marginBottom: 10 }}>
        Add charges after the customer places an order. Current items + GST: {formatInr(subtotal + gstAmount)}.
      </p>
      <div className="form-row two">
        <div className="field">
          <label htmlFor={`pack-${orderId}`}>Packing (₹)</label>
          <input id={`pack-${orderId}`} name="packingCharge" type="number" min={0} step={1} defaultValue={packingCharge} />
        </div>
        <div className="field">
          <label htmlFor={`ship-${orderId}`}>Shipping (₹)</label>
          <input id={`ship-${orderId}`} name="shippingCharge" type="number" min={0} step={1} defaultValue={shippingCharge} />
        </div>
      </div>
      <p className="cell-sub">Preview total with current values: {formatInr(preview)} (updates after save).</p>
      <button className="btn btn-sm btn-primary" type="submit" style={{ marginTop: 8 }}>
        Save charges
      </button>
    </form>
  );
}
