import Link from "next/link";
import MarketingFooter from "@/components/MarketingFooter";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

export default function Page({ params }: { params: { lang: string } }) {
  const lang: Lang = normalizeLang(params.lang);

  const cards = [
    ["Amazon注文データ取込", "Amazon OAuthで承認された範囲で、SP-APIを通じて注文データを取り込みます。"],
    ["売上・注文確認", "注文日時、注文ステータス、SKU、販売数量、商品価格を整理します。"],
    ["SKU別販売分析", "SKU別の販売数量を確認し、仕入れや在庫判断を補助します。"],
    ["在庫管理", "注文データと在庫データを組み合わせ、在庫確認を支援します。"],
    ["銀行明細との照合", "銀行明細を取り込み、売上・支出・入金確認を補助します。"],
    ["証憑・支出管理", "請求書や証憑データを支出と紐づけて整理できます。"]
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">主要機能</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">LedgerSeiriの主な機能を、1ページで確認できます。</p>
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
