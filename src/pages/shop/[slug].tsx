import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { ProductCard } from "@/components/products/product-card";
import { ProductGallery } from "@/components/products/product-gallery";
import { PageHead } from "@/components/seo/page-head";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { getProduct } from "@/services/api";
import type { Product, ProductVariant } from "@/types";
import { formatPrice, getProductPrice } from "@/utils/format";

export default function ProductDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [focusImageUrl, setFocusImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    setLoading(true);
    getProduct(slug)
      .then((res) => {
        const next = res.data?.product || null;
        setProduct(next);
        setRelated(res.data?.related || []);
        setQuantity(1);

        const activeVariants = (next?.variants || []).filter((v) => v.active !== false);
        const initial =
          activeVariants.find((v) => v.stock > 0) || activeVariants[0] || null;
        setSelectedOptions(initial?.attributes ? { ...initial.attributes } : {});
        setFocusImageUrl(null);
      })
      .finally(() => setLoading(false));
  }, [router.isReady, slug]);

  const variants = useMemo(
    () => (product?.variants || []).filter((v) => v.active !== false),
    [product]
  );

  const attributeKeys = useMemo(() => {
    if (product?.optionConfig?.length) {
      return product.optionConfig.map((o) => o.name).filter(Boolean);
    }
    const keys = new Set<string>();
    variants.forEach((v) => Object.keys(v.attributes || {}).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [product, variants]);

  const selectedVariant: ProductVariant | null = useMemo(() => {
    if (!variants.length) return null;
    if (!attributeKeys.every((key) => selectedOptions[key])) return null;

    return (
      variants.find((v) =>
        attributeKeys.every((key) => v.attributes?.[key] === selectedOptions[key])
      ) || null
    );
  }, [variants, attributeKeys, selectedOptions]);

  function optionValues(key: string): string[] {
    const fromConfig = product?.optionConfig?.find((o) => o.name === key);
    if (fromConfig?.values?.length) {
      return fromConfig.values.map((v) => v.value).filter(Boolean);
    }
    return Array.from(
      new Set(variants.map((v) => v.attributes?.[key]).filter(Boolean) as string[])
    );
  }

  function isOptionSoldOut(key: string, value: string): boolean {
    const matches = variants.filter((v) => v.attributes?.[key] === value);
    if (matches.length === 0) return true;
    return matches.every((v) => v.stock <= 0);
  }

  function selectAttribute(key: string, value: string) {
    setSelectedOptions((prev) => ({ ...prev, [key]: value }));
    setQuantity(1);

    const image = product?.optionConfig
      ?.find((o) => o.name === key)
      ?.values.find((v) => v.value === value)?.image;
    if (!image) return;
    setFocusImageUrl(null);
    requestAnimationFrame(() => setFocusImageUrl(image));
  }

  if (loading) {
    return <p className="py-24 text-center text-sm text-neutral-500">Loading…</p>;
  }

  if (!product) {
    return <p className="py-24 text-center text-sm text-neutral-500">Product not found.</p>;
  }

  const price = getProductPrice(product, selectedVariant);
  const compareAt =
    selectedVariant?.price != null && selectedVariant.price !== ""
      ? Number(selectedVariant.price)
      : Number(product.price);
  const hasSale = price < compareAt;
  const images = product.images?.length ? product.images : [];
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const hasVariants = variants.length > 0;
  const combinationValid = !hasVariants || selectedVariant != null;
  const canAdd = combinationValid && stock > 0;

  function handleAdd() {
    if (hasVariants && !selectedVariant) {
      toast.error("This combination is unavailable");
      return;
    }
    addItem(product!, quantity, selectedVariant);
    toast.success("Added to cart");
  }

  return (
    <>
      <PageHead title={product.name} />
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <ProductGallery
            images={images}
            alt={product.name}
            focusImageUrl={focusImageUrl}
          />

          <div className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              {product.category?.name}
            </p>
            <h1 className="mt-3 font-display text-4xl text-neutral-900 sm:text-5xl">
              {product.name}
            </h1>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xl text-neutral-900">{formatPrice(price)}</span>
              {hasSale && (
                <span className="text-neutral-400 line-through">{formatPrice(compareAt)}</span>
              )}
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-neutral-600">
              {product.description}
            </p>

            {attributeKeys.map((key) => {
              const values = optionValues(key);
              const selectedValue = selectedOptions[key];

              return (
                <div key={key} className="mt-6">
                  <p className="mb-2 text-sm font-medium text-neutral-900">{key}</p>
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => {
                      const selected = selectedValue === value;
                      const soldOut = isOptionSoldOut(key, value);
                      const optionImage = product.optionConfig
                        ?.find((o) => o.name === key)
                        ?.values.find((v) => v.value === value)?.image;

                      return (
                        <button
                          key={`${key}-${value}`}
                          type="button"
                          onClick={() => selectAttribute(key, value)}
                          aria-pressed={selected}
                          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${selected
                              ? soldOut
                                ? "border-neutral-400 bg-neutral-400 text-white line-through"
                                : "border-neutral-900 bg-neutral-900 text-white"
                              : soldOut
                                ? "border-neutral-200 text-neutral-300 line-through"
                                : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                            }`}
                        >
                          {optionImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={optionImage}
                              alt=""
                              className="size-5 rounded-full object-cover"
                            />
                          ) : null}
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <p className="mt-4 text-sm text-neutral-500">
              {!combinationValid
                ? "This combination is unavailable"
                : stock > 0
                  ? `${stock} in stock`
                  : "Out of stock"}
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-neutral-200">
                <button
                  type="button"
                  className="px-4 py-2 text-sm"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm">{quantity}</span>
                <button
                  type="button"
                  className="px-4 py-2 text-sm"
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.max(combinationValid ? stock : 1, 1), q + 1))
                  }
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                className="rounded-lg px-8"
                disabled={!canAdd}
                onClick={handleAdd}
              >
                Add to cart
              </Button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="font-display text-3xl text-neutral-900">You may also like</h2>
            <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
