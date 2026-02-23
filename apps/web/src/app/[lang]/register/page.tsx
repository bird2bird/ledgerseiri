"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { authDict } from "@/lib/i18n/auth";

export default function RegisterPage() {
  const params = useParams<{ lang: string }>();
  const lang: Lang = normalizeLang(params?.lang);
  const t = authDict(lang);

  const router = useRouter();
  const [email, setEmail] = useState("you@example.com");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.length >= 8 && agree && !loading,
    [email, password, agree, loading]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      // TODO: call real API register
      router.push(`/${lang}/app`);
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

        <button
          disabled={!canSubmit}
          className={
            "w-full rounded-xl py-3 font-medium text-white " +
            (!canSubmit ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700")
          }
        >
          {t.register}
        </button>
      </form>
    </AuthShell>
  );
}
