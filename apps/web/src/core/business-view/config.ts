import type { BusinessViewType } from "@/core/business-view";

export type BusinessViewConfig = {
  workspaceTitle: string;
  workspaceSubtitle: string;
  metricsSemanticsTitle: string;
  metricsSemanticsSubtitle: string;
  anomalyTitle: string;
  anomalySubtitle: string;
  highPriorityText: string;
  mediumPriorityText: string;
  lowPriorityText: string;
  legacyTitle: string;
};

const CONFIG: Record<BusinessViewType, BusinessViewConfig> = {
  amazon: {
    workspaceTitle: "Amazon operating cockpit",
    workspaceSubtitle:
      "売上・入金・差額・広告費・返金を軸に、Amazon運営の全体像を整理します。",
    metricsSemanticsTitle: "Amazon metrics semantics",
    metricsSemanticsSubtitle:
      "Amazon business view で使う KPI の意味を固定し、cockpit と explain を揃えます。",
    anomalyTitle: "Amazon anomaly workspace",
    anomalySubtitle:
      "返金率・広告効率・差額圧力など、Amazon運営で優先確認すべき異常を整理します。",
    highPriorityText: "返金率や広告効率など、利益と入金への影響が大きい項目を優先します。",
    mediumPriorityText: "直近推移を確認しつつ、差額の悪化や費用増加の兆候を追います。",
    lowPriorityText: "経過観察し、異常の蓄積を防ぎます。",
    legacyTitle: "Legacy Amazon dashboard fallback",
  },
  ec: {
    workspaceTitle: "EC operating cockpit",
    workspaceSubtitle:
      "売上・回収・費用・受注を軸に、EC事業の運営状況を整理します。",
    metricsSemanticsTitle: "EC metrics semantics",
    metricsSemanticsSubtitle:
      "EC business view で使う KPI の意味を固定し、受注から回収までを揃えます。",
    anomalyTitle: "EC anomaly workspace",
    anomalySubtitle:
      "回収遅れ・費用増・受注変動など、EC運営で優先確認すべき異常を整理します。",
    highPriorityText: "資金回収や粗利に強く影響する項目を優先します。",
    mediumPriorityText: "推移を確認し、変動の広がりを早めに把握します。",
    lowPriorityText: "経過観察し、異常の常態化を防ぎます。",
    legacyTitle: "Legacy EC dashboard fallback",
  },
  restaurant: {
    workspaceTitle: "Restaurant operating cockpit",
    workspaceSubtitle:
      "売上・原価・人件費・利益を軸に、飲食店運営の状態を整理します。",
    metricsSemanticsTitle: "Restaurant metrics semantics",
    metricsSemanticsSubtitle:
      "Restaurant business view で使う KPI の意味を固定し、日次の利益感覚と揃えます。",
    anomalyTitle: "Restaurant anomaly workspace",
    anomalySubtitle:
      "原価率・人件費圧力・売上変動など、飲食店運営で優先確認すべき異常を整理します。",
    highPriorityText: "原価率や人件費など、利益を大きく圧迫する項目を優先します。",
    mediumPriorityText: "時間帯や週次で変動を確認し、悪化の兆候を追います。",
    lowPriorityText: "経過観察し、日常運営のブレを抑えます。",
    legacyTitle: "Legacy restaurant dashboard fallback",
  },
  generic: {
    workspaceTitle: "Generic SMB cockpit",
    workspaceSubtitle:
      "売上・入金・費用・案件進行を軸に、中小事業者向けの経営状態を整理します。",
    metricsSemanticsTitle: "Generic SMB metrics semantics",
    metricsSemanticsSubtitle:
      "Generic business view で使う KPI の意味を固定し、経営判断に必要な軸を揃えます。",
    anomalyTitle: "Generic anomaly workspace",
    anomalySubtitle:
      "資金繰り・費用増・案件停滞など、優先確認すべき異常を整理します。",
    highPriorityText: "資金繰りと利益に強く影響する項目を優先します。",
    mediumPriorityText: "推移を確認し、悪化の前兆を拾います。",
    lowPriorityText: "経過観察し、異常の蓄積を防ぎます。",
    legacyTitle: "Legacy generic dashboard fallback",
  },
};

export function getBusinessViewConfig(view: BusinessViewType): BusinessViewConfig {
  return CONFIG[view];
}
