"use client";

import { FeatureGate } from "./FeatureGate";

export function BillingGuardExample() {
  return (
    <div className="space-y-4">

      <FeatureGate feature="aiChat">
        <div className="rounded-xl border p-4">
          AI Chat Feature Enabled
        </div>
      </FeatureGate>

      <FeatureGate feature="invoiceOcr">
        <div className="rounded-xl border p-4">
          OCR Invoice Upload
        </div>
      </FeatureGate>

    </div>
  );
}
