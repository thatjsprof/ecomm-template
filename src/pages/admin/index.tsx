import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminOrders,
  getAdminProducts,
  getCategories,
  getPaymentStats,
  getSubscribers,
} from "@/services/api";
import { formatPrice } from "@/utils/format";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    subscribers: 0,
    revenueTotal: 0,
    revenueThisMonth: 0,
    paidOrders: 0,
  });

  useEffect(() => {
    Promise.all([
      getAdminProducts(1),
      getCategories(),
      getAdminOrders(1),
      getSubscribers(),
      getPaymentStats(),
    ]).then(([products, categories, orders, subscribers, payments]) => {
      setStats({
        products: products.data?.pagination.total || 0,
        categories: categories.data?.length || 0,
        orders: orders.data?.pagination.total || 0,
        subscribers: subscribers.data?.length || 0,
        revenueTotal: payments.data?.revenueTotal || 0,
        revenueThisMonth: payments.data?.revenueThisMonth || 0,
        paidOrders: payments.data?.paidOrders || 0,
      });
    });
  }, []);

  const revenueCards = [
    {
      label: "Revenue (all time)",
      value: formatPrice(stats.revenueTotal),
      href: "/admin/payments",
      hint: `${stats.paidOrders} paid order${stats.paidOrders === 1 ? "" : "s"}`,
    },
    {
      label: "Revenue (this month)",
      value: formatPrice(stats.revenueThisMonth),
      href: "/admin/payments",
      hint: "Successful payments only",
    },
  ];

  const cards = [
    { label: "Products", value: String(stats.products), href: "/admin/products" },
    { label: "Categories", value: String(stats.categories), href: "/admin/categories" },
    { label: "Orders", value: String(stats.orders), href: "/admin/orders" },
    { label: "Subscribers", value: String(stats.subscribers), href: "/admin/newsletter" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-neutral-900">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-500">Store overview</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {revenueCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-neutral-500">{card.label}</p>
            <p className="mt-2 text-3xl font-medium tracking-tight">{card.value}</p>
            <p className="mt-2 text-xs text-neutral-400">{card.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-neutral-500">{card.label}</p>
            <p className="mt-2 text-3xl font-medium">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
