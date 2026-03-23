"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { authDict } from "@/lib/i18n/auth";

export default function LoginPage() {
  const params = useParams<{ lang: string }>();
  const lang: Lang = normalizeLang(params?.lang);
  const t = authDict(lang);

  const router = useRouter();
  const [email, setEmail] = useState("fix@example.com");
  const [password, setPassword] = useState("•••••");
  const [show, setShow] = useState(false);
  const [keep, setKeep] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.trim().length > 0, [email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      await res.json().catch(() => ({}));
      router.push(`/${lang}/app`);
    } catch (e: any) {
      console.error(e);
      setErr("LOGIN_FAILED");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-sm " +
    "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b5cff]/20";

  return (
    <AuthShell lang={lang} title={t.loginTitle} subtitle={t.loginSubtitle}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-700">{t.email}</label>
          <input
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-700">{t.password}</label>
            <button
              type="button"
              className="text-sm text-slate-500 hover:text-slate-700"
              onClick={() => setShow(!show)}
            >
              {t.show}
            </button>
          </div>
          <input
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={show ? "text" : "password"}
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
            {t.keepMe}
          </label>
          <Link className="text-sm text-[#2b5cff] hover:underline" href={`/${lang}/forgot-password`}>
            {t.forgot}
          </Link>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          disabled={!canSubmit || loading}
          className={
            "w-full rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition " +
            (!canSubmit || loading ? "bg-slate-300 cursor-not-allowed" : "bg-[#2b5cff] hover:opacity-95")
          }
        >
          {t.login}
        </button>
      </form>

      <div className="mt-6 rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="text-center font-semibold text-slate-900">{t.firstTimeTitle}</div>
        <div className="text-center text-sm text-slate-600 mt-1">{t.firstTimeSub}</div>
        <div className="mt-4 flex justify-center">
          <Link
            href={`/${lang}/register`}
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-white"
          >
            {t.registerCta}
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
