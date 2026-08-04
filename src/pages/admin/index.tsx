import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminOrders, getAdminProducts, getCategories, getSubscribers } from "@/services/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    subscribers: 0,
  });

  useEffect(() => {
    Promise.all([
      getAdminProducts(1),
      getCategories(),
      getAdminOrders(1),
      getSubscribers(),
    ]).then(([products, categories, orders, subscribers]) => {
      setStats({
        products: products.data?.pagination.total || 0,
        categories: categories.data?.length || 0,
        orders: orders.data?.pagination.total || 0,
        subscribers: subscribers.data?.length || 0,
      });
    });
  }, []);

  const cards = [
    { label: "Products", value: stats.products, href: "/admin/products" },
    { label: "Categories", value: stats.categories, href: "/admin/categories" },
    { label: "Orders", value: stats.orders, href: "/admin/orders" },
    { label: "Subscribers", value: stats.subscribers, href: "/admin/newsletter" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-neutral-900">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-500">Store overview</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
