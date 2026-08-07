"use client";
import { useState } from "react";

const card = { backgroundColor:"var(--card)", border:"1px solid var(--border)" };

type Integration = {
  id:string; name:string; desc:string; category:string; icon:string;
  connected:boolean; config:Record<string,string>; fields:{key:string;label:string;placeholder:string;type?:string}[];
};

const initialIntegrations: Integration[] = [
  { id:"whatsapp",   name:"WhatsApp Business", desc:"Send order updates, abandoned cart reminders, and promotions via WhatsApp.", category:"Communication", icon:"💬", connected:false, config:{}, fields:[{key:"phone",label:"Business Phone",placeholder:"+91 98765 43210"},{key:"apiKey",label:"WhatsApp API Key",placeholder:"Your API key",type:"password"}] },
  { id:"instagram",  name:"Instagram Shopping", desc:"Tag products in Instagram posts and stories. Drive traffic directly to your store.", category:"Social", icon:"📸", connected:true,  config:{handle:"@artiory",pageId:"123456"}, fields:[{key:"handle",label:"Instagram Handle",placeholder:"@yourbrand"},{key:"pageId",label:"Facebook Page ID",placeholder:"Your Page ID"}] },
  { id:"razorpay",   name:"Razorpay", desc:"Accept payments via UPI, cards, net banking, and wallets.", category:"Payments", icon:"💳", connected:true,  config:{keyId:"rzp_live_xxx",mode:"Live"}, fields:[{key:"keyId",label:"Key ID",placeholder:"rzp_live_..."},{key:"keySecret",label:"Key Secret",placeholder:"Your secret",type:"password"}] },
  { id:"googleanalytics", name:"Google Analytics 4", desc:"Track store visitors, conversions, and user behaviour in detail.", category:"Analytics", icon:"📊", connected:false, config:{}, fields:[{key:"measurementId",label:"Measurement ID",placeholder:"G-XXXXXXXXXX"}] },
  { id:"metapixel",  name:"Meta Pixel", desc:"Track Facebook & Instagram ad conversions and retarget visitors.", category:"Advertising", icon:"🎯", connected:false, config:{}, fields:[{key:"pixelId",label:"Pixel ID",placeholder:"Your Pixel ID"}] },
  { id:"googlesearch", name:"Google Search Console", desc:"Monitor search performance, fix indexing issues, and submit sitemaps.", category:"SEO", icon:"🔍", connected:false, config:{}, fields:[{key:"verificationCode",label:"Verification Code",placeholder:"Paste HTML tag content"}] },
  { id:"shiprocket", name:"Shiprocket", desc:"Automate shipping with 25+ courier partners. Track orders in real-time.", category:"Shipping", icon:"🚚", connected:false, config:{}, fields:[{key:"email",label:"Shiprocket Email",placeholder:"your@email.com"},{key:"password",label:"Password",placeholder:"Your password",type:"password"}] },
  { id:"mailchimp",  name:"Mailchimp", desc:"Build email lists, send newsletters, and automate email marketing campaigns.", category:"Email", icon:"📧", connected:false, config:{}, fields:[{key:"apiKey",label:"API Key",placeholder:"Your Mailchimp API key",type:"password"},{key:"listId",label:"Audience ID",placeholder:"Your list ID"}] },
  { id:"googleads",  name:"Google Ads", desc:"Run search and shopping ads. Track ROAS and conversions automatically.", category:"Advertising", icon:"📢", connected:false, config:{}, fields:[{key:"conversionId",label:"Conversion ID",placeholder:"AW-XXXXXXXXX"},{key:"conversionLabel",label:"Conversion Label",placeholder:"Your label"}] },
];

