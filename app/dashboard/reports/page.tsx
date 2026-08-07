"use client";
import { useState } from "react";

const card = { backgroundColor:"var(--card)", border:"1px solid var(--border)" };

const reportTypes = [
  { id:"sales",     icon:"📈", title:"Sales Report",      desc:"Revenue, orders, avg order value by date range",       lastGen:"Jan 10, 2025" },
  { id:"tax",       icon:"🧾", title:"GST / Tax Report",  desc:"Tax collected, CGST, SGST, IGST breakdown",            lastGen:"Jan 1, 2025"  },
  { id:"inventory", icon:"📦", title:"Inventory Report",  desc:"Current stock levels, low stock, inventory value",     lastGen:"Jan 10, 2025" },
  { id:"customers", icon:"👥", title:"Customer Report",   desc:"New vs returning, top customers, city-wise breakdown", lastGen:"Jan 5, 2025"  },
  { id:"products",  icon:"🖼️", title:"Product Performance",desc:"Views, conversions, revenue per product",             lastGen:"Jan 8, 2025"  },
  { id:"shipping",  icon:"🚚", title:"Shipping Report",   desc:"Courier-wise orders, delivery times, COD vs prepaid",  lastGen:"Jan 7, 2025"  },
];

const salesData = [
  { period:"Jan 1–7",   orders:28, revenue:124500, returns:2, tax:11205 },
  { period:"Jan 8–10",  orders:12, revenue:58200,  returns:0, tax:5238  },
  { period:"Dec 25–31", orders:35, revenue:168000, returns:3, tax:15120 },
  { period:"Dec 18–24", orders:29, revenue:132000, returns:1, tax:11880 },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string|null>(null);
  const [generated, setGenerated]   = useState<string|null>(null);
  const [dateFrom, setDateFrom]     = useState("2025-01-01");
  const [dateTo, setDateTo]         = useState("2025-01-10");
  const [format, setFormat]         = useState<"csv"|"pdf">("csv");

  function generate(id:string) {
    setGenerating(id);
    setTimeout(()=>{ setGenerating(null); setGenerated(id); setTimeout(()=>setGenerated(null),3000); }, 1800);
  }

  const inputStyle = { backgroundColor:"var(--base)", borderColor:"var(--border)", color:"var(--txt-1)" };
  const inputClass = "px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

  const totalRevenue = salesData.reduce((s,d)=>s+d.revenue,0);
  const totalOrders  = salesData.reduce((s,d)=>s+d.orders,0);
  const totalTax     = salesData.reduce((s,d)=>s+d.tax,0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Total Revenue (Jan)", value:`₹${totalRevenue.toLocaleString()}`, color:"#22c55e" },
          { label:"Total Orders (Jan)",  value:totalOrders,                          color:"#3b82f6" },
          { label:"Tax Collected (Jan)", value:`₹${totalTax.toLocaleString()}`,      color:"#f59e0b" },
          { label:"Avg Order Value",     value:`₹${Math.round(totalRevenue/totalOrders).toLocaleString()}`, color:"#8b5cf6" },
        ].map(s=>(
          <div key={s.label} style={card} className="rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color:"var(--txt-3)" }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Date range + format */}
      <div style={card} className="rounded-2xl p-5 flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:"var(--txt-3)" }}>From</label>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={inputStyle} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:"var(--txt-3)" }}>To</label>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={inputStyle} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:"var(--txt-3)" }}>Format</label>
          <div className="flex rounded-xl overflow-hidden" style={{ border:"1px solid var(--border)" }}>
            {(["csv","pdf"] as const).map(f=>(
              <button key={f} onClick={()=>setFormat(f)}
                style={{ backgroundColor:format===f?"var(--txt-1)":"var(--card)", color:format===f?"var(--card)":"var(--txt-2)" }}
                className="px-5 py-2.5 text-sm font-medium uppercase transition-colors">{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {reportTypes.map(r=>(
          <div key={r.id} style={card} className="rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{r.icon}</span>
              <div>
                <p className="font-semibold" style={{ color:"var(--txt-1)" }}>{r.title}</p>
                <p className="text-xs mt-0.5" style={{ color:"var(--txt-2)" }}>{r.desc}</p>
                <p className="text-xs mt-1" style={{ color:"var(--txt-3)" }}>Last generated: {r.lastGen}</p>
              </div>
            </div>
            {generated===r.id && (
              <p className="text-xs font-medium" style={{ color:"#22c55e" }}>✓ Report ready — downloading...</p>
            )}
            <button onClick={()=>generate(r.id)} disabled={generating===r.id}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              style={{ backgroundColor:"rgba(139,92,246,0.1)", color:"#8b5cf6", border:"1px solid rgba(139,92,246,0.2)" }}>
              {generating===r.id ? "Generating..." : `↓ Download ${format.toUpperCase()}`}
            </button>
          </div>
        ))}
      </div>

      {/* Sales breakdown table */}
      <div style={card} className="rounded-2xl overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom:"1px solid var(--border)" }}>
          <h3 className="font-semibold" style={{ color:"var(--txt-1)" }}>Sales Breakdown</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor:"var(--base)", borderBottom:"1px solid var(--border)" }}>
              {["Period","Orders","Revenue","Returns","Tax Collected","Net Revenue"].map(h=>(
                <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color:"var(--txt-3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {salesData.map(d=>(
              <tr key={d.period} style={{ borderTop:"1px solid var(--border-sub)" }}>
                <td className="px-5 py-3.5 text-sm font-medium" style={{ color:"var(--txt-1)" }}>{d.period}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color:"var(--txt-2)" }}>{d.orders}</td>
                <td className="px-5 py-3.5 text-sm font-semibold" style={{ color:"var(--txt-1)" }}>₹{d.revenue.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color:d.returns>0?"#ef4444":"var(--txt-3)" }}>{d.returns}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color:"var(--txt-2)" }}>₹{d.tax.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-sm font-semibold" style={{ color:"#22c55e" }}>₹{(d.revenue-d.tax).toLocaleString()}</td>
              </tr>
            ))}
            <tr style={{ borderTop:"2px solid var(--border)", backgroundColor:"var(--base)" }}>
              <td className="px-5 py-3.5 text-sm font-bold" style={{ color:"var(--txt-1)" }}>Total</td>
              <td className="px-5 py-3.5 text-sm font-bold" style={{ color:"var(--txt-1)" }}>{totalOrders}</td>
              <td className="px-5 py-3.5 text-sm font-bold" style={{ color:"var(--txt-1)" }}>₹{totalRevenue.toLocaleString()}</td>
              <td className="px-5 py-3.5 text-sm font-bold" style={{ color:"#ef4444" }}>{salesData.reduce((s,d)=>s+d.returns,0)}</td>
              <td className="px-5 py-3.5 text-sm font-bold" style={{ color:"var(--txt-1)" }}>₹{totalTax.toLocaleString()}</td>
              <td className="px-5 py-3.5 text-sm font-bold" style={{ color:"#22c55e" }}>₹{(totalRevenue-totalTax).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
