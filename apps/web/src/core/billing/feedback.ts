export type BillingFeedbackMeta = {
  title: string;
  message: string;
  className: string;
};

export function resolveBillingFeedback(
  params: URLSearchParams | null | undefined
): BillingFeedbackMeta | null {
  if (!params) return null;

  const checkout = params.get("checkout");
  const portal = params.get("portal");
  const sync = params.get("sync");

  if (checkout === "success") {
    return {
      title: "プラン変更が完了しました",
      message: "Stripe checkout の完了後、最新の契約状態を反映しています。表示が古い場合はページを再読み込みしてください。",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (checkout === "cancel") {
    return {
      title: "プラン変更はキャンセルされました",
      message: "checkout は完了していません。現在の契約は維持されています。",
      className: "border-sky-200 bg-sky-50 text-sky-800",
    };
  }

  if (portal === "returned") {
    return {
      title: "Billing Portal から戻りました",
      message: "支払い方法や契約情報の変更後は、最新状態が反映されているか確認してください。",
      className: "border-sky-200 bg-sky-50 text-sky-800",
    };
  }

  if (sync === "success") {
    return {
      title: "契約情報を同期しました",
      message: "Stripe 上の最新サブスクリプション状態を再取得しました。",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (sync === "error") {
    return {
      title: "契約情報の同期に失敗しました",
      message: "時間をおいて再度お試しください。必要に応じて Billing Portal または管理者確認を行ってください。",
      className: "border-rose-200 bg-rose-50 text-rose-800",
    };
  }

  return null;
}
