"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [tab, setTab]         = useState<"profile" | "password" | "store">("profile");
  const [saved, setSaved]     = useState(false);
  const [profile, setProfile] = useState({ name: "Admin", email: "admin@artiory.com", phone: "", bio: "" });
  const [store, setStore]     = useState({ storeName: "Artiory", currency: "INR", timezone: "Asia/Kolkata", tagline: "Premium Art Marketplace" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [pwError, setPwError] = useState("");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "password") {
      if (passwords.current !== "artiory123") { setPwError("Current password is incorrect"); return; }
      if (passwords.newPass.length < 6)        { setPwError("New password must be at least 6 characters"); return; }
      if (passwords.newPass !== passwords.confirm) { setPwError("Passwords do not match"); return; }
      setPwError("");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputStyle = {
    backgroundColor: "var(--base)",
    borderColor: "var(--border)",
    color: "var(--txt-1)",
  };
  const inputClass = "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-[color:var(--txt-3)]";
  const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1.5";

  const tabs = [
    { key: "profile",  label: "Profile"  },
    { key: "store",    label: "Store"    },
    { key: "password", label: "Password" },
  ] as const;

  const card = { backgroundColor: "var(--card)", border: "1px solid var(--border)" };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Tabs */}
      <div style={{ ...card, padding: "6px" }} className="rounded-2xl flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={
              tab === t.key
                ? { backgroundColor: "var(--txt-1)", color: "var(--card)" }
                : { backgroundColor: "transparent", color: "var(--txt-3)" }
            }
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {t.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="rounded-xl px-5 py-3 text-sm font-medium" style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
          ✓ Changes saved successfully
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={card} className="rounded-2xl p-6 space-y-5">

          {/* Profile */}
          {tab === "profile" && (
            <>
              <div className="flex items-center gap-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--txt-1)" }}>{profile.name}</p>
                  <p className="text-sm" style={{ color: "var(--txt-3)" }}>{profile.email}</p>
                  <button type="button" className="text-xs font-medium mt-1 text-violet-500 hover:text-violet-400">Change avatar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Full Name</label>
                  <input style={inputStyle} className={inputClass} value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Email</label>
                  <input type="email" style={inputStyle} className={inputClass} value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Phone</label>
                  <input type="tel" style={inputStyle} className={inputClass} value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
                <div className="sm:col-span-2">
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Bio</label>
                  <textarea rows={3} style={inputStyle} className={inputClass} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." />
                </div>
              </div>
            </>
          )}

          {/* Store */}
          {tab === "store" && (
            <>
              <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Store Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Store Name</label>
                  <input style={inputStyle} className={inputClass} value={store.storeName} onChange={(e) => setStore((s) => ({ ...s, storeName: e.target.value }))} />
                </div>
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Tagline</label>
                  <input style={inputStyle} className={inputClass} value={store.tagline} onChange={(e) => setStore((s) => ({ ...s, tagline: e.target.value }))} />
                </div>
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Currency</label>
                  <select style={inputStyle} className={inputClass} value={store.currency} onChange={(e) => setStore((s) => ({ ...s, currency: e.target.value }))}>
                    <option value="INR">INR — Indian Rupee (₹)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="GBP">GBP — British Pound (£)</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "var(--txt-3)" }} className={labelClass}>Timezone</label>
                  <select style={inputStyle} className={inputClass} value={store.timezone} onChange={(e) => setStore((s) => ({ ...s, timezone: e.target.value }))}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Password */}
          {tab === "password" && (
            <>
              <h3 className="font-semibold" style={{ color: "var(--txt-1)" }}>Change Password</h3>
              {pwError && (
                <div className="rounded-xl px-4 py-2.5 text-sm text-rose-500" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {pwError}
                </div>
              )}
              <div className="space-y-4">
                {[
                  { label: "Current Password", key: "current", placeholder: "••••••••" },
                  { label: "New Password",      key: "newPass", placeholder: "Min. 6 characters" },
                  { label: "Confirm Password",  key: "confirm", placeholder: "••••••••" },
                ].map((f) => (
                  <div key={f.key}>
                    <label style={{ color: "var(--txt-3)" }} className={labelClass}>{f.label}</label>
                    <input
                      type="password" required placeholder={f.placeholder}
                      style={inputStyle} className={inputClass}
                      value={passwords[f.key as keyof typeof passwords]}
                      onChange={(e) => setPasswords((p) => ({ ...p, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button type="submit" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
