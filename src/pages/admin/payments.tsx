import { useEffect, useState } from "react";
import { getAdminPayments } from "@/services/api";
import type { Pagination, PaymentStatus } from "@/types";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/button";

type PaymentRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: string | number;
  paymentProvider: string | null;
  paymentReference: string | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(nextPage = page) {
    setLoading(true);
    try {
      const res = await getAdminPayments(nextPage);
      setPayments(res.data?.payments || []);
      setPagination(res.data?.pagination || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div>
      <h1 className="font-display text-3xl">Payments</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Payment attempts from checkout (Flutterwave &amp; Korapay)
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-neutral-100 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                  {new Date(payment.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">{payment.orderNumber}</td>
                <td className="px-4 py-3">
                  <p className="text-neutral-900">{payment.customerName}</p>
                  <p className="text-xs text-neutral-500">{payment.customerEmail}</p>
                </td>
                <td className="px-4 py-3 capitalize text-neutral-700">
                  {payment.paymentProvider || "—"}
                </td>
                <td className="max-w-[160px] truncate px-4 py-3 font-mono text-xs text-neutral-500">
                  {payment.paymentReference || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      payment.paymentStatus === "SUCCESS"
                        ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        : payment.paymentStatus === "FAILED"
                          ? "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                          : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                    }
                  >
                    {payment.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(payment.total)}</td>
              </tr>
            ))}
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">
                  No payments yet.
                </td>
              </tr>
            )}
            {loading && payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
