import Link from "next/link";
import MarketingFooter from "@/components/MarketingFooter";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

export default function Page({ params }: { params: { lang: string } }) {
  const lang: Lang = normalizeLang(params.lang);

  const cards = [
    ["小規模Amazon出品者", "CSVと銀行明細を手作業で管理していた事業者が、注文・売上・在庫確認を一元化するケース。"],
    ["複数SKUを扱うEC事業者", "SKU別の販売数量を確認し、仕入れや在庫判断を補助するケース。"],
    ["税理士へ資料を渡す事業者", "売上、支出、証憑、在庫関連データを整理し、月次確認を効率化するケース。"]
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">導入事例</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">想定される利用パターンを紹介します。実在企業の成果を保証するものではありません。</p>
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
