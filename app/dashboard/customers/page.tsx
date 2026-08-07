"use client";
import { useState } from "react";

const card = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

type Customer = {
  id: number; name: string; email: string; phone: string;
  city: string; orders: number; spent: number; lastOrder: string;
  status: "Active" | "Inactive" | "VIP"; joined: string; avatar: string;
};

const allCustomers: Customer[] = [
  { id:1, name:"Rahul Sharma",   email:"rahul@example.com",   phone:"+91 98765 43210", city:"Mumbai",    orders:8,  spent:62000, lastOrder:"Jan 10", status:"VIP",      joined:"Mar 2024", avatar:"R" },
  { id:2, name:"Priya Mehta",    email:"priya@example.com",   phone:"+91 87654 32109", city:"Delhi",     orders:5,  spent:38500, lastOrder:"Jan 9",  status:"Active",   joined:"May 2024", avatar:"P" },
  { id:3, name:"Arjun Nair",     email:"arjun@example.com",   phone:"+91 76543 21098", city:"Bangalore", orders:3,  spent:14200, lastOrder:"Jan 9",  status:"Active",   joined:"Jul 2024", avatar:"A" },
  { id:4, name:"Sneha Patel",    email:"sneha@example.com",   phone:"+91 65432 10987", city:"Ahmedabad", orders:2,  spent:9800,  lastOrder:"Jan 8",  status:"Active",   joined:"Aug 2024", avatar:"S" },
  { id:5, name:"Vikram Singh",   email:"vikram@example.com",  phone:"+91 54321 09876", city:"Jaipur",    orders:1,  spent:3200,  lastOrder:"Jan 7",  status:"Inactive", joined:"Sep 2024", avatar:"V" },
  { id:6, name:"Ananya Roy",     email:"ananya@example.com",  phone:"+91 43210 98765", city:"Kolkata",   orders:6,  spent:52000, lastOrder:"Jan 6",  status:"VIP",      joined:"Apr 2024", avatar:"A" },
  { id:7, name:"Karan Joshi",    email:"karan@example.com",   phone:"+91 32109 87654", city:"Pune",      orders:4,  spent:28000, lastOrder:"Dec 28", status:"Active",   joined:"Jun 2024", avatar:"K" },
  { id:8, name:"Meera Iyer",     email:"meera@example.com",   phone:"+91 21098 76543", city:"Chennai",   orders:7,  spent:71000, lastOrder:"Dec 25", status:"VIP",      joined:"Feb 2024", avatar:"M" },
  { id:9, name:"Rohan Das",      email:"rohan@example.com",   phone:"+91 10987 65432", city:"Hyderabad", orders:2,  spent:11200, lastOrder:"Dec 20", status:"Active",   joined:"Oct 2024", avatar:"R" },
  { id:10,name:"Divya Kapoor",   email:"divya@example.com",   phone:"+91 09876 54321", city:"Lucknow",   orders:1,  spent:4500,  lastOrder:"Dec 15", status:"Inactive", joined:"Nov 2024", avatar:"D" },
];

