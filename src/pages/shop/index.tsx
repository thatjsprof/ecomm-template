import { useEffect, useRef, useState } from "react";
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
import { getCategories, getProducts } from "@/services/api";
import type { Category, Pagination, Product } from "@/types";
import { cn } from "@/lib/utils";

function queryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default function ShopPage() {
  const router = useRouter();
  const ready = router.isReady;

  const page = Number(queryValue(router.query.page) || 1);
  const category = queryValue(router.query.category);
  const sort = queryValue(router.query.sort) || "newest";
  const newArrival = queryValue(router.query.newArrival);
  const searchQuery = queryValue(router.query.search);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery);
  const skipSearchSync = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (skipSearchSync.current) {
      skipSearchSync.current = false;
      return;
    }
    setSearch(searchQuery);
  }, [ready, searchQuery]);

  useEffect(() => {
    getCategories().then((res) => {
      if (res.data) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    getProducts({
      page,
      limit: 12,
      search: searchQuery || undefined,
      category: category || undefined,
      sort,
      newArrival: newArrival || undefined,
    })
      .then((res) => {
        setProducts(res.data?.products || []);
        setPagination(res.data?.pagination || null);
      })
      .catch(() => {
        setProducts([]);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  }, [ready, page, category, sort, newArrival, searchQuery]);

  function applyFilters(updates: Record<string, string>) {
    const next: Record<string, string> = {
      search: searchQuery,
      category,
      sort: sort !== "newest" ? sort : "",
      newArrival,
      page: page > 1 ? String(page) : "",
      ...updates,
    };

    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const qs = params.toString();
    skipSearchSync.current = true;
    void router.push(qs ? `/shop?${qs}` : "/shop");
  }

  function commitSearch(raw: string) {
    const q = raw.trim();
    setSearch(raw);
    applyFilters({
      search: q,
      page: "",
    });
  }

  // Live-filter as the user types (keeps new arrivals / category filters)
  useEffect(() => {
    if (!ready) return;
    const q = search.trim();
    if (q === searchQuery) return;

    const timer = window.setTimeout(() => {
      applyFilters({
        search: q,
        page: "",
      });
    }, 300);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function clearSearch() {
    setSearch("");
    applyFilters({ search: "", page: "" });
  }

  return (
    <>
      <PageHead title="Shop" />
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-4xl text-neutral-900">Shop</h1>
          <p className="mt-2 text-sm text-neutral-500">Browse the full collection.</p>
        </div>

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
                  "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-base outline-none md:text-sm",
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
                  page: "",
                });
              }}
              items={[
                { value: "all", label: "All categories" },
                ...categories.map((c) => ({ value: c.slug, label: c.name })),
              ]}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(value) =>
                value && applyFilters({ sort: String(value), page: "" })
              }
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

        {newArrival === "true" && (
          <div className="mb-6 flex items-center gap-3 text-sm text-neutral-600">
            <span>Showing new arrivals</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyFilters({ newArrival: "", page: "" })}
            >
              Clear
            </Button>
          </div>
        )}

        {loading || !ready ? (
          <p className="py-20 text-center text-sm text-neutral-500">Loading…</p>
        ) : products.length === 0 ? (
          <p className="py-20 text-center text-sm text-neutral-500">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => applyFilters({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <span className="text-sm text-neutral-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={page >= pagination.pages}
              onClick={() => applyFilters({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
