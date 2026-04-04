// Type definitions for user_product_matrix table (array-based structure)
export interface UserProductMatrix {
  id: string;
  user_id: string;
  company_id: string;
  product_ids: string[]; // Array of product UUIDs
  department?: string | null;
  user_type: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'reviewer' | 'guest';
  role_id?: string | null;
  role_name?: string | null;
  permissions: Record<string, boolean>;
  access_level: 'none' | 'read' | 'write' | 'full';
  is_active: boolean;
  assigned_by?: string | null;
  assigned_at: string;
  last_accessed_at?: string | null;
  expires_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Input type for creating/updating matrix record
export interface CreateUserProductMatrixInput {
  user_id: string;
  company_id: string;
  product_ids: string[]; // Array of product UUIDs
  department?: string | null;
  user_type?: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'reviewer' | 'guest';
  role_id?: string | null;
  role_name?: string | null;
  permissions?: Record<string, boolean>;
  access_level?: 'none' | 'read' | 'write' | 'full';
  is_active?: boolean;
  assigned_by?: string | null;
  expires_at?: string | null;
  notes?: string | null;
}

// Input type for updating matrix record
export interface UpdateUserProductMatrixInput {
  product_ids?: string[];
  department?: string | null;
  user_type?: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'reviewer' | 'guest';
  role_id?: string | null;
  role_name?: string | null;
  permissions?: Record<string, boolean>;
  access_level?: 'none' | 'read' | 'write' | 'full';
  is_active?: boolean;
  expires_at?: string | null;
  notes?: string | null;
}

// Extended type with user details
export interface UserProductMatrixWithDetails extends UserProductMatrix {
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    department?: string;
  };
}

