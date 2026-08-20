"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { subscribeNewsletter } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";

export function Footer() {
  const router = useRouter();
  const pathname = router.pathname;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  async function onSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await subscribeNewsletter(email);
      setMessage(res.data?.message || "Subscribed");
      setEmail("");
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer className="mt-24 bg-black">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-2xl text-white">{siteConfig.nameDisplay}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">
            {siteConfig.footerTagline}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-3">
            <p className="font-medium text-white">Shop</p>
            <Link href="/shop" className="block text-neutral-400 hover:text-white">
              All products
            </Link>
            <Link
              href="/shop?newArrival=true"
              className="block text-neutral-400 hover:text-white"
            >
              New arrivals
            </Link>
            <Link href="/cart" className="block text-neutral-400 hover:text-white">
              Cart
            </Link>
          </div>
          <div className="space-y-3">
            <p className="font-medium text-white">Account</p>
            <Link href="/login" className="block text-neutral-400 hover:text-white">
              Sign in
            </Link>
            <Link href="/register" className="block text-neutral-400 hover:text-white">
              Register
            </Link>
            <Link href="/orders" className="block text-neutral-400 hover:text-white">
              Orders
            </Link>
          </div>
        </div>

        <div>
          <p className="font-medium text-white">Newsletter</p>
          <p className="mt-2 text-sm text-neutral-400">
            Occasional notes on new pieces and seasonal edits.
          </p>
          <form onSubmit={onSubscribe} className="mt-4 flex gap-2">
            <Input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus-visible:border-white"
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-white text-neutral-900 hover:bg-white/90"
            >
              Join
            </Button>
          </form>
          {message && <p className="mt-2 text-xs text-neutral-400">{message}</p>}
        </div>
      </div>

      <div className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
