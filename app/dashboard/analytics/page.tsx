"use client";
import { useState } from "react";

const card = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

// ── Revenue data ──
const revenueData = {
  "7d":  [12,18,14,22,19,28,24],
  "30d": [45,52,48,61,58,72,68,75,70,82,78,90,85,92,88,95,91,98,94,102,98,105,101,108,104,110,107,114,110,118],
  "90d": [180,210,195,230,215,250,235,260,245,270,255,280,265,290,275,300,285,310,295,320,305,330,315,340,325,350,335,360,345,370],
};
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Top products ──
const topProducts = [
  { name: "Bronze Figurine",       revenue: 74000, units: 4,  pct: 100 },
  { name: "Marble Sculpture Set",  revenue: 60000, units: 5,  pct: 81  },
  { name: "Watercolor Series",     revenue: 40800, units: 6,  pct: 55  },
  { name: "Abstract Canvas Print", revenue: 36000, units: 8,  pct: 49  },
  { name: "Photography Print",     revenue: 19200, units: 6,  pct: 26  },
];

// ── Traffic sources ──
const traffic = [
  { source: "Direct",        visits: 1240, pct: 38, color: "#8b5cf6" },
  { source: "Instagram",     visits: 890,  pct: 27, color: "#3b82f6" },
  { source: "Google Search", visits: 620,  pct: 19, color: "#22c55e" },
  { source: "WhatsApp",      visits: 310,  pct: 10, color: "#f59e0b" },
  { source: "Other",         visits: 195,  pct: 6,  color: "#71717a" },
];

// ── Conversion funnel ──
const funnel = [
  { label: "Store Visits",    value: 3255, pct: 100 },
  { label: "Product Views",   value: 1840, pct: 57  },
  { label: "Add to Cart",     value: 420,  pct: 13  },
  { label: "Checkout",        value: 180,  pct: 6   },
  { label: "Orders Placed",   value: 124,  pct: 4   },
];

// ── Monthly breakdown ──
const monthly = months.map((m, i) => ({
  month: m,
  revenue: [28000,32000,29000,38000,35000,42000,39000,46000,43000,51000,48000,56000][i],
  orders:  [18,22,19,26,24,29,27,32,30,36,33,40][i],
}));

type Range = "7d" | "30d" | "90d";

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30d");
  const data = revenueData[range];
  const maxD = Math.max(...data);

  const kpis = [
    { label: "Total Revenue",    value: "₹4,87,000", change: "+22%",  up: true  },
    { label: "Total Orders",     value: "336",        change: "+14%",  up: true  },
    { label: "Avg Order Value",  value: "₹1,449",    change: "+7%",   up: true  },
    { label: "Conversion Rate",  value: "3.8%",       change: "-0.2%", up: false },
    { label: "Returning Buyers", value: "41%",        change: "+5%",   up: true  },
    { label: "Refund Rate",      value: "1.2%",       change: "-0.4%", up: true  },
  ];

  const rangeBtn = (r: Range) => ({
    backgroundColor: range === r ? "var(--txt-1)" : "var(--card)",
    color: range === r ? "var(--card)" : "var(--txt-2)",
    border: "1px solid var(--border)",
  });

  return (
    <div className="space-y-6">

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <div key={k.label} style={card} className="rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--txt-3)" }}>{k.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: "var(--txt-1)" }}>{k.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: k.up ? "#22c55e" : "#ef4444" }}>
              {k.up ? "↑" : "↓"} {k.change}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={card} className="rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Revenue Trend</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>Daily revenue in ₹000s</p>
          </div>
          <div className="flex gap-1.5">
            {(["7d","30d","90d"] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)} style={rangeBtn(r)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1 h-48">
          {data.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400 transition-all group-hover:from-violet-500 group-hover:to-violet-300"
                style={{ height: `${(v / maxD) * 100}%`, minHeight: "4px" }}
              />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                ₹{v}k
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        <div style={card} className="rounded-2xl p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--txt-1)" }}>Top Products by Revenue</h3>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-5 text-center" style={{ color: "var(--txt-3)" }}>#{i + 1}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--txt-1)" }}>{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color: "var(--txt-1)" }}>₹{p.revenue.toLocaleString()}</span>
                    <span className="text-xs ml-2" style={{ color: "var(--txt-3)" }}>{p.units} sold</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--base)" }}>
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div style={card} className="rounded-2xl p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--txt-1)" }}>Traffic Sources</h3>
          <div className="space-y-3">
            {traffic.map((t) => (
              <div key={t.source}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-sm" style={{ color: "var(--txt-2)" }}>{t.source}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "var(--txt-3)" }}>{t.visits.toLocaleString()} visits</span>
                    <span className="text-sm font-semibold w-10 text-right" style={{ color: "var(--txt-1)" }}>{t.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--base)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${t.pct}%`, backgroundColor: t.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div style={card} className="rounded-2xl p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--txt-1)" }}>Conversion Funnel</h3>
          <div className="space-y-2">
            {funnel.map((f, i) => (
              <div key={f.label} className="flex items-center gap-4">
                <span className="text-xs w-28 shrink-0" style={{ color: "var(--txt-2)" }}>{f.label}</span>
                <div className="flex-1 h-8 rounded-lg relative overflow-hidden" style={{ backgroundColor: "var(--base)" }}>
                  <div
                    className="h-full rounded-lg flex items-center px-3"
                    style={{ width: `${f.pct}%`, background: `rgba(139,92,246,${0.15 + (i * 0.15)})` }}
                  >
                    <span className="text-xs font-semibold" style={{ color: "#8b5cf6" }}>{f.value.toLocaleString()}</span>
                  </div>
                </div>
                <span className="text-xs font-medium w-10 text-right" style={{ color: "var(--txt-3)" }}>{f.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div style={card} className="rounded-2xl overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Monthly Breakdown</h3>
          </div>
          <div className="overflow-y-auto max-h-64">
            <table className="w-full">
              <thead style={{ backgroundColor: "var(--base)" }}>
                <tr>
                  {["Month","Revenue","Orders","Avg Value"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-[11px] uppercase tracking-widest" style={{ color: "var(--txt-3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.month} style={{ borderTop: "1px solid var(--border-sub)" }}>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--txt-1)" }}>{m.month}</td>
                    <td className="px-5 py-3 text-sm font-semibold" style={{ color: "var(--txt-1)" }}>₹{m.revenue.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--txt-2)" }}>{m.orders}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--txt-2)" }}>₹{Math.round(m.revenue / m.orders).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
