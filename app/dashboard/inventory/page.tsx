"use client";
import { useState, useEffect } from "react";
import { getAuthToken } from "@/lib/auth";

const card = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";
type ItemType    = "Product" | "Combo";

type Item = {
  sku: string; name: string; type: ItemType;
  stock: number; reorderLevel: number;
  status: StockStatus; lastUpdated: string;
};

function calcStatus(stock: number, reorder: number): StockStatus {
  if (stock === 0)           return "Out of Stock";
  if (stock <= reorder)      return "Low Stock";
  return "In Stock";
}

function now() {
  return new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusStyle: Record<StockStatus, { bg: string; color: string }> = {
  "In Stock":     { bg: "rgba(34,197,94,0.12)",  color: "#22c55e" },
  "Low Stock":    { bg: "rgba(234,179,8,0.12)",  color: "#eab308" },
  "Out of Stock": { bg: "rgba(239,68,68,0.12)",  color: "#ef4444" },
};

type EditState = { sku: string; stock: string; reorderLevel: string } | null;

export default function InventoryPage() {
  const [items, setItems]   = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [edit, setEdit]     = useState<EditState>(null);
  const [restock, setRestock] = useState<{ sku: string; qty: string } | null>(null);

  // ── Load Inventory ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadInventory() {
      try {
        setLoading(true);
        setError(null);
        
        const token = getAuthToken();
        const headers: Record<string, string> = {
          Accept: "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/inventory`, { headers });
        const json = await res.json();
        
        if (json.success && Array.isArray(json.data)) {
          const mapped: Item[] = json.data.map((i: any) => ({
            sku: i.sku || "",
            name: i.name || "",
            type: i.type || "Product",
            stock: Number(i.stock ?? 0),
            reorderLevel: Number(i.reorderLevel ?? 5),
            status: calcStatus(Number(i.stock ?? 0), Number(i.reorderLevel ?? 5)),
            lastUpdated: i.lastUpdated || "",
          }));
          setItems(mapped);
        } else {
          setError(json.message || "Failed to load inventory data");
        }
      } catch (err) {
        console.error(err);
        setError("Error connecting to inventory backend API");
      } finally {
        setLoading(false);
      }
    }
    loadInventory();
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const outCount  = items.filter((i) => i.status === "Out of Stock").length;
  const lowCount  = items.filter((i) => i.status === "Low Stock").length;
  const inCount   = items.filter((i) => i.status === "In Stock").length;
  const comboCount = items.filter((i) => i.type === "Combo").length;

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = items.filter((i) => {
    const matchFilter = filter === "All" || i.status === filter || (filter === "Combo" && i.type === "Combo");
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // ── Inline edit save ──────────────────────────────────────────────────────
  async function saveEdit() {
    if (!edit) return;
    try {
      const stockVal = Number(edit.stock);
      const reorderVal = Number(edit.reorderLevel);

      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/inventory/update`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          sku: edit.sku,
          stock: stockVal,
          reorderLevel: reorderVal,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update inventory");

      setItems((p) => p.map((i) => {
        if (i.sku !== edit.sku) return i;
        return { ...i, stock: stockVal, reorderLevel: reorderVal, status: calcStatus(stockVal, reorderVal), lastUpdated: now() };
      }));
      setEdit(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save inventory updates");
    }
  }

  // ── Restock confirm ───────────────────────────────────────────────────────
  async function confirmRestock() {
    if (!restock) return;
    try {
      const item = items.find((i) => i.sku === restock.sku);
      if (!item) return;

      const additionalStock = Number(restock.qty);
      const newStock = item.stock + additionalStock;

      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/inventory/update`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          sku: restock.sku,
          stock: newStock,
          reorderLevel: item.reorderLevel,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to restock item");

      setItems((p) => p.map((i) => {
        if (i.sku !== restock.sku) return i;
        return { ...i, stock: newStock, status: calcStatus(newStock, i.reorderLevel), lastUpdated: now() };
      }));
      setRestock(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to process restock request");
    }
  }

  const filterBtn = (s: string) => ({
    backgroundColor: filter === s ? "var(--txt-1)" : "var(--card)",
    color:           filter === s ? "var(--card)"  : "var(--txt-2)",
    border: "1px solid var(--border)",
  });

  const inp = "px-3 py-1.5 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500";
  const inpStyle = { backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--txt-1)" };

  if (loading) {
    return <div className="text-center py-24 text-sm" style={{ color: "var(--txt-3)" }}>Loading inventory data...</div>;
  }

  if (error) {
    return <div className="text-center py-24 text-sm font-medium text-rose-500">⚠ {error}</div>;
  }

  return (
    <div className="space-y-5">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "In Stock",      value: inCount,   color: "#22c55e", alert: false },
          { label: "Low Stock",     value: lowCount,  color: "#eab308", alert: lowCount > 0 },
          { label: "Out of Stock",  value: outCount,  color: "#ef4444", alert: outCount > 0 },
          { label: "Combo SKUs",    value: comboCount,color: "#8b5cf6", alert: false },
        ].map((s) => (
          <div key={s.label} style={{ ...card, ...(s.alert ? { borderColor: s.color + "40" } : {}) }} className="rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--txt-3)" }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.alert ? s.color : "var(--txt-1)" }}>{s.value}</p>
            {s.alert && <p className="text-xs mt-1 font-medium" style={{ color: s.color }}>⚠ Needs attention</p>}
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {(outCount > 0 || lowCount > 0) && (
        <div className="rounded-xl px-5 py-3 flex items-center gap-3"
          style={{ backgroundColor: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
          <span>⚠</span>
          <p className="text-sm" style={{ color: "#eab308" }}>
            <strong>{outCount} out of stock</strong> and <strong>{lowCount} low stock</strong> — restock soon to avoid missed sales.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {["All", "In Stock", "Low Stock", "Out of Stock", "Combo"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} style={filterBtn(s)}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors">
              {s}
              <span className="ml-1.5 opacity-50 text-xs">
                {s === "All"          ? items.length
                : s === "Combo"       ? comboCount
                : items.filter((i) => i.status === s).length}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--txt-3)" }}>⌕</span>
          <input type="text" placeholder="Search SKU or name..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--txt-1)" }}
            className="pl-8 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-56 placeholder:text-[color:var(--txt-3)]" />
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 900 }}>
            <colgroup>
              <col style={{ width: "110px" }} />
              <col style={{ width: "220px" }} />
              <col style={{ width: "90px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "200px" }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "var(--base)", position: "sticky", top: 0, zIndex: 1 }}>
                {["SKU Code", "Product / Combo Name", "Type", "Current Stock", "Reorder Level", "Stock Status", "Last Updated", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)", borderRight: "1px solid var(--border)", color: "var(--txt-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const isEditing    = edit?.sku === item.sku;
                const isRestocking = restock?.sku === item.sku;
                const cellBorder   = "1px solid var(--border)";
                const rowBg        = isEditing
                  ? "rgba(139,92,246,0.07)"
                  : idx % 2 === 0 ? "var(--card)" : "var(--base)";

                return (
                  <>
                    <tr key={item.sku} style={{ backgroundColor: rowBg, cursor: "default" }} className="transition-colors hover:brightness-95">

                      {/* SKU */}
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder, fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: "var(--txt-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.sku}
                      </td>

                      {/* Name */}
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder, fontSize: 13, fontWeight: 500, color: "var(--txt-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name}
                      </td>

                      {/* Type badge */}
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder }}>
                        <span style={{
                          fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, display: "inline-block",
                          ...(item.type === "Combo"
                            ? { backgroundColor: "rgba(139,92,246,0.12)", color: "#8b5cf6" }
                            : { backgroundColor: "rgba(59,130,246,0.12)",  color: "#3b82f6" }),
                        }}>
                          {item.type}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder, textAlign: "center" }}>
                        {isEditing ? (
                          <input type="number" min="0" value={edit.stock}
                            onChange={(e) => setEdit((p) => p && ({ ...p, stock: e.target.value }))}
                            style={{ ...inpStyle, width: 72 }} className={inp} />
                        ) : (
                          <span style={{ fontSize: 16, fontWeight: 700, color: item.stock === 0 ? "#ef4444" : item.stock <= item.reorderLevel ? "#eab308" : "var(--txt-1)" }}>
                            {item.stock}
                          </span>
                        )}
                      </td>

                      {/* Reorder Level */}
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder, textAlign: "center" }}>
                        {isEditing ? (
                          <input type="number" min="1" value={edit.reorderLevel}
                            onChange={(e) => setEdit((p) => p && ({ ...p, reorderLevel: e.target.value }))}
                            style={{ ...inpStyle, width: 72 }} className={inp} />
                        ) : (
                          <span style={{ fontSize: 13, color: "var(--txt-2)" }}>{item.reorderLevel}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder }}>
                        <span style={{ ...statusStyle[item.status], fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, display: "inline-block" }}>
                          {item.status}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder, fontSize: 12, color: "var(--txt-3)", whiteSpace: "nowrap" }}>
                        {item.lastUpdated}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={saveEdit}
                              style={{ fontSize: 11, padding: "4px 12px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
                              className="hover:bg-violet-700 transition-colors">
                              Save
                            </button>
                            <button onClick={() => setEdit(null)}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--txt-3)", cursor: "pointer" }}
                              className="hover:bg-[var(--base)] transition-colors">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => setEdit({ sku: item.sku, stock: String(item.stock), reorderLevel: String(item.reorderLevel) })}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--txt-2)", cursor: "pointer", whiteSpace: "nowrap" }}
                              className="hover:bg-[var(--base)] transition-colors">
                              Edit
                            </button>
                            <button
                              onClick={() => setRestock(isRestocking ? null : { sku: item.sku, qty: "5" })}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)", color: "#8b5cf6", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                              className="hover:bg-violet-500/20 transition-colors">
                              + Restock
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Restock inline row */}
                    {isRestocking && (
                      <tr style={{ backgroundColor: "rgba(139,92,246,0.05)", borderBottom: "1px solid var(--border)" }}>
                        <td colSpan={8} style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, color: "var(--txt-2)" }}>Add units to <strong>{item.name}</strong>:</span>
                            <input type="number" min="1" value={restock.qty}
                              onChange={(e) => setRestock((p) => p && ({ ...p, qty: e.target.value }))}
                              style={{ ...inpStyle, width: 80 }} className={inp} />
                            <span style={{ fontSize: 12, color: "var(--txt-3)" }}>
                              New total: <strong style={{ color: "var(--txt-1)" }}>{item.stock + Number(restock.qty || 0)}</strong>
                            </span>
                            <button onClick={confirmRestock}
                              style={{ fontSize: 12, padding: "5px 16px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
                              className="hover:bg-violet-700 transition-colors">
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
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", fontSize: 13, color: "var(--txt-3)" }}>No items found</div>
        )}
      </div>

      <p className="text-xs text-right" style={{ color: "var(--txt-3)" }}>
        Showing {filtered.length} of {items.length} SKUs
      </p>
    </div>
  );
}
