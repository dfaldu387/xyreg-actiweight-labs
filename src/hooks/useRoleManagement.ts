import { useState, useEffect } from 'react';
import { 
  RoleManagementService, 
  CompanyRole, 
  Permission,
  PermissionCategory,
  RoleWithPermissions 
} from '@/services/roleManagementService';

export function useRoleManagement(companyId?: string) {
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const service = new RoleManagementService();

  const fetchRoles = async () => {
    if (!companyId) {
      setRoles([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await service.getCompanyRoles(companyId);
      setRoles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load roles';
      setError(errorMessage);
      console.error('Error fetching roles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!companyId) {
      setCategories([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await service.getPermissionCategories(companyId);
      setCategories(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    if (!companyId) {
      setPermissions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await service.getCompanyPermissions(companyId);
      setPermissions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load permissions';
      setError(errorMessage);
      console.error('Error fetching permissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchRoles();
      fetchCategories();
      fetchPermissions();
    }
  }, [companyId]);

  const createRole = async (roleData: Partial<CompanyRole>) => {
    if (!companyId) return null;
    
    const newRole = await service.createRole({
      ...roleData,
      company_id: companyId
    });

    if (newRole) {
      setRoles(prev => [...prev, newRole]);
    }

    return newRole;
  };

  const updateRole = async (roleId: string, updates: Partial<CompanyRole>) => {
    const success = await service.updateRole(roleId, updates);
    
    if (success) {
      await fetchRoles();
    }

    return success;
  };

  const deleteRole = async (roleId: string) => {
    const success = await service.deleteRole(roleId);
    
    if (success) {
      setRoles(prev => prev.filter(role => role.id !== roleId));
    }

    return success;
  };

  const createPermission = async (permissionData: Partial<Permission>) => {
    if (!companyId) return null;
    
    const newPermission = await service.createPermission({
      ...permissionData,
      company_id: companyId
    });

    if (newPermission) {
      setPermissions(prev => [...prev, newPermission]);
    }

    return newPermission;
  };

  const updatePermission = async (permissionId: string, updates: Partial<Permission>) => {
    const success = await service.updatePermission(permissionId, updates);
    
    if (success) {
      await fetchPermissions();
    }

    return success;
  };

  const deletePermission = async (permissionId: string) => {
    const success = await service.deletePermission(permissionId);
    
    if (success) {
      setPermissions(prev => prev.filter(perm => perm.id !== permissionId));
    }

    return success;
  };

  const setRolePermission = async (roleId: string, permissionId: string, granted: boolean) => {
    return await service.setRolePermission(roleId, permissionId, granted);
  };

  const getRoleWithPermissions = async (roleId: string) => {
    return await service.getRoleWithPermissions(roleId);
  };

  const createCategory = async (categoryData: Partial<PermissionCategory>) => {
    if (!companyId) return null;
    
    const newCategory = await service.createPermissionCategory({
      ...categoryData,
      company_id: companyId
    });

    if (newCategory) {
      setCategories(prev => [...prev, newCategory]);
    }

    return newCategory;
  };

  const updateCategory = async (categoryId: string, updates: Partial<PermissionCategory>) => {
    const success = await service.updatePermissionCategory(categoryId, updates);
    
    if (success) {
      await fetchCategories();
    }

    return success;
  };

  const deleteCategory = async (categoryId: string) => {
    const success = await service.deletePermissionCategory(categoryId);
    
    if (success) {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }

    return success;
  };

  return {
    roles,
    permissions,
    categories,
    isLoading,
    error,
    fetchRoles,
    fetchCategories,
    fetchPermissions,
    createRole,
    updateRole,
    deleteRole,
    createPermission,
    updatePermission,
    deletePermission,
    createCategory,
    updateCategory,
    deleteCategory,
    setRolePermission,
    getRoleWithPermissions,
  };
}
