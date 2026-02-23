"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { authDict } from "@/lib/i18n/auth";

export default function ForgotPasswordPage() {
  const params = useParams<{ lang: string }>();
  const lang: Lang = normalizeLang(params?.lang);
  const t = authDict(lang);

  const [email, setEmail] = useState("you@example.com");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 3 && !loading, [email, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      // TODO: call API /api/auth/forgot-password
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      lang={lang}
      title={t.forgotTitle}
      subtitle={
        <>
          {t.forgotSubtitle}{" "}
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

        {done && (
          <div className="rounded-xl border bg-green-50 px-4 py-3 text-sm text-green-700">
            OK. If the email exists, you will receive a reset link.
          </div>
        )}

        <button
          disabled={!canSubmit}
          className={
            "w-full rounded-xl py-3 font-medium text-white " +
            (!canSubmit ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700")
          }
        >
          {t.sendReset}
        </button>
      </form>
    </AuthShell>
  );
}
