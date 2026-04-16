export class CommitImportDto {
  companyId?: string;
  monthConflictPolicy?: 'skip_existing_months' | 'replace_existing_months' | string;
}
