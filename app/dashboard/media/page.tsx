"use client";
import { useState, useRef } from "react";

const card = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

type MediaFile = {
  id: number; name: string; type: "image" | "video"; size: string;
  date: string; url: string; used: number; emoji: string;
};

const initialMedia: MediaFile[] = [
  { id:1,  name:"abstract-canvas-hero.jpg",   type:"image", size:"2.4 MB", date:"Jan 10", url:"/media/abstract-canvas-hero.jpg",   used:3, emoji:"🖼️" },
  { id:2,  name:"marble-sculpture-front.jpg", type:"image", size:"3.1 MB", date:"Jan 9",  url:"/media/marble-sculpture-front.jpg", used:1, emoji:"🗿" },
  { id:3,  name:"digital-print-preview.jpg",  type:"image", size:"1.8 MB", date:"Jan 8",  url:"/media/digital-print-preview.jpg",  used:2, emoji:"💻" },
  { id:4,  name:"watercolor-series-1.jpg",    type:"image", size:"2.9 MB", date:"Jan 7",  url:"/media/watercolor-series-1.jpg",    used:1, emoji:"🎨" },
  { id:5,  name:"bronze-figurine-detail.jpg", type:"image", size:"4.2 MB", date:"Jan 6",  url:"/media/bronze-figurine-detail.jpg", used:2, emoji:"🏺" },
  { id:6,  name:"photography-print-main.jpg", type:"image", size:"5.1 MB", date:"Jan 5",  url:"/media/photography-print-main.jpg", used:1, emoji:"📷" },
  { id:7,  name:"store-banner-jan.jpg",       type:"image", size:"1.2 MB", date:"Jan 1",  url:"/media/store-banner-jan.jpg",       used:5, emoji:"🏪" },
  { id:8,  name:"artiory-logo-dark.png",      type:"image", size:"0.3 MB", date:"Dec 20", url:"/media/artiory-logo-dark.png",      used:8, emoji:"◈" },
  { id:9,  name:"product-showcase.mp4",       type:"video", size:"18.4 MB",date:"Dec 15", url:"/media/product-showcase.mp4",       used:1, emoji:"🎬" },
  { id:10, name:"charcoal-portrait-wip.jpg",  type:"image", size:"2.7 MB", date:"Jan 4",  url:"/media/charcoal-portrait-wip.jpg",  used:0, emoji:"✏️" },
  { id:11, name:"ceramic-vase-360.jpg",       type:"image", size:"3.3 MB", date:"Jan 3",  url:"/media/ceramic-vase-360.jpg",       used:1, emoji:"🏺" },
  { id:12, name:"packaging-unbox.jpg",        type:"image", size:"1.9 MB", date:"Dec 28", url:"/media/packaging-unbox.jpg",        used:0, emoji:"📦" },
];

