import { normalizeLang, type Lang } from "@/lib/i18n/lang";

export default function TermsPage({ params }: { params: { lang: string } }) {
  const lang: Lang = normalizeLang(params.lang);

  const content: Record<Lang, { title: string; body: string[] }> = {
    ja: { title: "利用規約", body: [
      "LedgerSeiri（以下「本サービス」）の利用条件を定めます。",
      "アカウント作成時の情報は正確に入力してください。",
      "不正アクセス、濫用、法令違反行為を禁止します。",
      "サービス内容は予告なく変更される場合があります。",
      "免責：提供情報は現状有姿で提供されます。"
    ]},
    en: { title: "Terms of Service", body: [
      "These terms govern your use of LedgerSeiri (the “Service”).",
      "You must provide accurate information when creating an account.",
      "You must not abuse, attack, or use the Service unlawfully.",
      "We may change the Service with or without notice.",
      "Disclaimer: The Service is provided “as is”."
    ]},
    "zh-CN": { title: "服务条款", body: [
      "本条款规定了 LedgerSeiri（下称“本服务”）的使用条件。",
      "注册/使用时请提供真实、准确的信息。",
      "禁止任何滥用、攻击、违法违规使用行为。",
      "我们可能在必要时调整服务内容与规则。",
      "免责声明：本服务按“现状”提供。"
    ]},
    "zh-TW": { title: "服務條款", body: [
      "本條款規範 LedgerSeiri（下稱「本服務」）之使用。",
      "註冊/使用時請提供真實且正確的資訊。",
      "禁止任何濫用、攻擊或違法使用行為。",
      "我們可能視需要調整服務內容與規則。",
      "免責聲明：本服務按「現狀」提供。"
    ]},
  };

  const c = content[lang];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">{c.title}</h1>
          <div className="mt-6 space-y-3 text-slate-700">
            {c.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
