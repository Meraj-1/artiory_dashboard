"use client";
import React, { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth";
import { Search, FileText, AlertTriangle, Truck, User, Phone, MapPin, CheckCircle2, RotateCcw, Package, Download, X } from "lucide-react";

type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  price: number;
};

type ShippingAddress = {
  name?: string;
  email?: string;
  phone?: string;
  home?: string;
  street?: string;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

type Order = {
  _id: string;
  user?: { name: string; email: string; number?: string };
  shippingAddress?: ShippingAddress;
  orderItems: { name: string; qty: number; price: number }[];
  totalPrice: number;
  status: "Pending" | "Paid" | "Shipped" | "Delivered" | "Cancelled" | "Failed";
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
  Shipped: { bg: "rgba(168,85,247,0.12)", color: "#a855f7" },
  Delivered: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  Cancelled: { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
  Failed: { bg: "rgba(244,63,94,0.12)", color: "#f43f5e" },
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

  // Package Presets — saved in localStorage so they persist
  const DEFAULT_PRESETS = [
    { name: "Small Envelope", weight: "0.2", length: "25", width: "18", height: "2" },
    { name: "Medium Box", weight: "0.5", length: "30", width: "20", height: "10" },
    { name: "Large Box", weight: "1.0", length: "40", width: "30", height: "20" },
  ];
  const [presets, setPresets] = React.useState<{ name: string; weight: string; length: string; width: string; height: string }[]>(() => {
    if (typeof window === "undefined") return DEFAULT_PRESETS;
    try {
      const stored = localStorage.getItem("artiory_pkg_presets");
      return stored ? JSON.parse(stored) : DEFAULT_PRESETS;
    } catch { return DEFAULT_PRESETS; }
  });
  const [showSavePreset, setShowSavePreset] = React.useState(false);
  const [presetName, setPresetName] = React.useState("");

  const applyPreset = (p: typeof presets[0]) => {
    setWeight(p.weight); setLength(p.length); setWidth(p.width); setHeight(p.height);
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPreset = { name: presetName.trim(), weight, length, width, height };
    const updated = [...presets.filter(p => p.name !== newPreset.name), newPreset];
    setPresets(updated);
    if (typeof window !== "undefined") localStorage.setItem("artiory_pkg_presets", JSON.stringify(updated));
    setPresetName(""); setShowSavePreset(false);
  };

  const deletePreset = (name: string) => {
    const updated = presets.filter(p => p.name !== name);
    setPresets(updated);
    if (typeof window !== "undefined") localStorage.setItem("artiory_pkg_presets", JSON.stringify(updated));
  };

  // Reconcile Modal State
  const [reconcileOrderInstance, setReconcileOrderInstance] = useState<Order | null>(null);
  const [reconcileTxnId, setReconcileTxnId] = useState("");
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  // Live Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // NDR Action Modal State
  const [ndrOrder, setNdrOrder] = useState<Order | null>(null);
  const [ndrAction, setNdrAction] = useState<"1" | "2">("1");
  const [ndrDate, setNdrDate] = useState("2026-08-29");
  const [ndrTime, setNdrTime] = useState("14:00:00");
  const [ndrPhone, setNdrPhone] = useState("");
  const [ndrAddress, setNdrAddress] = useState("");
  const [ndrRemark, setNdrRemark] = useState("Customer requested rescheduling");
  const [ndrLoading, setNdrLoading] = useState(false);
  const [ndrMsg, setNdrMsg] = useState<{ success: boolean; text: string } | null>(null);

  const handleOpenTracking = async (order: Order) => {
    if (!order.awbNumber) return;
    setTrackingOrder(order);
    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingData(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/logistics/order/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awb_number_list: order.awbNumber }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTrackingData(json.data?.[order.awbNumber] || json.data);
      } else {
        throw new Error(json.message || "Failed to load live tracking");
      }
    } catch (e: any) {
      setTrackingError(e.message || "Error fetching tracking details");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleNdrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ndrOrder?.awbNumber) return;

    try {
      setNdrLoading(true);
      setNdrMsg(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/logistics/ndr/add-reattempt-rto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awb_numbers: ndrOrder.awbNumber,
          ndr_action: Number(ndrAction),
          reattempt_date: ndrAction === "1" ? ndrDate : undefined,
          reattempt_time: ndrAction === "1" ? ndrTime : undefined,
          reattempt_mobile_number: ndrAction === "1" && ndrPhone ? Number(ndrPhone) : undefined,
          reattempt_address: ndrAction === "1" && ndrAddress ? ndrAddress : undefined,
          rto_remark: ndrAction === "2" ? ndrRemark : undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNdrMsg({ success: true, text: json.message || (ndrAction === "1" ? "Reattempt scheduled!" : "Consignment marked for RTO!") });
        // Update local order shipment status
        setOrders((prev) =>
          prev.map((o) =>
            o._id === ndrOrder._id
              ? { ...o, shipmentStatus: ndrAction === "1" ? "In-Transit" : "RTO" }
              : o
          )
        );
      } else {
        throw new Error(json.message || "NDR action failed");
      }
    } catch (e: any) {
      setNdrMsg({ success: false, text: e.message || "Failed to execute NDR action" });
    } finally {
      setNdrLoading(false);
    }
  };

  const handleReconcileOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileOrderInstance) return;

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

      const txnIdToSend = reconcileTxnId || (reconcileOrderInstance as any).clientTxnId || reconcileOrderInstance._id;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/orders/reconcile`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            orderId: reconcileOrderInstance._id,
            clientTxnId: txnIdToSend,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to reconcile order with SabPaisa");
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-white">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {["Pending", "Paid", "Delivered", "Cancelled"].map((s) => (
          <div key={s} style={{ backgroundColor: "#09090b", border: "1px solid #27272a" }} className="rounded-2xl p-5 shadow-sm bg-zinc-950/80">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{s} Orders</p>
            <p className="text-3xl font-black mt-1 text-white">
              {orders.filter((o) => o.status === s).length}
            </p>
            <span className="text-xs font-bold px-3 py-1 rounded-full mt-2.5 inline-block" style={statusBadge[s]}>{s}</span>
          </div>
        ))}
      </div>

      {/* Filter + Revenue */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {["All", "Pending", "Paid", "Shipped", "Delivered", "Cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                filter === s
                  ? "bg-white text-zinc-950 border border-white shadow-md font-black"
                  : "bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="rounded-xl px-4 py-2.5 text-xs bg-emerald-500/15 border border-emerald-500/30 shadow-xs">
          <span className="font-extrabold text-emerald-400 uppercase tracking-wider">Total Revenue: </span>
          <span className="font-black text-white text-sm font-mono ml-1">₹{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#09090b", border: "1px solid #27272a" }} className="rounded-2xl overflow-hidden shadow-sm bg-zinc-950">
        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-zinc-300">Loading orders...</div>
        ) : error ? (
          <div className="text-center py-12 text-xs font-bold text-rose-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-800 text-white font-black text-xs uppercase tracking-wider">
                  {["Order ID", "Customer", "Items", "Amount", "Payment", "Logistics", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/60">
                {filtered.map((o) => (
                  <tr key={o._id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-5 py-4 text-xs font-mono font-black text-white">
                      #{o._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold text-white">
                        {o.shippingAddress?.name || o.user?.name || "Valued Customer"}
                      </p>
                      <p className="text-xs font-semibold text-zinc-300">
                        {o.shippingAddress?.email || o.user?.email || "customer@artiory.com"}
                      </p>
                      {(o.shippingAddress?.phone || o.user?.number) && (
                        <p className="text-xs text-zinc-300 font-mono font-bold mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{o.shippingAddress?.phone || o.user?.number}</span>
                        </p>
                      )}
                      {(o.shippingAddress?.address || o.shippingAddress?.city) && (
                        <p className="text-xs text-zinc-400 font-medium max-w-[260px] truncate mt-0.5" title={`${o.shippingAddress?.home ? o.shippingAddress.home + ", " : ""}${o.shippingAddress?.street || o.shippingAddress?.address || ""}, ${o.shippingAddress?.city || ""}, ${o.shippingAddress?.state || ""} - ${o.shippingAddress?.postalCode || ""}`}>
                          📍 {o.shippingAddress.address || `${o.shippingAddress.city}, ${o.shippingAddress.state}`} ({o.shippingAddress.postalCode})
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-zinc-200">
                      {o.orderItems.map((item) => `${item.name} (x${item.qty})`).join(", ")}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-white font-mono">₹{o.totalPrice.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-black px-3 py-1 rounded-full border border-zinc-700" style={statusBadge[o.status] || { bg: "rgba(100,100,100,0.12)", color: "#ffffff" }}>{o.status}</span>
                      {((o as any).sabpaisaTxnId || (o as any).clientTxnId) && (
                        <p className="text-[10px] font-mono text-zinc-400 mt-1 max-w-[150px] truncate" title={(o as any).sabpaisaTxnId || (o as any).clientTxnId}>
                          Txn: {(o as any).sabpaisaTxnId && (o as any).sabpaisaTxnId !== "N/A" ? (o as any).sabpaisaTxnId : (o as any).clientTxnId}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {o.awbNumber ? (
                        <div className="space-y-1.5">
                          <p className="font-black text-emerald-400 text-xs font-mono">AWB: {o.awbNumber}</p>
                          <p className="text-xs font-bold text-zinc-400">{o.courierName}</p>
                          {o.shippingLabelUrl && (
                            <a
                              href={o.shippingLabelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span>Download Label</span>
                            </a>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                const token = getAuthToken();
                                const headers: Record<string, string> = { "Content-Type": "application/json" };
                                if (token) headers["Authorization"] = `Bearer ${token}`;
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com";
                                const res = await fetch(`${apiUrl}/api/logistics/shipping/invoice`, {
                                  method: "POST",
                                  headers,
                                  body: JSON.stringify({ awbNumber: o.awbNumber })
                                });
                                const json = await res.json();
                                if (json.success && json.invoice_url) {
                                  window.open(json.invoice_url, "_blank");
                                } else {
                                  alert(json.message || "Invoice not available yet");
                                }
                              } catch (e: any) {
                                alert(e.message || "Failed to download invoice");
                              }
                            }}
                            className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1 text-left"
                          >
                            <FileText className="w-3.5 h-3.5 text-purple-400" />
                            <span>Customer Invoice</span>
                          </button>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleOpenTracking(o)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1 shadow-xs"
                            >
                              <Search className="w-3 h-3 text-emerald-300" />
                              <span>Track</span>
                            </button>
                            <button
                              onClick={() => {
                                setNdrOrder(o);
                                setNdrMsg(null);
                              }}
                              className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 hover:bg-amber-500/25 flex items-center gap-1 shadow-xs"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-300" />
                              <span>NDR Action</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-zinc-500">Not Shipped</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2 font-sans">
                        {["Pending", "Failed"].includes(o.status) && (
                          <button
                            onClick={() => {
                              setReconcileOrderInstance(o);
                              setReconcileTxnId((o as any).clientTxnId || o._id);
                              setReconcileError(null);
                            }}
                            className="text-xs px-3 py-1.5 rounded-xl transition-colors font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 flex items-center gap-1 shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reconcile SabPaisa</span>
                          </button>
                        )}
                        {["Paid", "Pending"].includes(o.status) && !o.awbNumber && (
                          <button
                            onClick={() => {
                              setShippingOrder(o);
                              setShippingError(null);
                            }}
                            className="text-xs px-3 py-1.5 rounded-xl transition-colors font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1 shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Ship via iThink</span>
                          </button>
                        )}
                        {o.status !== "Cancelled" && o.status !== "Delivered" && (
                          <button
                            onClick={async () => {
                              if (!confirm("Are you sure you want to cancel this order?")) return;
                              alert("Order status cancelled locally");
                            }}
                            className="text-xs px-3 py-1 rounded-xl transition-colors font-bold text-rose-400 border border-rose-800 hover:bg-rose-950/40"
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
          <div className="text-center py-12 text-sm font-bold text-zinc-400">No orders found</div>
        )}
      </div>

      {/* iThink Logistics Booking Modal */}
      {shippingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-white">
            <h3 className="text-lg font-bold text-white mb-4">Book Shipping with iThink Logistics</h3>
            <p className="text-xs text-zinc-400 mb-2">
              Order ID: <span className="font-mono text-white">{shippingOrder._id}</span>
            </p>

            {/* Customer Delivery Details Preview */}
            <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1.5 mb-4">
              <div className="font-semibold text-white flex justify-between">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-zinc-400" /> {shippingOrder.shippingAddress?.name || shippingOrder.user?.name || "Customer"}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-zinc-400" /> {shippingOrder.shippingAddress?.phone || shippingOrder.user?.number || "N/A"}</span>
              </div>
              <div className="text-zinc-400 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>{[shippingOrder.shippingAddress?.home, shippingOrder.shippingAddress?.street || shippingOrder.shippingAddress?.address, shippingOrder.shippingAddress?.landmark, shippingOrder.shippingAddress?.city, shippingOrder.shippingAddress?.state].filter(Boolean).join(", ") || "Address on record"}</span>
              </div>
              <div className="flex justify-between text-zinc-300 pt-1 border-t border-zinc-800 font-sans">
                <span>Postal PIN: <b className="font-mono text-white">{shippingOrder.shippingAddress?.postalCode || "400077"}</b></span>
                <span>Origin Warehouse: <b className="font-mono text-white">122518</b></span>
              </div>
            </div>

            {shippingError && (
              <div className="p-3 mb-4 text-xs text-rose-300 bg-rose-950/40 rounded-lg border border-rose-800/80">
                {shippingError}
              </div>
            )}

            {/* Order Items & Auto Weight Calculation Banner */}
            <div className="bg-violet-950/30 p-3.5 rounded-xl border border-violet-800/40 text-xs text-violet-200 space-y-2 mb-4">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-violet-300">
                  <Package className="w-4 h-4 text-violet-400" />
                  <span>Items ({shippingOrder.orderItems?.length || 0})</span>
                </span>
                <span className="bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-md text-[11px]">
                  ✨ Auto-Weight Applied
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                {shippingOrder.orderItems?.map((item) => `${item.name} (x${item.qty})`).join(", ")}
              </p>
              <p className="text-[11px] text-violet-400 font-medium pt-1 border-t border-violet-900/60">
                iThink Logistics calculates courier charges directly from product weights in MongoDB.
              </p>
            </div>

            <form onSubmit={handleShipOrder} className="space-y-4">
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShippingOrder(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-zinc-300 border border-zinc-700 rounded-xl hover:bg-zinc-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shippingLoading}
                  className="flex-1 py-2.5 text-xs font-black text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Truck className="w-4 h-4" />
                  <span>{shippingLoading ? "Booking..." : "⚡ Book Consignment (iThink)"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SabPaisa Payment Reconciliation Modal */}
      {reconcileOrderInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-white">
            <h3 className="text-lg font-bold text-white mb-4">Reconcile SabPaisa Payment</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Order ID: <span className="font-mono text-white">{reconcileOrderInstance._id}</span>
            </p>

            {reconcileError && (
              <div className="p-3 mb-4 text-xs text-rose-300 bg-rose-950/40 rounded-lg border border-rose-800/80">
                {reconcileError}
              </div>
            )}

            <form onSubmit={handleReconcileOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  SabPaisa Client Transaction ID (merchantTxnId)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6a884a70896d0d3ebf61e722-849999"
                  value={reconcileTxnId}
                  onChange={(e) => setReconcileTxnId(e.target.value)}
                  className="w-full border border-zinc-700 bg-zinc-900 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-zinc-500"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Copy this from your transaction row on the SabPaisa Merchant Panel.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setReconcileOrderInstance(null)}
                  className="py-2.5 px-4 text-xs font-bold text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reconcileLoading}
                  onClick={async () => {
                    if (!confirm("Are you sure you verified this transaction on SabPaisa and want to mark this order as Paid?")) return;
                    try {
                      setReconcileLoading(true);
                      const token = getAuthToken();
                      const headers: Record<string, string> = {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                      };
                      if (token) headers["Authorization"] = `Bearer ${token}`;
                      const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/orders/reconcile`,
                        {
                          method: "POST",
                          headers,
                          body: JSON.stringify({
                            orderId: reconcileOrderInstance._id,
                            clientTxnId: reconcileTxnId || (reconcileOrderInstance as any).clientTxnId || reconcileOrderInstance._id,
                            forcePaid: true,
                          }),
                        }
                      );
                      const json = await res.json();
                      if (!res.ok) throw new Error(json.message || "Failed to mark as Paid");
                      setOrders((prev) =>
                        prev.map((o) => (o._id === reconcileOrderInstance._id ? { ...o, status: "Paid" } : o))
                      );
                      setReconcileOrderInstance(null);
                      alert("Order successfully marked as Paid!");
                    } catch (e: any) {
                      setReconcileError(e.message || "Failed to mark as Paid");
                    } finally {
                      setReconcileLoading(false);
                    }
                  }}
                  className="py-2.5 px-4 text-xs font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  ✓ Confirm Paid (Manual)
                </button>
                <button
                  type="submit"
                  disabled={reconcileLoading}
                  className="flex-1 py-2.5 px-4 text-xs font-black text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {reconcileLoading ? "Verifying..." : "Verify with SabPaisa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative max-h-[85vh] overflow-y-auto text-white">
            <div className="flex justify-between items-start mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Live Shipment Tracker</h3>
                <p className="text-xs text-zinc-400 font-mono">AWB: {trackingOrder.awbNumber}</p>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="text-zinc-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {trackingLoading ? (
              <div className="py-12 text-center text-xs text-zinc-400">Fetching live milestones from courier network...</div>
            ) : trackingError ? (
              <div className="p-4 bg-rose-950/40 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-semibold">{trackingError}</div>
            ) : trackingData ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Current Status</span>
                    <p className="text-sm font-extrabold text-emerald-300">{trackingData.current_status || trackingData.status || "In-Transit"}</p>
                  </div>
                  <span className="text-xs font-semibold text-zinc-300">{trackingData.courier_name || trackingOrder.courierName}</span>
                </div>

                <div>
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Scan Checkpoints</p>
                  {Array.isArray(trackingData.scans || trackingData.scan || trackingData.history) && (trackingData.scans || trackingData.scan || trackingData.history).length > 0 ? (
                    <div className="relative pl-5 border-l-2 border-zinc-700 space-y-3">
                      {(trackingData.scans || trackingData.scan || trackingData.history).map((s: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 bg-white rounded-full border border-zinc-950" />
                          <p className="text-xs font-bold text-white">{s.activity || s.status_detail || s.location || "Checkpoint"}</p>
                          <p className="text-[11px] text-zinc-400">{s.date || s.scan_date_time || ""} • {s.location || ""}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No scan events recorded yet for this consignment.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* NDR Action Modal */}
      {ndrOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-white">
            <div className="flex justify-between items-start mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">NDR Reattempt / RTO Action</h3>
                <p className="text-xs text-zinc-400 font-mono">AWB: {ndrOrder.awbNumber}</p>
              </div>
              <button
                onClick={() => setNdrOrder(null)}
                className="text-zinc-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {ndrMsg && (
              <div className={`p-3 mb-4 rounded-xl text-xs font-semibold ${ndrMsg.success ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-rose-950/40 text-rose-300 border border-rose-800/80"}`}>
                {ndrMsg.text}
              </div>
            )}

            <form onSubmit={handleNdrSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">Select Action</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                    <input
                      type="radio"
                      name="orderNdrAction"
                      value="1"
                      checked={ndrAction === "1"}
                      onChange={() => setNdrAction("1")}
                      className="accent-white w-4 h-4"
                    />
                    <span>1. Reattempt</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-rose-400 cursor-pointer">
                    <input
                      type="radio"
                      name="orderNdrAction"
                      value="2"
                      checked={ndrAction === "2"}
                      onChange={() => setNdrAction("2")}
                      className="accent-rose-500 w-4 h-4"
                    />
                    <span>2. Return to Origin (RTO)</span>
                  </label>
                </div>
              </div>

              {ndrAction === "1" ? (
                <div className="space-y-3 p-3.5 border border-zinc-800 bg-zinc-900 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Reattempt Date</label>
                    <input
                      type="date"
                      required
                      value={ndrDate}
                      onChange={(e) => setNdrDate(e.target.value)}
                      className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Remarks / Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Customer will be available tomorrow"
                      value={ndrRemark}
                      onChange={(e) => setNdrRemark(e.target.value)}
                      className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2 text-xs placeholder-zinc-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 border border-rose-900/60 bg-rose-950/20 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-rose-300 mb-1">RTO Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer cancelled / Refused delivery"
                    value={ndrRemark}
                    onChange={(e) => setNdrRemark(e.target.value)}
                    className="w-full border border-zinc-700 bg-zinc-950 text-white rounded-lg p-2 text-xs placeholder-zinc-500"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setNdrOrder(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ndrLoading}
                  className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-colors disabled:opacity-50 ${
                    ndrAction === "1" ? "bg-white text-zinc-950 hover:bg-zinc-200" : "bg-rose-600 text-white hover:bg-rose-700"
                  }`}
                >
                  {ndrLoading ? "Submitting..." : ndrAction === "1" ? "Schedule Reattempt" : "Confirm RTO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
