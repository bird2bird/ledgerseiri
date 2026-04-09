export type BusinessViewType = "amazon" | "ec" | "restaurant" | "generic";

export function normalizeBusinessView(value: unknown): BusinessViewType {
  if (value === "amazon") return "amazon";
  if (value === "ec") return "ec";
  if (value === "restaurant") return "restaurant";
  return "generic";
}

export function getBusinessViewLabel(view: BusinessViewType): string {
  if (view === "amazon") return "Amazon View";
  if (view === "ec") return "EC View";
  if (view === "restaurant") return "Restaurant View";
  return "Generic SMB View";
}

export function getBusinessViewDescription(view: BusinessViewType): string {
  if (view === "amazon") {
    return "Amazon 売上・入金・差額の理解を中心にした運営ビュー";
  }
  if (view === "ec") {
    return "EC 販売向けの売上・費用・収益管理ビュー";
  }
  if (view === "restaurant") {
    return "飲食店向けの売上・原価・利益確認ビュー";
  }
  return "汎用中小事業者向けの経営管理ビュー";
}
