"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuthCookieName, getAuthToken } from "@/lib/auth";

const CATEGORIES: Record<string, string[]> = {
  ArtsCraft:["Crayons", "Water Colours", "Puzzle Crayons"],
  Stationery:  ["Pencil Box", "Compass Box", "Slate", "Stationery Combo Set", "Mechanical Sharpener", "Pencil Case", "Diary"],
  Bags: ["Tiffin Bags", "Cross Bags", "Folder Bags", "Fancy Bags", "Vanity Case"],
  Pouches:    ["Soft Pouch", "Silicone Pouch"],
  Drinkware:   ["Sippers", "500 ml Sipper", "900 ml Plastic Bottle Sipper", "Tumbler"],
  giftFun:     ["Metal Money Box", "Gift Hamper", "Mini Fan"],
};

type Variant = { id: number; color: string; design: string; price: string; stock: string };

const steps = ["Basic Info", "Variants", "Pricing & Stock", "Descriptions"];

const inputStyle = { backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" };
const inputClass = "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-[color:var(--txt-3)]";
const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1.5";
const card = { backgroundColor: "var(--card)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)" };

export default function UploadProductPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [step, setStep]         = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", sku: "", category: "", subCategory: "",
    active: true,
    sellingPrice: "", mrp: "", stock: "",
    weight: "", dimensions: "", gst: "",
    shortDesc: "", detailedDesc: "",
  });

  const [variants, setVariants] = useState<Variant[]>([
    { id: 1, color: "", design: "", price: "", stock: "" },
  ]);

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  // ── Variants ──────────────────────────────────────────────────────────────
  function addVariant() {
    setVariants((p) => [...p, { id: Date.now(), color: "", design: "", price: "", stock: "" }]);
  }
  function removeVariant(id: number) {
    setVariants((p) => p.filter((v) => v.id !== id));
  }
  function setVariant(id: number, key: keyof Variant, val: string) {
    setVariants((p) => p.map((v) => v.id === id ? { ...v, [key]: val } : v));
  }

  // ── Images ────────────────────────────────────────────────────────────────
  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => setPreviews((p) => [...p, URL.createObjectURL(f)]));
    setSelectedFiles((p) => [...p, ...files]);
  }

  function removeImageAt(index: number) {
    setPreviews((prev) => {
      const url = prev[index];
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
      return prev.filter((_, i) => i !== index);
    });
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Use FormData for file uploads. Do NOT set `Content-Type` manually —
      // the browser will set the correct multipart boundary.
      const formData = new FormData();

      formData.append("productName", form.name);
      formData.append("name", form.name);
      formData.append("skuCode", form.sku);
      formData.append("sku", form.sku);
      formData.append("category", form.category);
      formData.append("subCategory", form.subCategory);
      formData.append("active", String(form.active));
      formData.append("sellingPrice", String(Number(form.sellingPrice || 0)));
      formData.append("mrp", String(Number(form.mrp || 0)));
      formData.append("stockQuantity", String(Number(form.stock || 0)));
      formData.append("stock", String(Number(form.stock || 0)));
      if (form.weight) formData.append("weight", String(Number(form.weight)));
      if (form.dimensions) formData.append("dimensions", form.dimensions);
      if (form.gst) formData.append("gst", String(Number(form.gst)));
      formData.append("shortDescription", form.shortDesc);
      formData.append("shortDesc", form.shortDesc);
      formData.append("detailedDescription", form.detailedDesc);
      formData.append("detailedDesc", form.detailedDesc);

      const filteredVariants = variants
        .filter((v) => v.color || v.design || v.price || v.stock)
        .map((v) => ({
          color: v.color,
          design: v.design,
          sellingPrice: v.price ? Number(v.price) : null,
          stockQuantity: v.stock ? Number(v.stock) : null,
          price: v.price ? Number(v.price) : null,
          stock: v.stock ? Number(v.stock) : null,
        }));

      formData.append("variants", JSON.stringify(filteredVariants));

      // Append files from state. Add multiple field names to match various
      // backend expectations ("image", "images", "images[index]", "file").
      console.debug("Uploading selectedFiles:", selectedFiles);

      if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const f = selectedFiles[i];
          formData.append("image", f);
          formData.append("images", f);
          formData.append(`images[${i}]`, f);
          formData.append("file", f);
        }
      }

      // Debug: list FormData entries (files will appear as File objects)
      try {
        for (const pair of Array.from(formData.entries())) {
          console.debug("formData entry:", pair[0], pair[1]);
        }
      } catch (err) {
        console.debug("Could not iterate FormData entries", err);
      }

      const authToken = getAuthToken();
      const headers: Record<string, string> = {
        // Do not set Content-Type when sending FormData
        Accept: "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
        headers["x-auth-token"] = authToken;
        headers["x-access-token"] = authToken;
        headers["token"] = authToken;
      }

      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers,
        body: formData,
      });

      const responseText = await response.text();
      let data: any = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || responseText || "Product creation failed.");
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/products"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while creating the product.");
    } finally {
      setLoading(false);
    }
  }

  const canNext = [
    !!(form.name && form.sku && form.category && form.subCategory),
    true, // variants optional
    !!(form.sellingPrice && form.mrp && form.stock),
    !!(form.shortDesc),
  ];

  const subCategories = CATEGORIES[form.category] ?? [];

  // ── Discount % ────────────────────────────────────────────────────────────
  const discount = form.mrp && form.sellingPrice
    ? Math.round(((+form.mrp - +form.sellingPrice) / +form.mrp) * 100)
    : null;

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
                    i < step  ? { backgroundColor: "#8b5cf6", color: "#fff" }
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
        <div className="rounded-xl px-5 py-3 text-sm font-medium" style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
          ✓ Product uploaded successfully! Redirecting...
        </div>
      )}

      {error && (
        <div className="rounded-xl px-5 py-3 text-sm font-medium" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={card} className="rounded-2xl p-6 space-y-5">

          {/* ── STEP 0 : Basic Info ─────────────────────────────────────── */}
          {step === 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Basic Information</h3>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Product Name *</label>
                  <input name="name" required value={form.name} onChange={set}
                    placeholder="e.g. Floral Backpack" style={inputStyle} className={inputClass} />
                </div>
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>SKU Code *</label>
                  <input name="sku" required value={form.sku} onChange={set}
                    placeholder="e.g. BAG-001" style={inputStyle} className={inputClass} />
                  <p className="text-xs mt-1" style={{ color: "var(--txt-3)" }}>Unique product identifier</p>
                </div>
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Category *</label>
                  <select name="category" required value={form.category} onChange={(e) => {
                    setForm((p) => ({ ...p, category: e.target.value, subCategory: "" }));
                  }} style={inputStyle} className={inputClass}>
                    <option value="">Select category</option>
                    {Object.keys(CATEGORIES).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Sub-Category *</label>
                  <select name="subCategory" required value={form.subCategory} onChange={set}
                    style={inputStyle} className={inputClass} disabled={!form.category}>
                    <option value="">Select sub-category</option>
                    {subCategories.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Image upload inline */}
                <div className="sm:col-span-2">
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Product Images</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
                    style={{ borderColor: "var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8b5cf6")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <span className="text-3xl mb-1">📁</span>
                    <p className="text-sm font-medium" style={{ color: "var(--txt-2)" }}>Click to upload images</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>PNG, JPG, WEBP — multiple allowed</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                  {previews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {previews.map((src, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden aspect-square" style={{ backgroundColor: "var(--base)" }}>
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          {i === 0 && <span className="absolute top-1 left-1 bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Cover</span>}
                          <button type="button" onClick={() => removeImageAt(i)}
                            className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 text-xs text-[color:var(--txt-3)]">
                      <div className="font-medium mb-1">Selected files ({selectedFiles.length}):</div>
                      <ul className="list-disc pl-5">
                        {selectedFiles.map((f, idx) => (
                          <li key={idx}>{f.name} — {(f.size / 1024).toFixed(1)} KB</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── STEP 1 : Variants ───────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Variants</h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>Color, design options for the same SKU</p>
                </div>
                <button type="button" onClick={addVariant}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors">
                  + Add Variant
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div key={v.id} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "var(--base)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--txt-3)" }}>
                        Variant {i + 1}
                      </span>
                      {variants.length > 1 && (
                        <button type="button" onClick={() => removeVariant(v.id)}
                          className="text-xs text-rose-500 hover:text-rose-400">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label style={{ color: "var(--txt-3)" }} className={labelClass}>Color</label>
                        <input value={v.color} onChange={(e) => setVariant(v.id, "color", e.target.value)}
                          placeholder="e.g. Red" style={inputStyle} className={inputClass} />
                      </div>
                      <div>
                        <label style={{ color: "var(--txt-3)" }} className={labelClass}>Design</label>
                        <input value={v.design} onChange={(e) => setVariant(v.id, "design", e.target.value)}
                          placeholder="e.g. Floral" style={inputStyle} className={inputClass} />
                      </div>
                      <div>
                        <label style={{ color: "var(--txt-3)" }} className={labelClass}>Price (₹)</label>
                        <input type="number" value={v.price} onChange={(e) => setVariant(v.id, "price", e.target.value)}
                          placeholder="4500" style={inputStyle} className={inputClass} />
                      </div>
                      <div>
                        <label style={{ color: "var(--txt-3)" }} className={labelClass}>Stock</label>
                        <input type="number" value={v.stock} onChange={(e) => setVariant(v.id, "stock", e.target.value)}
                          placeholder="10" style={inputStyle} className={inputClass} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs" style={{ color: "var(--txt-3)" }}>
                Skip if product has no variants — base price & stock set in next step.
              </p>
            </>
          )}

          {/* ── STEP 2 : Pricing & Stock ────────────────────────────────── */}
          {step === 2 && (
            <>
              <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Pricing & Inventory</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Selling Price (₹) *</label>
                  <input name="sellingPrice" type="number" required value={form.sellingPrice} onChange={set}
                    placeholder="4500" style={inputStyle} className={inputClass} />
                  <p className="text-xs mt-1" style={{ color: "var(--txt-3)" }}>Final customer price</p>
                </div>

                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>MRP (₹) *</label>
                  <input name="mrp" type="number" required value={form.mrp} onChange={set}
                    placeholder="6000" style={inputStyle} className={inputClass} />
                  <p className="text-xs mt-1" style={{ color: "var(--txt-3)" }}>Original / maximum retail price</p>
                </div>

                {discount !== null && discount > 0 && (
                  <div className="sm:col-span-2 rounded-xl px-4 py-2.5 flex items-center gap-2"
                    style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <span className="text-sm font-bold" style={{ color: "#22c55e" }}>{discount}% OFF</span>
                    <span className="text-xs" style={{ color: "var(--txt-3)" }}>
                      Customer saves ₹{(+form.mrp - +form.sellingPrice).toLocaleString()}
                    </span>
                  </div>
                )}

                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Stock Quantity *</label>
                  <input name="stock" type="number" required value={form.stock} onChange={set}
                    placeholder="10" style={inputStyle} className={inputClass} />
                </div>

                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>GST %</label>
                  <select name="gst" value={form.gst} onChange={set} style={inputStyle} className={inputClass}>
                    <option value="">Not applicable</option>
                    {["0", "5", "12", "18", "28"].map((g) => (
                      <option key={g} value={g}>{g}%</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Weight (grams)</label>
                  <input name="weight" type="number" value={form.weight} onChange={set}
                    placeholder="500" style={inputStyle} className={inputClass} />
                  <p className="text-xs mt-1" style={{ color: "var(--txt-3)" }}>Used for shipping calculation</p>
                </div>

                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Dimensions (L×W×H cm)</label>
                  <input name="dimensions" value={form.dimensions} onChange={set}
                    placeholder="30×20×10" style={inputStyle} className={inputClass} />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3 : Descriptions ───────────────────────────────────── */}
          {step === 3 && (
            <>
              <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Product Descriptions</h3>
              <div className="space-y-4">
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Short Description * (1–2 lines)</label>
                  <textarea name="shortDesc" required rows={2} value={form.shortDesc} onChange={set}
                    placeholder="A quick 1–2 line summary shown on product cards..."
                    style={inputStyle} className={inputClass} />
                  <p className="text-xs mt-1" style={{ color: form.shortDesc.length > 160 ? "#ef4444" : "var(--txt-3)" }}>
                    {form.shortDesc.length}/160 characters
                  </p>
                </div>
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Detailed Description</label>
                  <textarea name="detailedDesc" rows={7} value={form.detailedDesc} onChange={set}
                    placeholder="Full product details — materials, care instructions, story behind the product, dimensions, etc."
                    style={inputStyle} className={inputClass} />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 4 : Summary ─────────────────────────────────────────── */}
          {step === 3 && (
            <>
              <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Product Summary</h3>
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "var(--base)", border: "1px solid var(--border)" }}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                  {[
                    ["Name",         form.name || "—"],
                    ["SKU",          form.sku || "—"],
                    ["Category",     form.category ? `${form.category} › ${form.subCategory}` : "—"],
                    ["Selling Price",form.sellingPrice ? `₹${Number(form.sellingPrice).toLocaleString()}` : "—"],
                    ["MRP",          form.mrp ? `₹${Number(form.mrp).toLocaleString()}` : "—"],
                    ["Stock",        form.stock || "—"],
                    ["Weight",       form.weight ? `${form.weight}g` : "—"],
                    ["GST",          form.gst ? `${form.gst}%` : "N/A"],
                    ["Variants",     `${variants.filter(v => v.color || v.design).length} added`],
                    ["Images",       `${previews.length} uploaded`],
                    ["Active",       form.active ? "Yes" : "No"],
                  ].map(([k, v]) => (
                    <div key={k} className="contents">
                      <span style={{ color: "var(--txt-3)" }}>{k}</span>
                      <span className="font-medium truncate" style={{ color: "var(--txt-2)" }}>{v}</span>
                    </div>
                  ))}
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
              {loading ? "Uploading..." : "Upload Product"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
