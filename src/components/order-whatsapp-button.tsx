import { formatInr, waLink } from "@/lib/utils";

type OrderWa = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  packingCharge: number;
  shippingCharge: number;
  paymentStatus: string;
  items: { name: string; qty: number; salePrice: number }[];
};

export function OrderWhatsAppButton({ order }: { order: OrderWa }) {
  const lines = [
    `Namaste ${order.customerName},`,
    "",
    `Your order *${order.orderNumber}* from Sri Pathra Pyro World is confirmed.`,
    "",
    "Items:",
    ...order.items.map((i) => `• ${i.name} × ${i.qty} = ${formatInr(i.salePrice * i.qty)}`),
    "",
    order.packingCharge > 0 ? `Packing: ${formatInr(order.packingCharge)}` : null,
    order.shippingCharge > 0 ? `Shipping: ${formatInr(order.shippingCharge)}` : null,
    `Total: *${formatInr(order.total)}*`,
    `Payment status: ${order.paymentStatus}`,
    "",
    "Please complete payment (UPI / bank transfer / cash) as discussed. Thank you!",
    "— Sri Pathra Pyro World",
  ].filter(Boolean) as string[];

  const href = waLink(order.customerPhone, lines.join("\n"));

  return (
    <a className="btn btn-sm btn-wa" href={href} target="_blank" rel="noreferrer">
      WhatsApp confirmation
    </a>
  );
}
