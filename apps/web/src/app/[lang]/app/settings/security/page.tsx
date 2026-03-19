"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

type SessionMeResponse =
  | {
      authenticated?: boolean;
      user?: {
        id?: string;
        email?: string;
      } | null;
    }
  | {
      message?: string;
      statusCode?: number;
    };

type CsrfResponse =
  | {
      csrfToken?: string;
    }
  | {
      message?: string;
      statusCode?: number;
    };

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function SecurityStatCard(props: {
  title: string;
  value: string;
  helper: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    props.tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : props.tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-slate-50";

  return (
    <section className={cls("rounded-[24px] border p-5", toneClass)}>
      <div className="text-xs font-medium text-slate-500">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      <div className="mt-2 text-sm text-slate-600">{props.helper}</div>
    </section>
  );
}

function SecurityActionCard(props: {
  title: string;
  description: string;
  href?: string;
  buttonLabel: string;
  tone?: "primary" | "ghost";
}) {
  return (
    <section className="rounded-[24px] border border-black/5 bg-white p-5 shadow-sm">
      <div className="text-base font-semibold text-slate-900">{props.title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{props.description}</div>

      <div className="mt-5">
        {props.href ? (
          <Link
            href={props.href}
            className={cls(
              props.tone === "primary" ? "ls-btn ls-btn-primary" : "ls-btn ls-btn-ghost",
              "inline-flex px-4 py-2 text-sm font-semibold"
            )}
          >
            {props.buttonLabel}
          </Link>
        ) : (
          <button
            type="button"
            className={cls(
              props.tone === "primary" ? "ls-btn ls-btn-primary" : "ls-btn ls-btn-ghost",
              "inline-flex px-4 py-2 text-sm font-semibold"
            )}
            onClick={() => window.alert("この導線は次ステップで接続します。")}
          >
            {props.buttonLabel}
          </button>
        )}
      </div>
    </section>
  );
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const [sessionLoading, setSessionLoading] = useState(true);
  const [csrfLoading, setCsrfLoading] = useState(true);

  const [sessionState, setSessionState] = useState<"authenticated" | "unauthorized" | "error">(
    "error"
  );
  const [sessionEmail, setSessionEmail] = useState<string>("-");
  const [sessionNote, setSessionNote] = useState<string>("");

  const [csrfState, setCsrfState] = useState<"ready" | "missing" | "error">("error");
  const [csrfPreview, setCsrfPreview] = useState<string>("-");
  const [csrfNote, setCsrfNote] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      setSessionLoading(true);
      try {
        const res = await fetch("/api/auth/session-me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const text = await res.text();
        let data: SessionMeResponse = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { message: text || "unknown response" };
        }

        if (!mounted) return;

        if (res.ok && (data as any)?.authenticated) {
          setSessionState("authenticated");
          setSessionEmail((data as any)?.user?.email || "-");
          setSessionNote("現在の session-based 認証状態を取得できました。");
        } else if (res.status === 401 || (data as any)?.message === "UNAUTHORIZED") {
          setSessionState("unauthorized");
          setSessionEmail("-");
          setSessionNote("未ログイン、または session cookie が存在しません。");
        } else {
          setSessionState("error");
          setSessionEmail("-");
          setSessionNote(`session-me returned ${res.status}.`);
        }
      } catch (err: any) {
        if (!mounted) return;
        setSessionState("error");
        setSessionEmail("-");
        setSessionNote(err?.message || "session-me fetch failed");
      } finally {
        if (mounted) setSessionLoading(false);
      }
    }

    async function loadCsrf() {
      setCsrfLoading(true);
      try {
        const res = await fetch("/auth/csrf", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const text = await res.text();
        let data: CsrfResponse = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { message: text || "unknown response" };
        }

        if (!mounted) return;

        const token = (data as any)?.csrfToken;
        if (res.ok && token) {
          setCsrfState("ready");
          setCsrfPreview(`${String(token).slice(0, 10)}...`);
          setCsrfNote("CSRF token endpoint は利用可能です。");
        } else if (res.ok) {
          setCsrfState("missing");
          setCsrfPreview("-");
          setCsrfNote("endpoint は応答していますが token が見つかりません。");
        } else {
          setCsrfState("error");
          setCsrfPreview("-");
          setCsrfNote(`csrf endpoint returned ${res.status}.`);
        }
      } catch (err: any) {
        if (!mounted) return;
        setCsrfState("error");
        setCsrfPreview("-");
        setCsrfNote(err?.message || "csrf fetch failed");
      } finally {
        if (mounted) setCsrfLoading(false);
      }
    }

    loadSession();
    loadCsrf();

    return () => {
      mounted = false;
    };
  }, []);

  const sessionBadge = useMemo(() => {
    if (sessionLoading) return { label: "Loading", cls: "border-slate-200 bg-slate-100 text-slate-600" };
    if (sessionState === "authenticated") {
      return { label: "Authenticated", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    }
    if (sessionState === "unauthorized") {
      return { label: "Unauthorized", cls: "border-amber-200 bg-amber-50 text-amber-700" };
    }
    return { label: "Error", cls: "border-rose-200 bg-rose-50 text-rose-700" };
  }, [sessionLoading, sessionState]);

  const csrfBadge = useMemo(() => {
    if (csrfLoading) return { label: "Loading", cls: "border-slate-200 bg-slate-100 text-slate-600" };
    if (csrfState === "ready") {
      return { label: "Ready", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    }
    if (csrfState === "missing") {
      return { label: "Missing Token", cls: "border-amber-200 bg-amber-50 text-amber-700" };
    }
    return { label: "Error", cls: "border-rose-200 bg-rose-50 text-rose-700" };
  }, [csrfLoading, csrfState]);

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
          Security Center
        </div>

        <h1 className="mt-5 text-[34px] font-semibold tracking-tight">セキュリティ</h1>

        <div className="mt-3 max-w-3xl text-sm leading-6 text-white/80">
          現在の認証・CSRF の接続状態を確認し、ログイン安全性や今後のセキュリティ設定導線の
          ベースとして使う production baseline ページです。
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/${lang}/app/settings`}
            className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            Settings に戻る
          </Link>

          <Link
            href={`/${lang}/app/profile`}
            className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            Profile を開く
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SecurityStatCard
          title="Session State"
          value={sessionLoading ? "Loading..." : sessionBadge.label}
          helper={sessionNote || "session cookie based auth status"}
          tone={
            sessionState === "authenticated"
              ? "success"
              : sessionState === "unauthorized"
              ? "warning"
              : "default"
          }
        />

        <SecurityStatCard
          title="Current User"
          value={sessionLoading ? "..." : sessionEmail}
          helper="`/api/auth/session-me` から取得したメール"
          tone="default"
        />

        <SecurityStatCard
          title="CSRF Token"
          value={csrfLoading ? "Loading..." : csrfPreview}
          helper={csrfNote || "`/auth/csrf` endpoint status"}
          tone={csrfState === "ready" ? "success" : csrfState === "missing" ? "warning" : "default"}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-semibold text-slate-900">Security Signals</div>
            <span className={cls("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium", sessionBadge.cls)}>
              {sessionBadge.label}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">Session Authentication</div>
                <span className={cls("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium", sessionBadge.cls)}>
                  {sessionBadge.label}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-600">{sessionNote || "-"}</div>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">CSRF Endpoint</div>
                <span className={cls("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium", csrfBadge.cls)}>
                  {csrfBadge.label}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-600">{csrfNote || "-"}</div>
            </div>

            <div className="rounded-[20px] border border-dashed border-slate-200 bg-white p-4">
              <div className="text-sm font-medium text-slate-900">Current Baseline</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• session 状態の可視化</li>
                <li>• CSRF token endpoint の可視化</li>
                <li>• 設定導線の production-style 集約</li>
                <li>• API contract は変更しない安全構成</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <SecurityActionCard
            title="ログイン / セッション確認"
            description="現在の認証状態確認や、未認証時のログイン導線確認に使います。"
            href={`/${lang}/login`}
            buttonLabel="ログインページへ"
            tone="primary"
          />

          <SecurityActionCard
            title="プロフィール確認"
            description="ユーザー関連の基本情報確認導線です。将来はパスワード変更や本人設定と接続します。"
            href={`/${lang}/app/profile`}
            buttonLabel="プロフィールを開く"
          />

          <SecurityActionCard
            title="ユーザー管理"
            description="将来の権限管理・招待・ロール設計に接続する前段導線です。"
            href={`/${lang}/app/settings/users`}
            buttonLabel="ユーザー管理へ"
          />

          <SecurityActionCard
            title="権限管理"
            description="将来の RBAC / workspace 権限設定をここに集約します。"
            href={`/${lang}/app/settings/permissions`}
            buttonLabel="権限設定へ"
          />
        </div>
      </section>
    </main>
  );
}
