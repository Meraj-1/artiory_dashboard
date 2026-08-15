"use client";
import React, { useState, useEffect } from "react";
import { getAuthToken } from "@/lib/auth";

const card = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";
type ItemType    = "Product" | "Combo";

type Item = {
  sku: string;
  name: string;
  type: ItemType;
  stock: number;
  reorderLevel: number;
  status: StockStatus;
  lastUpdated: string;
};

function calcStatus(stock: number, reorder: number): StockStatus {
  if (stock === 0)      return "Out of Stock";
  if (stock <= reorder) return "Low Stock";
  return "In Stock";
}

function now() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const statusStyle: Record<StockStatus, { backgroundColor: string; color: string }> = {
  "In Stock":     { backgroundColor: "rgba(34,197,94,0.12)",  color: "#22c55e" },
  "Low Stock":    { backgroundColor: "rgba(234,179,8,0.12)",  color: "#eab308" },
  "Out of Stock": { backgroundColor: "rgba(239,68,68,0.12)",  color: "#ef4444" },
};

type EditState = { sku: string; stock: string } | null;

const COLS = ["SKU Code", "Product / Combo Name", "Type", "Stock", "Status", "Last Updated", "Actions"];

export default function InventoryPage() {
  const [items,    setItems]    = useState<Item[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [filter,   setFilter]   = useState("All");
  const [search,   setSearch]   = useState("");
  const [edit,     setEdit]     = useState<EditState>(null);
  const [restock,  setRestock]  = useState<{ sku: string; qty: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const token = getAuthToken();
        const headers: Record<string, string> = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/inventory`, { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setItems(json.data.map((i: any) => ({
            sku:          i.sku          || "",
            name:         i.name         || "",
            type:         i.type         || "Product",
            stock:        Number(i.stock        ?? 0),
            reorderLevel: Number(i.reorderLevel ?? 5),
            status:       calcStatus(Number(i.stock ?? 0), Number(i.reorderLevel ?? 5)),
            lastUpdated:  i.lastUpdated  || "",
          })));
        } else {
          setError(json.message || "Failed to load inventory");
        }
      } catch {
        setError("Error connecting to inventory API");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const outCount   = items.filter((i) => i.status === "Out of Stock").length;
  const lowCount   = items.filter((i) => i.status === "Low Stock").length;
  const inCount    = items.filter((i) => i.status === "In Stock").length;
  const comboCount = items.filter((i) => i.type === "Combo").length;

  const filtered = items.filter((i) => {
    const mf = filter === "All" || i.status === filter || (filter === "Combo" && i.type === "Combo");
    const ms = i.name.toLowerCase().includes(search.toLowerCase()) ||
               i.sku.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  async function saveEdit() {
    if (!edit) return;
    try {
      const stockVal   = Number(edit.stock);
      const item       = items.find((i) => i.sku === edit.sku);
      const token      = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/inventory/${encodeURIComponent(edit.sku)}`,
        { method: "PATCH", headers, body: JSON.stringify({ stock: stockVal, reorderLevel: item?.reorderLevel }) },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update");
      setItems((p) => p.map((i) => i.sku !== edit.sku ? i : {
        ...i, stock: stockVal, status: calcStatus(stockVal, i.reorderLevel), lastUpdated: now(),
      }));
      setEdit(null);
    } catch (err: any) {
      alert(err.message || "Failed to save");
    }
  }

  async function confirmRestock() {
    if (!restock) return;
    try {
      const item     = items.find((i) => i.sku === restock.sku);
      if (!item) return;
      const newStock = item.stock + Number(restock.qty);
      const token    = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/inventory/${encodeURIComponent(restock.sku)}`,
        { method: "PATCH", headers, body: JSON.stringify({ stock: newStock, reorderLevel: item.reorderLevel }) },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to restock");
      setItems((p) => p.map((i) => i.sku !== restock.sku ? i : {
        ...i, stock: newStock, status: calcStatus(newStock, i.reorderLevel), lastUpdated: now(),
      }));
      setRestock(null);
    } catch (err: any) {
      alert(err.message || "Failed to restock");
    }
  }

  const filterBtn = (s: string) => ({
    backgroundColor: filter === s ? "var(--txt-1)" : "var(--card)",
    color:           filter === s ? "var(--card)"  : "var(--txt-2)",
    border: "1px solid var(--border)",
    cursor: "pointer",
  });

  const inp      = "px-3 py-1.5 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500";
  const inpStyle = { backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" };
  const cb       = "1px solid var(--border)"; // cell border

  if (loading) return (
    <div className="text-center py-24 text-sm" style={{ color: "var(--txt-3)" }}>Loading inventory...</div>
  );
  if (error) return (
    <div className="text-center py-24 text-sm font-medium" style={{ color: "#ef4444" }}>⚠ {error}</div>
  );

  return (
    <div className="space-y-5">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "In Stock",     value: inCount,    color: "#22c55e", alert: false },
          { label: "Low Stock",    value: lowCount,   color: "#eab308", alert: lowCount > 0 },
          { label: "Out of Stock", value: outCount,   color: "#ef4444", alert: outCount > 0 },
          { label: "Combo SKUs",   value: comboCount, color: "#8b5cf6", alert: false },
        ].map((s) => (
          <div key={s.label}
            style={{ ...card, borderRadius: 16, padding: 16, ...(s.alert ? { borderColor: s.color + "40" } : {}) }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--txt-3)" }}>
              {s.label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: s.alert ? s.color : "var(--txt-1)" }}>
              {s.value}
            </p>
            {s.alert && (
              <p style={{ fontSize: 11, fontWeight: 500, marginTop: 4, color: s.color }}>⚠ Needs attention</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Alert banner ── */}
      {(outCount > 0 || lowCount > 0) && (
        <div style={{ backgroundColor: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: 12, padding: "10px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <span>⚠</span>
          <p style={{ fontSize: 13, color: "#eab308" }}>
            <strong>{outCount} out of stock</strong> and <strong>{lowCount} low stock</strong> — restock soon to avoid missed sales.
          </p>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {["All", "In Stock", "Low Stock", "Out of Stock", "Combo"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} style={filterBtn(s)}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors">
              {s}
              <span style={{ marginLeft: 6, opacity: 0.5, fontSize: 12 }}>
                {s === "All" ? items.length : s === "Combo" ? comboCount : items.filter((i) => i.status === s).length}
              </span>
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--txt-3)", fontSize: 14 }}>⌕</span>
          <input type="text" placeholder="Search SKU or name..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--txt-1)", paddingLeft: 32, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, width: 220, outline: "none" }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 760 }}>
            <colgroup>
              <col style={{ width: "120px" }} />
              <col style={{ width: "260px" }} />
              <col style={{ width: "90px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "190px" }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "var(--base)", position: "sticky", top: 0, zIndex: 1 }}>
                {COLS.map((h, i) => (
                  <th key={h} style={{
                    padding: "11px 14px",
                    borderBottom: "2px solid var(--border)",
                    borderRight: i < COLS.length - 1 ? cb : "none",
                    color: "var(--txt-3)",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    textAlign: i >= 3 && i <= 4 ? "center" : "left",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const isEditing    = edit?.sku === item.sku;
                const isRestocking = restock?.sku === item.sku;
                const rowBg        = isEditing
                  ? "rgba(139,92,246,0.07)"
                  : idx % 2 === 0 ? "var(--card)" : "var(--base)";

                return (
                  <React.Fragment key={item.sku}>
                    <tr style={{ backgroundColor: rowBg }} className="transition-colors hover:brightness-95">

                      {/* SKU */}
                      <td style={{ padding: "11px 14px", borderBottom: cb, borderRight: cb, fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "var(--txt-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.sku}
                      </td>

                      {/* Name */}
                      <td style={{ padding: "11px 14px", borderBottom: cb, borderRight: cb, fontSize: 13, fontWeight: 500, color: "var(--txt-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name}
                      </td>

                      {/* Type */}
                      <td style={{ padding: "11px 14px", borderBottom: cb, borderRight: cb }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, display: "inline-block",
                          ...(item.type === "Combo"
                            ? { backgroundColor: "rgba(139,92,246,0.12)", color: "#8b5cf6" }
                            : { backgroundColor: "rgba(59,130,246,0.12)",  color: "#3b82f6" }),
                        }}>
                          {item.type}
                        </span>
                      </td>

                      {/* Stock */}
                      <td style={{ padding: "11px 14px", borderBottom: cb, borderRight: cb, textAlign: "center" }}>
                        {isEditing ? (
                          <input type="number" min="0" value={edit.stock}
                            onChange={(e) => setEdit((p) => p && ({ ...p, stock: e.target.value }))}
                            style={{ ...inpStyle, width: 70 }} className={inp} />
                        ) : (
                          <span style={{
                            fontSize: 17, fontWeight: 700,
                            color: item.stock === 0 ? "#ef4444" : item.stock <= item.reorderLevel ? "#eab308" : "var(--txt-1)",
                          }}>
                            {item.stock}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "11px 14px", borderBottom: cb, borderRight: cb, textAlign: "center" }}>
                        <span style={{ ...statusStyle[item.status], fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 999, display: "inline-block", whiteSpace: "nowrap" }}>
                          {item.status}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: "11px 14px", borderBottom: cb, borderRight: cb, fontSize: 12, color: "var(--txt-3)", whiteSpace: "nowrap" }}>
                        {item.lastUpdated || "—"}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "11px 14px", borderBottom: cb }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={saveEdit} style={{ fontSize: 11, padding: "5px 14px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
                              Save
                            </button>
                            <button onClick={() => setEdit(null)} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--txt-3)", cursor: "pointer" }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => setEdit({ sku: item.sku, stock: String(item.stock) })}
                              style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--txt-2)", cursor: "pointer", whiteSpace: "nowrap" }}>
                              Edit
                            </button>
                            <button
                              onClick={() => setRestock(isRestocking ? null : { sku: item.sku, qty: "5" })}
                              style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)", color: "#8b5cf6", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                              + Restock
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Restock inline row */}
                    {isRestocking && (
                      <tr style={{ backgroundColor: "rgba(139,92,246,0.05)", borderBottom: "1px solid var(--border)" }}>
                        <td colSpan={7} style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, color: "var(--txt-2)" }}>
                              Add units to <strong style={{ color: "var(--txt-1)" }}>{item.name}</strong>:
                            </span>
                            <input type="number" min="1" value={restock.qty}
                              onChange={(e) => setRestock((p) => p && ({ ...p, qty: e.target.value }))}
                              style={{ ...inpStyle, width: 80 }} className={inp} />
                            <span style={{ fontSize: 12, color: "var(--txt-3)" }}>
                              New total: <strong style={{ color: "var(--txt-1)" }}>{item.stock + Number(restock.qty || 0)}</strong>
                            </span>
                            <button onClick={confirmRestock}
                              style={{ fontSize: 12, padding: "5px 18px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
                              Confirm
                            </button>
                            <button onClick={() => setRestock(null)}
                              style={{ fontSize: 12, color: "var(--txt-3)", background: "none", border: "none", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "56px 0", fontSize: 13, color: "var(--txt-3)" }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>🔍</p>
            No items found
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, textAlign: "right", color: "var(--txt-3)" }}>
        Showing {filtered.length} of {items.length} SKUs
      </p>
    </div>
  );
}
