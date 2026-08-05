import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { X } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { PageHead } from "@/components/seo/page-head";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategories, getCollection } from "@/services/api";
import type { Category, Collection, Product } from "@/types";
import { cn } from "@/lib/utils";
import { getProductPrice } from "@/utils/format";

interface CollectionPageProps {
  collection: Collection | null;
}

function queryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function sortProducts(products: Product[], sort: string) {
  const next = [...products];
  switch (sort) {
    case "price-asc":
      return next.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    case "price-desc":
      return next.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    case "name":
      return next.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
    default:
      return next.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

export const getServerSideProps: GetServerSideProps<CollectionPageProps> = async (ctx) => {
  const slug = String(ctx.params?.slug || "");
  try {
    const res = await getCollection(slug);
    return { props: { collection: res.data || null } };
  } catch {
    return { props: { collection: null } };
  }
};

export default function CollectionPage({ collection }: CollectionPageProps) {
  const router = useRouter();
  const ready = router.isReady;
  const slug = queryValue(router.query.slug);

  const category = queryValue(router.query.category);
  const sort = queryValue(router.query.sort) || "newest";
  const searchQuery = queryValue(router.query.search);

  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(searchQuery);
  const skipSearchSync = useRef(false);

  useEffect(() => {
    getCategories().then((res) => {
      if (res.data) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipSearchSync.current) {
      skipSearchSync.current = false;
      return;
    }
    setSearch(searchQuery);
  }, [ready, searchQuery]);

  const baseProducts = collection?.products || [];

  const availableCategories = useMemo(() => {
    const slugs = new Set(
      baseProducts.map((p) => p.category?.slug).filter(Boolean) as string[]
    );
    return categories.filter((c) => slugs.has(c.slug));
  }, [baseProducts, categories]);

  const filteredProducts = useMemo(() => {
    let list = baseProducts;

    if (category) {
      list = list.filter((p) => p.category?.slug === category);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    return sortProducts(list, sort);
  }, [baseProducts, category, searchQuery, sort]);

  function applyFilters(updates: Record<string, string>) {
    if (!slug) return;
    const next: Record<string, string> = {
      search: searchQuery,
      category,
      sort: sort !== "newest" ? sort : "",
      ...updates,
    };

    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const qs = params.toString();
    skipSearchSync.current = true;
    void router.push(
      qs ? `/collections/${slug}?${qs}` : `/collections/${slug}`,
      undefined,
      { shallow: true }
    );
  }

  function commitSearch(raw: string) {
    const q = raw.trim();
    setSearch(raw);
    applyFilters({ search: q });
  }

  useEffect(() => {
    if (!ready || !collection) return;
    const q = search.trim();
    if (q === searchQuery) return;

    const timer = window.setTimeout(() => {
      applyFilters({ search: q });
    }, 300);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function clearSearch() {
    setSearch("");
    applyFilters({ search: "" });
  }

  if (!collection) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-8">
        <h1 className="font-display text-3xl">Collection not found</h1>
        <Link href="/shop" className="mt-4 inline-block text-sm underline">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHead title={collection.name} description={collection.description || undefined} />
      <div>
        <section className="relative min-h-[42vh] overflow-hidden bg-neutral-900">
          {collection.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={collection.image}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-70"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-neutral-950/20" />
          <div className="relative mx-auto flex min-h-[42vh] max-w-7xl flex-col justify-end px-6 pb-12 pt-24 lg:px-8">
            <p className="text-sm uppercase tracking-wide text-white/70">Collection</p>
            <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">
              {collection.name}
            </h1>
            {collection.description ? (
              <p className="mt-3 max-w-2xl text-sm text-white/75">{collection.description}</p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full max-w-md gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  type="text"
                  name="search"
                  placeholder="Search products"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitSearch(search);
                    }
                  }}
                  autoComplete="off"
                  className={cn(
                    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none md:text-sm",
                    search && "pr-9"
                  )}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 transition-colors hover:text-neutral-700"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className={cn(buttonVariants())}
                onClick={() => commitSearch(search)}
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Select
                value={category || "all"}
                onValueChange={(value) => {
                  if (!value) return;
                  applyFilters({
                    category: value === "all" ? "" : String(value),
                  });
                }}
                items={[
                  { value: "all", label: "All categories" },
                  ...availableCategories.map((c) => ({ value: c.slug, label: c.name })),
                ]}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {availableCategories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sort}
                onValueChange={(value) => value && applyFilters({ sort: String(value) })}
                items={[
                  { value: "newest", label: "Newest" },
                  { value: "price-asc", label: "Price: Low to High" },
                  { value: "price-desc", label: "Price: High to Low" },
                  { value: "name", label: "Name" },
                ]}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(category || searchQuery) && (
            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
              <span>
                {filteredProducts.length} of {baseProducts.length} products
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  applyFilters({ search: "", category: "", sort: "" });
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {baseProducts.length === 0 ? (
            <p className="text-sm text-neutral-500">No products in this collection yet.</p>
          ) : filteredProducts.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-500">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 md:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
