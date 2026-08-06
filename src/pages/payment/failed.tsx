import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PaymentFailedPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="font-display text-4xl text-neutral-900">Payment failed</h1>
      <p className="mt-3 text-sm text-neutral-500">
        Your payment could not be completed. No charges were made for this attempt.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/checkout" className={cn(buttonVariants(), "rounded-lg")}>
          Try again
        </Link>
        <Link
          href="/cart"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-lg")}
        >
          Back to cart
        </Link>
      </div>
    </div>
  );
}
