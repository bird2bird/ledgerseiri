import Link from "next/link";

export default async function HelpPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
        <div className="text-3xl font-semibold text-slate-900">ヘルプ</div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          LedgerSeiri の使い方、ログイン、ワークスペース、請求・プランに関する案内ページです。
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">ログインとセッション</div>
            <p className="mt-2 text-sm text-slate-600">
              ログインできない場合は、Cookie を確認し、再ログインをお試しください。
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">ワークスペース</div>
            <p className="mt-2 text-sm text-slate-600">
              店舗、請求プラン、利用制限はワークスペース設定から確認できます。
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${lang}/login`}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ログインへ
          </Link>
          <Link
            href={`/${lang}/status`}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            サービス状態
          </Link>
        </div>
      </div>
    </main>
  );
}
