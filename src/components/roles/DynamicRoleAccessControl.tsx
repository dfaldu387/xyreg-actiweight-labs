import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Shield, User, Plus, Edit3, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { CompanyRole, Permission } from '@/services/roleManagementService';
import { CreateCategoryDialog } from './CreateCategoryDialog';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface DynamicRoleAccessControlProps {
  companyId: string;
}

export function DynamicRoleAccessControl({ companyId }: DynamicRoleAccessControlProps) {
  const { lang } = useTranslation();
  const {
    roles,
    permissions,
    categories,
    isLoading,
    createRole,
    updateRole,
    deleteRole,
    createPermission,
    updatePermission,
    deletePermission,
    createCategory,
    setRolePermission,
    getRoleWithPermissions,
  } = useRoleManagement(companyId);

  const [selectedRole, setSelectedRole] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CompanyRole | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  // Form states for new role
  const [newRole, setNewRole] = useState({
    role_key: '',
    role_name: '',
    description: '',
    icon_name: 'shield',
    color: 'bg-blue-100 text-blue-800',
  });

  // Form states for new permission
  const [newPermission, setNewPermission] = useState({
    permission_key: '',
    permission_name: '',
    description: '',
    category: '',
    icon_name: 'lock',
    assignToRoleId: '', // New field for role assignment
  });

  // Load permissions for selected role
  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole);
    }
  }, [selectedRole]);

  // Set first role as selected when roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0].id);
    }
  }, [roles]);

  const loadRolePermissions = async (roleId: string) => {
    const roleData = await getRoleWithPermissions(roleId);
    if (roleData && roleData.permissions) {
      const permMap: Record<string, boolean> = {};
      roleData.permissions.forEach(perm => {
        permMap[perm.id] = perm.granted;
      });
      setRolePermissions(permMap);
    }
  };
  
  
  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach(perm => {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    });
    return grouped;
  }, [permissions]);

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const toggleAllSections = (collapse: boolean) => {
    const newState: Record<string, boolean> = {};
    Object.keys(permissionsByCategory).forEach(key => {
      newState[key] = collapse;
    });
    setCollapsedSections(newState);
  };

  const handleCreateRole = async () => {
    const created = await createRole(newRole);
    if (created) {
      setIsRoleDialogOpen(false);
      setNewRole({
        role_key: '',
        role_name: '',
        description: '',
        icon_name: 'shield',
        color: 'bg-blue-100 text-blue-800',
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    
    const success = await updateRole(editingRole.id, {
      role_name: editingRole.role_name,
      description: editingRole.description,
      icon_name: editingRole.icon_name,
      color: editingRole.color,
    });

    if (success) {
      setIsRoleDialogOpen(false);
      setEditingRole(null);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (confirm(lang('companySettings.permissions.confirmDeleteRole'))) {
      await deleteRole(roleId);
      if (selectedRole === roleId) {
        setSelectedRole(roles[0]?.id || '');
      }
    }
  };

  const handleCreatePermission = async () => {
    const { assignToRoleId, ...permissionData } = newPermission;
    const created = await createPermission(permissionData);
    
    // If a role was selected, assign the permission to that role
    if (created && assignToRoleId) {
      await setRolePermission(assignToRoleId, created.id, true);
      toast.success(lang('companySettings.permissions.permissionCreatedAndAssigned'));
    } else if (created) {
      toast.success(lang('companySettings.permissions.permissionCreatedSuccess'));
    }
    
    if (created) {
      setIsPermissionDialogOpen(false);
      setNewPermission({
        permission_key: '',
        permission_name: '',
        description: '',
        category: '',
        icon_name: 'lock',
        assignToRoleId: '',
      });
      // Reload permissions for the selected role if it was updated
      if (assignToRoleId === selectedRole) {
        await loadRolePermissions(selectedRole);
      }
    }
  };

  const handleUpdatePermission = async () => {
    if (!editingPermission) return;
    
    const success = await updatePermission(editingPermission.id, {
      permission_name: editingPermission.permission_name,
      description: editingPermission.description,
      category: editingPermission.category,
      icon_name: editingPermission.icon_name,
    });

    if (success) {
      setIsPermissionDialogOpen(false);
      setEditingPermission(null);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (confirm(lang('companySettings.permissions.confirmDeletePermission'))) {
      await deletePermission(permissionId);
    }
  };

  const handleTogglePermission = async (permissionId: string, granted: boolean) => {
    if (!selectedRole) return;
    
    const success = await setRolePermission(selectedRole, permissionId, granted);
    if (success) {
      setRolePermissions(prev => ({
        ...prev,
        [permissionId]: granted
      }));
    }
  };

  const currentRole = roles.find(r => r.id === selectedRole);
  const allowedCount = Object.values(rolePermissions).filter(Boolean).length;
  const totalCount = permissions.length;

  const handleCreateCategory = async (categoryData: any) => {
    await createCategory(categoryData);
  };

  if (isLoading && roles.length === 0) {
    return <div>{lang('common.loading')}</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <CreateCategoryDialog 
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onCreateCategory={handleCreateCategory}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{lang('companySettings.permissions.title')}</h1>
          <p className="text-muted-foreground">
            {lang('companySettings.permissions.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setEditingPermission(null)}>
                <Plus className="w-4 h-4 mr-2" />
                {lang('companySettings.permissions.addPermission')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPermission ? lang('companySettings.permissions.editPermission') : lang('companySettings.permissions.createNewPermission')}</DialogTitle>
                <DialogDescription>
                  {editingPermission ? lang('companySettings.permissions.updatePermissionDetails') : lang('companySettings.permissions.addPermissionToSystem')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="perm-key">{lang('companySettings.permissions.permissionKey')}</Label>
                  <Input
                    id="perm-key"
                    value={editingPermission?.permission_key || newPermission.permission_key}
                    onChange={(e) => editingPermission 
                      ? setEditingPermission({...editingPermission, permission_key: e.target.value})
                      : setNewPermission({...newPermission, permission_key: e.target.value})
                    }
                    placeholder="product_edit"
                    disabled={!!editingPermission}
                  />
                </div>
                <div>
                  <Label htmlFor="perm-name">{lang('companySettings.permissions.permissionName')}</Label>
                  <Input
                    id="perm-name"
                    value={editingPermission?.permission_name || newPermission.permission_name}
                    onChange={(e) => editingPermission 
                      ? setEditingPermission({...editingPermission, permission_name: e.target.value})
                      : setNewPermission({...newPermission, permission_name: e.target.value})
                    }
                    placeholder="Product Edit"
                  />
                </div>
                <div>
                  <Label htmlFor="perm-category">{lang('companySettings.permissions.category')}</Label>
                  <div className="flex gap-2">
                    <Select
                      value={editingPermission?.category || newPermission.category}
                      onValueChange={(value) => {
                        if (value === '__add_new__') {
                          setIsCategoryDialogOpen(true);
                        } else {
                          editingPermission 
                            ? setEditingPermission({...editingPermission, category: value})
                            : setNewPermission({...newPermission, category: value});
                        }
                      }}
                    >
                      <SelectTrigger id="perm-category" className="flex-1">
                        <SelectValue placeholder={lang('companySettings.permissions.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.category_key}>
                            {cat.category_name}
                          </SelectItem>
                        ))}
                        <SelectItem value="__add_new__" className="text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            {lang('companySettings.permissions.addCategory')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="perm-desc">{lang('common.description')}</Label>
                  <Textarea
                    id="perm-desc"
                    value={editingPermission?.description || newPermission.description}
                    onChange={(e) => editingPermission 
                      ? setEditingPermission({...editingPermission, description: e.target.value})
                      : setNewPermission({...newPermission, description: e.target.value})
                    }
                    placeholder="Allows editing product information"
                  />
                </div>
                
                {!editingPermission && (
                  <div>
                    <Label htmlFor="assign-role">{lang('companySettings.permissions.assignToRole')}</Label>
                    <Select
                      value={newPermission.assignToRoleId}
                      onValueChange={(value) => setNewPermission({...newPermission, assignToRoleId: value})}
                    >
                      <SelectTrigger id="assign-role">
                        <SelectValue placeholder={lang('companySettings.permissions.selectRoleToAssign')} />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.role_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsPermissionDialogOpen(false);
                  setEditingPermission(null);
                }}>
                  {lang('common.cancel')}
                </Button>
                <Button
                  onClick={editingPermission ? handleUpdatePermission : handleCreatePermission}
                  disabled={
                    editingPermission
                      ? !editingPermission.permission_name?.trim()
                      : !newPermission.permission_name?.trim() || !newPermission.permission_key?.trim()
                  }
                >
                  {editingPermission ? lang('common.update') : lang('common.create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingRole(null)}>
                <Plus className="w-4 h-4 mr-2" />
                {lang('companySettings.permissions.addRole')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRole ? lang('companySettings.permissions.editRole') : lang('companySettings.permissions.createNewRole')}</DialogTitle>
                <DialogDescription>
                  {editingRole ? lang('companySettings.permissions.updateRoleDetails') : lang('companySettings.permissions.addRoleToOrg')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role-key">{lang('companySettings.permissions.roleKey')}</Label>
                  <Input
                    id="role-key"
                    value={editingRole?.role_key || newRole.role_key}
                    onChange={(e) => editingRole 
                      ? setEditingRole({...editingRole, role_key: e.target.value})
                      : setNewRole({...newRole, role_key: e.target.value})
                    }
                    placeholder="analyst"
                    disabled={!!editingRole}
                  />
                </div>
                <div>
                  <Label htmlFor="role-name">{lang('companySettings.permissions.roleName')}</Label>
                  <Input
                    id="role-name"
                    value={editingRole?.role_name || newRole.role_name}
                    onChange={(e) => editingRole 
                      ? setEditingRole({...editingRole, role_name: e.target.value})
                      : setNewRole({...newRole, role_name: e.target.value})
                    }
                    placeholder="Analyst"
                  />
                </div>
                <div>
                  <Label htmlFor="role-desc">{lang('common.description')}</Label>
                  <Textarea
                    id="role-desc"
                    value={editingRole?.description || newRole.description}
                    onChange={(e) => editingRole
                      ? setEditingRole({...editingRole, description: e.target.value})
                      : setNewRole({...newRole, description: e.target.value})
                    }
                    placeholder={lang('companySettings.permissions.roleDescription')}
                  />
                </div>
                <div>
                  <Label htmlFor="role-color">{lang('companySettings.permissions.colorClass')}</Label>
                  <Input
                    id="role-color"
                    value={editingRole?.color || newRole.color}
                    onChange={(e) => editingRole 
                      ? setEditingRole({...editingRole, color: e.target.value})
                      : setNewRole({...newRole, color: e.target.value})
                    }
                    placeholder="bg-blue-100 text-blue-800"
                  />
                </div>
              </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsRoleDialogOpen(false);
                    setEditingRole(null);
                  }}>
                    {lang('common.cancel')}
                  </Button>
                  <Button
                    onClick={editingRole ? handleUpdateRole : handleCreateRole}
                    disabled={
                      editingRole
                        ? !editingRole.role_name?.trim()
                        : !newRole.role_name?.trim() || !newRole.role_key?.trim()
                    }
                  >
                    {editingRole ? lang('common.update') : lang('common.create')}
                  </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {lang('companySettings.permissions.selectRoleToView')}
          </CardTitle>
          <CardDescription>
            {lang('companySettings.permissions.selectRoleDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full">
            <TabsList className="grid w-full h-auto p-1" style={{ gridTemplateColumns: `repeat(${Math.min(roles.length, 4)}, 1fr)` }}>
              {roles.map((role) => {
                const isActive = selectedRole === role.id;
                return (
                  <TabsTrigger 
                    key={role.id} 
                    value={role.id} 
                    className={`flex items-center gap-2 py-3 px-2 ${
                      isActive ? 'border-2 border-primary' : 'border-2 border-transparent'
                    }`}
                  >
                    <Shield className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">{role.role_name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          
          {currentRole && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <Badge className={currentRole.color}>
                    {currentRole.role_name}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang('companySettings.permissions.permissionsAllowed', { allowed: allowedCount, total: totalCount })}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setEditingRole(currentRole);
                    setIsRoleDialogOpen(true);
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                {!currentRole.is_system_role && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteRole(currentRole.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {currentRole?.role_name} {lang('companySettings.permissions.permissionsLabel')}
              </CardTitle>
              <CardDescription>
                {lang('companySettings.permissions.detailedView', { role: currentRole?.role_name.toLowerCase() })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllSections(false)}
              >
                <ChevronDown className="w-4 h-4" />
                {lang('companySettings.permissions.expandAll')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllSections(true)}
              >
                <ChevronRight className="w-4 h-4" />
                {lang('companySettings.permissions.collapseAll')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>{lang('companySettings.permissions.permission')}</TableHead>
                  <TableHead className="text-center">{lang('companySettings.permissions.access')}</TableHead>
                  <TableHead className="text-center">{lang('common.status')}</TableHead>
                  <TableHead className="w-24">{lang('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(permissionsByCategory).map(([category, perms]) => {
                  const isCollapsed = collapsedSections[category];
                  const categoryAllowedCount = perms.filter(p => rolePermissions[p.id]).length;
                  
                  return (
                    <React.Fragment key={category}>
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/50 border-b-2 cursor-pointer hover:opacity-80">
                          <div 
                            className="flex items-center gap-2 py-2"
                            onClick={() => toggleSection(category)}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <span className="font-semibold">{category}</span>
                            <Badge variant="outline" className="ml-auto">
                              {categoryAllowedCount}/{perms.length}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {!isCollapsed && perms.map((permission) => {
                        const hasAccess = rolePermissions[permission.id] || false;
                        
                        return (
                          <TableRow key={permission.id}>
                            <TableCell>
                              <Shield className="w-4 h-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                <div>{permission.permission_name}</div>
                                {permission.description && (
                                  <div className="text-xs text-muted-foreground">{permission.description}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTogglePermission(permission.id, !hasAccess)}
                              >
                                {hasAccess ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-500" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={hasAccess ? "default" : "secondary"}
                                className={hasAccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {hasAccess ? lang('companySettings.permissions.allowed') : lang('companySettings.permissions.denied')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingPermission(permission);
                                    setIsPermissionDialogOpen(true);
                                  }}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeletePermission(permission.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
