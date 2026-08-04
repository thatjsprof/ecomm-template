import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PageHead } from "@/components/seo/page-head";
import { verifyPayment } from "@/services/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function queryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const provider = queryValue(router.query.provider) || "flutterwave";
  const reference =
    queryValue(router.query.tx_ref) ||
    queryValue(router.query.reference) ||
    queryValue(router.query.trxref);
  const transactionId = queryValue(router.query.transaction_id);
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    if (!router.isReady) return;

    if (!reference) {
      setStatus("failed");
      return;
    }

    verifyPayment(provider, reference, transactionId || undefined)
      .then((res) => {
        setStatus(res.data?.paid ? "success" : "failed");
      })
      .catch(() => setStatus("failed"));
  }, [router.isReady, provider, reference, transactionId]);

  return (
    <>
      <PageHead title="Payment" />
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-6 py-20">
        {status === "loading" || !router.isReady ? (
          <p className="text-sm text-neutral-500">Confirming payment…</p>
        ) : status === "failed" ? (
          <div className="text-center">
            <h1 className="font-display text-4xl text-neutral-900">Payment failed</h1>
            <p className="mt-3 text-sm text-neutral-500">
              We could not confirm your payment. Please try again or contact support.
            </p>
            <Link href="/payment/failed" className={cn(buttonVariants(), "mt-8 rounded-full")}>
              View details
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="font-display text-4xl text-neutral-900">Payment successful</h1>
            <p className="mt-3 text-sm text-neutral-500">
              Thank you. Your order has been confirmed.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/orders" className={cn(buttonVariants(), "rounded-full")}>
                View orders
              </Link>
              <Link
                href="/shop"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
              >
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
