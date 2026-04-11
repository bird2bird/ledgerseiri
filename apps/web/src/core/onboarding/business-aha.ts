import type { BusinessType } from "@/core/onboarding/business-type";

export type AhaBreakdownItem = {
  key: string;
  label: string;
  amount: number;
  description: string;
};

export type BusinessAhaViewModel = {
  stepLabel: string;
  title: string;
  summary: string;
  kpi1Label: string;
  kpi1Value: number;
  kpi1Description: string;
  kpi2Label: string;
  kpi2Value: number;
  kpi2Description: string;
  kpi3Label: string;
  kpi3Value: number;
  kpi3Description: string;
  breakdownTitle: string;
  breakdownDescription: string;
  breakdown: AhaBreakdownItem[];
  unexplainedRemainder: number;
  confidence: "low" | "medium" | "high";
  coverageNote: string;
  trustNotes: string[];
  valueTitle: string;
  valueSummary: string;
  tags: string[];
  nextStepTitle: string;
  nextStepSummary: string;
};

export function formatJPY(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function getBusinessAhaViewModel(type: BusinessType): BusinessAhaViewModel {
  if (type === "ec") {
    return {
      stepLabel: "Step 2 / EC Aha",
      title: "EC運営の回収と費用のバランスを、最初に理解できます",
      summary:
        "EC business では、売上だけでなく、回収タイミング・配送費・返品費用が経営感覚に大きく影響します。LedgerSeiri はそのズレを最初に見える化します。",
      kpi1Label: "売上",
      kpi1Value: 460000,
      kpi1Description: "受注ベースの売上総額",
      kpi2Label: "回収",
      kpi2Value: 398000,
      kpi2Description: "実際に回収済みの金額",
      kpi3Label: "差額",
      kpi3Value: 62000,
      kpi3Description: "未回収・配送費・返品などの影響",
      breakdownTitle: "差額の内訳",
      breakdownDescription: "回収タイミングや費用構成を分解して理解できます。",
      breakdown: [
        { key: "shipping", label: "配送費", amount: 32000, description: "配送にかかる変動費です。" },
        { key: "returns", label: "返品", amount: 9000, description: "返品処理や返金に伴う負担です。" },
        { key: "ads", label: "広告費", amount: 21000, description: "集客コストとして発生しています。" },
      ],
      unexplainedRemainder: 0,
      confidence: "high",
      coverageNote: "回収・配送費・返品・広告費を中心に、EC運営のズレを把握できます。",
      trustNotes: [
        "売上だけでなく回収ベースでも経営状態を確認できます。",
        "配送費や返品コストが粗利を圧迫していないか確認できます。",
        "今後はチャネル別 explain へ発展できます。",
      ],
      valueTitle: "LedgerSeiri が最初に提供する価値",
      valueSummary:
        "EC business では、売上の大きさだけではなく、どれだけ回収され、どれだけ費用が漏れているかが重要です。最初の dashboard ではこのバランスを把握できます。",
      tags: ["Cash conversion", "Cost visibility", "EC cockpit"],
      nextStepTitle: "EC operating cockpit へ進みます",
      nextStepSummary:
        "回収・費用・受注のバランスを、そのまま dashboard 上の KPI・trends・alerts へ繋げて確認できます。",
    };
  }

  if (type === "restaurant") {
    return {
      stepLabel: "Step 2 / Restaurant Aha",
      title: "飲食店の利益圧力を、最初に理解できます",
      summary:
        "飲食店では、売上だけではなく、食材原価・人件費・固定費が利益感覚を大きく左右します。LedgerSeiri はその圧力を最初に整理します。",
      kpi1Label: "売上",
      kpi1Value: 680000,
      kpi1Description: "来店・注文ベースの売上総額",
      kpi2Label: "原価＋人件費",
      kpi2Value: 300000,
      kpi2Description: "主要な利益圧力の源泉",
      kpi3Label: "利益圧力",
      kpi3Value: 25000,
      kpi3Description: "改善優先度が高い差額圧力",
      breakdownTitle: "利益圧力の内訳",
      breakdownDescription: "利益に影響する主要因を分解して理解できます。",
      breakdown: [
        { key: "food", label: "食材原価", amount: 120000, description: "料理提供にかかる主要原価です。" },
        { key: "labor", label: "人件費", amount: 180000, description: "ピーク時間帯を含む人件費です。" },
        { key: "rent", label: "固定費", amount: 70000, description: "家賃などの継続費用です。" },
      ],
      unexplainedRemainder: 0,
      confidence: "high",
      coverageNote: "売上・原価・人件費・固定費を中心に利益圧力を見える化できます。",
      trustNotes: [
        "売上だけでなく原価率・人件費圧力を同時に確認できます。",
        "利益感覚に近い構造で dashboard を理解できます。",
        "今後は時間帯別・店舗別の explain へ発展できます。",
      ],
      valueTitle: "LedgerSeiri が最初に提供する価値",
      valueSummary:
        "飲食店では、売上の伸びだけではなく、原価率や人件費の圧力が重要です。最初の dashboard ではこの利益圧力を把握できます。",
      tags: ["Food cost", "Labor pressure", "Restaurant cockpit"],
      nextStepTitle: "Restaurant operating cockpit へ進みます",
      nextStepSummary:
        "売上・原価・人件費のバランスを、そのまま dashboard 上の KPI・trends・alerts へ繋げて確認できます。",
    };
  }

  if (type === "generic") {
    return {
      stepLabel: "Step 2 / Business Overview",
      title: "売上・入金・費用の流れを、最初に理解できます",
      summary:
        "一般的な中小事業では、売上だけでなく、入金タイミング・費用発生・案件進行を一緒に見ないと経営感覚がつかみにくくなります。LedgerSeiri はその全体像を最初に整理します。",
      kpi1Label: "売上",
      kpi1Value: 390000,
      kpi1Description: "期間中の売上総額",
      kpi2Label: "入金",
      kpi2Value: 352000,
      kpi2Description: "実際に受け取った金額",
      kpi3Label: "差額",
      kpi3Value: 38000,
      kpi3Description: "費用やタイミング差の影響",
      breakdownTitle: "経営 overview",
      breakdownDescription: "売上・入金・費用の流れを簡潔に理解できます。",
      breakdown: [
        { key: "income-gap", label: "入金タイミング差", amount: 18000, description: "売上と回収の時間差です。" },
        { key: "cost", label: "主要費用", amount: 12000, description: "運営上の主要費用です。" },
        { key: "other", label: "その他要因", amount: 8000, description: "細かな調整項目です。" },
      ],
      unexplainedRemainder: 0,
      confidence: "medium",
      coverageNote: "売上・入金・費用の基本構造を最初に理解できる overview です。",
      trustNotes: [
        "最初に経営の全体像を掴めます。",
        "詳細分析は dashboard 上で深掘りできます。",
        "必要に応じて将来の専用 cockpit へ拡張できます。",
      ],
      valueTitle: "LedgerSeiri が最初に提供する価値",
      valueSummary:
        "まずは business の全体像を把握し、その後でより詳細な dashboard 分析に進めるようにします。",
      tags: ["Overview", "Cash flow", "SMB cockpit"],
      nextStepTitle: "Business dashboard へ進みます",
      nextStepSummary:
        "売上・入金・費用・案件進行の overview を dashboard 上の KPI・trends・alerts へ繋げて確認できます。",
    };
  }

  throw new Error(`Unsupported business type: ${type}`);
}
