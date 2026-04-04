export type DistributionPattern = 'even' | 'gaussian_curve' | 'empirical_data';

export interface ProductVariantGroup {
  id: string;
  product_id: string;
  company_id: string;
  name: string;
  description?: string;
  distribution_pattern: DistributionPattern;
  total_percentage: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVariantGroupData {
  product_id: string;
  company_id: string;
  name: string;
  description?: string;
  distribution_pattern?: DistributionPattern;
  total_percentage?: number;
  position?: number;
}

export interface UpdateVariantGroupData {
  name?: string;
  description?: string;
  distribution_pattern?: DistributionPattern;
  total_percentage?: number;
  position?: number;
}
