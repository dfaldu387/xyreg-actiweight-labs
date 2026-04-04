export type BomRevisionStatus = 'draft' | 'active' | 'obsolete';

export interface BomRevision {
  id: string;
  product_id: string;
  company_id: string;
  revision: string;
  status: BomRevisionStatus;
  description?: string;
  total_cost: number;
  currency: string;
  approved_by?: string;
  approved_at?: string;
  created_by?: string;
  ccr_id?: string;
  created_at: string;
  updated_at: string;
  is_archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  // Computed on fetch
  item_count?: number;
  // Joined
  ccr?: { id: string; ccr_id: string; status: string; title: string } | null;
}

export type BomItemChangeType = 'added' | 'modified' | 'removed';

export interface BomItemChange {
  id: string;
  bom_revision_id: string;
  bom_item_id?: string;
  change_type: BomItemChangeType;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by: string;
  created_at: string;
}

export type BomItemCategory = 'purchased_part' | 'manufactured_part' | 'raw_material' | 'sub_assembly' | 'consumable';
export type BomPatientContact = 'direct' | 'indirect' | 'none';
export type BomCertificateRequired = 'coa' | 'coc' | 'both' | 'none';

export interface BomItem {
  id: string;
  bom_revision_id: string;
  component_id?: string;
  material_id?: string;
  item_number: string;
  description: string;
  quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  extended_cost: number;
  supplier_id?: string;
  supplier_part_number?: string;
  lead_time_days?: number;
  is_critical: boolean;
  notes?: string;
  sort_order: number;
  // Medtech fields
  category?: BomItemCategory;
  material_name?: string;
  material_specification?: string;
  patient_contact?: BomPatientContact;
  biocompatibility_notes?: string;
  certificate_required?: BomCertificateRequired;
  internal_part_number?: string;
  reference_designator?: string;
  sterilization_compatible?: string;
  shelf_life_days?: number;
  rohs_compliant?: boolean | null;
  reach_compliant?: boolean | null;
  drawing_url?: string;
  created_at: string;
  updated_at: string;
  // Joined
  supplier?: { id: string; name: string; status: string };
}

export interface BomRevisionTransition {
  id: string;
  bom_revision_id: string;
  from_status?: string;
  to_status: string;
  transitioned_by: string;
  reason?: string;
  created_at: string;
}

export interface CreateBomRevisionData {
  product_id: string;
  company_id: string;
  revision?: string;
  description?: string;
  currency?: string;
  created_by?: string;
}

export interface CreateBomItemData {
  bom_revision_id: string;
  component_id?: string;
  material_id?: string;
  item_number?: string;
  description: string;
  quantity?: number;
  unit_of_measure?: string;
  unit_cost?: number;
  supplier_id?: string;
  supplier_part_number?: string;
  lead_time_days?: number;
  is_critical?: boolean;
  notes?: string;
  sort_order?: number;
  category?: BomItemCategory;
  material_name?: string;
  material_specification?: string;
  patient_contact?: BomPatientContact;
  biocompatibility_notes?: string;
  certificate_required?: BomCertificateRequired;
  internal_part_number?: string;
  reference_designator?: string;
  sterilization_compatible?: string;
  shelf_life_days?: number;
  rohs_compliant?: boolean | null;
  reach_compliant?: boolean | null;
  drawing_url?: string;
}

export interface UpdateBomItemData {
  component_id?: string;
  description?: string;
  quantity?: number;
  unit_of_measure?: string;
  unit_cost?: number;
  supplier_id?: string;
  supplier_part_number?: string;
  lead_time_days?: number;
  is_critical?: boolean;
  notes?: string;
  sort_order?: number;
  item_number?: string;
  category?: BomItemCategory;
  material_name?: string;
  material_specification?: string;
  patient_contact?: BomPatientContact;
  biocompatibility_notes?: string;
  certificate_required?: BomCertificateRequired;
  internal_part_number?: string;
  reference_designator?: string;
  sterilization_compatible?: string;
  shelf_life_days?: number;
  rohs_compliant?: boolean | null;
  reach_compliant?: boolean | null;
  drawing_url?: string;
}

export type BomDocumentType = 'material_data_sheet' | 'certificate' | 'test_report' | 'drawing' | 'other';

export interface BomItemDocument {
  id: string;
  bom_item_id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  document_type: BomDocumentType;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export const BOM_DOCUMENT_TYPE_LABELS: Record<BomDocumentType, string> = {
  material_data_sheet: 'Material Data Sheet',
  certificate: 'Certificate',
  test_report: 'Test Report',
  drawing: 'Drawing',
  other: 'Other',
};

export const BOM_STATUS_FLOW: Record<BomRevisionStatus, BomRevisionStatus[]> = {
  draft: ['active'],
  active: ['obsolete'],
  obsolete: [],
};
