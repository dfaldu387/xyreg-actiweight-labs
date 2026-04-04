import { Supplier } from './supplier';

export interface MaterialSupplier {
  id: string;
  material_id: string;
  supplier_id: string;
  company_id: string;
  is_primary: boolean;
  material_specification?: string;
  inspection_requirements?: string;
  supplier_part_number?: string;
  lead_time_days?: number;
  minimum_order_quantity?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface CreateMaterialSupplierData {
  material_id: string;
  supplier_id: string;
  company_id: string;
  is_primary?: boolean;
  material_specification?: string;
  inspection_requirements?: string;
  supplier_part_number?: string;
  lead_time_days?: number;
  minimum_order_quantity?: number;
  notes?: string;
}

export interface UpdateMaterialSupplierData {
  is_primary?: boolean;
  material_specification?: string;
  inspection_requirements?: string;
  supplier_part_number?: string;
  lead_time_days?: number;
  minimum_order_quantity?: number;
  notes?: string;
}