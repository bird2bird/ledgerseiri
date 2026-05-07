type StatusPillProps = {
  label: string;
  tone: "blue" | "green" | "amber" | "gray";
};

function StatusPill({ label, tone }: StatusPillProps) {
  const toneClassName =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClassName}`}>
      {label}
    </span>
  );
}

export function AmazonSpApiSandboxReadModelPanelShell() {
  const previewRows = [
    {
      id: "preview-001",
      filename: "amazon-sp-api-sandbox-orders-preview.json",
      status: "PENDING",
      rows: 128,
      classification: "未確定・確認待ち",
      createdAt: "2026/05/07",
    },
    {
      id: "preview-002",
      filename: "amazon-sp-api-sandbox-fees-preview.json",
      status: "DISPLAY_ONLY",
      rows: 42,
      classification: "読取専用",
      createdAt: "2026/05/07",
    },
  ];

  return (
    <section
      data-step122-w="amazon-sp-api-sandbox-read-model-panel-shell"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Amazon SP-API サンドボックス取込プレビュー</h2>
            <StatusPill label="UI shell" tone="gray" />
            <StatusPill label="dryRun=true" tone="blue" />
            <StatusPill label="displayOnly" tone="green" />
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            このパネルは Step122-W の表示シェルです。まだデータ取得は行いません。売上計上・在庫反映・OAuth・実SP-API接続は無効です。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400"
          >
            売上計上は無効
          </button>
          <button
            type="button"
            disabled
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400"
          >
            在庫反映は無効
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        Amazon SP-API サンドボックスの読取専用プレビューです。ここではデータ取得・保存・売上計上・在庫反映は実行されません。
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <label className="space-y-1 text-xs font-medium text-slate-600">
          フィルター
          <select disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            <option>amazon-sp-api-sandbox</option>
            <option>pending-review</option>
            <option>uncommitted-staging</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-medium text-slate-600">
          並び順
          <select disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            <option>作成日 新しい順</option>
            <option>ファイル名 A-Z</option>
            <option>行数 多い順</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-medium text-slate-600">
          表示件数
          <select disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            <option>20件</option>
            <option>50件</option>
            <option>100件</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-medium text-slate-600">
          状態
          <select disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            <option>表示シェルのみ</option>
            <option>未認証 401</option>
            <option>権限なし 403</option>
            <option>検索条件エラー 400</option>
          </select>
        </label>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
          <div className="col-span-4">ファイル</div>
          <div className="col-span-2">状態</div>
          <div className="col-span-2">行数</div>
          <div className="col-span-2">分類</div>
          <div className="col-span-2">作成日</div>
        </div>

        {previewRows.map((row) => (
          <div key={row.id} className="grid grid-cols-12 items-center border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
            <div className="col-span-4 truncate font-medium text-slate-800">{row.filename}</div>
            <div className="col-span-2">
              <StatusPill label={row.status} tone={row.status === "PENDING" ? "amber" : "green"} />
            </div>
            <div className="col-span-2 text-slate-600">{row.rows.toLocaleString("ja-JP")}</div>
            <div className="col-span-2 text-slate-600">{row.classification}</div>
            <div className="col-span-2 text-slate-500">{row.createdAt}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">401</p>
          <p className="mt-1 text-sm text-slate-700">ログインが必要です。</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">403</p>
          <p className="mt-1 text-sm text-slate-700">表示権限がありません。</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">400</p>
          <p className="mt-1 text-sm text-slate-700">検索条件を確認してください。</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">Empty</p>
          <p className="mt-1 text-sm text-slate-700">対象データはありません。</p>
        </div>
      </div>
    </section>
  );
}

export default AmazonSpApiSandboxReadModelPanelShell;
