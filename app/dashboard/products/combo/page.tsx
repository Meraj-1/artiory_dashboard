"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Mock inventory — replace with real API data ───────────────────────────────
const INVENTORY = [
  { sku: "BAG-001", name: "Floral Backpack",       price: 1200 },
  { sku: "BAG-002", name: "Tote Bag Classic",       price: 800  },
  { sku: "STA-001", name: "Sketchbook A4",          price: 350  },
  { sku: "STA-002", name: "Pencil Box Wooden",      price: 450  },
  { sku: "STA-003", name: "Watercolor Diary",       price: 600  },
  { sku: "ACC-001", name: "Floral Keychain",        price: 150  },
  { sku: "ACC-002", name: "Bookmark Set (5pcs)",    price: 250  },
  { sku: "PNT-001", name: "Abstract Canvas Print",  price: 4500 },
  { sku: "PNT-002", name: "Watercolor Series",      price: 6800 },
  { sku: "PHO-001", name: "Photography Print",      price: 3200 },
];

const steps = ["Basic Info", "Select Products", "Pricing & Stock", "Publish"];

const inputStyle = { backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" };
const inputClass = "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-[color:var(--txt-3)]";
const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1.5";
const card = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

export default function ComboProductPage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [search, setSearch]   = useState("");

  const [form, setForm] = useState({
    comboName: "",
    comboSku: "",
    active: true,
    comboDesc: "",
    comboPrice: "",
    stockLogic: "auto" as "auto" | "manual",
    comboStock: "",
    status: "Draft",
  });

  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function toggleSku(sku: string) {
    setSelectedSkus((p) => p.includes(sku) ? p.filter((s) => s !== sku) : [...p, sku]);
  }

  // ── Auto price = sum of selected products ────────────────────────────────
  const autoPrice = selectedSkus.reduce((sum, sku) => {
    const p = INVENTORY.find((i) => i.sku === sku);
    return sum + (p?.price ?? 0);
  }, 0);

  const savings = autoPrice - Number(form.comboPrice || 0);

  // ── Auto stock = min stock of included products (mock: show label) ───────
  const selectedProducts = INVENTORY.filter((i) => selectedSkus.includes(i.sku));

  const filteredInventory = INVENTORY.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const canNext = [
    !!(form.comboName && form.comboSku),
    selectedSkus.length >= 2,
    !!(form.comboPrice && (form.stockLogic === "auto" || form.comboStock)),
    true,
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push("/dashboard/products"), 1500);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Step Progress */}
      <div style={card} className="rounded-2xl p-5">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${i < step ? "cursor-pointer" : ""}`}
                style={{ color: i === step ? "var(--txt-1)" : i < step ? "#8b5cf6" : "var(--txt-3)" }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={
                    i < step    ? { backgroundColor: "#8b5cf6", color: "#fff" }
                    : i === step ? { backgroundColor: "var(--txt-1)", color: "var(--card)" }
                    : { backgroundColor: "var(--base)", color: "var(--txt-3)" }
                  }
                >
                  {i < step ? "✓" : i + 1}
                </span>
                <span className="hidden sm:block">{s}</span>
              </button>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: i < step ? "#8b5cf6" : "var(--border)" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {success && (
        <div className="rounded-xl px-5 py-3 text-sm font-medium"
          style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
          ✓ Combo product created! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={card} className="rounded-2xl p-6 space-y-5">

          {/* ── STEP 0 : Basic Info ─────────────────────────────────────── */}
          {step === 0 && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Combo Basic Info</h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>Name and identifier for this combo</p>
                </div>
                {/* Active toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--txt-3)" }}>Active</span>
                  <div
                    onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
                    className="relative w-10 h-5 rounded-full transition-colors"
                    style={{ backgroundColor: form.active ? "#8b5cf6" : "var(--border)" }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                      style={{ left: form.active ? "22px" : "2px" }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: form.active ? "#8b5cf6" : "var(--txt-3)" }}>
                    {form.active ? "Visible" : "Hidden"}
                  </span>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Combo Name *</label>
                  <input name="comboName" required value={form.comboName} onChange={set}
                    placeholder="e.g. Artist Starter Kit" style={inputStyle} className={inputClass} />
                </div>
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Combo SKU *</label>
                  <input name="comboSku" required value={form.comboSku} onChange={set}
                    placeholder="e.g. COMBO-001" style={inputStyle} className={inputClass} />
                  <p className="text-xs mt-1" style={{ color: "var(--txt-3)" }}>Unique combo identifier</p>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 1 : Select Products ────────────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Select Products</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>Pick at least 2 products from inventory to include in this combo</p>
              </div>

              {/* Selected chips */}
              {selectedSkus.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-xl" style={{ backgroundColor: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  {selectedProducts.map((p) => (
                    <span key={p.sku} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
                      <span>{p.name}</span>
                      <span className="opacity-60">·</span>
                      <span>₹{p.price.toLocaleString()}</span>
                      <button type="button" onClick={() => toggleSku(p.sku)} className="ml-1 hover:text-rose-500 transition-colors">✕</button>
                    </span>
                  ))}
                  <div className="w-full flex items-center justify-between pt-1">
                    <span className="text-xs" style={{ color: "var(--txt-3)" }}>{selectedSkus.length} products selected</span>
                    <span className="text-xs font-semibold" style={{ color: "#8b5cf6" }}>
                      Combined value: ₹{autoPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--txt-3)" }}>⌕</span>
                <input
                  type="text" placeholder="Search by name or SKU..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={inputStyle} className={`${inputClass} pl-8`}
                />
              </div>

              {/* Inventory list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredInventory.map((item) => {
                  const selected = selectedSkus.includes(item.sku);
                  return (
                    <div
                      key={item.sku}
                      onClick={() => toggleSku(item.sku)}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: `1px solid ${selected ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
                        backgroundColor: selected ? "rgba(139,92,246,0.06)" : "var(--base)",
                      }}
                    >
                      {/* Checkbox */}
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
                        style={{ backgroundColor: selected ? "#8b5cf6" : "var(--card)", border: `2px solid ${selected ? "#8b5cf6" : "var(--border)"}` }}>
                        {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--txt-1)" }}>{item.name}</p>
                        <p className="text-xs" style={{ color: "var(--txt-3)" }}>{item.sku}</p>
                      </div>
                      <span className="text-sm font-semibold shrink-0" style={{ color: "var(--txt-2)" }}>
                        ₹{item.price.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
                {filteredInventory.length === 0 && (
                  <p className="text-center py-6 text-sm" style={{ color: "var(--txt-3)" }}>No products found</p>
                )}
              </div>

              {selectedSkus.length < 2 && (
                <p className="text-xs" style={{ color: "#eab308" }}>⚠ Select at least 2 products to continue</p>
              )}
            </>
          )}

          {/* ── STEP 2 : Pricing & Stock ────────────────────────────────── */}
          {step === 2 && (
            <>
              <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Pricing & Stock</h3>

              <div className="space-y-4">
                {/* Combined value reference */}
                <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: "var(--base)", border: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--txt-3)" }}>Combined Product Value</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: "var(--txt-1)" }}>₹{autoPrice.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: "var(--txt-3)" }}>{selectedSkus.length} products</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>{selectedProducts.map(p => p.sku).join(", ")}</p>
                  </div>
                </div>

                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Combo Price (₹) *</label>
                  <input name="comboPrice" type="number" required value={form.comboPrice} onChange={set}
                    placeholder={String(Math.round(autoPrice * 0.85))} style={inputStyle} className={inputClass} />
                  <p className="text-xs mt-1" style={{ color: "var(--txt-3)" }}>
                    Suggested: ₹{Math.round(autoPrice * 0.85).toLocaleString()} (15% off combined value)
                  </p>
                </div>

                {/* Savings badge */}
                {form.comboPrice && savings > 0 && (
                  <div className="rounded-xl px-4 py-2.5 flex items-center gap-3"
                    style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <span className="text-sm font-bold" style={{ color: "#22c55e" }}>
                      {Math.round((savings / autoPrice) * 100)}% OFF
                    </span>
                    <span className="text-xs" style={{ color: "var(--txt-3)" }}>
                      Customer saves ₹{savings.toLocaleString()} vs buying individually
                    </span>
                  </div>
                )}

                {/* Stock Logic */}
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Stock Logic *</label>
                  <div className="flex gap-3">
                    {(["auto", "manual"] as const).map((opt) => (
                      <label key={opt} className="flex-1 flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors"
                        style={{
                          border: `2px solid ${form.stockLogic === opt ? "#8b5cf6" : "var(--border)"}`,
                          backgroundColor: form.stockLogic === opt ? "rgba(139,92,246,0.08)" : "var(--base)",
                        }}>
                        <input type="radio" name="stockLogic" value={opt}
                          checked={form.stockLogic === opt}
                          onChange={() => setForm((p) => ({ ...p, stockLogic: opt }))}
                          className="accent-violet-600" />
                        <div>
                          <p className="text-sm font-semibold capitalize" style={{ color: "var(--txt-1)" }}>{opt}</p>
                          <p className="text-xs" style={{ color: "var(--txt-3)" }}>
                            {opt === "auto"
                              ? "Stock = min qty of included products"
                              : "Set combo stock manually"}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {form.stockLogic === "auto" && (
                  <div className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <p className="text-xs font-medium" style={{ color: "#3b82f6" }}>
                      ℹ Auto mode — combo stock will automatically reflect the lowest stock among included products
                    </p>
                  </div>
                )}

                {form.stockLogic === "manual" && (
                  <div>
                    <label style={{ color: "var(--txt-3)" }} className={labelClass}>Combo Stock Qty *</label>
                    <input name="comboStock" type="number" required={form.stockLogic === "manual"}
                      value={form.comboStock} onChange={set}
                      placeholder="e.g. 20" style={inputStyle} className={inputClass} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── STEP 3 : Publish ────────────────────────────────────────── */}
          {step === 3 && (
            <>
              <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Description & Publish</h3>
              <div className="space-y-4">
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Combo Description</label>
                  <textarea name="comboDesc" rows={3} value={form.comboDesc} onChange={set}
                    placeholder="Short explanation of what's included and why it's a great deal..."
                    style={inputStyle} className={inputClass} />
                </div>

                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Publish Status</label>
                  <div className="flex gap-3">
                    {["Draft", "Published"].map((s) => (
                      <label key={s} className="flex-1 flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors"
                        style={{
                          border: `2px solid ${form.status === s ? "#8b5cf6" : "var(--border)"}`,
                          backgroundColor: form.status === s ? "rgba(139,92,246,0.08)" : "var(--base)",
                        }}>
                        <input type="radio" name="status" value={s} checked={form.status === s} onChange={set} className="accent-violet-600" />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--txt-1)" }}>{s}</p>
                          <p className="text-xs" style={{ color: "var(--txt-3)" }}>
                            {s === "Draft" ? "Save for later" : "Go live immediately"}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "var(--base)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--txt-3)" }}>Combo Summary</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {[
                      ["Combo Name",    form.comboName || "—"],
                      ["Combo SKU",     form.comboSku || "—"],
                      ["Products",      selectedSkus.length > 0 ? selectedSkus.join(", ") : "—"],
                      ["Combined Value","₹" + autoPrice.toLocaleString()],
                      ["Combo Price",   form.comboPrice ? "₹" + Number(form.comboPrice).toLocaleString() : "—"],
                      ["Savings",       savings > 0 ? "₹" + savings.toLocaleString() : "—"],
                      ["Stock Logic",   form.stockLogic === "auto" ? "Auto" : `Manual (${form.comboStock || "—"})`],
                      ["Active",        form.active ? "Yes" : "No"],
                    ].map(([k, v]) => (
                      <div key={k} className="contents">
                        <span style={{ color: "var(--txt-3)" }}>{k}</span>
                        <span className="font-medium truncate" style={{ color: "var(--txt-2)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              style={{ border: "1px solid var(--border)", color: "var(--txt-2)", backgroundColor: "var(--card)" }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              ← Back
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={() => router.back()}
            style={{ border: "1px solid var(--border)", color: "var(--txt-3)", backgroundColor: "var(--card)" }}
            className="px-5 py-2.5 rounded-xl text-sm transition-colors">
            Cancel
          </button>
          {step < steps.length - 1 ? (
            <button type="button" disabled={!canNext[step]} onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: "var(--txt-1)", color: "var(--card)" }}>
              Next →
            </button>
          ) : (
            <button type="submit" disabled={loading || success}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
              {loading ? "Creating..." : "Create Combo"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
