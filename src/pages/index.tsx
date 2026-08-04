import Link from "next/link";
import type { GetServerSideProps } from "next";
import { ProductCard } from "@/components/products/product-card";
import { PageHead } from "@/components/seo/page-head";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getCategories, getProducts } from "@/services/api";
import type { Category, Product } from "@/types";
import { cn } from "@/lib/utils";

interface HomeProps {
  featured: Product[];
  newArrivals: Product[];
  categories: Category[];
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    const [featuredRes, newRes, categoriesRes] = await Promise.all([
      getProducts({ featured: "true", limit: 4 }),
      getProducts({ newArrival: "true", limit: 4 }),
      getCategories(),
    ]);

    return {
      props: {
        featured: featuredRes.data?.products || [],
        newArrivals: newRes.data?.products || [],
        categories: categoriesRes.data || [],
      },
    };
  } catch {
    return {
      props: {
        featured: [],
        newArrivals: [],
        categories: [],
      },
    };
  }
};

export default function HomePage({ featured, newArrivals, categories }: HomeProps) {
  return (
    <>
      <PageHead absolute title={`${siteConfig.name} — ${siteConfig.tagline}`} />
      <div>
        <section className="relative min-h-[78vh] overflow-hidden bg-neutral-100">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(120deg, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.55) 42%, rgba(10,10,10,0.4) 100%), url('${siteConfig.heroImage}')`,
            }}
          />
          <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-6 pb-20 pt-28 lg:px-8">
            <p className="font-display text-5xl tracking-tight text-white sm:text-7xl">
              {siteConfig.nameDisplay}
            </p>
            <h1 className="mt-4 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
              {siteConfig.heroTagline}
            </h1>
            <div className="mt-8">
              <Link
                href="/shop"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "rounded-full bg-white px-8 text-neutral-900 hover:bg-white/90"
                )}
              >
                Shop collection
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl text-neutral-900 sm:text-4xl">Featured</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Pieces we return to, season after season.
              </p>
            </div>
            <Link href="/shop" className="text-sm text-neutral-600 hover:text-neutral-900">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="bg-neutral-50 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="font-display text-3xl text-neutral-900 sm:text-4xl">New arrivals</h2>
              <p className="mt-2 text-sm text-neutral-500">Fresh additions to the edit.</p>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mb-12">
            <h2 className="font-display text-3xl text-neutral-900 sm:text-4xl">Categories</h2>
            <p className="mt-2 text-sm text-neutral-500">Browse by collection.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl bg-neutral-200 p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent" />
                <div className="relative">
                  <p className="font-display text-3xl text-white">{category.name}</p>
                  <p className="mt-1 text-sm text-white/80">
                    {category._count?.products ?? 0} pieces
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
