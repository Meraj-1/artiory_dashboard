"use client";
import { useState } from "react";

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

const seed: Omit<Item, "status">[] = [
  { sku: "BAG-001",   name: "Floral Backpack",        type: "Product", stock: 12, reorderLevel: 5,  lastUpdated: "10 Jan 2025, 10:30 AM" },
  { sku: "BAG-002",   name: "Tote Bag Classic",        type: "Product", stock: 3,  reorderLevel: 5,  lastUpdated: "09 Jan 2025, 02:15 PM" },
  { sku: "STA-001",   name: "Sketchbook A4",           type: "Product", stock: 0,  reorderLevel: 10, lastUpdated: "08 Jan 2025, 11:00 AM" },
  { sku: "STA-002",   name: "Pencil Box Wooden",       type: "Product", stock: 20, reorderLevel: 8,  lastUpdated: "07 Jan 2025, 09:45 AM" },
  { sku: "STA-003",   name: "Watercolor Diary",        type: "Product", stock: 4,  reorderLevel: 5,  lastUpdated: "06 Jan 2025, 04:00 PM" },
  { sku: "ACC-001",   name: "Floral Keychain",         type: "Product", stock: 50, reorderLevel: 15, lastUpdated: "05 Jan 2025, 01:20 PM" },
  { sku: "PNT-001",   name: "Abstract Canvas Print",   type: "Product", stock: 2,  reorderLevel: 3,  lastUpdated: "04 Jan 2025, 03:10 PM" },
  { sku: "COMBO-001", name: "Artist Starter Kit",      type: "Combo",   stock: 3,  reorderLevel: 5,  lastUpdated: "10 Jan 2025, 12:00 PM" },
  { sku: "COMBO-002", name: "Stationery Bundle",       type: "Combo",   stock: 0,  reorderLevel: 3,  lastUpdated: "09 Jan 2025, 05:30 PM" },
];

const initialItems: Item[] = seed.map((i) => ({ ...i, status: calcStatus(i.stock, i.reorderLevel) }));

const statusStyle: Record<StockStatus, { bg: string; color: string }> = {
  "In Stock":     { bg: "rgba(34,197,94,0.12)",  color: "#22c55e" },
  "Low Stock":    { bg: "rgba(234,179,8,0.12)",  color: "#eab308" },
  "Out of Stock": { bg: "rgba(239,68,68,0.12)",  color: "#ef4444" },
};

type EditState = { sku: string; stock: string; reorderLevel: string } | null;

