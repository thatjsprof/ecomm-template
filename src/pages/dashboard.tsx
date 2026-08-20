import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/use-auth";
import { PageHead } from "@/components/seo/page-head";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <>
        <PageHead title="Account" noindex path="/dashboard" />
        <p className="py-24 text-center text-sm text-neutral-500">Loading…</p>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
      <PageHead title="Account" noindex path="/dashboard" />
      <h1 className="font-display text-4xl text-neutral-900">Hello, {user.name}</h1>
      <p className="mt-2 text-sm text-neutral-500">Manage your account and orders.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/orders"
          className="rounded-2xl border border-neutral-200 p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="font-medium">Orders</h2>
          <p className="mt-2 text-sm text-neutral-500">Track purchases and delivery status.</p>
        </Link>
        <Link
          href="/profile"
          className="rounded-2xl border border-neutral-200 p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="font-medium">Profile</h2>
          <p className="mt-2 text-sm text-neutral-500">Update your details and password.</p>
        </Link>
      </div>

      {user.role === "ADMIN" && (
        <Link href="/admin" className={cn(buttonVariants(), "mt-8 rounded-lg")}>
          Go to admin
        </Link>
      )}
    </div>
  );
}
