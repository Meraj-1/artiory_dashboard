"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthToken } from "@/lib/auth";

type Product = {
  id: string | number;
  name: string;
  category: string;
  price: number;
  status: "Published" | "Pending" | "Draft";
  date: string;
  image: string | { url: string } | null;
  stock: number;
  deletedAt?: string | Date | null;
};



const statusBadge: Record<string, { bg: string; color: string }> = {
  Published: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
  Pending: { bg: "rgba(234,179,8,0.12)", color: "#eab308" },
  Draft: { bg: "rgba(113,113,122,0.12)", color: "#71717a" },
};

type SortKey = "name" | "price" | "date" | "status";

const card = {
  backgroundColor: "var(--card)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--border)",
};

function renderProductImage(image: Product["image"]) {
  if (!image) {
    return (
      <span className="text-2xl" aria-hidden>
        🛍️
      </span>
    );
  }

  // Handle string image values (either absolute URLs or relative server paths)
  if (typeof image === "string") {
    let src = image || "";

    if (!(src.startsWith("http") || src.startsWith("data:") || src.startsWith("blob:"))) {
      const origin = typeof window !== "undefined" ? window.location.origin : `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}`;
      const path = src.startsWith("/") ? src : `/${src}`;
      src = `${origin}${path}`;
    }

    return (
      <img
        src={src}
        alt="Product"
        className="w-full h-full object-cover rounded-lg"
        style={{ maxHeight: "100%" }}
      />
    );
  }

  if (typeof image === "object" && image.url) {
    return (
      <img
        src={image.url}
        alt="Product"
        className="w-full h-full object-cover rounded-lg"
        style={{ maxHeight: "100%" }}
      />
    );
  }

  return (
    <span className="text-2xl" aria-hidden>
      🛍️
    </span>
  );
}

