export default function TenantSuspendedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-4xl">🚫</div>
        <h1 className="text-3xl font-semibold tracking-tight">アカウントが停止されています</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
          このテナントは現在、プラットフォーム管理者により停止されています。
          利用を再開するには、管理者へ連絡して再有効化を依頼してください。
        </p>
      </div>
    </div>
  );
}
