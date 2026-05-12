import Link from "next/link";
import MarketingFooter from "@/components/MarketingFooter";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

export default function Page({ params }: { params: { lang: string } }) {
  const lang: Lang = normalizeLang(params.lang);

  const cards = [
    ["Amazon連携について", "Amazon OAuth、SP-API、取得データ範囲、連携解除について説明します。"],
    ["データ保護", "Amazonデータ、連携トークン、会社・ワークスペース分離について説明します。"],
    ["料金と契約", "料金プラン、支払い、解約、特定商取引法に基づく表示を確認できます。"]
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">資料一覧</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">LedgerSeiriの利用検討に役立つ情報をまとめています。</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map(([title, body]) => (
            <section key={title} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-[#2b5cff]/15 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Amazon連携とデータ保護</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            LedgerSeiriは、出品者がAmazon OAuthを通じて明示的に承認した場合にのみ、
            Amazon Selling Partner API（SP-API）を通じて出品者自身の注文データへアクセスします。
            Seller CentralのログインID・パスワードは取得しません。
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
            <Link className="rounded-full border border-black/10 bg-white px-5 py-3 hover:bg-slate-50" href={`/${lang}#amazon-sp-api`}>
              Amazon連携を見る
            </Link>
            <Link className="rounded-full border border-black/10 bg-white px-5 py-3 hover:bg-slate-50" href={`/${lang}/privacy`}>
              プライバシーポリシー
            </Link>
            <Link className="rounded-full border border-black/10 bg-white px-5 py-3 hover:bg-slate-50" href={`/${lang}/security`}>
              セキュリティ
            </Link>
          </div>
        </div>
      </div>
      <MarketingFooter lang={lang} />
    </main>
  );
}
