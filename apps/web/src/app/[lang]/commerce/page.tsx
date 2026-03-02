import React from "react";
import Link from "next/link";
import MarketingFooter from "@/components/MarketingFooter";

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";

function normalizeLang(x: string): Lang {
  return (x === "ja" || x === "en" || x === "zh-CN" || x === "zh-TW") ? (x as Lang) : "ja";
}

export default function TokuteiDisclosurePage({ params }: { params: { lang: string } }) {
  const lang = normalizeLang(params?.lang ?? "ja");

  const title = "特定商取引法に基づく表記";
  const notice =
    "本ページは、通信販売に関する表示事項を掲載しています。LedgerSeiriは会計データ（売上・手数料・費用等）の整理・集計・分類を支援するソフトウェア（SaaS）であり、資金の保管、決済代行、税務代理業務は行いません。";

  const rows: Array<{ k: string; v: React.ReactNode }> = [
    { k: "販売事業者（法定名称）", v: "Kimoca Co., Ltd.（株式会社キモカ）" },
    { k: "所在地", v: "〒220-0004 神奈川県横浜市西区北幸2丁目10番48号つづきビル3F" },
    { k: "電話番号", v: (
      <div className="space-y-1">
        <div>+81-70-8332-2320（日本語対応）</div>
        <div className="text-xs text-slate-500">受付時間：10:00〜18:00（平日）</div>
      </div>
    )},
    { k: "メールアドレス", v: (
      <a className="text-[#2b5cff] hover:underline" href="mailto:support@kimoca.com">support@kimoca.com</a>
    )},
    { k: "運営統括責任者", v: "WEIWEI SUN" },

    { k: "販売価格", v: (
      <div className="space-y-1">
        <div>サブスクリプション料金（消費税込）</div>
        <div className="mt-1 rounded-2xl border border-black/10 bg-white p-3 text-sm">
          <div>Starter: <span className="font-semibold">¥1,980/月</span></div>
          <div>Standard: <span className="font-semibold">¥4,980/月</span></div>
          <div>Business: <span className="font-semibold">¥9,980/月</span></div>
        </div>
        <div className="text-xs text-slate-500">※ 価格は各プラン表示に準じます。</div>
      </div>
    )},

    { k: "商品（サービス）内容", v: (
      <div className="space-y-1">
        <div>クラウド型ソフトウェア（SaaS）の提供。</div>
        <div className="text-sm text-slate-700">会計データ（売上・手数料・費用等）の整理・集計・分類、およびCSV/Excel出力を支援します。</div>
      </div>
    )},

    { k: "追加手数料等の追加料金", v: (
      <div className="space-y-1">
        <div>インターネット接続料金、通信費等はお客様のご負担となります。</div>
        <div className="text-xs text-slate-500">（サービス利用料以外に当社が別途請求する費用は原則ありません）</div>
      </div>
    )},

    { k: "お支払い方法", v: "クレジットカード決済（Stripe）" },
    { k: "支払時期（支払期限）", v: "クレジットカード決済：お申し込み時に即時決済（以後、月次/年次で自動更新）" },
    { k: "提供時期（引き渡し時期）", v: (
      <div className="space-y-1">
        <div>決済完了後、直ちにサービスをご利用いただけます。</div>
        <div className="text-xs text-slate-500">（SaaSのため物理的な配送はありません）</div>
      </div>
    )},

    { k: "キャンセル・解約", v: (
      <div className="space-y-1">
        <div>いつでも解約可能です。次回更新日まで利用でき、更新後の請求は行われません。</div>
        <div>解約手続きは、サポート窓口（support@kimoca.com）までご連絡ください。</div>
      </div>
    )},

    { k: "返品・返金（不良がない場合）", v: (
      <div className="space-y-1">
        <div>デジタルサービスの性質上、決済完了後の返金は原則として承っておりません。</div>
        <div>ただし、二重課金等の当社起因の誤課金が確認できた場合は、調査のうえ返金します。</div>
      </div>
    )},

    { k: "返品・返金（不具合がある場合）", v: (
      <div className="space-y-1">
        <div>サービスの重大な不具合等により合理的に利用できない状態が継続する場合は、サポート窓口へご連絡ください。</div>
        <div>状況確認のうえ、返金または代替措置を含め誠実に対応します。</div>
      </div>
    )},

    { k: "重要事項", v: (
      <div className="space-y-1">
        <div>LedgerSeiriは会計データの整理・集計・分類を支援するSaaSです。</div>
        <div>資金の保管、決済代行、税務代理業務は行いません。</div>
        <div className="text-xs text-slate-500">（決済はStripe等の決済事業者で処理されます）</div>
      </div>
    )},
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_30%_10%,rgba(43,92,255,.10),transparent),radial-gradient(900px_500px_at_80%_20%,rgba(16,185,129,.08),transparent)]">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>

        <div className="mt-4 rounded-2xl border border-black/10 bg-white/80 px-5 py-4 text-sm text-slate-700 shadow-[var(--sh-sm)] backdrop-blur">
          {notice}
        </div>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white shadow-[var(--sh-md)]">
          <div className="px-6 py-6">
            <dl className="divide-y divide-black/5">
              {rows.map((r) => (
                <div key={r.k} className="grid grid-cols-1 gap-2 py-4 md:grid-cols-12 md:gap-6">
                  <dt className="md:col-span-4 text-sm font-semibold text-slate-800">{r.k}</dt>
                  <dd className="md:col-span-8 text-sm text-slate-700 leading-relaxed">{r.v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-black/[0.03] px-3 py-1">更新・運用は予告なく変更される場合があります</span>
              <Link className="hover:text-slate-700 underline underline-offset-4" href={`/${lang}/privacy`}>プライバシーポリシー</Link>
              <Link className="hover:text-slate-700 underline underline-offset-4" href={`/${lang}/terms`}>利用規約</Link>
              <Link className="hover:text-slate-700 underline underline-offset-4" href={`/${lang}/support`}>サポート</Link>
            </div>
          </div>
        </section>

        <MarketingFooter lang={lang} />
      </div>
    </main>
  );
}