export default function InventoryPage() {
  const [items, setItems]   = useState(initialItems);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [edit, setEdit]     = useState<EditState>(null);
  const [restock, setRestock] = useState<{ sku: string; qty: string } | null>(null);

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
  function saveEdit() {
    if (!edit) return;
    setItems((p) => p.map((i) => {
      if (i.sku !== edit.sku) return i;
      const s = Number(edit.stock);
      const r = Number(edit.reorderLevel);
      return { ...i, stock: s, reorderLevel: r, status: calcStatus(s, r), lastUpdated: now() };
    }));
    setEdit(null);
  }

  // ── Restock confirm ───────────────────────────────────────────────────────
  function confirmRestock() {
    if (!restock) return;
    setItems((p) => p.map((i) => {
      if (i.sku !== restock.sku) return i;
      const s = i.stock + Number(restock.qty);
      return { ...i, stock: s, status: calcStatus(s, i.reorderLevel), lastUpdated: now() };
    }));
    setRestock(null);
  }

  const filterBtn = (s: string) => ({
    backgroundColor: filter === s ? "var(--txt-1)" : "var(--card)",
    color:           filter === s ? "var(--card)"  : "var(--txt-2)",
    border: "1px solid var(--border)",
  });

  const inp = "px-3 py-1.5 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500";
  const inpStyle = { backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--txt-1)" };

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
      <div style={card} className="rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "var(--base)", borderBottom: "1px solid var(--border)" }}>
              {["SKU Code", "Product / Combo Name", "Type", "Current Stock", "Reorder Level", "Stock Status", "Last Updated", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-widest whitespace-nowrap" style={{ color: "var(--txt-3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isEditing   = edit?.sku === item.sku;
              const isRestocking = restock?.sku === item.sku;

              return (
                <>
                  <tr key={item.sku} style={{ borderTop: "1px solid var(--border-sub)", backgroundColor: isEditing ? "rgba(139,92,246,0.03)" : undefined }}>

                    {/* SKU */}
                    <td className="px-5 py-3.5 text-xs font-mono font-semibold" style={{ color: "var(--txt-3)" }}>{item.sku}</td>

                    {/* Name */}
                    <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "var(--txt-1)" }}>{item.name}</td>

                    {/* Type badge */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={item.type === "Combo"
                          ? { backgroundColor: "rgba(139,92,246,0.12)", color: "#8b5cf6" }
                          : { backgroundColor: "rgba(59,130,246,0.12)",  color: "#3b82f6" }}>
                        {item.type}
                      </span>
                    </td>

                    {/* Current Stock */}
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <input type="number" min="0" value={edit.stock}
                          onChange={(e) => setEdit((p) => p && ({ ...p, stock: e.target.value }))}
                          style={inpStyle} className={`${inp} w-20`} />
                      ) : (
                        <span className="text-lg font-bold"
                          style={{ color: item.stock === 0 ? "#ef4444" : item.stock <= item.reorderLevel ? "#eab308" : "var(--txt-1)" }}>
                          {item.stock}
                        </span>
                      )}
                    </td>

                    {/* Reorder Level */}
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <input type="number" min="1" value={edit.reorderLevel}
                          onChange={(e) => setEdit((p) => p && ({ ...p, reorderLevel: e.target.value }))}
                          style={inpStyle} className={`${inp} w-20`} />
                      ) : (
                        <span className="text-sm" style={{ color: "var(--txt-2)" }}>{item.reorderLevel}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={statusStyle[item.status]}>
                        {item.status}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "var(--txt-3)" }}>
                      {item.lastUpdated}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button onClick={saveEdit}
                            className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">
                            Save
                          </button>
                          <button onClick={() => setEdit(null)}
                            className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ border: "1px solid var(--border)", color: "var(--txt-3)" }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEdit({ sku: item.sku, stock: String(item.stock), reorderLevel: String(item.reorderLevel) })}
                            className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ border: "1px solid var(--border)", color: "var(--txt-2)" }}>
                            Edit
                          </button>
                          <button
                            onClick={() => setRestock(isRestocking ? null : { sku: item.sku, qty: "5" })}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                            style={{ border: "1px solid rgba(139,92,246,0.3)", color: "#8b5cf6", backgroundColor: "rgba(139,92,246,0.06)" }}>
                            + Restock
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Restock inline row */}
                  {isRestocking && (
                    <tr style={{ borderTop: "1px solid var(--border-sub)", backgroundColor: "rgba(139,92,246,0.04)" }}>
                      <td colSpan={8} className="px-5 py-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm" style={{ color: "var(--txt-2)" }}>Add units to <strong>{item.name}</strong>:</span>
                          <input type="number" min="1" value={restock.qty}
                            onChange={(e) => setRestock((p) => p && ({ ...p, qty: e.target.value }))}
                            style={inpStyle} className={`${inp} w-24`} />
                          <span className="text-xs" style={{ color: "var(--txt-3)" }}>
                            New total: <strong style={{ color: "var(--txt-1)" }}>{item.stock + Number(restock.qty || 0)}</strong>
                          </span>
                          <button onClick={confirmRestock}
                            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium transition-colors">
                            Confirm
                          </button>
                          <button onClick={() => setRestock(null)} className="text-xs" style={{ color: "var(--txt-3)" }}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: "var(--txt-3)" }}>No items found</div>
        )}
      </div>

      <p className="text-xs text-right" style={{ color: "var(--txt-3)" }}>
        Showing {filtered.length} of {items.length} SKUs
      </p>
    </div>
  );
}
