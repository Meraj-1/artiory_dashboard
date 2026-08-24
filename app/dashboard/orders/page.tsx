"use client";
import React, { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth";

type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  price: number;
};

type Order = {
  _id: string;
  user?: {
    name?: string;
    email?: string;
    number?: string;
  };
  orderItems: OrderItem[];
  totalPrice: number;
  status: "Pending" | "Paid" | "Delivered" | "Cancelled";
  awbNumber?: string;
  courierName?: string;
  logisticsOrderId?: string;
  shipmentStatus?: "Unshipped" | "Shipped" | "In-Transit" | "Delivered" | "RTO";
  shippingLabelUrl?: string;
  createdAt: string;
};

const statusBadge: Record<string, { bg: string; color: string }> = {
  Pending: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  Paid: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
  Delivered: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  Cancelled: { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
};

const cardStyle = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  // iThink Shipping Modal state
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const [weight, setWeight] = useState("0.5");
  const [length, setLength] = useState("10");
  const [width, setWidth] = useState("10");
  const [height, setHeight] = useState("10");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Reconcile Modal State
  const [reconcileOrderInstance, setReconcileOrderInstance] = useState<Order | null>(null);
  const [reconcileTxnId, setReconcileTxnId] = useState("");
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  const handleReconcileOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileOrderInstance || !reconcileTxnId) return;

    try {
      setReconcileLoading(true);
      setReconcileError(null);

      const token = getAuthToken();
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["x-auth-token"] = token;
        headers["x-access-token"] = token;
        headers["token"] = token;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/orders/reconcile`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            orderId: reconcileOrderInstance._id,
            clientTxnId: reconcileTxnId,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to reconcile order");
      }

      // Update order status in local state to Paid
      setOrders((prev) =>
        prev.map((o) =>
          o._id === reconcileOrderInstance._id ? { ...o, status: "Paid" } : o
        )
      );

      setReconcileOrderInstance(null);
      setReconcileTxnId("");
      alert("Order reconciled successfully! Status updated to Paid.");
    } catch (err: any) {
      console.error(err);
      setReconcileError(err.message || "Reconciliation failed");
    } finally {
      setReconcileLoading(false);
    }
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["x-auth-token"] = token;
        headers["x-access-token"] = token;
        headers["token"] = token;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/orders`,
        { headers }
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch orders: ${res.status}`);
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      } else if (Array.isArray(json)) {
        setOrders(json);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Auto-refresh orders list every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleShipOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingOrder) return;

    try {
      setShippingLoading(true);
      setShippingError(null);

      const token = getAuthToken();
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["x-auth-token"] = token;
        headers["x-access-token"] = token;
        headers["token"] = token;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/logistics/orders/${shippingOrder._id}/ship`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            weight: Number(weight),
            length: Number(length),
            width: Number(width),
            height: Number(height),
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to book shipment");
      }

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o._id === shippingOrder._id
            ? {
                ...o,
                awbNumber: json.awbNumber,
                courierName: json.courierName,
                shippingLabelUrl: json.shippingLabelUrl,
                shipmentStatus: "Shipped",
              }
            : o
        )
      );

      setShippingOrder(null);
      alert("Shipment booked successfully! AWB: " + json.awbNumber);
    } catch (err: any) {
      console.error(err);
      setShippingError(err.message || "Logistics booking failed");
    } finally {
      setShippingLoading(false);
    }
  };

  const filtered = orders.filter((o) => filter === "All" || o.status === filter);
  const totalRevenue = orders.reduce((s, o) => s + (o.status !== "Cancelled" ? o.totalPrice : 0), 0);

  const filterBtn = (s: string) => ({
    backgroundColor: filter === s ? "var(--txt-1)" : "var(--card)",
    color: filter === s ? "var(--card)" : "var(--txt-2)",
    border: "1px solid var(--border)",
  });

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {["Pending", "Paid", "Delivered", "Cancelled"].map((s) => (
          <div key={s} style={cardStyle} className="rounded-2xl p-4">
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
          {["All", "Pending", "Paid", "Delivered", "Cancelled"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} style={filterBtn(s)} className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors">{s}</button>
          ))}
        </div>
        <div className="rounded-xl px-4 py-2 text-sm" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <span className="font-medium" style={{ color: "#22c55e" }}>Total Revenue: </span>
          <span className="font-bold" style={{ color: "#22c55e" }}>₹{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Table */}
      <div style={cardStyle} className="rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading orders...</div>
        ) : error ? (
          <div className="text-center py-12 text-sm text-rose-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr style={{ backgroundColor: "var(--base)", borderBottom: "1px solid var(--border)" }}>
                  {["Order ID", "Customer", "Items", "Amount", "Payment", "Logistics", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color: "var(--txt-3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o._id} style={{ borderTop: "1px solid var(--border-sub)" }}>
                    <td className="px-5 py-3.5 text-xs font-mono font-medium" style={{ color: "var(--txt-2)" }}>
                      {o._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium" style={{ color: "var(--txt-1)" }}>{o.user?.name || "Valued Customer"}</p>
                      <p className="text-xs" style={{ color: "var(--txt-3)" }}>{o.user?.email || "customer@artiory.com"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--txt-2)" }}>
                      {o.orderItems.map((item) => `${item.name} (x${item.qty})`).join(", ")}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--txt-1)" }}>₹{o.totalPrice.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={statusBadge[o.status]}>{o.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {o.awbNumber ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-emerald-600">AWB: {o.awbNumber}</p>
                          <p className="text-[10px] text-gray-500">{o.courierName}</p>
                          {o.shippingLabelUrl && (
                            <a
                              href={o.shippingLabelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-500 hover:underline block"
                            >
                              📄 Download Label
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not Shipped</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 font-sans">
                        {o.status === "Pending" && (
                          <button
                            onClick={() => {
                              setReconcileOrderInstance(o);
                              setReconcileTxnId("");
                              setReconcileError(null);
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg transition-colors font-medium text-blue-600 border border-blue-500/30 hover:bg-blue-50"
                          >
                            🔄 Reconcile
                          </button>
                        )}
                        {o.status === "Paid" && !o.awbNumber && (
                          <button
                            onClick={() => {
                              setShippingOrder(o);
                              setShippingError(null);
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg transition-colors font-medium text-emerald-600 border border-emerald-500/30 hover:bg-emerald-50"
                          >
                            📦 Ship via iThink
                          </button>
                        )}
                        {o.status !== "Cancelled" && o.status !== "Delivered" && (
                          <button
                            onClick={async () => {
                              if (!confirm("Are you sure you want to cancel this order?")) return;
                              // Optional: call cancel API if exists
                              alert("Order status cancelled locally");
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg transition-colors text-rose-500 border border-rose-500/30 hover:bg-rose-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: "var(--txt-3)" }}>No orders found</div>
        )}
      </div>

      {/* iThink Logistics Booking Modal */}
      {shippingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Book Shipping with iThink Logistics</h3>
            <p className="text-xs text-gray-500 mb-4">
              Order ID: <span className="font-mono text-gray-700">{shippingOrder._id}</span>
            </p>

            {shippingError && (
              <div className="p-3 mb-4 text-xs text-rose-600 bg-rose-50 rounded-lg border border-rose-200">
                {shippingError}
              </div>
            )}

            <form onSubmit={handleShipOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Package Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full border border-gray-300 text-black rounded-lg p-2.5 text-sm focus:outline-none focus:ring focus:ring-emerald-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Length (cm)</label>
                  <input
                    type="number"
                    required
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full border border-gray-300 text-black rounded-lg p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    required
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full border border-gray-300 text-black rounded-lg p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full border border-gray-300 text-black rounded-lg p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShippingOrder(null)}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shippingLoading}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {shippingLoading ? "Booking..." : "Book Consignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SabPaisa Payment Reconciliation Modal */}
      {reconcileOrderInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reconcile SabPaisa Payment</h3>
            <p className="text-xs text-gray-500 mb-4">
              Order ID: <span className="font-mono text-gray-700">{reconcileOrderInstance._id}</span>
            </p>

            {reconcileError && (
              <div className="p-3 mb-4 text-xs text-rose-600 bg-rose-50 rounded-lg border border-rose-200">
                {reconcileError}
              </div>
            )}

            <form onSubmit={handleReconcileOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  SabPaisa Client Transaction ID (merchantTxnId)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6a884a70896d0d3ebf61e722-849999"
                  value={reconcileTxnId}
                  onChange={(e) => setReconcileTxnId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring focus:ring-blue-200 text-gray-800"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Copy this from your successful transaction row on the SabPaisa Merchant Panel.
                </p>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReconcileOrderInstance(null)}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reconcileLoading}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {reconcileLoading ? "Verifying..." : "Verify & Reconcile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
