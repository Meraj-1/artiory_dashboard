"use client";
import { useState } from "react";

type Order = {
  id: string; customer: string; email: string; product: string;
  amount: number; status: "Processing" | "Shipped" | "Delivered" | "Cancelled"; date: string;
};

const initialOrders: Order[] = [
  { id: "#ORD-001", customer: "Rahul Sharma",  email: "rahul@example.com",  product: "Abstract Canvas Print", amount: 4500,  status: "Delivered",  date: "Jan 10, 2025" },
  { id: "#ORD-002", customer: "Priya Mehta",   email: "priya@example.com",  product: "Bronze Figurine",       amount: 18500, status: "Shipped",    date: "Jan 9, 2025"  },
  { id: "#ORD-003", customer: "Arjun Nair",    email: "arjun@example.com",  product: "Digital Art Print",     amount: 2200,  status: "Processing", date: "Jan 9, 2025"  },
  { id: "#ORD-004", customer: "Sneha Patel",   email: "sneha@example.com",  product: "Watercolor Series",     amount: 6800,  status: "Processing", date: "Jan 8, 2025"  },
  { id: "#ORD-005", customer: "Vikram Singh",  email: "vikram@example.com", product: "Photography Print",     amount: 3200,  status: "Cancelled",  date: "Jan 7, 2025"  },
  { id: "#ORD-006", customer: "Ananya Roy",    email: "ananya@example.com", product: "Marble Sculpture Set",  amount: 12000, status: "Delivered",  date: "Jan 6, 2025"  },
];

const statusBadge: Record<string, { bg: string; color: string }> = {
  Processing: { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6" },
  Shipped:    { bg: "rgba(234,179,8,0.12)",   color: "#eab308" },
  Delivered:  { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
  Cancelled:  { bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
};

const nextStatus: Record<string, Order["status"]> = {
  Processing: "Shipped", Shipped: "Delivered", Delivered: "Delivered", Cancelled: "Cancelled",
};

const card = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

export default function OrdersPage() {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState("All");
    
  const filtered = orders.filter((o) => filter === "All" || o.status === filter);
  const total = orders.reduce((s, o) => s + (o.status !== "Cancelled" ? o.amount : 0), 0);

  function advance(id: string) { setOrders((p) => p.map((o) => o.id === id ? { ...o, status: nextStatus[o.status] } : o)); }
  function cancel(id: string)  { setOrders((p) => p.map((o) => o.id === id ? { ...o, status: "Cancelled" } : o)); }

  const filterBtn = (s: string) => ({
    backgroundColor: filter === s ? "var(--txt-1)" : "var(--card)",
    color: filter === s ? "var(--card)" : "var(--txt-2)",
    border: "1px solid var(--border)",
  });

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["Processing", "Shipped", "Delivered", "Cancelled"] as const).map((s) => (
          <div key={s} style={card} className="rounded-2xl p-4">
            <p className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>{s}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--txt-1)" }}>
              {orders.filter((o) => o.status === s).length}
            </p>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block" style={statusBadge[s]}>{s}</span>
          </div>
        ))}
      </div>

      {/* Filter + Revenue */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {["All", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} style={filterBtn(s)} className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors">{s}</button>
          ))}
        </div>
        <div className="rounded-xl px-4 py-2 text-sm" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <span className="font-medium" style={{ color: "#22c55e" }}>Total Revenue: </span>
          <span className="font-bold" style={{ color: "#22c55e" }}>₹{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Table */}
      <div style={card} className="rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "var(--base)", borderBottom: "1px solid var(--border)" }}>
              {["Order ID", "Customer", "Product", "Amount", "Status", "Date", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color: "var(--txt-3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid var(--border-sub)" }}>
                <td className="px-5 py-3.5 text-sm font-mono font-medium" style={{ color: "var(--txt-2)" }}>{o.id}</td>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium" style={{ color: "var(--txt-1)" }}>{o.customer}</p>
                  <p className="text-xs" style={{ color: "var(--txt-3)" }}>{o.email}</p>
                </td>
                <td className="px-5 py-3.5 text-sm" style={{ color: "var(--txt-2)" }}>{o.product}</td>
                <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--txt-1)" }}>₹{o.amount.toLocaleString()}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={statusBadge[o.status]}>{o.status}</span>
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: "var(--txt-3)" }}>{o.date}</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    {o.status !== "Delivered" && o.status !== "Cancelled" && (
                      <>
                        <button onClick={() => advance(o.id)} className="text-xs px-2.5 py-1 rounded-lg transition-colors" style={{ border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6" }}>
                          → {nextStatus[o.status]}
                        </button>
                        <button onClick={() => cancel(o.id)} className="text-xs px-2.5 py-1 rounded-lg transition-colors text-rose-500" style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
                          Cancel
                        </button>
                      </>
                    )}
                    {(o.status === "Delivered" || o.status === "Cancelled") && (
                      <span className="text-xs" style={{ color: "var(--txt-3)" }}>—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: "var(--txt-3)" }}>No orders found</div>
        )}
      </div>
    </div>
  );
}
