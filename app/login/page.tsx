"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAuth, validateCredentials } from "@/lib/auth";
import { ThemeToggle } from "@/app/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (validateCredentials(email, password)) {
      try {
        const res = await fetch("http://localhost:5000/api/auth/admin-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.token) {
          setAuth(data.token);
        } else {
          setAuth("artiory-token-" + Date.now());
        }
      } catch {
        setAuth("artiory-token-" + Date.now());
      }
      router.push("/dashboard");
    } else {
      setError("Invalid email or password");
      setLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: "var(--base)",
    borderColor: "var(--border)",
    color: "var(--txt-1)",
  };

  return (
    <div
      className="min-h-screen flex items-center p-4 relative"
      style={{ backgroundColor: "var(--base)" }}
    >
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg shadow-violet-500/25">
            A
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--txt-1)" }}>Artiory</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--txt-3)" }}>Client Dashboard</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl shadow-2xl p-8"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          }}
        >
          <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--txt-1)" }}>Welcome back</h2>
          <p className="text-sm mb-6" style={{ color: "var(--txt-3)" }}>Sign in to your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt-3)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@artiory.com"
                style={inputStyle}
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-[color:var(--txt-3)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt-3)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  className="w-full px-4 py-3 pr-12 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-[color:var(--txt-3)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors"
                  style={{ color: "var(--txt-3)" }}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-2.5 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-60 shadow-lg shadow-violet-500/20 mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