export default function MediaPage() {
  const [media, setMedia]       = useState(initialMedia);
  const [filter, setFilter]     = useState("All");
  const [selected, setSelected] = useState<number[]>([]);
  const [copied, setCopied]     = useState<number | null>(null);
  const [view, setView]         = useState<"grid" | "list">("grid");
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleSelect(id: number) {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }
  function deleteSelected() {
    setMedia((p) => p.filter((m) => !selected.includes(m.id)));
    setSelected([]);
  }
  function copyUrl(id: number, url: string) {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newFiles: MediaFile[] = files.map((f, i) => ({
      id: Date.now() + i, name: f.name,
      type: f.type.startsWith("video") ? "video" : "image",
      size: (f.size / 1024 / 1024).toFixed(1) + " MB",
      date: "Just now", url: URL.createObjectURL(f), used: 0, emoji: "🆕",
    }));
    setMedia((p) => [...newFiles, ...p]);
  }

  const filtered = media.filter((m) => filter === "All" || (filter === "Images" ? m.type === "image" : m.type === "video"));
  const totalSize = media.reduce((s, m) => s + parseFloat(m.size), 0).toFixed(1);

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
          { label: "Total Files",  value: media.length },
          { label: "Images",       value: media.filter((m) => m.type === "image").length },
          { label: "Videos",       value: media.filter((m) => m.type === "video").length },
          { label: "Storage Used", value: `${totalSize} MB` },
        ].map((s) => (
          <div key={s.label} style={card} className="rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--txt-3)" }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--txt-1)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {["All","Images","Videos"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} style={filterBtn(s)} className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors">{s}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button onClick={deleteSelected} className="px-4 py-2 text-sm font-medium text-rose-500 rounded-xl transition-colors"
              style={{ border: "1px solid rgba(239,68,68,0.25)", backgroundColor: "rgba(239,68,68,0.08)" }}>
              Delete {selected.length} selected
            </button>
          )}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {(["grid","list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                style={{ backgroundColor: view === v ? "var(--txt-1)" : "var(--card)", color: view === v ? "var(--card)" : "var(--txt-3)" }}
                className="px-3 py-2 text-sm transition-colors">
                {v === "grid" ? "⊞" : "☰"}
              </button>
            ))}
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">
            + Upload
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" onChange={handleUpload} className="hidden" />
        </div>
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map((m) => (
            <div key={m.id}
              style={{ ...card, ...(selected.includes(m.id) ? { borderColor: "#8b5cf6", boxShadow: "0 0 0 2px rgba(139,92,246,0.2)" } : {}) }}
              className="rounded-xl overflow-hidden group cursor-pointer"
              onClick={() => toggleSelect(m.id)}>
              <div className="aspect-square flex items-center justify-center text-4xl relative" style={{ backgroundColor: "var(--base)" }}>
                {m.emoji}
                {selected.includes(m.id) && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(139,92,246,0.15)" }}>
                    <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                  </div>
                )}
                {m.type === "video" && (
                  <span className="absolute bottom-1 right-1 text-xs px-1.5 py-0.5 rounded font-medium text-white" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>▶</span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium truncate" style={{ color: "var(--txt-1)" }}>{m.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--txt-3)" }}>{m.size} · {m.date}</p>
                <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => copyUrl(m.id, m.url)}
                    className="flex-1 text-[10px] py-1 rounded-lg transition-colors"
                    style={{ border: "1px solid var(--border)", color: copied === m.id ? "#22c55e" : "var(--txt-3)" }}>
                    {copied === m.id ? "✓ Copied" : "Copy URL"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div style={card} className="rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--base)", borderBottom: "1px solid var(--border)" }}>
                <th className="px-5 py-3 w-8" />
                {["File","Type","Size","Date","Used In","Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color: "var(--txt-3)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} style={{ borderTop: "1px solid var(--border-sub)", backgroundColor: selected.includes(m.id) ? "rgba(139,92,246,0.05)" : undefined }}>
                  <td className="px-5 py-3.5">
                    <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleSelect(m.id)} className="rounded accent-violet-600" />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-sm font-medium truncate max-w-[160px]" style={{ color: "var(--txt-1)" }}>{m.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: m.type === "image" ? "rgba(59,130,246,0.1)" : "rgba(139,92,246,0.1)", color: m.type === "image" ? "#3b82f6" : "#8b5cf6" }}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--txt-2)" }}>{m.size}</td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: "var(--txt-3)" }}>{m.date}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--txt-2)" }}>{m.used} products</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => copyUrl(m.id, m.url)} className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                        style={{ border: "1px solid var(--border)", color: copied === m.id ? "#22c55e" : "var(--txt-2)" }}>
                        {copied === m.id ? "✓ Copied" : "Copy URL"}
                      </button>
                      <button onClick={() => { setMedia((p) => p.filter((x) => x.id !== m.id)); setSelected((s) => s.filter((x) => x !== m.id)); }}
                        className="text-xs px-2.5 py-1 rounded-lg text-rose-500" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: "var(--txt-3)" }}>No files found</div>
          )}
        </div>
      )}
    </div>
  );
}
