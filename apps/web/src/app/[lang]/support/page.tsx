import Link from "next/link";
import MarketingFooter from "@/components/MarketingFooter";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

const COMPANY_LEGAL_JA = "Kimoca Co., Ltd.（株式会社キモカ）";
const SUPPORT_EMAIL = "support@kimoca.com";
const SUPPORT_PHONE = "+81-70-8332-2320";

export default function SupportPage({ params }: { params: { lang: string } }) {
  const lang: Lang = normalizeLang(params.lang);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">サポート</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            LedgerSeiriの使い方、Amazon連携、アカウント、請求、データ削除に関するお問い合わせを受け付けています。
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-black/10 bg-slate-50 p-6">
              <h2 className="text-lg font-black text-slate-950">お問い合わせ窓口</h2>
              <dl className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <div>
                  <dt className="font-bold">運営会社</dt>
                  <dd>{COMPANY_LEGAL_JA}</dd>
                </div>
                <div>
                  <dt className="font-bold">メール</dt>
                  <dd><a className="text-[#2b5cff] underline underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></dd>
                </div>
                <div>
                  <dt className="font-bold">電話</dt>
                  <dd>{SUPPORT_PHONE}（平日 10:00〜18:00）</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-black/10 bg-slate-50 p-6">
              <h2 className="text-lg font-black text-slate-950">Amazon連携の解除・データ削除</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Amazon連携の解除、保存されたAmazon連携情報の削除、アカウント解約、データ削除に関する依頼は、
                サポート窓口までご連絡ください。法令上保存が必要な情報を除き、合理的な期間内に削除または匿名化を行います。
              </p>
            </section>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Amazon連携", "OAuth承認、SP-API連携、注文データ取込に関するお問い合わせ。"],
              ["アカウント・請求", "ログイン、プラン、請求、解約に関するお問い合わせ。"],
              ["不具合・改善要望", "画面表示、CSV取込、データ確認に関するお問い合わせ。"],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-black/10 bg-white p-5">
                <h3 className="font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
            <Link className="rounded-full border border-black/10 bg-white px-5 py-3 hover:bg-slate-50" href={"/" + lang + "/privacy"}>
              プライバシーポリシー
            </Link>
            <Link className="rounded-full border border-black/10 bg-white px-5 py-3 hover:bg-slate-50" href={"/" + lang + "/security"}>
              セキュリティ
            </Link>
            <Link className="rounded-full border border-black/10 bg-white px-5 py-3 hover:bg-slate-50" href={"/" + lang + "/commerce"}>
              特定商取引法に基づく表示
            </Link>
          </div>
        </div>
      </div>
      <MarketingFooter lang={lang} />
    </main>
  );
}
