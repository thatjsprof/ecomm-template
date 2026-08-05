import Link from "next/link";
import type { GetServerSideProps } from "next";
import { ProductCard } from "@/components/products/product-card";
import { PageHead } from "@/components/seo/page-head";
import { getCollection } from "@/services/api";
import type { Collection } from "@/types";

interface CollectionPageProps {
  collection: Collection | null;
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

  const products = collection.products || [];

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
          {products.length === 0 ? (
            <p className="text-sm text-neutral-500">No products in this collection yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
