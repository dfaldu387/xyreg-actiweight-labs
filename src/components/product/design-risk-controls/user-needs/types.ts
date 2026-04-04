/**
 * Maps each category to its domain prefix for ISO 13485 traceability.
 */
export const CATEGORY_PREFIX_MAP: Record<string, string> = {
  General: 'UN-C',
  Safety: 'UN-DR',
  Performance: 'UN-PD',
  Usability: 'UN-PD',
  Interface: 'UN-DR',
  Design: 'UN-DR',
  Regulatory: 'UN-QMS',
  Genesis: 'UN-GN',
  'Document Management': 'UN-DM',
  Supplier: 'UN-SM',
  Training: 'UN-TR',
};

export interface UserNeed {
  id: string;
  user_need_id: string; // e.g. UN-DR-01
  product_id: string;
  company_id: string;
  description: string;
  linked_requirements: string;
  status: 'Met' | 'Not Met';
  category?: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateUserNeedRequest {
  product_id: string;
  company_id: string;
  description: string;
  linked_requirements?: string;
  status: 'Met' | 'Not Met';
  category?: string;
}

export interface UpdateUserNeedRequest {
  description?: string;
  linked_requirements?: string;
  status?: 'Met' | 'Not Met';
  category?: string;
}