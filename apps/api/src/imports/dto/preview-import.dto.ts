export class PreviewImportDto {
  companyId?: string;
  filename?: string;
  csvText?: string;
  workbookBase64?: string;
  module?: 'store-orders' | 'store-operation' | string;
  sourceType?: 'amazon-csv' | 'excel' | string;
  monthConflictPolicy?: 'skip_existing_months' | 'replace_existing_months' | string;
}
