"use client";
import { useState } from "react";

const card = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

type Review = {
  id: number; customer: string; avatar: string; product: string;
  rating: number; comment: string; date: string;
  status: "Pending" | "Approved" | "Rejected"; reply: string;
};

const initialReviews: Review[] = [
  { id:1, customer:"Rahul Sharma",  avatar:"R", product:"Abstract Canvas Print", rating:5, comment:"Absolutely stunning piece! The colors are vibrant and the quality is exceptional. Delivered perfectly packed.", date:"Jan 10", status:"Approved", reply:"" },
  { id:2, customer:"Priya Mehta",   avatar:"P", product:"Bronze Figurine",       rating:4, comment:"Beautiful craftsmanship. Slightly smaller than expected but the detail work is incredible.", date:"Jan 9",  status:"Pending",  reply:"" },
  { id:3, customer:"Arjun Nair",    avatar:"A", product:"Digital Art Print",     rating:5, comment:"Perfect print quality. Framed it immediately and it looks amazing in my living room.", date:"Jan 8",  status:"Approved", reply:"Thank you so much Arjun! We're thrilled you love it." },
  { id:4, customer:"Sneha Patel",   avatar:"S", product:"Watercolor Series",     rating:3, comment:"Good quality but the packaging could be better. One corner was slightly bent on arrival.", date:"Jan 7",  status:"Pending",  reply:"" },
  { id:5, customer:"Ananya Roy",    avatar:"A", product:"Marble Sculpture Set",  rating:5, comment:"A masterpiece! Every guest who visits asks about it. Worth every rupee.", date:"Jan 6",  status:"Approved", reply:"" },
  { id:6, customer:"Karan Joshi",   avatar:"K", product:"Photography Print",     rating:2, comment:"Colors look different from the website. Expected warmer tones but got cooler ones.", date:"Dec 28", status:"Pending",  reply:"" },
  { id:7, customer:"Meera Iyer",    avatar:"M", product:"Abstract Canvas Print", rating:5, comment:"Third purchase from Artiory and never disappointed. The curation is world class.", date:"Dec 25", status:"Approved", reply:"Meera, your continued support means the world to us!" },
];

const ratingColors = ["","#ef4444","#f97316","#eab308","#3b82f6","#22c55e"];
const avatarColors  = ["#8b5cf6","#3b82f6","#22c55e","#f59e0b","#ef4444","#06b6d4","#ec4899"];

