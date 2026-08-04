import { useEffect, useState } from "react";
import { getSubscribers } from "@/services/api";
import type { NewsletterSubscriber } from "@/types";

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);

  useEffect(() => {
    getSubscribers().then((res) => setSubscribers(res.data || []));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Newsletter</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.id} className="border-b border-neutral-50">
                <td className="px-4 py-3">{sub.email}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(sub.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscribers.length === 0 && (
          <p className="px-4 py-8 text-sm text-neutral-500">No subscribers yet.</p>
        )}
      </div>
    </div>
  );
}
