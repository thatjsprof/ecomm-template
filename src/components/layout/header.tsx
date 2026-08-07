"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = pathname.startsWith("/admin");
  const isHome = pathname === "/";
  const overlay = isHome && !scrolled && !open;

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }

    function onScroll() {
      setScrolled(window.scrollY > 24);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  if (isAdmin) {
    return null;
  }

  return (
    <header
      className={cn(
        "z-50 transition-colors duration-300",
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
        overlay
          ? "border-transparent bg-gradient-to-b from-black/45 via-black/20 to-transparent"
          : "border-b border-neutral-200/80 bg-white/90 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          className={cn(
            "font-display text-2xl tracking-tight transition-colors",
            overlay ? "text-white" : "text-neutral-900"
          )}
        >
          {siteConfig.nameDisplay}
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-base tracking-wide transition-colors",
                overlay
                  ? "text-white/85 hover:text-white"
                  : "text-neutral-600 hover:text-neutral-900"
              )}
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
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "rounded-full",
                    overlay && "text-white hover:bg-white/10 hover:text-white"
                  )}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-full",
                  overlay && "text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <User className="size-4" />
                <span className="sr-only">Account</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full",
                  overlay && "text-white hover:bg-white/10 hover:text-white"
                )}
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden rounded-full sm:inline-flex",
                overlay && "text-white hover:bg-white/10 hover:text-white"
              )}
            >
              Sign in
            </Link>
          )}

          <Link
            href="/cart"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "relative rounded-full",
              overlay && "text-white hover:bg-white/10 hover:text-white"
            )}
          >
            <ShoppingBag className="size-4" />
            {count > 0 && (
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[10px]",
                  overlay
                    ? "bg-white text-neutral-900"
                    : "bg-neutral-900 text-white"
                )}
              >
                {count}
              </span>
            )}
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full md:hidden",
              overlay && "text-white hover:bg-white/10 hover:text-white"
            )}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div
          className={cn(
            "border-t px-6 py-6 md:hidden",
            overlay
              ? "border-white/15 bg-neutral-950/90 text-white backdrop-blur-md"
              : "border-neutral-100 bg-white"
          )}
        >
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm",
                  overlay ? "text-white/90" : "text-neutral-700"
                )}
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
                  className={cn(
                    "text-left text-sm",
                    overlay ? "text-white/90" : "text-neutral-700"
                  )}
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
