import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import MarketingFooter from "@/components/MarketingFooter";

export default function PrivacyPage({ params }: { params: { lang: string } }) {
  const lang: Lang = normalizeLang(params.lang);

  const content: Record<Lang, { title: string; body: string[] }> = {
    ja: { title: "プライバシーポリシー", body: [
      "当社は、アカウント情報（メール等）とサービス利用ログを取り扱います。",
      "目的：本人確認、提供機能の改善、不正防止、サポート対応。",
      "第三者提供：法令に基づく場合等を除き行いません。",
      "保管：必要期間に限り安全に保管します。",
      "お問い合わせ：サポート窓口までご連絡ください。"
    ]},
    en: { title: "Privacy Policy", body: [
      "We process account data (email, etc.) and service usage logs.",
      "Purpose: authentication, improvement, abuse prevention, support.",
      "Sharing: not shared with third parties unless required by law.",
      "Retention: kept only as necessary and secured appropriately.",
      "Contact: reach out to support for inquiries."
    ]},
    "zh-CN": { title: "隐私政策", body: [
      "我们会处理账号信息（邮箱等）与服务使用日志。",
      "用途：身份验证、功能优化、风控与反欺诈、客服支持。",
      "第三方共享：除法律要求等情形外，不会对外提供。",
      "保存期限：仅在必要范围内保存并采取合理安全措施。",
      "如需咨询，请联系支持渠道。"
    ]},
    "zh-TW": { title: "隱私政策", body: [
      "我們會處理帳號資訊（電子郵件等）與使用紀錄。",
      "用途：身份驗證、功能優化、風控反詐、客服支援。",
      "第三方提供：除法律要求等情形外，不會對外提供。",
      "保存期限：僅於必要範圍保存並採取合理安全措施。",
      "如需諮詢，請聯繫支援管道。"
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
