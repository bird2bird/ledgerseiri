export type TenantRow = {
  id: string;
  name: string;
  companyStatus: string;
  createdAt: string;
  userCount: number;
  storeCount: number;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
};
