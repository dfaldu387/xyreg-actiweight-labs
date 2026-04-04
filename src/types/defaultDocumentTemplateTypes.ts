export interface DefaultCompanyDocumentTemplate {
  id: string;
  name: string;
  description: string | null;
  document_type: string | null;
  phase_id: string[] | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  public_url: string | null;
  uploaded_at: string | null;
  updated_by: string | null;
  created_at: string;
  inserted_at: string;
  updated_at: string;
}

export interface DefaultDocumentTemplateFilters {
  searchTerm?: string;
  documentType?: string;
  phaseId?: string;
}

export interface DefaultDocumentTemplateStats {
  totalTemplates: number;
  templatesWithFiles: number;
  uniqueDocumentTypes: number;
  uniquePhases: number;
}
