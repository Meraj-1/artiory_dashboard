"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const options = [
  { value: "light", icon: "☀️", label: "Light" },
  { value: "dark",  icon: "🌙", label: "Dark"  },
  { value: "system",icon: "💻", label: "System"},
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-[108px] h-9" />;

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      style={{ backgroundColor: "var(--base)", border: "1px solid var(--border)" }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setTheme(o.value)}
          title={o.label}
          className="w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all"
          style={
            theme === o.value
              ? { backgroundColor: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }
              : { backgroundColor: "transparent" }
          }
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
