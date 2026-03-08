export default function Page() {
  const plans = [
    {
      code: "starter",
      name: "Starter",
      price: "¥980 / 月",
      badge: "現在の最小プラン",
      features: [
        "1 店舗",
        "基本帳簿管理",
        "請求アップロード",
        "12 ヶ月履歴",
      ],
      tone: "border-slate-200 bg-white",
    },
    {
      code: "standard",
      name: "Standard",
      price: "¥1,980 / 月",
      badge: "おすすめ",
      features: [
        "3 店舗",
        "請求管理",
        "資金移動",
        "高度なエクスポート",
        "24 ヶ月履歴",
      ],
      tone: "border-sky-200 bg-sky-50",
    },
    {
      code: "premium",
      name: "Premium",
      price: "¥4,980 / 月",
      badge: "AI / 上位分析",
      features: [
        "10 店舗",
        "AI Insights",
        "AI Chat",
        "AI OCR",
        "24 ヶ月履歴",
      ],
      tone: "border-violet-200 bg-violet-50",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Billing / Plans
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              現在のプラン、利用上限、アップグレード候補を確認できます。
            </p>
          </div>

          <a
            href="/ja/app/billing/change"
            className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
          >
            プラン変更へ
          </a>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <section
              key={plan.code}
              className={`rounded-2xl border p-5 ${plan.tone}`}
            >
              <div className="inline-flex rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                {plan.badge}
              </div>

              <div className="mt-4 text-xl font-semibold text-slate-900">
                {plan.name}
              </div>

              <div className="mt-2 text-sm text-slate-500">{plan.price}</div>

              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
