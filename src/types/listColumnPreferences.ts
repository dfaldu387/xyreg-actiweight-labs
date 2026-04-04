export type ListModuleType =
  | 'device_documents'
  | 'company_documents'
  | 'capa'
  | 'nonconformity'
  | 'calibration'
  | 'production_orders'
  | 'inspections'
  | 'pms_events'
  | 'audit'
  | 'suppliers'
  | 'training'
  | 'design_review'
  | 'change_control';

export type ListViewType = 'list' | 'card' | 'table';

export interface ListColumnPreference {
  id: string;
  company_id: string;
  product_id: string | null;
  module: ListModuleType;
  view_key: ListViewType;
  hidden_columns: string[];
  column_order: string[];
  created_at: string;
  updated_at: string;
}
