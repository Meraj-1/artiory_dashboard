"use client";
import { useState } from "react";

const card = { backgroundColor:"var(--card)", border:"1px solid var(--border)" };

type Zone = { id:number; name:string; states:string[]; rate:number; freeAbove:number; days:string; active:boolean; };

const initialZones: Zone[] = [
  { id:1, name:"Metro Cities",    states:["Maharashtra","Delhi","Karnataka","Tamil Nadu","West Bengal"], rate:49,  freeAbove:999,  days:"2-3 days", active:true  },
  { id:2, name:"Tier 2 Cities",   states:["Rajasthan","Gujarat","Madhya Pradesh","Uttar Pradesh"],       rate:79,  freeAbove:1499, days:"3-5 days", active:true  },
  { id:3, name:"Rest of India",   states:["All other states"],                                           rate:99,  freeAbove:1999, days:"5-7 days", active:true  },
  { id:4, name:"North East India",states:["Assam","Meghalaya","Manipur","Nagaland","Mizoram","Tripura","Arunachal Pradesh","Sikkim"], rate:149, freeAbove:2999, days:"7-10 days", active:true },
  { id:5, name:"International",   states:["USA","UK","UAE","Singapore","Australia"],                     rate:999, freeAbove:9999, days:"10-15 days",active:false },
];

const couriers = [
  { name:"Shiprocket",  logo:"🚀", status:"Connected", orders:124, rating:4.2, cod:true  },
  { name:"Delhivery",   logo:"📦", status:"Connected", orders:89,  rating:4.5, cod:true  },
  { name:"BlueDart",    logo:"🔵", status:"Available", orders:0,   rating:4.7, cod:false },
  { name:"DTDC",        logo:"🟡", status:"Available", orders:0,   rating:3.9, cod:true  },
  { name:"India Post",  logo:"📮", status:"Available", orders:0,   rating:3.5, cod:true  },
];

const recentShipments = [
  { id:"#ORD-001", customer:"Rahul Sharma",  courier:"Shiprocket", tracking:"SR123456789", status:"Delivered", date:"Jan 10" },
  { id:"#ORD-002", customer:"Priya Mehta",   courier:"Delhivery",  tracking:"DL987654321", status:"In Transit",date:"Jan 9"  },
  { id:"#ORD-003", customer:"Arjun Nair",    courier:"Shiprocket", tracking:"SR456789123", status:"Picked Up", date:"Jan 9"  },
  { id:"#ORD-004", customer:"Sneha Patel",   courier:"Delhivery",  tracking:"DL321654987", status:"Processing",date:"Jan 8"  },
];

const shipBadge: Record<string,{bg:string;color:string}> = {
  "Delivered":  {bg:"rgba(34,197,94,0.1)",  color:"#22c55e"},
  "In Transit": {bg:"rgba(59,130,246,0.1)", color:"#3b82f6"},
  "Picked Up":  {bg:"rgba(234,179,8,0.1)",  color:"#eab308"},
  "Processing": {bg:"rgba(113,113,122,0.1)",color:"#71717a"},
};

