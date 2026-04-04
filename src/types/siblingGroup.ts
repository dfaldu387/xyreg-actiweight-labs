export type DistributionPattern = 'even' | 'gaussian_curve' | 'empirical_data';

export interface ProductSiblingGroup {
  id: string;
  company_id: string;
  basic_udi_di: string;
  name: string;
  description?: string;
  distribution_pattern: DistributionPattern;
  total_percentage: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProductSiblingAssignment {
  id: string;
  sibling_group_id: string;
  product_id: string;
  percentage: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSiblingGroupData {
  company_id: string;
  basic_udi_di: string;
  name: string;
  description?: string;
  distribution_pattern?: DistributionPattern;
  total_percentage?: number;
  position?: number;
}

export interface UpdateSiblingGroupData {
  name?: string;
  description?: string;
  distribution_pattern?: DistributionPattern;
  total_percentage?: number;
  position?: number;
}
