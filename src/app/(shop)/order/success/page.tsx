import Link from "next/link";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return (
    <section>
      <div className="wrap" style={{ maxWidth: 640, textAlign: "center" }}>
        <div className="card static" style={{ padding: 40 }}>
          <div style={{ fontSize: "3rem" }}>🎉</div>
          <h1 style={{ marginTop: 12 }}>Order Placed</h1>
          <p style={{ color: "var(--cream-dim)", marginTop: 12 }}>
            Thank you. Your payment was received
            {id ? <> and your order ID is <strong style={{ color: "var(--gold-2)" }}>{id}</strong></> : null}.
          </p>
          <div className="order-success-actions">
            {id && (
              <Link className="btn btn-primary" href={`/track/${id}`}>
                Track this order
              </Link>
            )}
            {id && (
              <a className="btn btn-outline" href={`/api/orders/${id}/invoice`}>
                Download invoice PDF
              </a>
            )}
            <Link className="btn btn-outline" href="/account/orders">
              My orders
            </Link>
            <Link className="btn btn-ghost" href="/shop">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
