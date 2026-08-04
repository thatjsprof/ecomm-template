import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAdminOrders, updateOrderStatus } from "@/services/api";
import type { Order, OrderStatus, Pagination } from "@/types";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statuses: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);

  async function load(nextPage = page) {
    const res = await getAdminOrders(nextPage);
    setOrders(res.data?.orders || []);
    setPagination(res.data?.pagination || null);
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function onStatus(id: string, status: string) {
    try {
      await updateOrderStatus(id, status);
      toast.success("Status updated");
      load(page);
    } catch {
      toast.error("Update failed");
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-neutral-500">View and update order status</p>

      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {order.customerName} · {order.customerEmail}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatPrice(order.total)}</p>
                <div className="mt-2">
                  <Select
                    value={order.status}
                    onValueChange={(v) => v && onStatus(order.id, String(v))}
                    items={statuses.map((s) => ({ value: s, label: s }))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
              {order.items.map((item) => (
                <p key={item.id}>
                  {item.product?.name}
                  {item.variantAttributes
                    ? ` (${Object.values(item.variantAttributes).join(" / ")})`
                    : ""}{" "}
                  × {item.quantity}
                </p>
              ))}
              {(order.shippingMethod || Number(order.shipping) > 0) && (
                <p className="mt-2 text-neutral-500">
                  {order.shippingMethod || "Shipping"}
                  {Number(order.shipping) === 0
                    ? " · Free"
                    : ` · ${formatPrice(order.shipping)}`}
                </p>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-sm text-neutral-500">No orders yet.</p>
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-neutral-500">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
