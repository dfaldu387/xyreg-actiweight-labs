import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuditTrailService } from '@/services/auditTrailService';

export interface CompanyRole {
  id: string;
  company_id: string;
  role_key: string;
  role_name: string;
  description?: string;
  icon_name: string;
  color: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionCategory {
  id: string;
  company_id: string;
  category_key: string;
  category_name: string;
  description?: string;
  icon_name: string;
  color: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  company_id: string;
  permission_key: string;
  permission_name: string;
  description?: string;
  category: string;
  icon_name: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted: boolean;
  created_at: string;
}

export interface RoleWithPermissions extends CompanyRole {
  permissions?: Array<Permission & { granted: boolean }>;
}

export class RoleManagementService {
  // Fetch all roles for a company
  async getCompanyRoles(companyId: string): Promise<CompanyRole[]> {
    const { data, error } = await supabase
      .from('company_roles')
      .select('*')
      .eq('company_id', companyId)
      .order('role_name');

    if (error) {
      console.error('Error fetching company roles:', error);
      toast.error('Failed to fetch roles');
      return [];
    }

    return data || [];
  }

  // Fetch all permission categories for a company
  async getPermissionCategories(companyId: string): Promise<PermissionCategory[]> {
    const { data, error } = await supabase
      .from('permission_categories')
      .select('*')
      .eq('company_id', companyId)
      .order('display_order, category_name');

    if (error) {
      console.error('Error fetching permission categories:', error);
      toast.error('Failed to fetch permission categories');
      return [];
    }

    return data || [];
  }

  // Fetch all permissions for a company
  async getCompanyPermissions(companyId: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('company_id', companyId)
      .order('category, permission_name');

    if (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to fetch permissions');
      return [];
    }

    return data || [];
  }

  // Get role with its permissions
  async getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
    const { data: role, error: roleError } = await supabase
      .from('company_roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (roleError) {
      console.error('Error fetching role:', roleError);
      toast.error('Failed to fetch role');
      return null;
    }

    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select(`
        *,
        permissions (*)
      `)
      .eq('role_id', roleId);
    console.log("permissions", permissions);
    if (permError) {
      console.error('Error fetching role permissions:', permError);
    }

    return {
      ...role,

      permissions: permissions?.map(rp => ({
        ...(rp.permissions as any),
        granted: rp.granted,
        role_permission_id: rp.id
      })) || []
    };
  }

  // Create a new role
  async createRole(role: Partial<CompanyRole>): Promise<CompanyRole | null> {
    const { data, error } = await supabase
      .from('company_roles')
      .insert([role as any])
      .select()
      .single();

    if (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
      return null;
    }

    toast.success(`Role "${data.role_name}" created successfully`);
    return data;
  }

  // Update a role
  async updateRole(roleId: string, updates: Partial<CompanyRole>): Promise<boolean> {
    // Fetch old role for audit diff
    const { data: oldRole } = await supabase
      .from('company_roles')
      .select('*')
      .eq('id', roleId)
      .single();

    const { error } = await supabase
      .from('company_roles')
      .update(updates)
      .eq('id', roleId);

    if (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
      return false;
    }

    // Log role change
    const { data: { user } } = await supabase.auth.getUser();
    if (user && oldRole) {
      const changes = Object.keys(updates)
        .filter(k => (oldRole as any)[k] !== (updates as any)[k])
        .map(k => ({ field: k, oldValue: String((oldRole as any)[k] || ''), newValue: String((updates as any)[k] || '') }));

      AuditTrailService.logUserAccessEvent({
        userId: user.id,
        companyId: oldRole.company_id,
        action: 'role_change',
        entityName: updates.role_name || oldRole.role_name,
        changes,
        reason: 'Role configuration updated',
      }).catch(() => {});
    }

    toast.success('Role updated successfully');
    return true;
  }

