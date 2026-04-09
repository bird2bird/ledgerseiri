"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { authDict } from "@/lib/i18n/auth";
import { trackLpConversionEvent } from "@/core/lp-tracking";

function PageContent() {
  const params = useParams<{ lang: string }>();
  const lang: Lang = normalizeLang(params?.lang);
  const t = authDict(lang);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("you@example.com");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.length >= 8 && agree && !loading,
    [email, password, agree, loading]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
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
      router.push(`/${lang}/onboarding/business-type`);
    } catch (e: any) {
      console.error(e);
      setErr("REGISTER_FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      lang={lang}
      title={t.registerTitle}
      subtitle={
        <>
          {t.haveAccount}{" "}
          <Link className="text-blue-600 hover:underline" href={`/${lang}/login`}>
            {t.backToLogin}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-700">{t.email}</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3 bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-sm text-slate-700">
            {t.password} {t.min8}
          </label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3 bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            {t.agreePrefix}{" "}
            <Link className="text-blue-600 hover:underline" href={`/${lang}/terms`}>{t.terms}</Link>
            {" "} & {" "}
            <Link className="text-blue-600 hover:underline" href={`/${lang}/privacy`}>{t.privacy}</Link>
            {t.agreeSuffix}
          </span>
        </label>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          disabled={!canSubmit || loading}
          className={
            "w-full rounded-xl py-3 font-medium text-white " +
            (!canSubmit || loading ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700")
          }
        >
          {loading ? "Loading..." : t.register}
        </button>
      </form>
    </AuthShell>
  );
}


export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
            Loading...
          </div>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
