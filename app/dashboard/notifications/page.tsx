"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAuthToken } from "@/lib/auth";
import { 
  AlertTriangle, 
  Package, 
  Truck, 
  User, 
  CheckCircle2, 
  X, 
  RotateCw, 
  ArrowRight,
  ShoppingBag,
  BellRing,
  Layers
} from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "order" | "inventory" | "alert" | "customer" | "system";
  category: "stock" | "order" | "shipping" | "customer" | "system";
  link: string;
  read: boolean;
  badge?: string;
  badgeColor?: string;
  createdAt: string;
};

type NotificationStats = {
  total: number;
  unread: number;
  outOfStock: number;
  lowStock: number;
  recentOrders: number;
};

function formatTimeAgo(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Recently";
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
    if (diffSec < 172800) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Recently";
  }
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    outOfStock: 0,
    lowStock: 0,
    recentOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "outOfStock" | "lowStock" | "orders" | "customers" | "unread">("all");

  const fetchNotifications = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const token = getAuthToken();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["x-auth-token"] = token;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/notifications`,
        { headers }
      );

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotifs(json.data);
          if (json.stats) setStats(json.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
    const timer = setInterval(() => fetchNotifications(false), 15000); // 15s auto-sync
    return () => clearInterval(timer);
  }, []);

  const markRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));

    try {
      const token = getAuthToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/notifications/${id}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
    } catch (e) {
      console.error("Mark read API error:", e);
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifs.filter((n) => !n.read).map((n) => n.id);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setStats((prev) => ({ ...prev, unread: 0 }));

    try {
      const token = getAuthToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/notifications/mark-all-read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ notificationIds: unreadIds }),
        }
      );
    } catch (e) {
      console.error("Mark all read API error:", e);
    }
  };

  const dismissNotif = async (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    try {
      const token = getAuthToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/notifications/${id}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
    } catch (e) {
      console.error("Dismiss API error:", e);
    }
  };

  // Filtering
  const displayed = notifs.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "outOfStock") return n.title.includes("Out of Stock") || n.badge === "OUT OF STOCK" || n.badge === "COMBO OOS";
    if (filter === "lowStock") return n.type === "inventory" || n.title.includes("Low Stock");
    if (filter === "orders") return n.category === "order" || n.category === "shipping";
    if (filter === "customers") return n.category === "customer";
    return true;
  });

  const getIcon = (n: NotificationItem) => {
    if (n.title.includes("Out of Stock") || n.badge === "OUT OF STOCK") {
      return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
    if (n.title.includes("Low Stock")) {
      return <Package className="w-5 h-5 text-amber-400" />;
    }
    if (n.category === "shipping") {
      return <Truck className="w-5 h-5 text-purple-400" />;
    }
    if (n.category === "order") {
      return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
    }
    if (n.category === "customer") {
      return <User className="w-5 h-5 text-indigo-400" />;
    }
    return <BellRing className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <BellRing className="w-6 h-6 text-violet-400" />
            <span>Store Notifications & Live Alerts</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time updates on out-of-stock items, low inventory, customer orders, and shipping status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchNotifications(false)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-800 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-violet-400" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Sync Now"}</span>
          </button>
          {stats.unread > 0 && (
            <button
              onClick={markAllRead}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30 hover:bg-violet-500/25 flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          onClick={() => setFilter("outOfStock")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "outOfStock"
              ? "bg-red-950/40 border-red-500 shadow-md ring-1 ring-red-500/50"
              : "bg-zinc-950 border-zinc-800/90 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Out of Stock</span>
            <span className="p-1.5 bg-red-500/15 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.outOfStock}</p>
          <p className="text-[11px] text-zinc-400 mt-1">Requires immediate restock</p>
        </button>

        <button
          onClick={() => setFilter("lowStock")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "lowStock"
              ? "bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50"
              : "bg-zinc-950 border-zinc-800/90 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Low Stock</span>
            <span className="p-1.5 bg-amber-500/15 rounded-lg">
              <Package className="w-4 h-4 text-amber-400" />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.lowStock}</p>
          <p className="text-[11px] text-zinc-400 mt-1">Stock ≤ 5 units left</p>
        </button>

        <button
          onClick={() => setFilter("orders")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "orders"
              ? "bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
              : "bg-zinc-950 border-zinc-800/90 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Recent Orders</span>
            <span className="p-1.5 bg-emerald-500/15 rounded-lg">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.recentOrders}</p>
          <p className="text-[11px] text-zinc-400 mt-1">Paid & active consignments</p>
        </button>

        <button
          onClick={() => setFilter("unread")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "unread"
              ? "bg-violet-950/40 border-violet-500 shadow-md ring-1 ring-violet-500/50"
              : "bg-zinc-950 border-zinc-800/90 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">Unread Alerts</span>
            <span className="p-1.5 bg-violet-500/15 rounded-lg">
              <BellRing className="w-4 h-4 text-violet-400" />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.unread}</p>
          <p className="text-[11px] text-zinc-400 mt-1">Awaiting admin review</p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "all", label: "All Updates", count: notifs.length },
          { key: "outOfStock", label: "🚨 Out of Stock", count: stats.outOfStock },
          { key: "lowStock", label: "⚠️ Low Stock", count: stats.lowStock },
          { key: "orders", label: "📦 Orders & Dispatch", count: stats.recentOrders },
          { key: "customers", label: "👤 Customers" },
          { key: "unread", label: "Unread", count: stats.unread },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === tab.key
                ? "bg-white text-zinc-950 font-black shadow-sm"
                : "bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === tab.key ? "bg-zinc-200 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-300"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <RotateCw className="w-7 h-7 text-violet-400 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-zinc-400">Fetching real-time store updates...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950 border border-zinc-800/80 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">All caught up!</p>
            <p className="text-xs text-zinc-400 mt-1">No notifications matching the selected filter.</p>
          </div>
        ) : (
          displayed.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex gap-4 items-start ${
                !n.read
                  ? "bg-zinc-950/90 border-violet-500/40 shadow-sm ring-1 ring-violet-500/20"
                  : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              {/* Icon */}
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                {getIcon(n)}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-extrabold text-white truncate">{n.title}</p>
                    {n.badge && (
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wide"
                        style={{
                          backgroundColor: `${n.badgeColor || "#3b82f6"}20`,
                          color: n.badgeColor || "#3b82f6",
                          border: `1px solid ${n.badgeColor || "#3b82f6"}40`,
                        }}
                      >
                        {n.badge}
                      </span>
                    )}
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0 animate-pulse" />
                  )}
                </div>

                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{n.message}</p>

                {/* Footer Bar */}
                <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-zinc-900 text-xs">
                  <span className="text-[11px] font-medium text-zinc-500 font-mono">
                    {formatTimeAgo(n.createdAt)}
                  </span>

                  {n.link && (
                    <Link
                      href={n.link}
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition ml-1"
                    >
                      <span>
                        {n.category === "stock"
                          ? "Restock in Inventory"
                          : n.category === "order" || n.category === "shipping"
                          ? "View in Orders"
                          : "View Details"}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 transition"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => dismissNotif(n.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded-md transition"
                      title="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

