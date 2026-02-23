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
      // TODO: call your real API
      // await fetch('/api/auth/login' ...)
      // success -> go to dashboard
      router.push(`/${lang}/app`);
    } catch (e: any) {
      setErr("LOGIN_FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      lang={lang}
      title={t.loginTitle}
      subtitle={t.loginSubtitle}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-700">{t.email}</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3 bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-700">{t.password}</label>
            <button type="button" className="text-sm text-slate-500 hover:underline" onClick={() => setShow(!show)}>
              {t.show}
            </button>
          </div>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3 bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
          <Link className="text-sm text-blue-600 hover:underline" href={`/${lang}/forgot-password`}>
            {t.forgot}
          </Link>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          disabled={!canSubmit || loading}
          className={
            "w-full rounded-xl py-3 font-medium text-white " +
            (!canSubmit || loading ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700")
          }
        >
          {t.login}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border p-6 bg-slate-50">
        <div className="text-center font-semibold text-slate-900">{t.firstTimeTitle}</div>
        <div className="text-center text-sm text-slate-600 mt-1">{t.firstTimeSub}</div>
        <div className="mt-4 flex justify-center">
          <Link href={`/${lang}/register`} className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-slate-100">
            {t.registerCta}
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
