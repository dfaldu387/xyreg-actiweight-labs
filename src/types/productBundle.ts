export interface Product {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  project_types?: string[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  variant_type?: string;
}

export interface ProductWithVariants {
  product: Product;
  variants: ProductVariant[];
  relationshipType: 'component' | 'accessory' | 'consumable' | 'required' | 'optional' | 'replacement_part';
  multiplier?: number;
  quantity?: number;
}

export interface SiblingGroupInBundle {
  groupId: string;
  groupName: string;
  basicUdiDi: string;
  description?: string;
  productCount: number;
  relationshipType: 'component' | 'accessory' | 'consumable' | 'required' | 'optional' | 'replacement_part';
  multiplier?: number;
  distributionPattern?: string;
}

export interface ProductBundle {
  mainProduct: Product | null;
  accessories: Product[];
  consumables: Product[];
  bundleItems: Product[];
  crossSells: Product[];
  upsells: Product[];
  siblingGroups: SiblingGroupInBundle[];
}

export interface ProductBundleWithVariants extends ProductBundle {
  accessoriesWithVariants: ProductWithVariants[];
  consumablesWithVariants: ProductWithVariants[];
  bundleItemsWithVariants: ProductWithVariants[];
}

export interface BundleStats {
  totalProducts: number;
  totalVariants: number;
  hasAccessories: boolean;
  hasConsumables: boolean;
  hasBundleItems: boolean;
  hasSiblingGroups: boolean;
  totalSiblingGroups: number;
}

// Bundle Group System Types
export interface ProductBundleGroup {
  id: string;
  company_id: string;
  bundle_name: string;
  description?: string;
  created_by_product_id?: string;
  is_feasibility_study: boolean;
  target_markets?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductBundleMember {
  id: string;
  bundle_id: string;
  product_id?: string;
  sibling_group_id?: string;
  relationship_type: 'component' | 'accessory' | 'consumable' | 'required' | 'optional' | 'replacement_part';
  multiplier?: number;
  quantity?: number;
  consumption_rate?: number;
  consumption_period?: 'per_use' | 'per_procedure' | 'per_day' | 'per_week' | 'per_month' | 'per_year';
  is_primary: boolean;
  position: number;
  attachment_rate?: number; // 0-100%, percentage of time this item is purchased with main product
  distribution_group_id?: string; // Groups competing items (must sum to 100% within group)
  created_at: string;
}

export interface BundleGroupWithMembers extends ProductBundleGroup {
  members: ProductBundleMember[];
}

export interface BundleMemberConfig {
  product_id?: string;
  sibling_group_id?: string;
  relationship_type: 'component' | 'accessory' | 'consumable' | 'required' | 'optional' | 'replacement_part';
  multiplier?: number;
  quantity?: number;
  consumption_rate?: number;
  consumption_period?: 'per_use' | 'per_procedure' | 'per_day' | 'per_week' | 'per_month' | 'per_year';
  is_primary?: boolean;
  position?: number;
  attachment_rate?: number; // 0-100%
  distribution_group_id?: string;
}