const statusBadge: Record<string, { bg: string; color: string }> = {
  VIP:      { bg: "rgba(234,179,8,0.12)",   color: "#eab308" },
  Active:   { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
  Inactive: { bg: "rgba(113,113,122,0.12)", color: "#71717a" },
};

const avatarColors = ["#8b5cf6","#3b82f6","#22c55e","#f59e0b","#ef4444","#06b6d4","#ec4899"];

export default function CustomersPage() {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [sortKey, setSortKey] = useState<"spent" | "orders" | "name">("spent");

  const filtered = allCustomers
    .filter((c) => {
      const ms = c.name.toLowerCase().includes(search.toLowerCase()) ||
                 c.email.toLowerCase().includes(search.toLowerCase()) ||
                 c.city.toLowerCase().includes(search.toLowerCase());
      const mf = filter === "All" || c.status === filter;
      return ms && mf;
    })
    .sort((a, b) => sortKey === "name" ? a.name.localeCompare(b.name) : b[sortKey] - a[sortKey]);

  const totalRevenue = allCustomers.reduce((s, c) => s + c.spent, 0);
  const vipCount     = allCustomers.filter((c) => c.status === "VIP").length;
  const avgSpend     = Math.round(totalRevenue / allCustomers.length);

  const filterBtn = (s: string) => ({
    backgroundColor: filter === s ? "var(--txt-1)" : "var(--card)",
    color: filter === s ? "var(--card)" : "var(--txt-2)",
    border: "1px solid var(--border)",
  });

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: allCustomers.length, sub: "+3 this month",  color: "#8b5cf6" },
          { label: "VIP Customers",   value: vipCount,            sub: "High value",     color: "#eab308" },
          { label: "Total Revenue",   value: `₹${totalRevenue.toLocaleString()}`, sub: "All time", color: "#22c55e" },
          { label: "Avg Lifetime Value", value: `₹${avgSpend.toLocaleString()}`, sub: "Per customer", color: "#3b82f6" },
        ].map((s) => (
          <div key={s.label} style={card} className="rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--txt-3)" }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--txt-1)" }}>{s.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: s.color }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        {/* Customer List */}
        <div className="flex-1 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-wrap">
              {["All","VIP","Active","Inactive"].map((s) => (
                <button key={s} onClick={() => setFilter(s)} style={filterBtn(s)} className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  {s} <span className="ml-1 opacity-50">{s === "All" ? allCustomers.length : allCustomers.filter((c) => c.status === s).length}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 ml-auto">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--txt-3)" }}>⌕</span>
                <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                  className="pl-8 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-52 placeholder:text-[color:var(--txt-3)]" />
              </div>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--txt-2)" }}
                className="px-3 py-2 rounded-lg border text-sm focus:outline-none">
                <option value="spent">Sort: Highest Spend</option>
                <option value="orders">Sort: Most Orders</option>
                <option value="name">Sort: Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={card} className="rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--base)", borderBottom: "1px solid var(--border)" }}>
                  {["Customer","City","Orders","Total Spent","Last Order","Status",""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color: "var(--txt-3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--border-sub)", backgroundColor: selected?.id === c.id ? "rgba(139,92,246,0.05)" : undefined }}
                    className="cursor-pointer" onClick={() => setSelected(selected?.id === c.id ? null : c)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
                          {c.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--txt-1)" }}>{c.name}</p>
                          <p className="text-xs" style={{ color: "var(--txt-3)" }}>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "var(--txt-2)" }}>{c.city}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--txt-1)" }}>{c.orders}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--txt-1)" }}>₹{c.spent.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--txt-3)" }}>{c.lastOrder}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={statusBadge[c.status]}>{c.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-violet-500">
                      {selected?.id === c.id ? "▲ Hide" : "▼ View"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-sm" style={{ color: "var(--txt-3)" }}>No customers found</div>
            )}
          </div>
        </div>

        {/* Customer Detail Panel */}
        {selected && (
          <div style={card} className="xl:w-72 rounded-2xl p-5 space-y-5 shrink-0 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Customer Profile</h3>
              <button onClick={() => setSelected(null)} className="text-xs" style={{ color: "var(--txt-3)" }}>✕</button>
            </div>
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: avatarColors[allCustomers.findIndex((c) => c.id === selected.id) % avatarColors.length] }}>
                {selected.avatar}
              </div>
              <p className="font-semibold" style={{ color: "var(--txt-1)" }}>{selected.name}</p>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={statusBadge[selected.status]}>{selected.status}</span>
            </div>
            <div className="space-y-2.5" style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
              {[
                ["Email",      selected.email],
                ["Phone",      selected.phone],
                ["City",       selected.city],
                ["Joined",     selected.joined],
                ["Orders",     String(selected.orders)],
                ["Total Spent","₹" + selected.spent.toLocaleString()],
                ["Last Order", selected.lastOrder],
                ["Avg Order",  "₹" + Math.round(selected.spent / selected.orders).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: "var(--txt-3)" }}>{k}</span>
                  <span className="font-medium" style={{ color: "var(--txt-1)" }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <button className="w-full py-2 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 transition-colors">
                Send Message
              </button>
              <button className="w-full py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--txt-2)", backgroundColor: "var(--base)" }}>
                View All Orders
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
