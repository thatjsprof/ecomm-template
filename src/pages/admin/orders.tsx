import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteOrder, getAdminOrders, updateOrderStatus } from "@/services/api";
import type { Order, OrderStatus, Pagination } from "@/types";
import { formatPrice, formatVariantLabel } from "@/utils/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [deleting, setDeleting] = useState<Order | null>(null);
  const [removing, setRemoving] = useState(false);

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

  async function onConfirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await deleteOrder(deleting.id);
      toast.success("Order deleted");
      setDeleting(null);
      load(page);
    } catch {
      toast.error("Delete failed");
    } finally {
      setRemoving(false);
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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{order.orderNumber}</p>
                  {order.paymentStatus === "SUCCESS" && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                      Paid
                    </span>
                  )}
                  {order.paymentStatus === "PENDING" &&
                    order.paymentProvider === "bank_transfer" &&
                    order.paymentReceiptUrl && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                        Awaiting confirmation
                      </span>
                    )}
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {order.customerName} · {order.customerEmail}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatPrice(order.total)}</p>
                <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
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
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 text-red-600 hover:text-red-700"
                    onClick={() => setDeleting(order)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
              {order.items.map((item) => {
                const variant = formatVariantLabel(item.variantAttributes);
                return (
                  <p key={item.id}>
                    {item.product?.name}
                    {variant ? (
                      <span className="text-neutral-500"> · {variant}</span>
                    ) : null}{" "}
                    × {item.quantity}
                  </p>
                );
              })}
              {(order.shippingMethod || Number(order.shipping) > 0) && (
                <p className="mt-2 text-neutral-500">
                  {order.shippingMethod || "Shipping"}
                  {Number(order.shipping) === 0
                    ? " · Free"
                    : ` · ${formatPrice(order.shipping)}`}
                </p>
              )}
              {order.paymentProvider && (
                <p className="mt-2 text-neutral-500">
                  Payment ·{" "}
                  <span className="capitalize text-neutral-700">
                    {order.paymentProvider.replace("_", " ")}
                  </span>
                  {order.paymentStatus === "PENDING" && order.paymentReceiptUrl
                    ? " · Awaiting confirmation"
                    : null}
                </p>
              )}
              {order.paymentNote && (
                <p className="mt-2 text-neutral-500">
                  Note · <span className="text-neutral-700">{order.paymentNote}</span>
                </p>
              )}
              {order.paymentReceiptUrl && (
                <p className="mt-2">
                  <a
                    href={order.paymentReceiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-neutral-900 underline"
                  >
                    View payment receipt
                  </a>
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

      <Dialog open={!!deleting} onOpenChange={(open) => !open && !removing && setDeleting(null)}>
        <DialogContent className="sm:max-w-md" showCloseButton={!removing}>
          <DialogHeader>
            <DialogTitle>Delete order?</DialogTitle>
            <DialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-neutral-900">{deleting?.orderNumber}</span>
              {deleting?.paymentReference
                ? " and its payment record from Payments."
                : "."}{" "}
              {deleting?.paymentStatus === "SUCCESS"
                ? "Stock from this sale will be restored."
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={removing}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removing}
              onClick={onConfirmDelete}
            >
              {removing ? "Deleting…" : "Delete order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