function Stars({ n, size = "text-sm" }: { n: number; size?: string }) {
  return (
    <span className={size}>
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ color: i <= n ? "#eab308" : "var(--border)" }}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter]   = useState("All");
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const filtered = reviews.filter((r) => filter === "All" || r.status === filter);

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const ratingDist = [5,4,3,2,1].map((n) => ({
    n, count: reviews.filter((r) => r.rating === n).length,
    pct: Math.round((reviews.filter((r) => r.rating === n).length / reviews.length) * 100),
  }));

  function approve(id: number) { setReviews((p) => p.map((r) => r.id === id ? { ...r, status: "Approved" } : r)); }
  function reject(id: number)  { setReviews((p) => p.map((r) => r.id === id ? { ...r, status: "Rejected" } : r)); }
  function deleteR(id: number) { setReviews((p) => p.filter((r) => r.id !== id)); }
  function submitReply(id: number) {
    if (!replyText.trim()) return;
    setReviews((p) => p.map((r) => r.id === id ? { ...r, reply: replyText } : r));
    setReplyId(null);
    setReplyText("");
  }

  const statusBadge: Record<string, { bg: string; color: string }> = {
    Approved: { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
    Pending:  { bg: "rgba(234,179,8,0.12)",   color: "#eab308" },
    Rejected: { bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  };

  const filterBtn = (s: string) => ({
    backgroundColor: filter === s ? "var(--txt-1)" : "var(--card)",
    color: filter === s ? "var(--card)" : "var(--txt-2)",
    border: "1px solid var(--border)",
  });

  return (
    <div className="space-y-5">
      {/* Rating Summary */}
      <div style={card} className="rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="text-center">
            <p className="text-5xl font-bold" style={{ color: "var(--txt-1)" }}>{avgRating}</p>
            <Stars n={Math.round(Number(avgRating))} size="text-xl" />
            <p className="text-xs mt-1" style={{ color: "var(--txt-3)" }}>{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {ratingDist.map((d) => (
              <div key={d.n} className="flex items-center gap-3">
                <span className="text-xs w-4 text-right" style={{ color: "var(--txt-2)" }}>{d.n}</span>
                <span style={{ color: "#eab308" }}>★</span>
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: "var(--base)" }}>
                  <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: ratingColors[d.n] }} />
                </div>
                <span className="text-xs w-6" style={{ color: "var(--txt-3)" }}>{d.count}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: "Approved", value: reviews.filter((r) => r.status === "Approved").length, color: "#22c55e" },
              { label: "Pending",  value: reviews.filter((r) => r.status === "Pending").length,  color: "#eab308" },
              { label: "Rejected", value: reviews.filter((r) => r.status === "Rejected").length, color: "#ef4444" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "var(--txt-3)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["All","Pending","Approved","Rejected"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={filterBtn(s)} className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors">
            {s} <span className="ml-1 opacity-50">{s === "All" ? reviews.length : reviews.filter((r) => r.status === s).length}</span>
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filtered.map((r, i) => (
          <div key={r.id} style={card} className="rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
                  {r.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: "var(--txt-1)" }}>{r.customer}</p>
                    <Stars n={r.rating} />
                    <span className="text-xs" style={{ color: "var(--txt-3)" }}>{r.date}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--txt-3)" }}>on <span className="font-medium" style={{ color: "var(--txt-2)" }}>{r.product}</span></p>
                </div>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={statusBadge[r.status]}>{r.status}</span>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "var(--txt-2)" }}>{r.comment}</p>

            {/* Existing reply */}
            {r.reply && (
              <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#8b5cf6" }}>Your Reply</p>
                <p style={{ color: "var(--txt-2)" }}>{r.reply}</p>
              </div>
            )}

            {/* Reply input */}
            {replyId === r.id && (
              <div className="space-y-2">
                <textarea
                  rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-[color:var(--txt-3)]"
                />
                <div className="flex gap-2">
                  <button onClick={() => submitReply(r.id)} className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium transition-colors">
                    Post Reply
                  </button>
                  <button onClick={() => { setReplyId(null); setReplyText(""); }}
                    style={{ border: "1px solid var(--border)", color: "var(--txt-3)" }}
                    className="px-4 py-1.5 rounded-lg text-xs transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap pt-1" style={{ borderTop: "1px solid var(--border-sub)" }}>
              {r.status === "Pending" && (
                <>
                  <button onClick={() => approve(r.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                    ✓ Approve
                  </button>
                  <button onClick={() => reject(r.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors text-rose-500" style={{ border: "1px solid rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.08)" }}>
                    ✕ Reject
                  </button>
                </>
              )}
              {r.status === "Rejected" && (
                <button onClick={() => approve(r.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                  ✓ Approve
                </button>
              )}
              {!r.reply && replyId !== r.id && (
                <button onClick={() => { setReplyId(r.id); setReplyText(""); }} className="text-xs px-3 py-1.5 rounded-lg font-medium text-violet-500 transition-colors" style={{ border: "1px solid rgba(139,92,246,0.2)", backgroundColor: "rgba(139,92,246,0.08)" }}>
                  ↩ Reply
                </button>
              )}
              {r.reply && (
                <button onClick={() => { setReplyId(r.id); setReplyText(r.reply); }} className="text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ border: "1px solid var(--border)", color: "var(--txt-3)" }}>
                  Edit Reply
                </button>
              )}
              <button onClick={() => deleteR(r.id)} className="text-xs px-3 py-1.5 rounded-lg text-rose-500 transition-colors ml-auto" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: "var(--txt-3)" }}>
            <p className="text-3xl mb-2">★</p><p className="text-sm">No reviews found</p>
          </div>
        )}
      </div>
    </div>
  );
}
