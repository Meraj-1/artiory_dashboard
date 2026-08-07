"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthToken } from "@/lib/auth";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  status: "Published" | "Pending" | "Draft";
  date: string;
  image: string | { url: string } | null;
  stock: number;
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
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }
  function toggleSelect(id: number) {
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  }
  function toggleAll(ids: number[]) {
    setSelected((p) => (p.length === ids.length ? [] : ids));
  }
  async function deleteProduct(id: number) {
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
        `http://localhost:5000/api/products/${id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }

      setProducts((prev) => prev.filter((x) => x.id !== id));
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
        `http://localhost:5000/api/products/${product.id}/${action}`,
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
          "http://localhost:5000/api/products/dashboard",
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

  const filtered = Array.isArray(products)
    ? products
        .filter((p) => {
          const ms =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase());
          const mf = filter === "All" || p.status === filter;
          return ms && mf;
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
              onClick={bulkDelete}
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
        <div style={card} className="rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <th className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={
                      filteredIds.length > 0 &&
                      selected.length === filteredIds.length
                    }
                    onChange={() => toggleAll(filteredIds)}
                    className="rounded accent-violet-600"
                  />
                </th>
                <th
                  className="px-5 py-3 text-left text-[11px] uppercase tracking-widest"
                  style={{ color: "var(--txt-3)" }}
                >
                  Image
                </th>
                {(["name", "price", "status", "date"] as SortKey[]).map((k) => (
                  <th
                    key={k}
                    onClick={() => toggleSort(k)}
                    className="px-5 py-3 text-left text-[11px] uppercase tracking-widest cursor-pointer select-none"
                    style={{ color: "var(--txt-3)" }}
                  >
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                    <SI k={k} />
                  </th>
                ))}
                <th
                  className="px-5 py-3 text-left text-[11px] uppercase tracking-widest"
                  style={{ color: "var(--txt-3)" }}
                >
                  Category
                </th>
                <th
                  className="px-5 py-3 text-left text-[11px] uppercase tracking-widest"
                  style={{ color: "var(--txt-3)" }}
                >
                  Stock
                </th>
                <th
                  className="px-5 py-3 text-left text-[11px] uppercase tracking-widest"
                  style={{ color: "var(--txt-3)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderTop: "1px solid var(--border-sub)",
                    backgroundColor: selected.includes(p.id)
                      ? "rgba(124,58,237,0.05)"
                      : undefined,
                  }}
                >
                  <td className="px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="rounded accent-violet-600"
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl overflow-hidden"
                      style={{ backgroundColor: "var(--base)" }}
                    >
                      {renderProductImage(p.image)}
                    </div>
                  </td>
                  <td
                    className="px-5 py-3.5 text-sm font-medium"
                    style={{ color: "var(--txt-1)" }}
                  >
                    {p.name}
                  </td>
                  <td
                    className="px-5 py-3.5 text-sm font-semibold"
                    style={{ color: "var(--txt-2)" }}
                  >
                    ₹{p.price.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={statusBadge[p.status]}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td
                    className="px-5 py-3.5 text-xs"
                    style={{ color: "var(--txt-3)" }}
                  >
                    {p.date}
                  </td>
                  <td
                    className="px-5 py-3.5 text-sm"
                    style={{ color: "var(--txt-3)" }}
                  >
                    {p.category}
                  </td>
                  <td
                    className="px-5 py-3.5 text-sm"
                    style={{ color: "var(--txt-2)" }}
                  >
                    {p.stock}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePublishStatus(p)}
                        className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                        style={{
                          border: "1px solid var(--border)",
                          color: "var(--txt-2)",
                        }}
                      >
                        {p.status === "Published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="text-xs px-2.5 py-1 rounded-lg text-rose-500 transition-colors"
                        style={{ border: "1px solid rgba(239,68,68,0.3)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div
              className="text-center py-16"
              style={{ color: "var(--txt-3)" }}
            >
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
                    onClick={() => deleteProduct(p.id)}
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
    </div>
  );
}
