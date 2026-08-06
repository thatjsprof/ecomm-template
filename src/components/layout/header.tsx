"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button, buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?newArrival=true", label: "New" },
];

export function Header() {
  const router = useRouter();
  const pathname = router.pathname;
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="font-display text-2xl tracking-tight text-neutral-900">
          {siteConfig.nameDisplay}
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm tracking-wide text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
              >
                <User className="size-4" />
                <span className="sr-only">Account</span>
              </Link>
              <Button variant="ghost" size="sm" className="rounded-full" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden rounded-full sm:inline-flex"
              )}
            >
              Sign in
            </Link>
          )}

          <Link
            href="/cart"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "relative rounded-full"
            )}
          >
            <ShoppingBag className="size-4" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white">
                {count}
              </span>
            )}
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-full md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-neutral-100 bg-white px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  className="text-left text-sm text-neutral-700"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
