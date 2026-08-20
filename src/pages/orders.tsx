import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PageHead } from "@/components/seo/page-head";
import { useAuth } from "@/hooks/use-auth";
import { getMyOrders } from "@/services/api";
import type { Order } from "@/types";
import { formatPrice, formatVariantLabel } from "@/utils/format";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    getMyOrders()
      .then((res) => setOrders(res.data || []))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <>
        <PageHead title="Orders" noindex path="/orders" />
        <p className="py-24 text-center text-sm text-neutral-500">Loading…</p>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
      <PageHead title="Orders" noindex path="/orders" />
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        ← Back to account
      </Link>
      <h1 className="mt-4 font-display text-4xl text-neutral-900">Orders</h1>
      <p className="mt-2 text-sm text-neutral-500">Your purchase history.</p>

      {orders.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-neutral-500">No orders yet.</p>
          <Link href="/shop" className="mt-4 inline-block text-sm underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-neutral-200 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {order.status === "PENDING" && order.paymentProvider === "bank_transfer"
                      ? "AWAITING CONFIRMATION"
                      : order.status}
                  </Badge>
                  <p className="font-medium">{formatPrice(order.total)}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-neutral-600">
                {order.items.map((item) => {
                  const variant = formatVariantLabel(item.variantAttributes);
                  return (
                    <p key={item.id}>
                      {item.product?.name || "Product"}
                      {variant ? (
                        <span className="text-neutral-500"> · {variant}</span>
                      ) : null}{" "}
                      × {item.quantity}
                    </p>
                  );
                })}
                {(order.shippingMethod || Number(order.shipping) > 0) && (
                  <p className="pt-2 text-neutral-500">
                    {order.shippingMethod || "Shipping"}
                    {Number(order.shipping) === 0
                      ? " · Free"
                      : ` · ${formatPrice(order.shipping)}`}
                  </p>
                )}
                {order.shippingAddress && (
                  <div className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-600">
                    <p className="font-medium text-neutral-800">Ship to</p>
                    <p className="mt-1">
                      {order.shippingAddress.name}
                      {(order.shippingAddress.phone || order.customerPhone) &&
                        ` · ${order.shippingAddress.phone || order.customerPhone}`}
                    </p>
                    <p>{order.shippingAddress.address}</p>
                    <p>
                      {[
                        order.shippingAddress.city,
                        order.shippingAddress.state,
                        order.shippingAddress.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
