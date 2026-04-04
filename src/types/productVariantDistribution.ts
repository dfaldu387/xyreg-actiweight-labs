export interface ProductVariantDistribution {
  id: string;
  relationship_id: string;
  source_variant_id?: string;
  target_variant_id: string;
  distribution_percentage: number;
  distribution_method: 'fixed_percentages' | 'conditional_logic' | 'equal_distribution';
  conditional_rules?: any;
  created_at: string;
  updated_at: string;
}

export interface VariantDistributionData {
  distributions: ProductVariantDistribution[];
  totalPercentage: number;
}

export interface CreateVariantDistributionData {
  relationship_id: string;
  source_variant_id?: string;
  target_variant_id: string;
  distribution_percentage: number;
  distribution_method: 'fixed_percentages' | 'conditional_logic' | 'equal_distribution';
  conditional_rules?: any;
}

export interface UpdateVariantDistributionData {
  distribution_percentage?: number;
  distribution_method?: 'fixed_percentages' | 'conditional_logic' | 'equal_distribution';
  conditional_rules?: any;
}