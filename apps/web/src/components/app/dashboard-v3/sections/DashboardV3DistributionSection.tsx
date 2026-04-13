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

function sectionTitle(lang: string, businessView: BusinessViewType, index: number, fallback: string) {
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
  const structure = getDashboardSectionStructure(props.businessView, props.lang);
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
          const hasItems = (block.items?.length || 0) > 0;

          return (
            <div
              key={block.key}
              className={"rounded-[28px] border p-6 shadow-sm " + theme.chartPanelClass}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold">
                    {isEnhanced
                      ? sectionTitle(props.lang, props.businessView, index, block.title)
                      : block.title}
                  </div>
                  <div className="mt-2 text-sm text-white/75">
                    {isEnhanced ? c.distributionEnhanced : c.distributionBasic}
                  </div>
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
                  {hasItems ? `${block.items.length} items` : "empty"}
                </div>
              </div>

              {hasItems ? (
                <div className="mt-6 space-y-3">
                  {block.items.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm font-medium text-white">{item.label}</div>
                        <div className="text-sm text-white/85">
                          {Number(item.value).toLocaleString("ja-JP")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-white/75">
                  No distribution data is available yet.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