  // Delete a role
  async deleteRole(roleId: string): Promise<boolean> {
    const { error } = await supabase
      .from('company_roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
      return false;
    }

    toast.success('Role deleted successfully');
    return true;
  }

  // Create a new permission
  async createPermission(permission: Partial<Permission>): Promise<Permission | null> {
    const { data, error } = await supabase
      .from('permissions')
      .insert([permission as any])
      .select()
      .single();

    if (error) {
      console.error('Error creating permission:', error);
      toast.error('Failed to create permission');
      return null;
    }

    toast.success(`Permission "${data.permission_name}" created successfully`);
    return data;
  }

  // Update a permission
  async updatePermission(permissionId: string, updates: Partial<Permission>): Promise<boolean> {
    const { error } = await supabase
      .from('permissions')
      .update(updates)
      .eq('id', permissionId);

    if (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
      return false;
    }

    toast.success('Permission updated successfully');
    return true;
  }

  // Delete a permission
  async deletePermission(permissionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', permissionId);

    if (error) {
      console.error('Error deleting permission:', error);
      toast.error('Failed to delete permission');
      return false;
    }

    toast.success('Permission deleted successfully');
    return true;
  }

  // Set role permission
  async setRolePermission(roleId: string, permissionId: string, granted: boolean): Promise<boolean> {
    // First, try to update if exists
    const { data: existing } = await supabase
      .from('role_permissions')
      .select('id')
      .eq('role_id', roleId)
      .eq('permission_id', permissionId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('role_permissions')
        .update({ granted })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating role permission:', error);
        toast.error('Failed to update permission');
        return false;
      }
    } else {
      const { error } = await supabase
        .from('role_permissions')
        .insert({ role_id: roleId, permission_id: permissionId, granted });

      if (error) {
        console.error('Error creating role permission:', error);
        toast.error('Failed to set permission');
        return false;
      }
    }

    // Log permission change
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      AuditTrailService.logUserAccessEvent({
        userId: user.id,
        action: 'permission_change',
        entityName: `Permission ${permissionId} on role ${roleId}`,
        changes: [{ field: 'granted', oldValue: existing ? 'existing' : 'none', newValue: String(granted) }],
        reason: granted ? 'Permission granted' : 'Permission revoked',
      }).catch(() => {});
    }

    return true;
  }

  // Set multiple role permissions at once
  async setRolePermissions(roleId: string, permissions: Array<{ permissionId: string; granted: boolean }>): Promise<boolean> {
    try {
      for (const perm of permissions) {
        await this.setRolePermission(roleId, perm.permissionId, perm.granted);
      }
      toast.success('Permissions updated successfully');
      return true;
    } catch (error) {
      console.error('Error setting role permissions:', error);
      toast.error('Failed to update permissions');
      return false;
    }
  }

  // Create a new permission category
  async createPermissionCategory(category: Partial<PermissionCategory>): Promise<PermissionCategory | null> {
    const { data, error } = await supabase
      .from('permission_categories')
      .insert([category as any])
      .select()
      .single();

    if (error) {
      console.error('Error creating permission category:', error);
      toast.error('Failed to create category');
      return null;
    }

    toast.success(`Category "${data.category_name}" created successfully`);
    return data;
  }

  // Update a permission category
  async updatePermissionCategory(categoryId: string, updates: Partial<PermissionCategory>): Promise<boolean> {
    const { error } = await supabase
      .from('permission_categories')
      .update(updates)
      .eq('id', categoryId);

    if (error) {
      console.error('Error updating permission category:', error);
      toast.error('Failed to update category');
      return false;
    }

    toast.success('Category updated successfully');
    return true;
  }

  // Delete a permission category
  async deletePermissionCategory(categoryId: string): Promise<boolean> {
    const { error } = await supabase
      .from('permission_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting permission category:', error);
      toast.error('Failed to delete category');
      return false;
    }

    toast.success('Category deleted successfully');
    return true;
  }
}
