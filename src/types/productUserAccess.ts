// Type definitions for product_user_access table
export interface ProductUserAccess {
  id: string;
  product_id: string;
  user_id: string;
  user_type: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'reviewer' | 'guest';
  role_id?: string;
  role_name?: string;
  permissions: Record<string, boolean>;
  access_level: 'none' | 'read' | 'write' | 'full';
  is_active: boolean;
  invited_by?: string;
  invited_at: string;
  last_accessed_at?: string;
  expires_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Input type for creating new access
export interface CreateProductUserAccessInput {
  product_id: string;
  user_id: string;
  user_type: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'reviewer' | 'guest';
  role_id: string | null;
  role_name: string | null;
  permissions: Record<string, boolean>;
  access_level: 'none' | 'read' | 'write' | 'full';
  is_active: boolean;
  invited_by: string | null;
  expires_at: string | null;
  notes: string | null;
}

// Input type for updating access
export interface UpdateProductUserAccessInput {
  user_type?: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'reviewer' | 'guest';
  role_id?: string;
  role_name?: string;
  permissions?: Record<string, boolean>;
  access_level?: 'none' | 'read' | 'write' | 'full';
  is_active?: boolean;
  expires_at?: string;
  notes?: string;
}

// Extended type with user and product information
export interface ProductUserAccessWithDetails extends ProductUserAccess {
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  product?: {
    id: string;
    name: string;
    description?: string;
  };
  role?: {
    id: string;
    role_name: string;
    description?: string;
  };
  inviter?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

// Query filters
export interface ProductUserAccessFilters {
  product_id?: string;
  user_id?: string;
  user_type?: string;
  role_id?: string;
  is_active?: boolean;
  access_level?: string;
  invited_by?: string;
}

// Statistics type
export interface ProductUserAccessStats {
  total_users: number;
  active_users: number;
  users_by_type: Record<string, number>;
  users_by_access_level: Record<string, number>;
  recent_invitations: number;
}
