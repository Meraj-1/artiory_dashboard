"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuth } from "@/lib/auth";
import { ThemeToggle } from "@/app/components/ThemeToggle";

type NavItem = { href: string; label: string; icon: string; exact?: boolean; badge?: number };
type NavSection = { title: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { href: "/dashboard",               label: "Overview",      icon: "▦", exact: true },
      { href: "/dashboard/orders",        label: "Orders",        icon: "◈", badge: 3 },
      { href: "/dashboard/notifications", label: "Notifications", icon: "◉", badge: 5 },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/dashboard/products",        label: "All Products",   icon: "◫" },
      { href: "/dashboard/products/upload", label: "Upload Product", icon: "⊕" },
      { href: "/dashboard/products/combo",  label: "Combo Products", icon: "⊞" },
      { href: "/dashboard/inventory",       label: "Inventory",      icon: "◧" },
      { href: "/dashboard/discounts",       label: "Discounts",      icon: "◬" },
    ],
  },
  {
    title: "Customers",
    items: [
      { href: "/dashboard/customers", label: "Customers", icon: "◍" },
      { href: "/dashboard/reviews",   label: "Reviews",   icon: "◎" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/dashboard/shipping", label: "Shipping", icon: "◩" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: "⊙" },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

const EASE = "cubic-bezier(0.4,0,0.2,1)";
const COLLAPSED_W = 64;
const EXPANDED_W  = 256;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  const crumbs = pathname.split("/").filter(Boolean).map((seg, i, arr) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + arr.slice(0, i + 1).join("/"),
  }));

  const sideW = open ? EXPANDED_W : COLLAPSED_W;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--base)" }}>

      {/* ── Sidebar ── */}
      <aside
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          backgroundColor: "var(--sidebar)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          width: sideW,
          transition: `width 0.28s ${EASE}`,
          boxShadow: open ? "4px 0 24px rgba(0,0,0,0.35)" : "none",
        }}
        className="text-white flex flex-col fixed h-full z-30 overflow-hidden"
      >
        {/* Logo */}
        <div
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", minHeight: 64 }}
          className="flex items-center px-3 py-4 gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            A
          </div>
          <div style={{
            opacity: open ? 1 : 0,
            width: open ? "auto" : 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: `opacity 0.2s ease, width 0.28s ${EASE}`,
          }}>
            <h1 className="text-base font-bold tracking-tight text-white">Artiory</h1>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Dashboard</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <div style={{
                overflow: "hidden",
                maxHeight: open ? 24 : 0,
                opacity: open ? 1 : 0,
                transition: `max-height 0.25s ease, opacity 0.2s ease`,
              }}>
                <p className="text-[10px] uppercase tracking-widest px-3 mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {section.title}
                </p>
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!open ? item.label : undefined}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative"
                      style={active ? { background: "#ffffff", color: "#0a0a0a" } : { color: "rgba(255,255,255,0.55)" }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span className="text-base shrink-0">{item.icon}</span>
                      <span style={{
                        opacity: open ? 1 : 0,
                        maxWidth: open ? 160 : 0,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        transition: `opacity 0.18s ease, max-width 0.28s ${EASE}`,
                        flex: 1,
                      }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <>
                          <span style={{ opacity: open ? 1 : 0, transition: "opacity 0.18s ease" }}
                            className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {item.badge}
                          </span>
                          {!open && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} className="p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 text-white">
              A
            </div>
            <div style={{
              opacity: open ? 1 : 0,
              maxWidth: open ? 160 : 0,
              overflow: "hidden",
              whiteSpace: "nowrap",
              transition: `opacity 0.18s ease, max-width 0.28s ${EASE}`,
            }}>
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>admin@artiory.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
          >
            <span className="text-base shrink-0">⇥</span>
            <span style={{
              opacity: open ? 1 : 0,
              maxWidth: open ? 120 : 0,
              overflow: "hidden",
              whiteSpace: "nowrap",
              transition: `opacity 0.18s ease, max-width 0.28s ${EASE}`,
            }}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main — shifts with sidebar ── */}
      <div
        style={{
          marginLeft: sideW,
          transition: `margin-left 0.28s ${EASE}`,
        }}
        className="flex-1 flex flex-col"
      >
        {/* Header */}
        <header
          style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}
          className="px-6 py-3 flex items-center gap-4 sticky top-0 z-20"
        >
          <div className="flex items-center gap-1.5 text-sm flex-1">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <span style={{ color: "var(--txt-3)" }}>/</span>}
                {i === crumbs.length - 1 ? (
                  <span className="font-semibold" style={{ color: "var(--txt-1)" }}>{c.label}</span>
                ) : (
                  <Link href={c.href} className="transition-colors" style={{ color: "var(--txt-3)" }}>
                    {c.label}
                  </Link>
                )}
              </span>
            ))}
          </div>

          <div className="relative hidden sm:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--txt-3)" }}>⌕</span>
            <input
              type="text"
              placeholder="Search anything..."
              style={{ backgroundColor: "var(--base)", borderColor: "var(--border)", color: "var(--txt-1)" }}
              className="pl-8 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-56 placeholder:text-[color:var(--txt-3)]"
            />
          </div>

          <ThemeToggle />

          <Link
            href="/dashboard/notifications"
            style={{ borderColor: "var(--border)", color: "var(--txt-2)" }}
            className="relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors hover:bg-[color:var(--base)]"
          >
            <span className="text-base">◉</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </Link>

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
            A
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
