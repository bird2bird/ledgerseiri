import Link from "next/link";

export default async function StatusPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
        <div className="text-3xl font-semibold text-slate-900">サービス状態</div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          現在の LedgerSeiri サービス状態を確認するためのページです。
        </p>

        <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-800">現在の状態</div>
          <div className="mt-2 text-sm text-emerald-700">
            主要サービスは稼働中です。ログインやワークスペース取得に問題がある場合は、
            再ログインのうえヘルプページをご確認ください。
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${lang}/help`}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ヘルプへ
          </Link>
          <Link
            href={`/${lang}/login`}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ログインへ
          </Link>
        </div>
      </div>
    </main>
  );
}
