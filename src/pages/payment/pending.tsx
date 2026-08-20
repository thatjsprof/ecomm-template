import Link from "next/link";
import { useRouter } from "next/router";
import { PageHead } from "@/components/seo/page-head";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function queryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default function BankTransferPendingPage() {
  const router = useRouter();
  const orderNumber = queryValue(router.query.order);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
      <PageHead title="Payment pending" noindex path="/payment/pending" />
      <h1 className="font-display text-4xl text-neutral-900">Transfer received</h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-500">
        Thanks — your order
        {orderNumber ? (
          <>
            {" "}
            <span className="font-medium text-neutral-900">{orderNumber}</span>
          </>
        ) : null}{" "}
        has been submitted with your payment receipt. We’ll confirm the transfer and update your
        order status shortly.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/orders" className={cn(buttonVariants(), "rounded-lg")}>
          View orders
        </Link>
        <Link
          href="/shop"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-lg")}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
