"use client";
import Link from "next/link";

const stats = [
  { label: "Total Revenue", value: "₹2,84,500", change: "+18% this month", trend: "up",   grad: "from-violet-500 to-indigo-600" },
  { label: "Total Products", value: "24",        change: "+3 this week",    trend: "up",   grad: "from-blue-500 to-cyan-500" },
  { label: "Pending Orders", value: "8",         change: "Needs attention", trend: "warn", grad: "from-amber-400 to-orange-500" },
  { label: "Published",      value: "16",        change: "Live on store",   trend: "up",   grad: "from-emerald-400 to-teal-500" },
];

const chartData = [
  { month: "Aug", value: 45 }, { month: "Sep", value: 62 },
  { month: "Oct", value: 48 }, { month: "Nov", value: 78 },
  { month: "Dec", value: 91 }, { month: "Jan", value: 67 },
];

const recentProducts = [
  { name: "Abstract Canvas Print", category: "Painting",   price: "₹4,500",  status: "Published", date: "Jan 10" },
  { name: "Marble Sculpture Set",  category: "Sculpture",  price: "₹12,000", status: "Pending",   date: "Jan 9"  },
  { name: "Digital Art Print",     category: "Digital",    price: "₹2,200",  status: "Published", date: "Jan 8"  },
  { name: "Watercolor Series",     category: "Painting",   price: "₹6,800",  status: "Draft",     date: "Jan 7"  },
  { name: "Bronze Figurine",       category: "Sculpture",  price: "₹18,500", status: "Published", date: "Jan 6"  },
];

const activity = [
  { text: "New order received for Abstract Canvas Print",    time: "2 min ago",  dot: "#22c55e" },
  { text: "Marble Sculpture Set moved to Pending review",    time: "1 hr ago",   dot: "#eab308" },
  { text: "Digital Art Print published successfully",        time: "3 hrs ago",  dot: "#3b82f6" },
  { text: "New client registered: studio@example.com",      time: "Yesterday",  dot: "#8b5cf6" },
  { text: "Watercolor Series saved as Draft",               time: "Yesterday",  dot: "#71717a" },
];

const quickActions = [
  { label: "Upload Product", href: "/dashboard/products/upload", icon: "⊕" },
  { label: "Analytics",      href: "/dashboard/analytics",       icon: "◱" },
  { label: "Customers",      href: "/dashboard/customers",       icon: "◍" },
  { label: "Inventory",      href: "/dashboard/inventory",       icon: "◧" },
  // { label: "Reviews",        href: "/dashboard/reviews",         icon: "◎" },
  { label: "Discounts",      href: "/dashboard/discounts",       icon: "◬" },
  // { label: "Media Library",  href: "/dashboard/media",           icon: "◨" },
  { label: "Settings",       href: "/dashboard/settings",        icon: "◉" },
];

const statusBadge: Record<string, { bg: string; color: string }> = {
  Published: { bg: "rgba(34,197,94,0.12)",  color: "#22c55e" },
  Pending:   { bg: "rgba(234,179,8,0.12)",  color: "#eab308" },
  Draft:     { bg: "rgba(113,113,122,0.12)",color: "#71717a" },
};

const maxVal = Math.max(...chartData.map((d) => d.value));

const card = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} style={card} className="rounded-2xl p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} shrink-0`} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--txt-3)" }}>{s.label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--txt-1)" }}>{s.value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: s.trend === "warn" ? "#f59e0b" : "#22c55e" }}>
                {s.trend === "up" ? "↑ " : "⚠ "}{s.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div style={card} className="xl:col-span-2 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Revenue Overview</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>Last 6 months</p>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
              ↑ 18% vs last period
            </span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {chartData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>{d.value}k</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-indigo-400"
                  style={{ height: `${(d.value / maxVal) * 100}%` }}
                />
                <span className="text-xs" style={{ color: "var(--txt-3)" }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div style={card} className="rounded-2xl p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--txt-1)" }}>Recent Activity</h3>
          <div className="space-y-4">
            {activity.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: a.dot }} />
                <div>
                  <p className="text-sm leading-snug" style={{ color: "var(--txt-2)" }}>{a.text}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Products */}
        <div style={card} className="xl:col-span-2 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Recent Products</h3>
            <Link href="/dashboard/products" className="text-xs font-medium text-violet-500 hover:text-violet-400">
              View all →
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--base)", borderBottom: "1px solid var(--border-sub)" }}>
                {["Product", "Category", "Price", "Status", "Date"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color: "var(--txt-3)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((p) => (
                <tr key={p.name} style={{ borderTop: "1px solid var(--border-sub)" }}>
                  <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "var(--txt-1)" }}>{p.name}</td>
                  <td className="px-6 py-3.5 text-sm" style={{ color: "var(--txt-3)" }}>{p.category}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "var(--txt-2)" }}>{p.price}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={statusBadge[p.status]}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-xs" style={{ color: "var(--txt-3)" }}>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div style={card} className="rounded-2xl p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--txt-1)" }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: "var(--base)", border: "1px solid var(--border)", color: "var(--txt-2)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-center text-xs leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
