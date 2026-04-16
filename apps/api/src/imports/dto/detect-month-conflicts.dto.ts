export class DetectMonthConflictsDto {
  companyId?: string;
  filename?: string;
  csvText?: string;
  workbookBase64?: string;
  module?: 'store-orders' | 'store-operation' | string;
  sourceType?: 'amazon-csv' | 'excel' | string;
}
