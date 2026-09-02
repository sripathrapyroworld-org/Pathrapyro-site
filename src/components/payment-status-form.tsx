import { updateOrderPayment } from "@/app/admin/actions";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
] as const;

export function PaymentStatusForm({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  return (
    <form
      className="payment-status-form"
      action={async (fd) => {
        "use server";
        await updateOrderPayment(fd);
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <label htmlFor={`pay-${orderId}`}>Payment status</label>
      <div className="payment-status-row">
        <select
          id={`pay-${orderId}`}
          name="paymentStatus"
          className="admin-select"
          defaultValue={current}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="btn btn-sm btn-primary" type="submit">
          Update
        </button>
      </div>
      {current === "pending" && (
        <p className="cell-sub">Mark as paid once UPI / bank transfer / cash payment is received — order will move to confirmed for processing.</p>
      )}
    </form>
  );
}