const categories = ["All","Payments","Communication","Social","Analytics","Advertising","SEO","Shipping","Email"];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [filter, setFilter]   = useState("All");
  const [configId, setConfigId] = useState<string|null>(null);
  const [formData, setFormData] = useState<Record<string,string>>({});
  const [saved, setSaved]     = useState<string|null>(null);

  const filtered = integrations.filter(i => filter==="All" || i.category===filter);
  const connected = integrations.filter(i=>i.connected).length;

  function openConfig(i: Integration) {
    setConfigId(i.id);
    setFormData(i.connected ? {...i.config} : {});
  }

  function saveConfig(id:string) {
    setIntegrations(p=>p.map(i=>i.id===id?{...i,connected:true,config:{...formData}}:i));
    setConfigId(null);
    setSaved(id);
    setTimeout(()=>setSaved(null),2000);
  }

  function disconnect(id:string) {
    setIntegrations(p=>p.map(i=>i.id===id?{...i,connected:false,config:{}}:i));
  }

  const filterBtn = (s:string) => ({
    backgroundColor: filter===s?"var(--txt-1)":"var(--card)",
    color: filter===s?"var(--card)":"var(--txt-2)",
    border:"1px solid var(--border)",
  });

  const inputStyle = { backgroundColor:"var(--base)", borderColor:"var(--border)", color:"var(--txt-1)" };
  const inputClass = "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-[color:var(--txt-3)]";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label:"Total Integrations", value:integrations.length },
          { label:"Connected",          value:connected, color:"#22c55e" },
          { label:"Not Connected",      value:integrations.length-connected, color:"var(--txt-3)" },
        ].map(s=>(
          <div key={s.label} style={card} className="rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color:"var(--txt-3)" }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color:s.color||"var(--txt-1)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={filterBtn(c)} className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors">{c}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(i=>(
          <div key={i.id} style={{ ...card, ...(i.connected?{borderColor:"rgba(34,197,94,0.3)"}:{}) }} className="rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{i.icon}</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color:"var(--txt-1)" }}>{i.name}</p>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor:"rgba(139,92,246,0.1)", color:"#8b5cf6" }}>{i.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor:i.connected?"#22c55e":"var(--border)" }} />
                <span className="text-xs" style={{ color:i.connected?"#22c55e":"var(--txt-3)" }}>{i.connected?"Connected":"Not connected"}</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color:"var(--txt-2)" }}>{i.desc}</p>

            {saved===i.id && <p className="text-xs font-medium" style={{ color:"#22c55e" }}>✓ Connected successfully</p>}

            {configId===i.id && (
              <div className="space-y-3 pt-3" style={{ borderTop:"1px solid var(--border)" }}>
                {i.fields.map(f=>(
                  <div key={f.key}>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color:"var(--txt-3)" }}>{f.label}</label>
                    <input type={f.type||"text"} value={formData[f.key]||""} onChange={e=>setFormData(d=>({...d,[f.key]:e.target.value}))}
                      placeholder={f.placeholder} style={inputStyle} className={inputClass} />
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onClick={()=>saveConfig(i.id)} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-medium transition-colors">Save & Connect</button>
                  <button onClick={()=>setConfigId(null)} className="px-4 py-2 rounded-xl text-xs transition-colors" style={{ border:"1px solid var(--border)", color:"var(--txt-3)" }}>Cancel</button>
                </div>
              </div>
            )}

            {configId!==i.id && (
              <div className="flex gap-2">
                <button onClick={()=>openConfig(i)} className="flex-1 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{ backgroundColor:i.connected?"rgba(34,197,94,0.08)":"rgba(139,92,246,0.08)", color:i.connected?"#22c55e":"#8b5cf6", border:`1px solid ${i.connected?"rgba(34,197,94,0.2)":"rgba(139,92,246,0.2)"}` }}>
                  {i.connected?"⚙ Configure":"+ Connect"}
                </button>
                {i.connected && (
                  <button onClick={()=>disconnect(i.id)} className="px-3 py-2 rounded-xl text-xs text-rose-500 transition-colors" style={{ border:"1px solid rgba(239,68,68,0.2)" }}>
                    Disconnect
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
