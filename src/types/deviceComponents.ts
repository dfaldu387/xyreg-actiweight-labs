// DB-backed device component (from device_components table)
export interface DeviceComponent {
  id: string;
  product_id: string;
  company_id: string;
  parent_id: string | null; // deprecated — use parent_ids
  parent_ids: string[]; // many-to-many parents
  name: string;
  description: string;
  component_type: 'hardware' | 'software' | 'sub_assembly';
  sort_order: number;
  part_number: string | null;
  is_master_source: boolean;
  created_at: string;
  updated_at: string;
  linked_features?: { id: string; feature_name: string }[];
  children?: DeviceComponent[];
}

// Lightweight component used in regulatory classification UI (not DB-persisted)
export interface RegulatoryComponent {
  id: string;
  name: string;
  description?: string;
  riskClass: string;
  componentType: 'device' | 'software';
  isFromProductDefinition?: boolean;
  isSelected?: boolean;
}

export interface ComponentRiskClassification {
  components: RegulatoryComponent[];
  overallRiskClass?: string;
}

export interface EnhancedProductMarketWithComponents {
  code: string;
  selected: boolean;
  riskClass?: string;
  regulatoryStatus?: string;
  reauditTimeline?: string | Date;
  name: string;
  componentClassification?: ComponentRiskClassification;
}
