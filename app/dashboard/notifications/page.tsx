"use client";
import { useState } from "react";

type Notif = {
  id: number; title: string; message: string; time: string;
  type: "order" | "product" | "system" | "alert"; read: boolean;
};

const initialNotifs: Notif[] = [
  { id: 1, title: "New Order Received",    message: "Rahul Sharma placed an order for Abstract Canvas Print (₹4,500)", time: "2 min ago",  type: "order",   read: false },
  { id: 2, title: "Product Pending Review",message: "Marble Sculpture Set is awaiting review before publishing",       time: "1 hr ago",   type: "alert",   read: false },
  { id: 3, title: "Order Delivered",       message: "Order #ORD-006 for Ananya Roy has been delivered successfully",  time: "3 hrs ago",  type: "order",   read: false },
  { id: 4, title: "Product Published",     message: "Digital Art Print is now live on the store",                     time: "5 hrs ago",  type: "product", read: false },
  { id: 5, title: "New Client Registered", message: "studio@example.com has joined as a new client",                  time: "Yesterday",  type: "system",  read: true  },
  { id: 6, title: "Low Stock Alert",       message: "Bronze Figurine has only 1 unit left in stock",                  time: "Yesterday",  type: "alert",   read: true  },
  { id: 7, title: "Order Shipped",         message: "Order #ORD-002 for Priya Mehta has been shipped",                time: "2 days ago", type: "order",   read: true  },
];

const typeIcon: Record<string, { icon: string; color: string }> = {
  order:   { icon: "◈", color: "#3b82f6" },
  product: { icon: "◫", color: "#8b5cf6" },
  system:  { icon: "◎", color: "#71717a" },
  alert:   { icon: "⚠", color: "#f59e0b" },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(initialNotifs);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifs.filter((n) => !n.read).length;
  const displayed   = filter === "unread" ? notifs.filter((n) => !n.read) : notifs;

  function markRead(id: number)  { setNotifs((p) => p.map((n) => n.id === id ? { ...n, read: true } : n)); }
  function markAllRead()         { setNotifs((p) => p.map((n) => ({ ...n, read: true }))); }
  function deleteNotif(id: number){ setNotifs((p) => p.filter((n) => n.id !== id)); }
  function clearAll()            { setNotifs((p) => p.filter((n) => !n.read)); }

  const filterBtn = (v: string) => ({
    backgroundColor: filter === v ? "var(--txt-1)" : "var(--card)",
    color: filter === v ? "var(--card)" : "var(--txt-2)",
    border: "1px solid var(--border)",
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setFilter("all")} style={filterBtn("all")} className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
            All <span className="ml-1 opacity-50">{notifs.length}</span>
          </button>
          <button onClick={() => setFilter("unread")} style={filterBtn("unread")} className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
            Unread{" "}
            {unreadCount > 0 && (
              <span className="ml-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-medium px-3 py-1.5 rounded-lg text-violet-500 hover:bg-violet-500/10 transition-colors">
              Mark all read
            </button>
          )}
          <button onClick={clearAll} className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ color: "var(--txt-3)" }}>
            Clear read
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {displayed.map((n) => {
          const cfg = typeIcon[n.type];
          return (
            <div
              key={n.id}
              className="rounded-2xl p-4 flex gap-4"
              style={{
                backgroundColor: "var(--card)",
                border: `1px solid ${!n.read ? "rgba(124,58,237,0.25)" : "var(--border)"}`,
                boxShadow: !n.read ? "0 0 0 1px rgba(124,58,237,0.08)" : undefined,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
              >
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--txt-1)" }}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 bg-violet-500 rounded-full shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--txt-2)" }}>{n.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs" style={{ color: "var(--txt-3)" }}>{n.time}</span>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} className="text-xs font-medium text-violet-500 hover:text-violet-400">
                      Mark read
                    </button>
                  )}
                  <button onClick={() => deleteNotif(n.id)} className="text-xs ml-auto transition-colors" style={{ color: "var(--txt-3)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--txt-3)")}
                  >✕</button>
                </div>
              </div>
            </div>
          );
        })}
        {displayed.length === 0 && (
          <div className="text-center py-16" style={{ color: "var(--txt-3)" }}>
            <p className="text-4xl mb-3">◉</p>
            <p className="text-sm">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
