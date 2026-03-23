"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { platformLogin, setPlatformAccessToken, getPlatformApiBase } from "@/core/platform-auth/client";

export default function PlatformHiddenLoginPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ja";

  const [email, setEmail] = useState("admin@ledgerseiri.local");
  const [password, setPassword] = useState("dev_password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hintOpen, setHintOpen] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await platformLogin(email, password);
      setPlatformAccessToken(result.accessToken);
      router.push(`/${lang}/platform/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
        <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-2xl">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">
              Concealed Access
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              LedgerSeiri Platform Control Center
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              This entrance is separate from normal workspace login. Use only
              for platform operations, tenant visibility, user supervision, and
              reconciliation oversight.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="text-sm text-slate-400">Scope</div>
                <div className="mt-2 text-lg font-medium">Platform-wide</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="text-sm text-slate-400">API</div>
                <div className="mt-2 text-lg font-medium">{getPlatformApiBase()}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="text-sm text-slate-400">Current Mode</div>
                <div className="mt-2 text-lg font-medium">JWT + Session</div>
              </div>
            </div>

            <button
              className="mt-6 text-sm text-cyan-300 hover:text-cyan-200"
              onClick={() => setHintOpen((v) => !v)}
            >
              {hintOpen ? "Hide entry hint" : "Show hidden entry hint"}
            </button>

            {hintOpen ? (
              <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                Recommended hidden entry:
                <div className="mt-2 font-mono">/{lang}/platform-auth/login</div>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="text-sm uppercase tracking-[0.25em] text-slate-400">
              Admin Sign In
            </div>
            <form className="mt-6 space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Email</label>
                <input
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none ring-0 placeholder:text-slate-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ledgerseiri.local"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Password</label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none ring-0 placeholder:text-slate-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter platform password"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Enter Platform Console"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
