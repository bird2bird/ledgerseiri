import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import MarketingFooter from "@/components/MarketingFooter";

const SUPPORT_EMAIL = "support@kimoca.com";

export default function SecurityPage({ params }: { params: { lang: string } }) {
  const lang: Lang = normalizeLang(params.lang);
  const isEn = lang === "en";

  const title = isEn ? "Data Protection and Security" : "データ保護とセキュリティ";
  const lead = isEn
    ? "LedgerSeiri is designed to handle Amazon data and credentials safely."
    : "LedgerSeiriは、Amazonデータと認証情報を安全に取り扱うことを前提に設計しています。";

  const items = isEn
    ? [
        "All communication uses HTTPS/TLS.",
        "Amazon integration tokens are managed only on the server side.",
        "Refresh tokens and similar credentials are encrypted at rest.",
        "Access tokens, refresh tokens, and client secrets are never returned to the browser.",
        "Data is isolated by company and workspace.",
        "Imported data is used only for order import, sales review, SKU analysis, inventory management, bank reconciliation, and import history.",
        "Users can request Amazon disconnection and deletion or disabling of connection data.",
        "LedgerSeiri does not collect Seller Central login IDs or passwords.",
      ]
    : [
        "すべての通信にHTTPS/TLSを使用します。",
        "Amazon連携トークンはサーバー側でのみ管理します。",
        "refresh tokenなどの認証情報は暗号化して保存します。",
        "access token、refresh token、client secretをブラウザへ返却しません。",
        "会社・ワークスペース単位でデータを分離します。",
        "取得したデータは、注文取込、売上確認、SKU別販売分析、在庫管理、銀行明細照合、インポート履歴管理の目的でのみ利用します。",
        "利用者はAmazon連携の解除、および連携情報の削除または無効化を依頼できます。",
        "LedgerSeiriはSeller CentralのログインID・パスワードを取得しません。",
      ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">{lead}</p>

          <div className="mt-8 grid gap-3">
            {items.map((x) => (
              <div key={x} className="rounded-2xl border border-black/10 bg-slate-50 px-5 py-4 text-sm font-semibold leading-7 text-slate-700">
                {x}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-slate-700">
            {isEn
              ? "For security and privacy inquiries, contact " + SUPPORT_EMAIL + "."
              : "セキュリティおよびプライバシーに関するお問い合わせは、" + SUPPORT_EMAIL + " までご連絡ください。"}
          </div>
        </div>
      </div>
      <MarketingFooter lang={lang} />
    </main>
  );
}