export default function ShippingPage() {
  const [zones, setZones]   = useState(initialZones);
  const [tab, setTab]       = useState<"zones"|"couriers"|"shipments">("zones");
  const [editId, setEditId] = useState<number|null>(null);
  const [editRate, setEditRate]     = useState("");
  const [editFree, setEditFree]     = useState("");
  const [globalFree, setGlobalFree] = useState("999");
  const [saved, setSaved]   = useState(false);

  function saveZone(id:number) {
    setZones(p=>p.map(z=>z.id===id?{...z,rate:Number(editRate)||z.rate,freeAbove:Number(editFree)||z.freeAbove}:z));
    setEditId(null);
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  }

  const tabBtn = (t:string) => ({
    backgroundColor: tab===t?"var(--txt-1)":"var(--card)",
    color: tab===t?"var(--card)":"var(--txt-2)",
    border:"1px solid var(--border)",
  });

  const inputStyle = { backgroundColor:"var(--base)", borderColor:"var(--border)", color:"var(--txt-1)" };
  const inputClass = "px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Shipping Zones",    value:zones.filter(z=>z.active).length },
          { label:"Active Couriers",   value:couriers.filter(c=>c.status==="Connected").length },
          { label:"Avg Delivery Time", value:"3.5 days" },
          { label:"Free Shipping From",value:`₹${globalFree}` },
        ].map(s=>(
          <div key={s.label} style={card} className="rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color:"var(--txt-3)" }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color:"var(--txt-1)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {saved && <div className="rounded-xl px-5 py-3 text-sm font-medium" style={{ backgroundColor:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", color:"#22c55e" }}>✓ Shipping settings saved</div>}

      {/* Global free shipping */}
      <div style={card} className="rounded-2xl p-5 flex items-center gap-4 flex-wrap">
        <div className="flex-1">
          <p className="font-semibold" style={{ color:"var(--txt-1)" }}>Global Free Shipping Threshold</p>
          <p className="text-xs mt-0.5" style={{ color:"var(--txt-3)" }}>Orders above this amount get free shipping across all zones</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color:"var(--txt-2)" }}>₹</span>
          <input type="number" value={globalFree} onChange={e=>setGlobalFree(e.target.value)} style={inputStyle} className={`${inputClass} w-28`} />
          <button onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">Save</button>
        </div>
      </div>

      <div style={{ ...card, padding:"6px" }} className="rounded-2xl flex gap-1">
        {[["zones","Shipping Zones"],["couriers","Courier Partners"],["shipments","Recent Shipments"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k as typeof tab)} style={tabBtn(k)} className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors">{l}</button>
        ))}
      </div>

      {tab==="zones" && (
        <div className="space-y-3">
          {zones.map(z=>(
            <div key={z.id} style={{ ...card, opacity:z.active?1:0.5 }} className="rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold" style={{ color:"var(--txt-1)" }}>{z.name}</p>
                    <span className="text-xs" style={{ color:"var(--txt-3)" }}>{z.days}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color:"var(--txt-3)" }}>{z.states.join(", ")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={()=>setZones(p=>p.map(x=>x.id===z.id?{...x,active:!x.active}:x))}
                    className="relative w-10 h-5 rounded-full transition-colors"
                    style={{ backgroundColor:z.active?"#8b5cf6":"var(--border)" }}>
                    <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left:z.active?"22px":"2px" }} />
                  </button>
                  <button onClick={()=>{setEditId(editId===z.id?null:z.id);setEditRate(String(z.rate));setEditFree(String(z.freeAbove));}}
                    className="text-xs px-3 py-1.5 rounded-lg text-violet-500 transition-colors" style={{ border:"1px solid rgba(139,92,246,0.25)", backgroundColor:"rgba(139,92,246,0.08)" }}>
                    {editId===z.id?"Cancel":"Edit Rates"}
                  </button>
                </div>
              </div>
              {editId===z.id ? (
                <div className="flex items-end gap-4 mt-4 flex-wrap" style={{ borderTop:"1px solid var(--border)", paddingTop:"16px" }}>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color:"var(--txt-3)" }}>Shipping Rate (₹)</label>
                    <input type="number" value={editRate} onChange={e=>setEditRate(e.target.value)} style={inputStyle} className={`${inputClass} w-28`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color:"var(--txt-3)" }}>Free Above (₹)</label>
                    <input type="number" value={editFree} onChange={e=>setEditFree(e.target.value)} style={inputStyle} className={`${inputClass} w-28`} />
                  </div>
                  <button onClick={()=>saveZone(z.id)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">Save Zone</button>
                </div>
              ) : (
                <div className="flex gap-6 mt-3" style={{ borderTop:"1px solid var(--border)", paddingTop:"12px" }}>
                  <div><p className="text-xs" style={{ color:"var(--txt-3)" }}>Shipping Rate</p><p className="font-bold" style={{ color:"var(--txt-1)" }}>₹{z.rate}</p></div>
                  <div><p className="text-xs" style={{ color:"var(--txt-3)" }}>Free Shipping Above</p><p className="font-bold" style={{ color:"var(--txt-1)" }}>₹{z.freeAbove}</p></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="couriers" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {couriers.map(c=>(
            <div key={c.name} style={{ ...card, ...(c.status==="Connected"?{borderColor:"rgba(34,197,94,0.3)"}:{}) }} className="rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.logo}</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color:"var(--txt-1)" }}>{c.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span style={{ color:"#eab308" }}>★</span>
                      <span className="text-xs" style={{ color:"var(--txt-3)" }}>{c.rating}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor:c.status==="Connected"?"rgba(34,197,94,0.1)":"rgba(113,113,122,0.1)", color:c.status==="Connected"?"#22c55e":"#71717a" }}>{c.status}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <div><p className="text-xs" style={{ color:"var(--txt-3)" }}>Orders Shipped</p><p className="font-bold" style={{ color:"var(--txt-1)" }}>{c.orders}</p></div>
                <div><p className="text-xs" style={{ color:"var(--txt-3)" }}>COD Available</p><p className="font-bold" style={{ color:c.cod?"#22c55e":"#ef4444" }}>{c.cod?"Yes":"No"}</p></div>
              </div>
              <button className="w-full py-2 rounded-xl text-xs font-medium transition-colors"
                style={{ backgroundColor:c.status==="Connected"?"rgba(34,197,94,0.08)":"rgba(139,92,246,0.08)", color:c.status==="Connected"?"#22c55e":"#8b5cf6", border:`1px solid ${c.status==="Connected"?"rgba(34,197,94,0.2)":"rgba(139,92,246,0.2)"}` }}>
                {c.status==="Connected"?"⚙ Manage":"+ Connect"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab==="shipments" && (
        <div style={card} className="rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor:"var(--base)", borderBottom:"1px solid var(--border)" }}>
                {["Order","Customer","Courier","Tracking No.","Status","Date"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color:"var(--txt-3)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentShipments.map(s=>(
                <tr key={s.id} style={{ borderTop:"1px solid var(--border-sub)" }}>
                  <td className="px-5 py-3.5 text-sm font-mono font-medium" style={{ color:"var(--txt-2)" }}>{s.id}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color:"var(--txt-1)" }}>{s.customer}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color:"var(--txt-2)" }}>{s.courier}</td>
                  <td className="px-5 py-3.5 text-xs font-mono" style={{ color:"var(--txt-3)" }}>{s.tracking}</td>
                  <td className="px-5 py-3.5"><span className="text-xs font-medium px-2.5 py-1 rounded-full" style={shipBadge[s.status]}>{s.status}</span></td>
                  <td className="px-5 py-3.5 text-xs" style={{ color:"var(--txt-3)" }}>{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
