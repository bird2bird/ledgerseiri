import React from "react";
import type { DashboardV3DistributionBlock } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";
import { getDashboardSectionStructure } from "@/core/dashboard-v3/structure";

type Props = {
  businessView: BusinessViewType;
  items: DashboardV3DistributionBlock[];
};

export function DashboardV3DistributionSection(props: Props) {
  const theme = getDashboardTheme(props.businessView);
  const structure = getDashboardSectionStructure(props.businessView);

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
        {props.items.map((block) => (
          <div
            key={block.key}
            className={"rounded-[28px] border p-6 shadow-sm " + theme.darkPanelClass}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold">{block.title}</div>
                <div className="mt-2 text-sm text-white/75">distribution view</div>
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
                {block.items.length} items
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {block.items.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div className="font-medium text-white">{item.label}</div>
                    <div className="text-white/90">
                      ¥{Number(item.value).toLocaleString("ja-JP")}
                    </div>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-white/15">
                    <div
                      className="h-3 rounded-full bg-white/85"
                      style={{
                        width: `${Math.max(
                          8,
                          Math.round(
                            (Number(item.value) /
                              Math.max(
                                1,
                                ...block.items.map((i) => Number(i.value))
                              )) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
