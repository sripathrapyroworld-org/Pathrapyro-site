import { saveCustomerQuote } from "@/app/admin/actions";
import { formatInr } from "@/lib/utils";

type CustomerQuote = {
  id: string;
  packingCharge: number;
  shippingCharge: number;
  quoteReady: boolean;
};

export function CustomerQuoteForm({
  customer,
  subtotal,
  gstPercent,
  gstAmount,
}: {
  customer: CustomerQuote;
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
}) {
  const quotedTotal = subtotal + gstAmount + customer.packingCharge + customer.shippingCharge;

  return (
    <form
      className="customer-quote-form"
      action={async (fd) => {
        "use server";
        await saveCustomerQuote(fd);
      }}
    >
      <input type="hidden" name="userId" value={customer.id} />
      <div className="form-row two">
        <div className="field">
          <label>Packing charge (₹)</label>
          <input
            name="packingCharge"
            type="number"
            min={0}
            step={1}
            defaultValue={customer.packingCharge}
          />
        </div>
        <div className="field">
          <label>Shipping charge (₹)</label>
          <input
            name="shippingCharge"
            type="number"
            min={0}
            step={1}
            defaultValue={customer.shippingCharge}
          />
        </div>
      </div>
      <label className="customer-quote-check">
        <input type="checkbox" name="quoteReady" defaultChecked={customer.quoteReady} />
        <span>Allow customer to place order (quote confirmed)</span>
      </label>
      <p className="cell-sub customer-quote-preview">
        Quoted total for current cart: {formatInr(quotedTotal)} (incl. GST {gstPercent}%)
      </p>
      <button className="btn btn-primary btn-sm" type="submit">
        Save quote
      </button>
    </form>
  );
}
