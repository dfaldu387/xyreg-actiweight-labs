import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, Save, X, Camera, Upload,ChevronRight, ChevronDown, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CompanyUser, useCompanyUsers } from "@/hooks/useCompanyUsers";
import { SmartRoleSelector } from "@/components/permissions/SmartRoleSelector";
import { MultiDepartmentSelector, DepartmentAssignment, MultiDepartmentSelectorRef } from "@/components/permissions/MultiDepartmentSelector";
import { supabase } from "@/integrations/supabase/client";
import { uploadFileToStorage } from "@/utils/storageUtils";
import { toast } from "sonner";
import { UserProductMatrixService } from "@/services/userProductMatrixService";
import { UserCompanyModuleAccessService } from "@/services/userCompanyModuleAccessService";
import { COMPANY_MODULES, MODULE_DISPLAY_NAMES, ALL_COMPANY_MODULES } from "@/types/userCompanyModuleAccess";
import { DocumentPermissionSelector } from "@/components/permissions/DocumentPermissionSelector";

interface CompanyUserPermissionsProps {
  user: CompanyUser;
  onRemove: () => void;
  companyId: string;
}

// Function to convert department display names to enum values
const getDepartmentEnumValue = (displayName: string): string => {
  const mapping: Record<string, string> = {
    'Design & Development': 'design_development',
    'Research & Development': 'research_development',
    'Quality Assurance': 'quality_assurance',
    'Regulatory Affairs': 'regulatory_affairs',
    'Clinical Affairs': 'clinical_affairs',
    'Manufacturing Operations': 'manufacturing_operations',
    'Marketing & Labeling': 'marketing_labeling',
    'Management & Executive': 'management_executive',
    'Other Internal': 'other_internal'
  };
  return mapping[displayName] || displayName.toLowerCase().replace(/[^a-z]/g, '_');
};

// Function to convert enum values back to display names
const getDepartmentDisplayName = (enumValue: string): string => {
  const reverseMapping: Record<string, string> = {
    'design_development': 'Design & Development',
    'research_development': 'Research & Development',
    'quality_assurance': 'Quality Assurance',
    'regulatory_affairs': 'Regulatory Affairs',
    'clinical_affairs': 'Clinical Affairs',
    'manufacturing_operations': 'Manufacturing Operations',
    'marketing_labeling': 'Marketing & Labeling',
    'management_executive': 'Management & Executive',
    'other_internal': 'Other Internal'
  };
  return reverseMapping[enumValue] || enumValue;
};

// Function to convert external_role enum values to display names
const getExternalRoleDisplayName = (enumValue: string): string => {
  const mapping: Record<string, string> = {
    'consultant': 'Consultant',
    'auditor': 'Auditor',
    'contract_manufacturer': 'Contract Manufacturer',
    'distributor': 'Distributor',
    'key_opinion_leader': 'Key Opinion Leader (KOL)',
    'other_external': 'Other',
  };
  return mapping[enumValue] || enumValue;
};

// Map to get department colors
const getDepartmentColor = (functionalArea: string | null): string => {
  const departmentColors: Record<string, string> = {
    'design_development': 'from-blue-500 to-blue-600',
    'research_development': 'from-emerald-500 to-emerald-600',
    'quality_assurance': 'from-purple-500 to-purple-600',
    'regulatory_affairs': 'from-orange-500 to-orange-600',
    'clinical_affairs': 'from-pink-500 to-pink-600',
    'manufacturing': 'from-indigo-500 to-indigo-600',
    'sales_marketing': 'from-teal-500 to-teal-600',
    'other': 'from-slate-500 to-slate-600'
  };
  return departmentColors[functionalArea || 'other'] || departmentColors['other'];
};

