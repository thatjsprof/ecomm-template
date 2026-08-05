import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { siteConfig } from "@/config/site";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/shipping", label: "Shipping" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/newsletter", label: "Newsletter" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = router.pathname;

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return <p className="py-24 text-center text-sm text-neutral-500">Loading…</p>;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/admin" className="font-display text-xl">
            {siteConfig.name} Admin
          </Link>
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
            View store
          </Link>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[200px_1fr]">
        <aside className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === link.href
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
