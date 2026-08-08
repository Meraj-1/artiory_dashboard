"use client";
import { useState, useEffect } from "react";
import { getAuthToken } from "@/lib/auth";

const card = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

type Coupon = {
  id: string | number; code: string; type: "percent" | "flat"; value: number;
  minOrder: number; uses: number; maxUses: number; expiry: string;
  active: boolean; description: string;
};

const emptyForm = { code:"", type:"percent" as "percent"|"flat", value:"", minOrder:"", maxUses:"", expiry:"", description:"" };

export default function DiscountsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // ── Load Coupons ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadCoupons() {
      try {
        setLoading(true);
        setError("");

        const token = getAuthToken();
        const headers: Record<string, string> = {
          Accept: "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://artiory-backend.vercel.app"}/api/coupons`, { headers });
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          const mapped: Coupon[] = json.data.map((c: any) => ({
            id: c._id || c.id,
            code: c.code || "",
            type: c.type || "percent",
            value: Number(c.value ?? 0),
            minOrder: Number(c.minOrder ?? 0),
            uses: Number(c.uses ?? 0),
            maxUses: Number(c.maxUses ?? 999),
            expiry: c.expiry ? new Date(c.expiry).toISOString().split("T")[0] : "",
            active: !!c.active,
            description: c.description || "",
          }));
          setCoupons(mapped);
        } else {
          setError(json.message || "Failed to load coupons data");
        }
      } catch (err) {
        console.error(err);
        setError("Error connecting to coupons backend API");
      } finally {
        setLoading(false);
      }
    }
    loadCoupons();
  }, []);

  async function toggle(id: string | number) {
    try {
      const c = coupons.find((x) => x.id === id);
      if (!c) return;

      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://artiory-backend.vercel.app"}/api/coupons/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ active: !c.active }),
      });

      if (!res.ok) throw new Error("Failed to update coupon status");

      setCoupons((p) => p.map((x) => x.id === id ? { ...x, active: !x.active } : x));
    } catch (err) {
      console.error(err);
      alert("Failed to toggle coupon status");
    }
  }

  async function deleteCoupon(id: string | number) {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://artiory-backend.vercel.app"}/api/coupons/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) throw new Error("Failed to delete coupon");

      setCoupons((p) => p.filter((x) => x.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete coupon");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) { setError("Coupon code is required"); return; }
    if (!form.value) { setError("Discount value is required"); return; }
    if (!form.expiry) { setError("Expiry date is required"); return; }
    if (coupons.find((c) => c.code === form.code.toUpperCase())) { setError("Code already exists"); return; }
    
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxUses: Number(form.maxUses) || 999,
        expiry: form.expiry,
        description: form.description,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://artiory-backend.vercel.app"}/api/coupons`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create coupon");

      const created: Coupon = {
        id: json.data._id || json.data.id,
        code: json.data.code,
        type: json.data.type,
        value: Number(json.data.value),
        minOrder: Number(json.data.minOrder),
        uses: Number(json.data.uses ?? 0),
        maxUses: Number(json.data.maxUses),
        expiry: json.data.expiry ? new Date(json.data.expiry).toISOString().split("T")[0] : "",
        active: !!json.data.active,
        description: json.data.description,
      };

      setCoupons((p) => [created, ...p]);
      setForm(emptyForm);
      setShowForm(false);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create coupon");
    }
  }

  const inputStyle = { backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" };
  const inputClass = "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-[color:var(--txt-3)]";

  const totalSavings = coupons.reduce((s, c) => s + (c.type === "flat" ? c.value * c.uses : 0), 0);
  const activeCoupons = coupons.filter((c) => c.active).length;

  if (loading) {
    return <div className="text-center py-24 text-sm" style={{ color: "var(--txt-3)" }}>Loading discount coupons...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Coupons",   value: coupons.length,    color: "#8b5cf6" },
          { label: "Active",          value: activeCoupons,     color: "#22c55e" },
          { label: "Total Uses",      value: coupons.reduce((s,c)=>s+c.uses,0), color: "#3b82f6" },
          { label: "Savings Given",   value: `₹${totalSavings.toLocaleString()}`, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={card} className="rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--txt-3)" }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--txt-1)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Coupon Codes</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">
          {showForm ? "✕ Cancel" : "+ Create Coupon"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={card} className="rounded-2xl p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--txt-1)" }}>New Coupon</h3>
          {error && (
            <div className="mb-4 rounded-xl px-4 py-2.5 text-sm text-rose-500" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt-3)" }}>Coupon Code *</label>
              <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20" style={inputStyle} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt-3)" }}>Discount Type</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "percent"|"flat" }))}
                style={inputStyle} className={inputClass}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt-3)" }}>
                {form.type === "percent" ? "Discount %" : "Discount ₹"} *
              </label>
              <input type="number" min="1" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                placeholder={form.type === "percent" ? "e.g. 20" : "e.g. 500"} style={inputStyle} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt-3)" }}>Min Order (₹)</label>
              <input type="number" min="0" value={form.minOrder} onChange={(e) => setForm((p) => ({ ...p, minOrder: e.target.value }))}
                placeholder="e.g. 2000" style={inputStyle} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt-3)" }}>Max Uses</label>
              <input type="number" min="1" value={form.maxUses} onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                placeholder="e.g. 100" style={inputStyle} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt-3)" }}>Expiry Date</label>
              <input type="date" value={form.expiry} onChange={(e) => setForm((p) => ({ ...p, expiry: e.target.value }))}
                style={inputStyle} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt-3)" }}>Description</label>
              <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Internal note about this coupon" style={inputStyle} className={inputClass} />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="space-y-3">
        {coupons.map((c) => {
          const usePct = Math.round((c.uses / c.maxUses) * 100);
          const expired = new Date(c.expiry) < new Date();
          return (
            <div key={c.id} style={{ ...card, opacity: !c.active ? 0.6 : 1 }} className="rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 rounded-xl font-mono font-bold text-sm" style={{ backgroundColor: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
                    {c.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold" style={{ color: "var(--txt-1)" }}>
                        {c.type === "percent" ? `${c.value}% OFF` : `₹${c.value} OFF`}
                      </span>
                      {c.minOrder > 0 && (
                        <span className="text-xs" style={{ color: "var(--txt-3)" }}>on orders above ₹{c.minOrder.toLocaleString()}</span>
                      )}
                      {expired && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Expired</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>{c.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Toggle */}
                  <button onClick={() => toggle(c.id)}
                    className="relative w-11 h-6 rounded-full transition-colors"
                    style={{ backgroundColor: c.active ? "#8b5cf6" : "var(--border)" }}>
                    <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                      style={{ left: c.active ? "22px" : "2px" }} />
                  </button>
                  <button onClick={() => deleteCoupon(c.id)} className="text-xs px-3 py-1.5 rounded-lg text-rose-500 transition-colors"
                    style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                    Delete
                  </button>
                </div>
              </div>
              {/* Usage bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--txt-3)" }}>
                  <span>{c.uses} / {c.maxUses} uses</span>
                  <span>Expires: {c.expiry}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--base)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${usePct}%`, backgroundColor: usePct >= 90 ? "#ef4444" : usePct >= 60 ? "#f59e0b" : "#8b5cf6" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
