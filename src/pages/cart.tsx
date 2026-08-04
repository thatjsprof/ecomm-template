import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice, formatVariantLabel, getProductPrice } from "@/utils/format";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl text-neutral-900">Your cart</h1>
        <p className="mt-4 text-sm text-neutral-500">Your cart is empty.</p>
        <Link href="/shop" className={cn(buttonVariants(), "mt-8 rounded-full")}>
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
      <h1 className="font-display text-4xl text-neutral-900">Your cart</h1>

      <div className="mt-10 space-y-6">
        {items.map((item) => {
          const price = getProductPrice(item.product, item.variant);
          const image = item.product.images?.[0];
          const variantId = item.variant?.id;
          const label = formatVariantLabel(item.variant?.attributes);

          return (
            <div
              key={`${item.product.id}:${variantId || "base"}`}
              className="flex flex-col gap-4 border-b border-neutral-100 pb-6 sm:flex-row sm:items-center"
            >
              <div className="relative h-28 w-24 overflow-hidden rounded-xl bg-neutral-100">
                {image ? (
                  <Image src={image} alt={item.product.name} fill className="object-cover" sizes="96px" />
                ) : null}
              </div>
              <div className="flex-1">
                <Link
                  href={`/shop/${item.product.slug}`}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  {item.product.name}
                </Link>
                {label && <p className="mt-1 text-xs text-neutral-500">{label}</p>}
                <p className="mt-1 text-sm text-neutral-500">{formatPrice(price)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-full border border-neutral-200">
                  <button
                    type="button"
                    className="px-3 py-1 text-sm"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1, variantId)}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    className="px-3 py-1 text-sm"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1, variantId)}
                  >
                    +
                  </button>
                </div>
                <p className="w-24 text-right text-sm font-medium">
                  {formatPrice(price * item.quantity)}
                </p>
                <button
                  type="button"
                  className="text-sm text-neutral-400 hover:text-neutral-900"
                  onClick={() => removeItem(item.product.id, variantId)}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-end gap-4">
        <div className="text-right">
          <p className="text-sm text-neutral-500">Subtotal</p>
          <p className="mt-1 text-2xl font-medium">{formatPrice(subtotal)}</p>
        </div>
        <Link
          href="/checkout"
          className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
