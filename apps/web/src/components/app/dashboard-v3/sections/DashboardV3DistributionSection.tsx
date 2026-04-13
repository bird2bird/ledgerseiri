import React from "react";
import type { DashboardV3DistributionBlock } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";
import { getDashboardSectionStructure } from "@/core/dashboard-v3/structure";
import { getDashboardCopy } from "@/core/dashboard-copy";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  items: DashboardV3DistributionBlock[];
};

function getRingSegments(values: number[]) {
  const total = values.reduce((sum, n) => sum + n, 0) || 1;
  let acc = 0;
  return values.map((value) => {
    const start = (acc / total) * 100;
    acc += value;
    const end = (acc / total) * 100;
    return { start, end };
  });
}

function getConicGradient(segments: { start: number; end: number }[]) {
  const colors = [
    "rgba(255,255,255,0.95)",
    "rgba(255,255,255,0.78)",
    "rgba(255,255,255,0.62)",
    "rgba(255,255,255,0.48)",
    "rgba(255,255,255,0.34)",
    "rgba(255,255,255,0.24)",
  ];

  const parts = segments.map((segment, index) => {
    const color = colors[index % colors.length];
    return `${color} ${segment.start}% ${segment.end}%`;
  });

  if (parts.length === 0) {
    return "conic-gradient(rgba(255,255,255,0.5) 0% 100%)";
  }

  return `conic-gradient(${parts.join(",")})`;
}

function blockTitle(lang: string, businessView: BusinessViewType, index: number, fallback: string) {
  const c = getDashboardCopy(lang);
  if (businessView === "amazon") {
    return index === 0 ? c.distributionAmazonPrimary : c.distributionAmazonSecondary;
  }
  if (businessView === "ec") {
    return index === 0 ? c.distributionEcPrimary : c.distributionEcSecondary;
  }
  return fallback;
}

export function DashboardV3DistributionSection(props: Props) {
  const c = getDashboardCopy(props.lang);
  const theme = getDashboardTheme(props.businessView);
  const structure = getDashboardSectionStructure(props.businessView);
  const isEnhanced = props.businessView === "amazon" || props.businessView === "ec";

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-black/5 bg-white px-5 py-4 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">
          {structure.distributionTitle}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {structure.distributionSummary}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {props.items.map((block, index) => {
          const values = block.items.map((item) => Number(item.value) || 0);
          const total = values.reduce((sum, n) => sum + n, 0) || 1;
          const maxValue = Math.max(1, ...values);
          const segments = getRingSegments(values);

          return (
            <div
              key={block.key}
              className={"rounded-[28px] border p-6 shadow-sm " + theme.darkPanelClass}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold">
                    {isEnhanced ? blockTitle(props.lang, props.businessView, index, block.title) : block.title}
                  </div>
                  <div className="mt-2 text-sm text-white/75">
                    {isEnhanced ? c.distributionEnhanced : c.distributionBasic}
                  </div>
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
                  {block.items.length} items
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  {block.items.map((item) => {
                    const value = Number(item.value) || 0;
                    const width = Math.max(8, Math.round((value / maxValue) * 100));
                    const ratio = ((value / total) * 100).toFixed(1);

                    return (
                      <div key={item.key}>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="font-medium text-white">{item.label}</div>
                          <div className="text-right text-white/90">
                            <div>¥{value.toLocaleString("ja-JP")}</div>
                            {isEnhanced ? <div className="text-xs text-white/70">{ratio}%</div> : null}
                          </div>
                        </div>
                        <div className="mt-3 h-3 rounded-full bg-white/15">
                          <div
                            className="h-3 rounded-full bg-white/85"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col items-center justify-center gap-4">
                  <div
                    className="relative h-[180px] w-[180px] rounded-full"
                    style={{ background: getConicGradient(segments) }}
                  >
                    <div className="absolute inset-[28px] rounded-full bg-slate-950/35 backdrop-blur-sm" />
                  </div>

                  <div className="grid w-full grid-cols-2 gap-2 text-xs text-white/80">
                    {block.items.slice(0, 4).map((item) => {
                      const value = Number(item.value) || 0;
                      const ratio = ((value / total) * 100).toFixed(1);
                      return (
                        <div
                          key={`${block.key}-${item.key}-legend`}
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                        >
                          <div>{item.label}</div>
                          {isEnhanced ? <div className="mt-1 text-white/65">{ratio}%</div> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
