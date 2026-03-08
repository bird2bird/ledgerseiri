function cardTone(code: "starter" | "standard" | "premium") {
  if (code === "premium") return "border-violet-200 bg-violet-50";
  if (code === "standard") return "border-sky-200 bg-sky-50";
  return "border-slate-200 bg-white";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ target?: string }>;
}) {
  const sp = await searchParams;
  const rawTarget = sp?.target;
  const target =
    rawTarget === "starter" || rawTarget === "standard" || rawTarget === "premium"
      ? rawTarget
      : "standard";

  const plans = [
    {
      code: "starter" as const,
      name: "Starter",
      price: "¥980 / 月",
      desc: "1 店舗向けの基本プラン",
    },
    {
      code: "standard" as const,
      name: "Standard",
      price: "¥1,980 / 月",
      desc: "複数店舗・請求管理・高度な出力向け",
    },
    {
      code: "premium" as const,
      name: "Premium",
      price: "¥4,980 / 月",
      desc: "AI 分析・OCR・高度な運営支援向け",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Change Plan
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          変更候補のプランを確認できます。決済実装前の UI 骨格です。
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const active = plan.code === target;

            return (
              <section
                key={plan.code}
                className={`rounded-2xl border p-5 ${cardTone(plan.code)} ${active ? "ring-2 ring-[color:var(--ls-primary)]" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-slate-900">{plan.name}</div>
                  {active ? (
                    <span className="inline-flex rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                      Selected
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 text-sm text-slate-500">{plan.price}</div>
                <div className="mt-3 text-sm text-slate-600">{plan.desc}</div>

                <button className="ls-btn ls-btn-primary mt-5 px-4 py-2 text-sm font-semibold">
                  このプランを選択
                </button>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