function getRemainingDays(deletedAt: any): string {
  if (!deletedAt) return "7 days";
  const deletedDate = new Date(deletedAt);
  const expiryDate = new Date(deletedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const diffMs = expiryDate.getTime() - Date.now();
  if (diffMs <= 0) return "soon";
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) {
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  }
  return `${diffDays} days`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<any[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [confirmDelete, setConfirmDelete] = useState<{ id: any; name: string } | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [dashboardFilterCategories, setDashboardFilterCategories] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    const closeDropdown = () => setCategoryDropdownOpen(false);
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, []);

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({
    id: "", name: "", skuCode: "", category: "", subCategory: "",
    sellingPrice: "", mrp: "", stockQuantity: "",
    shortDescription: "", detailedDescription: "", active: true
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const editCategories = {
    ArtsCraft: ["Crayons", "Water Colours", "Puzzle Crayons"],
    Stationery: ["Pencil Box", "Compass Box", "Slate", "Stationery Combo Set", "Mechanical Sharpener", "Pencil Case", "Diary"],
    Bags: ["Tiffin Bags", "Cross Bags", "Folder Bags", "Fancy Bags", "Vanity Case"],
    Pouches: ["Soft Pouch", "Silicone Pouch"],
    "Drinkware/Lunchware": ["Sippers", "500 ml Sipper", "900 ml Plastic Bottle Sipper", "Tumbler", "600ml Sippers", "Lunch Boxes"],
    giftFun: ["Metal Money Box", "Gift Hamper", "Mini Fan", "Tissue Paper Box"],
  };

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }
  function toggleSelect(id: any) {
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  }
  function toggleAll(ids: any[]) {
    setSelected((p) => (p.length === ids.length ? [] : ids));
  }
  function requestDelete(id: any) {
    const product = products.find((p) => p.id === id);
    if (product) setConfirmDelete({ id, name: product.name });
  }

  async function startEdit(product: Product) {
    setEditError(null);
    setEditingProduct(product);
    setEditLoading(true);

    const token = getAuthToken();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-auth-token"] = token;
      headers["x-access-token"] = token;
      headers["token"] = token;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/products/${product.id}`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to fetch product details");
      const json = await res.json();
      if (json.success && json.data) {
        const p = json.data;
        setEditForm({
          id: p._id || product.id,
          name: p.productName || p.name || product.name,
          skuCode: p.skuCode || "",
          category: p.category || product.category || "",
          subCategory: p.subCategory || "",
          sellingPrice: p.sellingPrice ?? product.price ?? "",
          mrp: p.mrp ?? "",
          stockQuantity: p.stockQuantity ?? product.stock ?? "",
          shortDescription: p.shortDescription || p.shortDesc || "",
          detailedDescription: p.detailedDescription || p.detailedDesc || "",
          active: p.active !== undefined ? p.active : true,
        });
      } else {
        setEditForm({
          id: product.id,
          name: product.name,
          skuCode: "",
          category: product.category,
          subCategory: "",
          sellingPrice: product.price,
          mrp: product.price,
          stockQuantity: product.stock,
          shortDescription: "",
          detailedDescription: "",
          active: true,
        });
      }
    } catch (err) {
      console.error(err);
      setEditForm({
        id: product.id,
        name: product.name,
        skuCode: "",
        category: product.category,
        subCategory: "",
        sellingPrice: product.price,
        mrp: product.price,
        stockQuantity: product.stock,
        shortDescription: "",
        detailedDescription: "",
        active: true,
      });
    } finally {
      setEditLoading(false);
    }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    const token = getAuthToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-auth-token"] = token;
      headers["x-access-token"] = token;
      headers["token"] = token;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/products/${editForm.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            productName: editForm.name,
            skuCode: editForm.skuCode,
            category: editForm.category,
            subCategory: editForm.subCategory,
            sellingPrice: Number(editForm.sellingPrice),
            mrp: Number(editForm.mrp),
            stockQuantity: Number(editForm.stockQuantity),
            shortDescription: editForm.shortDescription,
            detailedDescription: editForm.detailedDescription,
            active: editForm.active,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update product: ${response.status}`);
      }

      const json = await response.json();
      if (json.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editForm.id
              ? {
                  ...p,
                  name: editForm.name,
                  price: Number(editForm.sellingPrice),
                  stock: Number(editForm.stockQuantity),
                  category: editForm.category,
                }
              : p
          )
        );
        setEditingProduct(null);
      } else {
        throw new Error(json.message || "Failed to update product");
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setEditLoading(false);
    }
  }

  async function deleteProduct(id: any) {
    setError(null);

    const token = getAuthToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-auth-token"] = token;
      headers["x-access-token"] = token;
      headers["token"] = token;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/products/${id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }

      setProducts((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: "Draft" as const, deletedAt: new Date().toISOString() } : x))
      );
      setSelected((prev) => prev.filter((x) => x !== id));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unknown error while deleting product",
      );
    }
  }

  async function bulkDelete() {
    const idsToDelete = selected;
    for (const id of idsToDelete) {
      await deleteProduct(id);
    }
    setSelected([]);
    setConfirmBulkDelete(false);
  }
  function bulkPublish() {
    setProducts((p) =>
      p.map((x) =>
        selected.includes(x.id) ? { ...x, status: "Published" as const } : x,
      ),
    );
    setSelected([]);
  }
  function bulkDraft() {
    setProducts((p) =>
      p.map((x) =>
        selected.includes(x.id) ? { ...x, status: "Draft" as const } : x,
      ),
    );
    setSelected([]);
  }

  async function togglePublishStatus(product: Product) {
    const newStatus = product.status === "Published" ? "Draft" : "Published";
    setError(null);

    const token = getAuthToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-auth-token"] = token;
      headers["x-access-token"] = token;
      headers["token"] = token;
    }

    try {
      const action = newStatus === "Published" ? "publish" : "unpublish";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/products/${product.id}/${action}`,
        {
          method: "PATCH",
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.status}`);
      }

      setProducts((prev) =>
        prev.map((x) =>
          x.id === product.id ? { ...x, status: newStatus } : x,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unknown error while updating product status",
      );
    }
  }

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["x-auth-token"] = token;
        headers["x-access-token"] = token;
        headers["token"] = token;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/products/dashboard?limit=1000`,
          {
            method: "GET",
            headers,
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to load products: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data?.products)) {
          setProducts(data.products);
        } else if (Array.isArray(data?.data)) {
          setProducts(data.data);
        } else {
          throw new Error("Unexpected API response shape for products");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unknown error while loading products",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const uniqueProductCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const filtered = Array.isArray(products)
    ? products
        .filter((p) => {
          const ms =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase());
          const mf = filter === "All" || p.status === filter;
          const mc = dashboardFilterCategories.length === 0 || (p.category && dashboardFilterCategories.includes(p.category));
          return ms && mf && mc;
        })
        .sort((a, b) => {
          let c = 0;
          if (sortKey === "name") c = a.name.localeCompare(b.name);
          if (sortKey === "price") c = a.price - b.price;
          if (sortKey === "date") c = a.date.localeCompare(b.date);
          if (sortKey === "status") c = a.status.localeCompare(b.status);
          return sortDir === "asc" ? c : -c;
        })
    : [];

  const filteredIds = filtered.map((p) => p.id);
  const SI = ({ k }: { k: SortKey }) => (
    <span className="ml-1 opacity-50">
      {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const filterBtn = (s: string) => ({
    backgroundColor: filter === s ? "var(--txt-1)" : "var(--card)",
    color: filter === s ? "var(--card)" : "var(--txt-2)",
    border: "1px solid var(--border)",
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {["All", "Published", "Pending", "Draft"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={filterBtn(s)}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {s}{" "}
              <span className="ml-1 opacity-50">
                {s === "All"
                  ? Array.isArray(products)
                    ? products.length
                    : 0
                  : Array.isArray(products)
                  ? products.filter((p) => p.status === s).length
                  : 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--txt-3)" }}
            >
              ⌕
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--txt-1)",
              }}
              className="pl-8 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-full sm:w-48 placeholder:text-[color:var(--txt-3)]"
            />
          </div>
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {(["table", "grid"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  backgroundColor: view === v ? "var(--txt-1)" : "var(--card)",
                  color: view === v ? "var(--card)" : "var(--txt-3)",
                }}
                className="px-3 py-2 text-sm transition-colors"
              >
                {v === "table" ? "☰" : "⊞"}
              </button>
            ))}
          </div>
          <Link
            href="/dashboard/products/combo"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            style={{
              border: "1px solid rgba(139,92,246,0.4)",
              color: "#8b5cf6",
            }}
          >
            + Combo
          </Link>
          <Link
            href="/dashboard/products/upload"
            className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap bg-violet-600 hover:bg-violet-700"
          >
            + Upload
          </Link>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div
          className="rounded-xl px-5 py-3 flex items-center gap-4"
          style={{
            backgroundColor: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.2)",
          }}
        >
          <span className="text-sm font-medium text-violet-500">
            {selected.length} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={bulkPublish}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium"
            >
              Publish
            </button>
            <button
              onClick={bulkDraft}
              className="px-3 py-1.5 text-white rounded-lg text-xs font-medium"
              style={{ backgroundColor: "var(--txt-3)" }}
            >
              Set Draft
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => setSelected([])}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-violet-500"
              style={{ border: "1px solid rgba(124,58,237,0.3)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div
          className="rounded-2xl overflow-hidden text-center py-24"
          style={{ backgroundColor: "var(--card)", color: "var(--txt-3)" }}
        >
          Loading products...
        </div>
      )}

      {error && (
        <div
          className="rounded-2xl overflow-hidden text-center py-24"
          style={{ backgroundColor: "rgba(248,113,113,0.08)", color: "#b91c1c" }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && view === "table" && (
        <div style={{ ...card, borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "860px" }}>
              <colgroup>
                <col style={{ width: "44px" }} />
                <col style={{ width: "56px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "180px" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "var(--base)", position: "sticky", top: 0, zIndex: 1 }}>
                  {/* checkbox */}
                  <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                    <input
                      type="checkbox"
                      checked={filteredIds.length > 0 && selected.length === filteredIds.length}
                      onChange={() => toggleAll(filteredIds)}
                      className="rounded accent-violet-600 cursor-pointer"
                    />
                  </th>
                  {/* image */}
                  <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)", borderRight: "1px solid var(--border)", color: "var(--txt-3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", fontWeight: 600 }}>
                    Img
                  </th>
                  {/* sortable cols */}
                  {(["name", "price", "status", "date"] as SortKey[]).map((k, i) => (
                    <th
                      key={k}
                      onClick={() => toggleSort(k)}
                      style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)", borderRight: "1px solid var(--border)", color: sortKey === k ? "var(--txt-1)" : "var(--txt-3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", fontWeight: 600, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                    >
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                      <SI k={k} />
                    </th>
                  ))}
                  {/* category */}
                  <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)", borderRight: "1px solid var(--border)", color: "var(--txt-3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", fontWeight: 600, position: "relative" }}>
                    <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--txt-1)]" onClick={(e) => { e.stopPropagation(); setCategoryDropdownOpen(!categoryDropdownOpen); }}>
                      <span>Category</span>
                      <span className="text-[9px]">▼</span>
                      {dashboardFilterCategories.length > 0 && (
                        <span className="bg-violet-600 text-white rounded-full w-4.5 h-4.5 text-[9px] flex items-center justify-center font-bold">
                          {dashboardFilterCategories.length}
                        </span>
                      )}
                    </div>

                    {categoryDropdownOpen && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                          zIndex: 50,
                          minWidth: "180px",
                          padding: "10px",
                          textTransform: "none",
                          letterSpacing: "normal",
                          fontWeight: "normal",
                          textAlign: "left"
                        }}
                      >
                        <div className="font-semibold text-xs mb-2 pb-1.5 border-b border-[var(--border)] text-[var(--txt-2)] flex justify-between items-center">
                          <span>Filter Categories</span>
                          {dashboardFilterCategories.length > 0 && (
                            <button
                              onClick={() => setDashboardFilterCategories([])}
                              className="text-[10px] text-violet-500 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1.5">
                          {uniqueProductCategories.map((cat) => {
                            const isChecked = dashboardFilterCategories.includes(cat);
                            return (
                              <label key={cat} className="flex items-center gap-2 text-xs text-[var(--txt-2)] cursor-pointer hover:text-[var(--txt-1)]">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setDashboardFilterCategories((prev) =>
                                      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                                    );
                                  }}
                                  className="rounded accent-violet-600 cursor-pointer"
                                />
                                <span className="truncate">{cat}</span>
                              </label>
                            );
                          })}
                          {uniqueProductCategories.length === 0 && (
                            <div className="text-xs text-gray-400 py-2 text-center">No categories found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </th>
                  {/* stock */}
                  <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)", borderRight: "1px solid var(--border)", color: "var(--txt-3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", fontWeight: 600 }}>
                    Stock
                  </th>
                  {/* actions */}
                  <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)", color: "var(--txt-3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", fontWeight: 600 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const isSelected = selected.includes(p.id);
                  const rowBg = isSelected
                    ? "rgba(124,58,237,0.07)"
                    : idx % 2 === 0
                    ? "var(--card)"
                    : "var(--base)";
                  const cellBorder = "1px solid var(--border)";
                  return (
                    <tr
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      style={{ backgroundColor: rowBg, cursor: "pointer" }}
                      className="transition-colors hover:brightness-95"
                    >
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded accent-violet-600 cursor-pointer"
                        />
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", backgroundColor: "var(--base)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          {renderProductImage(p.image)}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder, fontSize: 13, fontWeight: 500, color: "var(--txt-1)", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <div>{p.name}</div>
                        {p.status === "Draft" && (
                          <div className="text-[10px] text-rose-500 font-semibold mt-1" style={{ whiteSpace: "normal" }}>
                            ⚠️ Auto-deletes in {getRemainingDays(p.deletedAt)} if no action taken
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder, fontSize: 13, fontWeight: 600, color: "var(--txt-2)", whiteSpace: "nowrap" }}>
                        ₹{p.price.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder }}>
                        <span style={{ ...statusBadge[p.status], fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, display: "inline-block" }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder, fontSize: 12, color: "var(--txt-3)", whiteSpace: "nowrap" }}>
                        {p.date}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder, fontSize: 13, color: "var(--txt-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.category}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder, borderRight: cellBorder, fontSize: 13, color: "var(--txt-2)", textAlign: "center" }}>
                        {p.stock}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: cellBorder }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => togglePublishStatus(p)}
                            style={{ border: "1px solid var(--border)", color: "var(--txt-2)", fontSize: 11, padding: "4px 10px", borderRadius: 8, cursor: "pointer", background: "transparent", whiteSpace: "nowrap" }}
                            className="hover:bg-[var(--base)] transition-colors"
                          >
                            {p.status === "Published" ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            onClick={() => startEdit(p)}
                            style={{ border: "1px solid var(--border)", color: "var(--txt-2)", fontSize: 11, padding: "4px 10px", borderRadius: 8, cursor: "pointer", background: "transparent", whiteSpace: "nowrap" }}
                            className="hover:bg-[var(--base)] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => requestDelete(p.id)}
                            style={{ border: "1px solid rgba(239,68,68,0.35)", color: "#f87171", fontSize: 11, padding: "4px 10px", borderRadius: 8, cursor: "pointer", background: "transparent", whiteSpace: "nowrap" }}
                            className="hover:bg-rose-500/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: "var(--txt-3)" }}>
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => toggleSelect(p.id)}
              style={{
                ...card,
                ...(selected.includes(p.id)
                  ? {
                      borderColor: "#7c3aed",
                      boxShadow: "0 0 0 2px rgba(124,58,237,0.2)",
                    }
                  : {}),
              }}
              className="rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
            >
              <div
                className="h-36 flex items-center justify-center text-5xl relative overflow-hidden"
                style={{ backgroundColor: "var(--base)" }}
              >
                {renderProductImage(p.image)}
                {selected.includes(p.id) && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs">
                    ✓
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="font-semibold text-sm leading-tight"
                    style={{ color: "var(--txt-1)" }}
                  >
                    {p.name}
                  </h3>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={statusBadge[p.status]}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--txt-3)" }}>
                  {p.category}
                </p>
                {p.status === "Draft" && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1">
                    ⚠️ Auto-deletes in {getRemainingDays(p.deletedAt)} if no action taken
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span
                    className="font-bold text-sm"
                    style={{ color: "var(--txt-1)" }}
                  >
                    ₹{p.price.toLocaleString()}
                  </span>
                  <span className="text-xs" style={{ color: "var(--txt-3)" }}>
                    Stock: {p.stock}
                  </span>
                </div>
                <div
                  className="flex gap-2 mt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => togglePublishStatus(p)}
                    className="flex-1 text-xs py-1.5 rounded-lg transition-colors"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--txt-2)",
                    }}
                  >
                    {p.status === "Published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--txt-2)",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => requestDelete(p.id)}
                    className="text-xs px-3 py-1.5 rounded-lg text-rose-500"
                    style={{ border: "1px solid rgba(239,68,68,0.3)" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              className="col-span-full text-center py-16"
              style={{ color: "var(--txt-3)" }}
            >
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-right" style={{ color: "var(--txt-3)" }}>
        Showing {filtered.length} of {products.length} products
      </p>

      {/* Single delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-6 w-full max-w-sm space-y-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--txt-1)" }}>Delete Product?</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: "var(--txt-2)" }}>
              You are about to permanently delete <span className="font-semibold" style={{ color: "var(--txt-1)" }}>{confirmDelete.name}</span>.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ border: "1px solid var(--border)", color: "var(--txt-2)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteProduct(confirmDelete.id); setConfirmDelete(null); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-6 w-full max-w-sm space-y-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--txt-1)" }}>Delete {selected.length} Products?</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: "var(--txt-2)" }}>
              All selected products will be permanently deleted.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ border: "1px solid var(--border)", color: "var(--txt-2)" }}
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in fade-in zoom-in duration-200" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--txt-1)" }}>Edit Product</h2>
              <button onClick={() => setEditingProduct(null)} className="text-xl hover:opacity-75" style={{ color: "var(--txt-3)" }}>✕</button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-sm">
                {editError}
              </div>
            )}

            <form onSubmit={saveProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--txt-3)" }}>Product Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, name: e.target.value }))}
                    style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* SKU Code */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--txt-3)" }}>SKU Code</label>
                  <input
                    type="text"
                    required
                    value={editForm.skuCode}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, skuCode: e.target.value }))}
                    style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--txt-3)" }}>Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, category: e.target.value, subCategory: "" }))}
                    style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select Category</option>
                    {Object.keys(editCategories).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--txt-3)" }}>Sub Category</label>
                  <select
                    value={editForm.subCategory}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, subCategory: e.target.value }))}
                    style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select Subcategory</option>
                    {editForm.category && (editCategories as any)[editForm.category]?.map((sc: string) => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--txt-3)" }}>Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, sellingPrice: e.target.value }))}
                    style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* MRP */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--txt-3)" }}>MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={editForm.mrp}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, mrp: e.target.value }))}
                    style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--txt-3)" }}>Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={editForm.stockQuantity}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, stockQuantity: e.target.value }))}
                    style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Status (Active) */}
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--txt-1)" }}>
                    <input
                      type="checkbox"
                      checked={editForm.active}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, active: e.target.checked }))}
                      className="w-4.5 h-4.5 accent-violet-600 cursor-pointer rounded"
                    />
                    Active / Available
                  </label>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--txt-3)" }}>Short Description</label>
                <textarea
                  value={editForm.shortDescription}
                  onChange={(e) => setEditForm((prev: any) => ({ ...prev, shortDescription: e.target.value }))}
                  style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                  className="w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 h-20 resize-none"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--txt-3)" }}>Detailed Description</label>
                <textarea
                  value={editForm.detailedDescription}
                  onChange={(e) => setEditForm((prev: any) => ({ ...prev, detailedDescription: e.target.value }))}
                  style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                  className="w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 h-32 resize-y"
                />
              </div>

              <div className="flex gap-2 justify-end border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 rounded-xl text-sm"
                  style={{ border: "1px solid var(--border)", color: "var(--txt-2)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 text-white rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