export function CompanyUserPermissions({ user, onRemove, companyId }: CompanyUserPermissionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (user.avatar) {
      return user.avatar.includes('?')
        ? `${user.avatar}&t=${Date.now()}`
        : `${user.avatar}?t=${Date.now()}`;
    }
    return null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const departmentSelectorRef = useRef<MultiDepartmentSelectorRef>(null);
  const [departmentAssignments, setDepartmentAssignments] = useState<DepartmentAssignment[]>([]);
  const savedDepartmentAssignmentsRef = useRef<DepartmentAssignment[]>([]);
  const [hasProductRestriction, setHasProductRestriction] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedProductNames, setSelectedProductNames] = useState<Array<{ id: string; name: string }>>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [companyProducts, setCompanyProducts] = useState<Array<{ id: string; name: string; status?: string; basic_udi_di?: string; parent_product_id?: string; is_master_device?: boolean }>>([]);
  const [udiAliases, setUdiAliases] = useState<Map<string, string>>(new Map());
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Temporary state for product dialog (only committed on Save)
  const [tempSelectedProductIds, setTempSelectedProductIds] = useState<string[]>([]);

  // Device Module Permissions state (per-device granular access)
  const [hasDeviceModuleRestriction, setHasDeviceModuleRestriction] = useState(false);
  const [isDeviceModuleDialogOpen, setIsDeviceModuleDialogOpen] = useState(false);
  const [deviceModulePermissions, setDeviceModulePermissions] = useState<Record<string, string[]>>({});
  const [tempDeviceModulePermissions, setTempDeviceModulePermissions] = useState<Record<string, string[]>>({});
  const [expandedDeviceInModuleDialog, setExpandedDeviceInModuleDialog] = useState<string | null>(null);

  // Company Module Access state
  const [hasModuleRestriction, setHasModuleRestriction] = useState(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  
  // Temporary state for module dialog (only committed on Save)
  const [tempSelectedModuleIds, setTempSelectedModuleIds] = useState<string[]>([]);

  // Document Permissions state
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [hasDocumentRestriction, setHasDocumentRestriction] = useState(false);

  const [editData, setEditData] = useState({
    name: user.name,
    access_level: user.access_level as "viewer" | "editor" | "admin" | "consultant",
    is_internal: user.is_internal,
    functional_area: user.functional_area ? getDepartmentDisplayName(user.functional_area) : user.functional_area,
    role: user.role || user.external_role || "",
    external_role: user.external_role
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentColors, setDepartmentColors] = useState<Record<string, string>>({});

  const [displayData, setDisplayData] = useState({
    name: user.name,
    access_level: user.access_level,
    is_internal: user.is_internal,
    functional_area: user.functional_area ? getDepartmentDisplayName(user.functional_area) : user.functional_area,
    role: user.role || user.external_role || "",
    external_role: user.external_role
  });

  const { updateUserPermissions } = useCompanyUsers(companyId);

  // Sync avatarUrl when user.avatar changes, add cache buster to force reload
  useEffect(() => {
    if (user.avatar) {
      // Add timestamp to force browser to reload image
      const cacheBustedUrl = user.avatar.includes('?')
        ? `${user.avatar}&t=${Date.now()}`
        : `${user.avatar}?t=${Date.now()}`;
      setAvatarUrl(cacheBustedUrl);
    } else {
      setAvatarUrl(null);
    }
  }, [user.avatar]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUploadingAvatar(true);
    try {
      // Delete from storage
      const currentAvatarUrl = user.avatar || avatarUrl;
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/avatars/')[1]?.split('?')[0];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Clear avatar_url in database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(null);
      toast.success('Profile photo removed');
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      toast.error(error.message || 'Failed to remove profile photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image file (dedicated check for avatar uploads)
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/svg+xml'];
    const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.svg'];
    const fileExt = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type) || ALLOWED_IMAGE_EXTENSIONS.includes(fileExt);
    if (!isValidType) {
      toast.error('Please upload an image file (JPG, PNG, GIF, or WebP).');
      return;
    }
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size too large. Maximum size is 50 MB.');
      return;
    }

    // Create preview URL immediately to show selected image
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);

    setIsUploadingAvatar(true);
    try {
      // Generate unique filename with timestamp
      const uploadExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${uploadExt}`;

      // Delete old avatar if exists
      const currentAvatarUrl = user.avatar;
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL from avatars bucket
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state with the new public URL
      setAvatarUrl(publicUrl);
      
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);

      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload avatar');
      // Revert to original avatar on error
      setAvatarUrl(user.avatar);
      // Clean up preview URL on error
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Load departments and current department assignments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const { data: companyData, error } = await supabase
          .from('companies')
          .select('department_structure')
          .eq('id', companyId)
          .single();

        if (error) throw error;

        const departmentStructure = companyData?.department_structure as any[];
        if (departmentStructure && Array.isArray(departmentStructure)) {
          // Filter to only enabled departments
          const enabledDepts = departmentStructure.filter((dept: any) => dept.isEnabled !== false);
          setDepartments(enabledDepts);

          // Build color map from department structure
          const colorMap: Record<string, string> = {};
          departmentStructure.forEach((dept: any) => {
            if (dept.name && dept.color) {
              colorMap[dept.name] = dept.color;
            }
          });
          setDepartmentColors(colorMap);
        }
      } catch (error) {
        console.error('Error loading departments:', error);
      }
    };

    const loadDepartmentAssignments = async () => {
      try {
        const { data, error } = await supabase
          .from('user_department_assignments')
          .select('department_name, fte_allocation, role')
          .eq('user_id', user.id)
          .eq('company_id', companyId);

        if (error) throw error;

        setDepartmentAssignments(data || []);
      } catch (error) {
        console.error('Error loading department assignments:', error);
      }
    };

    loadDepartments();
    loadDepartmentAssignments();

    const loadProductAccess = async () => {
      try {
        const matrix = await UserProductMatrixService.getUserMatrix(user.id, companyId);
        if (matrix && matrix.product_ids && matrix.product_ids.length > 0) {
          setHasProductRestriction(true);
          setSelectedProductIds(matrix.product_ids);

          // Load product names
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name')
            .in('id', matrix.product_ids)
            .eq('is_archived', false);

          if (!productsError && products) {
            setSelectedProductNames(products.map(p => ({ id: p.id, name: p.name })));
          }

          // Load device module permissions from permissions JSON field
          const perms = matrix.permissions as any;
          if (perms?.device_modules && typeof perms.device_modules === 'object') {
            setDeviceModulePermissions(perms.device_modules);
            const hasAnyRestriction = Object.values(perms.device_modules as Record<string, string[]>).some(
              (mods) => mods && mods.length > 0
            );
            setHasDeviceModuleRestriction(hasAnyRestriction);
          }
        } else {
          setHasProductRestriction(false);
          setSelectedProductIds([]);
          setSelectedProductNames([]);
          setDeviceModulePermissions({});
          setHasDeviceModuleRestriction(false);
        }
      } catch (error) {
        console.error('Error loading Device access:', error);
      }
    };

    loadProductAccess();

    const loadModuleAccess = async () => {
      try {
        const moduleAccess = await UserCompanyModuleAccessService.getUserModuleAccess(user.id, companyId);
        if (moduleAccess && moduleAccess.module_ids && moduleAccess.module_ids.length > 0) {
          setHasModuleRestriction(true);
          setSelectedModuleIds(moduleAccess.module_ids);
        } else {
          setHasModuleRestriction(false);
          setSelectedModuleIds([]);
        }
      } catch (error) {
        console.error('Error loading module access:', error);
      }
    };

    loadModuleAccess();

    const loadDocumentPermissions = async () => {
      try {
        const { data: docPerms } = await supabase
          .from('user_document_permissions')
          .select('document_ids')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .maybeSingle();
        const ids = docPerms?.document_ids || [];
        setSelectedDocumentIds(ids);
        // If a record exists with specific document IDs, user has restriction
        if (docPerms && ids.length > 0) {
          setHasDocumentRestriction(true);
        }
      } catch (error) {
        console.error('Error loading document permissions:', error);
      }
    };

    loadDocumentPermissions();
  }, [companyId, user.id]);

  // Load company products when dialog opens
  useEffect(() => {
    if (isProductDialogOpen) {
      // Initialize temporary state with current selection
      setTempSelectedProductIds([...selectedProductIds]);
      
      const loadProducts = async () => {
        setIsLoadingProducts(true);
        try {
          const [{ data, error }, { data: aliasData }] = await Promise.all([
            supabase
              .from('products')
              .select('id, name, status, basic_udi_di, parent_product_id, is_master_device')
              .eq('company_id', companyId)
              .eq('is_archived', false)
              .order('name'),
            supabase
              .from('basic_udi_aliases')
              .select('basic_udi_di, alias')
              .eq('company_id', companyId)
          ]);

          if (error) throw error;
          setCompanyProducts(data || []);
          const aliasMap = new Map<string, string>();
          (aliasData || []).forEach((a: any) => aliasMap.set(a.basic_udi_di, a.alias));
          setUdiAliases(aliasMap);
        } catch (error) {
          console.error('Error loading Device:', error);
          toast.error('Failed to load Device');
        } finally {
          setIsLoadingProducts(false);
        }
      };
      loadProducts();
    }
  }, [isProductDialogOpen, companyId, selectedProductIds]);

  const handleDocumentPermissionsChange = async (newDocIds: string[]) => {
    setSelectedDocumentIds(newDocIds);
    try {
      // Upsert a single row with the document_ids array
      const { error } = await supabase
        .from('user_document_permissions')
        .upsert({
          user_id: user.id,
          company_id: companyId,
          document_ids: newDocIds,
        }, { onConflict: 'user_id,company_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving document permissions:', error);
      toast.error('Failed to save document permissions');
    }
  };

  const handleSave = async () => {
    let assignmentsToSave = departmentAssignments;
    if (departmentSelectorRef.current) {
      const updatedAssignments = departmentSelectorRef.current.commitPendingAssignment();
      if (updatedAssignments === null) {
        return;
      }
      assignmentsToSave = updatedAssignments;
    }

    setIsUpdating(true);

    // Optimistic update - immediately show changes in UI
    setDisplayData({
      name: editData.name,
      access_level: editData.access_level,
      is_internal: editData.is_internal,
      functional_area: editData.functional_area,
      role: editData.role,
      external_role: editData.external_role
    });

    try {
      // Update user profile data
      const updateData = {
        ...editData,
        functional_area: editData.is_internal && editData.functional_area
          ? getDepartmentEnumValue(editData.functional_area) as any
          : editData.functional_area,
        // Only set role for internal users from department assignments
        // For external users, use external_role
        role: editData.is_internal ? editData.role : null,
        external_role: !editData.is_internal ? editData.external_role : null
      };

      const success = await updateUserPermissions(user.id, updateData);

      if (success) {
        // Save department assignments to the new table
        // Delete existing assignments
        await supabase
          .from('user_department_assignments')
          .delete()
          .eq('user_id', user.id)
          .eq('company_id', companyId);

        // Insert new assignments
        if (assignmentsToSave.length > 0) {
          const { error: insertError } = await supabase
            .from('user_department_assignments')
            .insert(
              assignmentsToSave.map(assignment => ({
                user_id: user.id,
                company_id: companyId,
                department_name: assignment.department_name,
                fte_allocation: assignment.fte_allocation,
                role: assignment.role && assignment.role.length > 0 ? assignment.role : null
              }))
            );

          if (insertError) {
            console.error('Error saving department assignments:', insertError);
            toast.error('Failed to save department assignments');
          }
        }
      }

      if (success) {
        setIsEditing(false);
      } else {
        // Revert optimistic update on failure
        setDisplayData({
          name: user.name,
          access_level: user.access_level,
          is_internal: user.is_internal,
          functional_area: user.functional_area,
          role: user.role || user.external_role || "",
          external_role: user.external_role
        });
      }
    } catch (error) {
      console.error('Error saving:', error);
      // Revert optimistic update on error
      setDisplayData({
        name: user.name,
        access_level: user.access_level,
        is_internal: user.is_internal,
        functional_area: user.functional_area,
        role: user.role || user.external_role || "",
        external_role: user.external_role
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: user.name,
      access_level: user.access_level as "viewer" | "editor" | "admin" | "consultant",
      is_internal: user.is_internal,
      functional_area: user.functional_area ? getDepartmentDisplayName(user.functional_area) : user.functional_area,
      role: user.role || user.external_role || "",
      external_role: user.external_role
    });
    // Restore department assignments to the saved snapshot
    setDepartmentAssignments(savedDepartmentAssignmentsRef.current);
    setIsEditing(false);
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800 ml-2 border border-red-200';
      case 'editor': return 'bg-blue-100 text-blue-800 ml-2 border border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 ml-2 border border-gray-200';
      case 'consultant': return 'bg-purple-100 text-purple-800 ml-2 border border-purple-200';
      default: return 'bg-gray-100 text-gray-800 ml-2 border border-gray-200';
    }
  };

  // Get department color from the loaded department structure
  const getDepartmentColorFromStructure = (functionalAreaDisplay: string | null): string => {
    if (!functionalAreaDisplay) return 'from-slate-500 to-slate-600';

    // Check if we have a color for this department
    const color = departmentColors[functionalAreaDisplay];
    if (color) {
      return color;
    }

    // Fallback to a default gradient
    return 'from-slate-500 to-slate-600';
  };

  const departmentColor = getDepartmentColorFromStructure(displayData.functional_area);

  return (
    <Card className="w-full overflow-hidden">
      {isEditing ? (
        <CardContent className="p-6 space-y-4">
          {/* Avatar Upload Section */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={avatarUrl ? handleAvatarDelete : handleAvatarClick}
                >
                  {isUploadingAvatar ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : avatarUrl ? (
                    <Trash2 className="w-5 h-5 text-white" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Click on photo to upload. JPG, PNG or GIF. Max 50MB.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-gray-50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select
                value={editData.access_level}
                onValueChange={(value: "viewer" | "editor" | "admin" | "consultant") =>
                  setEditData(prev => ({ ...prev, access_level: value }))
                }
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md">
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>User Type</Label>
              <div className="flex items-center space-x-2 h-10">
                <Switch
                  checked={editData.is_internal}
                  onCheckedChange={(checked) => {
                    setEditData(prev => ({
                      ...prev,
                      is_internal: checked,
                      // Clear role when switching between internal/external
                      role: "",
                      external_role: null
                    }));
                    // Keep department assignments when switching to external
                  }}
                  disabled={isUpdating}
                />
                <span className="text-sm font-medium">
                  {editData.is_internal ? 'Internal' : 'External'}
                </span>
              </div>
            </div>
          </div>

          {!editData.is_internal && (
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editData.external_role || ''}
                onValueChange={(value) => {
                  setEditData(prev => ({ ...prev, external_role: value as any, role: value }));
                }}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md">
                  <SelectItem value="consultant">Consultant</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="contract_manufacturer">Contract Manufacturer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="key_opinion_leader">Key Opinion Leader</SelectItem>
                  <SelectItem value="other_external">Other External</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <MultiDepartmentSelector
            ref={departmentSelectorRef}
            companyId={companyId}
            userId={user.id}
            currentAssignments={departmentAssignments}
            onChange={setDepartmentAssignments}
            disabled={isUpdating}
          />

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </CardContent>
      ) : (
        <>
          {/* Department Color Header */}
          <div className={`bg-gradient-to-r ${departmentColor} p-4 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative">
                  <Avatar className="h-16 w-16 cursor-pointer border-2 border-white/20" onClick={handleAvatarClick}>
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-white/20 text-white">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={avatarUrl ? handleAvatarDelete : handleAvatarClick}
                  >
                    {isUploadingAvatar ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : avatarUrl ? (
                      <Trash2 className="w-4 h-4 text-white" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg truncate">{displayData.name}</h3>
                    <Badge className="bg-white/90 text-teal-700 text-xs capitalize">{displayData.access_level || 'viewer'}</Badge>
                  </div>
                  <p className="text-white/90 text-sm truncate">{user.email}</p>
                  {/* Only show role for internal users with department assignments OR external users with external_role */}
                  {displayData.is_internal && departmentAssignments.length > 0 && departmentAssignments[0].role && departmentAssignments[0].role.length > 0 && (
                    <p className="text-white/80 text-sm font-medium">{departmentAssignments[0].role[0]}</p>
                  )}
                  {!displayData.is_internal && displayData.external_role && (
                    <p className="text-white/80 text-sm font-medium">{getExternalRoleDisplayName(displayData.external_role)}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setMenuOpen(false);
                      savedDepartmentAssignmentsRef.current = [...departmentAssignments];
                      setIsEditing(true);
                    }} disabled={isUpdating}>
                      Edit
                    </DropdownMenuItem>
                    {!user.is_owner && (
                      <DropdownMenuItem onClick={() => {
                        setMenuOpen(false);
                        onRemove();
                      }} disabled={isUpdating} className="text-destructive">
                        Remove
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Access Level:</Label>
                <Badge className={getAccessLevelColor(displayData.access_level || 'viewer')}>
                  {displayData.access_level || 'viewer'}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>User Type:</Label>
                <Badge className="ml-2" variant={displayData.is_internal ? "default" : "secondary"}>
                  {displayData.is_internal ? 'Internal' : 'External'}
                </Badge>
              </div>
            </div>

            {/* Display department assignments for all users */}
            {departmentAssignments.length > 0 && (
              <div className="space-y-2">
                <Label>Department Assignments:</Label>
                <div className="space-y-2">
                  {departmentAssignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{assignment.department_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(assignment.fte_allocation * 100)}%
                        </Badge>
                      </div>
                      {assignment.role && assignment.role.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {assignment.role[0]}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display functional area for internal users (legacy) */}
            {displayData.is_internal && displayData.functional_area && departmentAssignments.length === 0 && (
              <div className="space-y-2">
                <Label>Functional Area:</Label>
                <Badge className="ml-2" variant="outline">
                  {displayData.functional_area}
                </Badge>
              </div>
            )}

            {/* Show external role for external users */}
            {!displayData.is_internal && displayData.external_role && (
              <div className="space-y-2">
                <Label>External Role:</Label>
                <Badge className="ml-2" variant="outline">
                  {getExternalRoleDisplayName(displayData.external_role)}
                </Badge>
              </div>
            )}

            {/* Permission & Access Section */}
            <Separator />
            <h4 className="text-sm font-semibold">Permission & Access</h4>

            {user.is_owner || displayData.access_level === 'admin' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Company Modules:</Label>
                  <span className="text-sm text-muted-foreground">All Modules</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Devices:</Label>
                  <span className="text-sm text-muted-foreground">All Device</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Documents:</Label>
                  <span className="text-sm text-muted-foreground">All Documents</span>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-3">
              {/* Company Modules */}
              <Label>Company Modules:</Label>
              <Switch
                checked={hasModuleRestriction}
                onCheckedChange={async (checked) => {
                  if (!checked) {
                    try {
                      const success = await UserCompanyModuleAccessService.deactivateModuleAccess(user.id, companyId);
                      if (success) {
                        setHasModuleRestriction(false);
                        setSelectedModuleIds([]);
                        toast.success('Company access updated - user can now access all dashboard modules');
                      } else {
                        toast.error('Failed to update company access');
                      }
                    } catch (error) {
                      console.error('Error updating company access:', error);
                      toast.error('Failed to update company access');
                    }
                  } else {
                    setHasModuleRestriction(true);
                    if (selectedModuleIds.length === 0) {
                      setTempSelectedModuleIds([...selectedModuleIds]);
                      setIsModuleDialogOpen(true);
                    }
                  }
                }}
                disabled={isUpdating}
              />
              <span className="text-sm text-muted-foreground">
                {hasModuleRestriction ? 'Restricted' : 'All Modules'}
              </span>
              {hasModuleRestriction && selectedModuleIds.length > 0 && (
                <p
                  className="col-span-3 text-xs text-primary -mt-2 cursor-pointer hover:underline"
                  onClick={() => { setTempSelectedModuleIds([...selectedModuleIds]); setIsModuleDialogOpen(true); }}
                >
                  {selectedModuleIds.length} module{selectedModuleIds.length !== 1 ? 's' : ''} selected
                </p>
              )}

              {/* Devices */}
              <Label>Devices:</Label>
              <Switch
                    checked={hasProductRestriction}
                    onCheckedChange={async (checked) => {
                      if (!checked) {
                        try {
                          const existing = await UserProductMatrixService.getUserMatrix(user.id, companyId);
                          if (existing) {
                            const { error: updateError } = await supabase
                              .from('user_product_matrix')
                              .update({ is_active: false, updated_at: new Date().toISOString() })
                              .eq('id', existing.id);
                            if (updateError) throw updateError;
                          }
                          setHasProductRestriction(false);
                          setSelectedProductIds([]);
                          setSelectedProductNames([]);
                          toast.success('Device access updated - user can now access all devices');
                        } catch (error) {
                          console.error('Error updating device access:', error);
                          toast.error('Failed to update device access');
                        }
                      } else {
                        setHasProductRestriction(true);
                        setIsProductDialogOpen(true);
                      }
                    }}
                    disabled={isUpdating}
                  />
              <span className="text-sm text-muted-foreground">
                {hasProductRestriction ? 'Restricted' : 'All Device'}
              </span>
              {hasProductRestriction && selectedProductIds.length > 0 && (
                <p
                  className="col-span-3 text-xs text-primary -mt-2 cursor-pointer hover:underline"
                  onClick={() => setIsProductDialogOpen(true)}
                >
                  {selectedProductIds.length} device{selectedProductIds.length !== 1 ? 's' : ''} selected
                </p>
              )}

              {/* Device Modules */}
              {hasProductRestriction && selectedProductIds.length > 0 && (
                <>
                  <Label>Device Modules:</Label>
                  <Switch
                    checked={hasDeviceModuleRestriction}
                    onCheckedChange={async (checked) => {
                      setHasDeviceModuleRestriction(checked);
                      if (checked) {
                        setTempDeviceModulePermissions({...deviceModulePermissions});
                        setExpandedDeviceInModuleDialog(null);
                        setIsDeviceModuleDialogOpen(true);
                      } else {
                        // Clear device module restrictions
                        setDeviceModulePermissions({});
                        try {
                          const matrix = await UserProductMatrixService.getUserMatrix(user.id, companyId);
                          if (matrix) {
                            const existingPerms = (matrix.permissions as any) || {};
                            const updatedPerms = { ...existingPerms, device_modules: {} };
                            await supabase
                              .from('user_product_matrix')
                              .update({ permissions: updatedPerms, updated_at: new Date().toISOString() })
                              .eq('id', matrix.id);
                          }
                          toast.success('Device module restrictions removed — user can access all modules');
                        } catch (error) {
                          console.error('Error clearing device module access:', error);
                        }
                      }
                    }}
                    disabled={isUpdating}
                  />
                  <span className="text-sm text-muted-foreground">
                    {hasDeviceModuleRestriction ? 'Restricted' : 'All Modules'}
                  </span>
                  {hasDeviceModuleRestriction && (
                    <p
                      className="col-span-3 text-xs text-primary -mt-2 cursor-pointer hover:underline"
                      onClick={() => {
                        setTempDeviceModulePermissions({...deviceModulePermissions});
                        setExpandedDeviceInModuleDialog(null);
                        setIsDeviceModuleDialogOpen(true);
                      }}
                    >
                      {Object.keys(deviceModulePermissions).filter(k => deviceModulePermissions[k]?.length > 0).length} device{Object.keys(deviceModulePermissions).filter(k => deviceModulePermissions[k]?.length > 0).length !== 1 ? 's' : ''} configured
                    </p>
                  )}
                </>
              )}

              {/* Documents */}
              <DocumentPermissionSelector
                companyId={companyId}
                selectedProductIds={selectedProductIds}
                selectedDocumentIds={selectedDocumentIds}
                onChange={handleDocumentPermissionsChange}
                label="Documents"
                inline
                initialRestricted={hasDocumentRestriction}
              />
            </div>
            )}

            <div className="text-xs text-muted-foreground">
              Added: {new Date(user.created_at).toLocaleDateString()}
            </div>
          </CardContent>

          {/* Product Selection Dialog */}
          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Select Device</DialogTitle>
                <DialogDescription>
                  Choose which Device {displayData.name} can access. When no Device are selected, user will have no device access.
                </DialogDescription>
              </DialogHeader>

              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {tempSelectedProductIds.length} of {companyProducts.length} Device selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (tempSelectedProductIds.length === companyProducts.length) {
                          setTempSelectedProductIds([]);
                        } else {
                          setTempSelectedProductIds(companyProducts.map(p => p.id));
                        }
                      }}
                    >
                      {tempSelectedProductIds.length === companyProducts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <Separator />

                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {companyProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No Device found for this company
                        </p>
                      ) : (
                        (() => {
                          // Build family groups: root + all descendants as members
                          const getAllMembers = (rootId: string): typeof companyProducts => {
                            const result: typeof companyProducts = [];
                            const addChildren = (parentId: string) => {
                              companyProducts
                                .filter(p => p.parent_product_id === parentId)
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .forEach(child => { result.push(child); addChildren(child.id); });
                            };
                            addChildren(rootId);
                            return result;
                          };
                          const roots = companyProducts
                            .filter(p => !p.parent_product_id)
                            .sort((a, b) => a.name.localeCompare(b.name));
                          const grouped = roots.map(root => ({
                            root,
                            members: [root, ...getAllMembers(root.id)], // root itself is a member
                            hasChildren: companyProducts.some(p => p.parent_product_id === root.id),
                          }));
                          // Orphans
                          const allGroupedIds = new Set(grouped.flatMap(g => g.members.map(m => m.id)));
                          companyProducts.forEach(p => {
                            if (!allGroupedIds.has(p.id)) {
                              grouped.push({ root: p, members: [p], hasChildren: false });
                            }
                          });
                          return grouped;
                        })().map(({ root, members, hasChildren }) => {
                          const memberIds = members.map(m => m.id);
                          const allSelected = memberIds.every(id => tempSelectedProductIds.includes(id));
                          const someSelected = memberIds.some(id => tempSelectedProductIds.includes(id));
                          const toggleAll = () => {
                            if (allSelected) {
                              setTempSelectedProductIds(prev => prev.filter(id => !memberIds.includes(id)));
                            } else {
                              setTempSelectedProductIds(prev => Array.from(new Set([...prev, ...memberIds])));
                            }
                          };

                          // Standalone device (no children) — show as single row
                          if (!hasChildren) {
                            return (
                              <div key={root.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                                <Checkbox
                                  id={root.id}
                                  checked={tempSelectedProductIds.includes(root.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setTempSelectedProductIds(prev => [...prev, root.id]);
                                    } else {
                                      setTempSelectedProductIds(prev => prev.filter(id => id !== root.id));
                                    }
                                  }}
                                />
                                <label htmlFor={root.id} className="text-sm font-medium cursor-pointer">
                                  {root.name}
                                </label>
                              </div>
                            );
                          }

                          // Family group — master header + all members
                          // Use UDI alias as display name if available (check both basic_udi_di and product id)
                          const groupDisplayName = (root.basic_udi_di && udiAliases.get(root.basic_udi_di)) || udiAliases.get(root.id) || root.name;
                          return (
                            <div key={root.id}>
                              {/* Master group header */}
                              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                                <Checkbox
                                  id={`group-${root.id}`}
                                  checked={someSelected}
                                  onCheckedChange={toggleAll}
                                />
                                <div className="flex items-center gap-2">
                                  <label htmlFor={`group-${root.id}`} className="text-sm font-semibold cursor-pointer">
                                    {groupDisplayName}
                                  </label>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                    {members.length} devices
                                  </Badge>
                                </div>
                              </div>
                              {/* Members (including root itself) */}
                              {members.map(member => (
                                <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 ml-6">
                                  <Checkbox
                                    id={member.id}
                                    checked={tempSelectedProductIds.includes(member.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        // Select this member only (no siblings, no descendants)
                                        setTempSelectedProductIds(prev => Array.from(new Set([...prev, member.id])));
                                      } else {
                                        setTempSelectedProductIds(prev => prev.filter(id => id !== member.id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={member.id} className="text-sm cursor-pointer">
                                    {member.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>

                  <Separator />

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Reset temporary state and close dialog
                        setTempSelectedProductIds([...selectedProductIds]);
                        setIsProductDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const currentUser = await supabase.auth.getUser();
                          const userId = currentUser.data.user?.id;

                          const previousProductIds = [...selectedProductIds];

                          // Update actual state with temporary selections
                          setSelectedProductIds([...tempSelectedProductIds]);

                          // Check if record exists (active or inactive)
                          const { data: existingRecords, error: checkError } = await supabase
                            .from('user_product_matrix')
                            .select('*')
                            .eq('user_id', user.id)
                            .eq('company_id', companyId)
                            .maybeSingle();

                          if (checkError && checkError.code !== 'PGRST116') throw checkError;

                          const existing = existingRecords || null;

                          const matrixData = {
                            user_id: user.id,
                            company_id: companyId,
                            product_ids: tempSelectedProductIds,
                            user_type: displayData.access_level === 'admin' ? 'admin' : displayData.access_level === 'editor' ? 'editor' : 'viewer',
                            access_level: displayData.access_level === 'admin' ? 'full' : displayData.access_level === 'editor' ? 'write' : 'read',
                            is_active: true,
                            assigned_by: userId || existing?.assigned_by || null,
                            assigned_at: existing?.assigned_at || new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          };

                          if (existing) {
                            const { error: updateError } = await supabase
                              .from('user_product_matrix')
                              .update(matrixData)
                              .eq('id', existing.id);
                            if (updateError) throw updateError;
                          } else {
                            const { error: insertError } = await supabase
                              .from('user_product_matrix')
                              .insert(matrixData);
                            if (insertError) throw insertError;
                          }

                          // Update product names from the dialog's companyProducts
                          const selectedProducts = companyProducts.filter(p => tempSelectedProductIds.includes(p.id));
                          setSelectedProductNames(selectedProducts.map(p => ({ id: p.id, name: p.name })));

                          // Auto-grant document access for newly assigned devices
                          const newlyAddedDeviceIds = tempSelectedProductIds.filter(id => !previousProductIds.includes(id));
                          if (newlyAddedDeviceIds.length > 0) {
                            try {
                              const { data: newDocs } = await (supabase as any)
                                .from('phase_assigned_document_template')
                                .select('id')
                                .eq('company_id', companyId)
                                .in('product_id', newlyAddedDeviceIds);

                              if (newDocs && newDocs.length > 0) {
                                const newDocIds = newDocs.map((d: any) => d.id);
                                const mergedDocIds = Array.from(new Set([...selectedDocumentIds, ...newDocIds]));
                                await handleDocumentPermissionsChange(mergedDocIds);
                              }
                            } catch (docError) {
                              console.error('Error auto-granting document access:', docError);
                            }
                          }

                          setHasProductRestriction(true);
                          toast.success(`Device access updated - ${tempSelectedProductIds.length} device${tempSelectedProductIds.length !== 1 ? 's' : ''} selected`);
                          setIsProductDialogOpen(false);
                        } catch (error) {
                          console.error('Error saving Device access:', error);
                          toast.error('Failed to save Device access');
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Module Selection Dialog */}
          <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Select Dashboard Modules</DialogTitle>
                <DialogDescription>
                  Choose which dashboard modules <span className="font-bold">{displayData.name}</span> can access. When no modules are selected, user can access all modules.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {tempSelectedModuleIds.length} of {ALL_COMPANY_MODULES.length} modules selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (tempSelectedModuleIds.length === ALL_COMPANY_MODULES.length) {
                        setTempSelectedModuleIds([]);
                      } else {
                        setTempSelectedModuleIds([...ALL_COMPANY_MODULES]);
                      }
                    }}
                  >
                    {tempSelectedModuleIds.length === ALL_COMPANY_MODULES.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <Separator />

                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {ALL_COMPANY_MODULES.map((moduleId) => (
                      <div
                        key={moduleId}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          id={moduleId}
                          checked={tempSelectedModuleIds.includes(moduleId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTempSelectedModuleIds(prev => [...prev, moduleId]);
                            } else {
                              setTempSelectedModuleIds(prev => prev.filter(id => id !== moduleId));
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={moduleId}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {MODULE_DISPLAY_NAMES[moduleId] || moduleId}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reset temporary state and close dialog
                      setTempSelectedModuleIds([...selectedModuleIds]);
                      // If no modules were previously selected, turn off the restriction switch
                      if (selectedModuleIds.length === 0) {
                        setHasModuleRestriction(false);
                      }
                      setIsModuleDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const currentUser = await supabase.auth.getUser();
                        const assignedBy = currentUser.data.user?.id;

                        // Update actual state with temporary selections
                        setSelectedModuleIds([...tempSelectedModuleIds]);

                        // If no modules selected, deactivate any existing access record
                        if (tempSelectedModuleIds.length === 0) {
                          const success = await UserCompanyModuleAccessService.deactivateModuleAccess(user.id, companyId);
                          if (success) {
                            setHasModuleRestriction(false);
                            toast.success('Company access updated - user can now access all modules');
                          } else {
                            toast.error('Failed to update company access');
                          }
                        } else {
                          // Create or update module access record
                          await UserCompanyModuleAccessService.upsertModuleAccess(
                            {
                              user_id: user.id,
                              company_id: companyId,
                              module_ids: tempSelectedModuleIds,
                              is_active: true,
                            },
                            assignedBy || null
                          );

                          setHasModuleRestriction(true);
                          toast.success(`Company access updated - ${tempSelectedModuleIds.length} module${tempSelectedModuleIds.length !== 1 ? 's' : ''} selected`);
                        }
                        setIsModuleDialogOpen(false);
                      } catch (error: any) {
                        console.error('Error saving module access:', error);
                        const errorMessage = error?.message || 'Failed to save module access';
                        toast.error(errorMessage);
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          {/* Device Module Permissions Dialog */}
          <Dialog open={isDeviceModuleDialogOpen} onOpenChange={setIsDeviceModuleDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Device Module Access</DialogTitle>
                <DialogDescription>
                  Configure which modules <span className="font-bold">{displayData.name}</span> can access per device. Click a device to expand and toggle modules on/off.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="h-[400px]">
                <div className="space-y-1 pr-4">
                  {selectedProductNames.map(device => {
                    const isExpanded = expandedDeviceInModuleDialog === device.id;
                    const deviceMods = tempDeviceModulePermissions[device.id] || [];
                    const allModuleIds = [
                      'device-dashboard', 'business-case', 'device-definition',
                      'bill-of-materials', 'design-risk-controls', 'development-lifecycle',
                      'operations', 'clinical-trials', 'quality-governance',
                      'audit-log', 'regulatory-submissions'
                    ];
                    const moduleCount = deviceMods.filter(m => allModuleIds.includes(m)).length;

                    return (
                      <div key={device.id} className="border rounded-lg overflow-hidden">
                        {/* Device header — click to expand/collapse */}
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedDeviceInModuleDialog(isExpanded ? null : device.id)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            <span className="text-sm font-medium">{device.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {moduleCount === 0 ? 'No restrictions' : `${moduleCount} of ${allModuleIds.length} modules`}
                          </span>
                        </div>

                        {/* Expanded module list */}
                        {isExpanded && (
                          <div className="border-t bg-muted/20 p-2 space-y-0.5">
                            <div className="flex justify-end mb-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {
                                  if (moduleCount === allModuleIds.length) {
                                    setTempDeviceModulePermissions(prev => ({ ...prev, [device.id]: [] }));
                                  } else {
                                    setTempDeviceModulePermissions(prev => ({ ...prev, [device.id]: [...allModuleIds] }));
                                  }
                                }}
                              >
                                {moduleCount === allModuleIds.length ? 'Deselect All' : 'Select All'}
                              </Button>
                            </div>
                            {[
                              { id: 'device-dashboard', label: 'Device Dashboard', subs: [] as {id: string; label: string}[] },
                              { id: 'business-case', label: 'Business Case', subs: [
                                { id: 'xyreg-genesis', label: 'XyReg Genesis' }, { id: 'venture-blueprint', label: 'Venture Blueprint' },
                                { id: 'business-canvas', label: 'Business Canvas' }, { id: 'team-profile', label: 'Team' },
                                { id: 'market-analysis', label: 'Market Analysis' }, { id: 'gtm-strategy', label: 'GTM' },
                                { id: 'use-of-proceeds', label: 'Use of Proceeds' }, { id: 'rnpv', label: 'rNPV Analysis' },
                                { id: 'reimbursement', label: 'Reimbursement' }, { id: 'pricing', label: 'Pricing Strategy' },
                                { id: 'exit-strategy', label: 'Strategic Horizon' }, { id: 'ip-strategy', label: 'IP Strategy' },
                              ]},
                              { id: 'device-definition', label: 'Device Definition', subs: [
                                { id: 'overview', label: 'Overview' }, { id: 'general', label: 'General' },
                                { id: 'purpose', label: 'Intended Purpose' }, { id: 'markets-tab', label: 'Market & Regulatory' },
                                { id: 'identification', label: 'Identification' }, { id: 'bundles', label: 'Bundles' },
                                { id: 'variants', label: 'Variants' },
                              ]},
                              { id: 'bill-of-materials', label: 'Bill of Materials', subs: [] as {id: string; label: string}[] },
                              { id: 'design-risk-controls', label: 'Design & Risk Controls', subs: [
                                { id: 'requirements', label: 'Requirements' }, { id: 'architecture', label: 'Architecture' },
                                { id: 'risk-mgmt', label: 'Risk Management' }, { id: 'vv', label: 'Verification & Validation' },
                                { id: 'usability-engineering', label: 'Usability Engineering' }, { id: 'traceability', label: 'Traceability' },
                              ]},
                              { id: 'development-lifecycle', label: 'Development Lifecycle', subs: [] as {id: string; label: string}[] },
                              { id: 'operations', label: 'Operations', subs: [
                                { id: 'supply-chain', label: 'Supply Chain' }, { id: 'incoming-inspection', label: 'Incoming Inspection' },
                                { id: 'production', label: 'Production' }, { id: 'sterilization-cleanliness', label: 'Sterilization & Cleanliness' },
                                { id: 'preservation-handling', label: 'Preservation & Handling' },
                                { id: 'installation-servicing', label: 'Installation & Servicing' }, { id: 'customer-property', label: 'Customer Property' },
                              ]},
                              { id: 'clinical-trials', label: 'Clinical Trials', subs: [] as {id: string; label: string}[] },
                              { id: 'quality-governance', label: 'Quality Governance', subs: [
                                { id: 'audits', label: 'Audits' }, { id: 'nonconformity', label: 'Nonconformity' },
                                { id: 'product-capa', label: 'CAPA' }, { id: 'product-change-control', label: 'Change Control' },
                                { id: 'design-review', label: 'Design Review' }, { id: 'user-access', label: 'User Access' },
                              ]},
                              { id: 'audit-log', label: 'Audit Log', subs: [] as {id: string; label: string}[] },
                              { id: 'regulatory-submissions', label: 'Regulatory & Submissions', subs: [
                                { id: 'gap-analysis', label: 'Gap Analysis' }, { id: 'activities', label: 'Activities' },
                                { id: 'documents', label: 'Technical Documentation' }, { id: 'technical-file', label: 'Technical File' },
                                { id: 'pms', label: 'Post-Market Surveillance' },
                              ]},
                            ].map((mod) => {
                              const subIds = mod.subs.map(s => `${mod.id}.${s.id}`);
                              const enabledSubCount = subIds.filter(id => deviceMods.includes(id)).length;
                              return (
                              <div key={mod.id}>
                                <div className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-background">
                                  <label htmlFor={`dm-${device.id}-${mod.id}`} className="text-sm font-medium cursor-pointer">
                                    {mod.label}
                                    {mod.subs.length > 0 && <span className="text-xs text-muted-foreground ml-1">({enabledSubCount}/{mod.subs.length})</span>}
                                  </label>
                                  <Switch
                                    id={`dm-${device.id}-${mod.id}`}
                                    checked={deviceMods.includes(mod.id)}
                                    onCheckedChange={(checked) => {
                                      setTempDeviceModulePermissions(prev => {
                                        const current = prev[device.id] || [];
                                        if (checked) {
                                          // Add module + all sub-menus
                                          return { ...prev, [device.id]: [...new Set([...current, mod.id, ...subIds])] };
                                        } else {
                                          // Remove module + all sub-menus
                                          const removeSet = new Set([mod.id, ...subIds]);
                                          return { ...prev, [device.id]: current.filter(id => !removeSet.has(id)) };
                                        }
                                      });
                                    }}
                                    className="scale-75"
                                  />
                                </div>
                                {mod.subs.length > 0 && deviceMods.includes(mod.id) && (
                                  <div className="ml-6 mb-1 space-y-0.5 border-l-2 border-muted pl-3">
                                    {mod.subs.map((sub) => {
                                      const subFullId = `${mod.id}.${sub.id}`;
                                      return (
                                        <div key={sub.id} className="flex items-center justify-between py-0.5 pr-1">
                                          <label htmlFor={`dm-${device.id}-${subFullId}`} className="text-xs text-muted-foreground cursor-pointer">
                                            {sub.label}
                                          </label>
                                          <Switch
                                            id={`dm-${device.id}-${subFullId}`}
                                            checked={deviceMods.includes(subFullId)}
                                            onCheckedChange={(checked) => {
                                              setTempDeviceModulePermissions(prev => {
                                                const current = prev[device.id] || [];
                                                return {
                                                  ...prev,
                                                  [device.id]: checked
                                                    ? [...current, subFullId]
                                                    : current.filter(id => id !== subFullId),
                                                };
                                              });
                                            }}
                                            className="scale-[0.6]"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              <Separator className="mt-1" />
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <Separator />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (Object.keys(deviceModulePermissions).length === 0) {
                      setHasDeviceModuleRestriction(false);
                    }
                    setIsDeviceModuleDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const newPermissions = {...tempDeviceModulePermissions};
                      setDeviceModulePermissions(newPermissions);

                      // Save to user_product_matrix.permissions JSON field
                      const matrix = await UserProductMatrixService.getUserMatrix(user.id, companyId);
                      if (matrix) {
                        const existingPerms = (matrix.permissions as any) || {};
                        const updatedPerms = { ...existingPerms, device_modules: newPermissions };
                        await supabase
                          .from('user_product_matrix')
                          .update({ permissions: updatedPerms, updated_at: new Date().toISOString() })
                          .eq('id', matrix.id);
                      }

                      toast.success('Device module access updated');
                      setIsDeviceModuleDialogOpen(false);
                    } catch (error) {
                      console.error('Error saving device module access:', error);
                      toast.error('Failed to save device module access');
                    }
                  }}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </Card>
  );
}
