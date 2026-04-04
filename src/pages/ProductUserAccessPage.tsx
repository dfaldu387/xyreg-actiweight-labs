import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Shield,
  Check,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Edit3,
  FileText,
  Info,
  BarChart3,
  Building2,
  UserCheck,
  CheckCircle,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductUserAccessService } from "@/services/productUserAccessService";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions?: { [permissionId: string]: boolean };
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  role_permission_id: string;
  level: "none" | "read" | "write" | "full";
}

const defaultRoles: Role[] = [
  {
    id: "super-admin",
    name: "Super Admin",
    description: "Full access to all product features",
  },
  {
    id: "owner",
    name: "Owner",
    description: "Product owner with full control",
  },
  {
    id: "manager",
    name: "Manager",
    description: "Management level access",
  },
  {
    id: "editor",
    name: "Editor",
    description: "Can edit product content",
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    description: "Can review and approve content",
  },
];

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: "1",
    email: "john.doe@company.com",
    first_name: "John",
    last_name: "Doe",
    role: "super-admin",
    permissions: {
      "Product Edit": true,
      "Product Update": true,
      "Product Delete": true,
      "Product Create": true,
      "Compliance Documents": true,
      "Compliance Audit": true,
      "Compliance Activities": true,
      "Compliance Gap Analysis": true,
      "Audit Management": true,
      "User Management": true,
      "Company Settings": true,
      "Document Management": true,
      "Report Generation": true,
      "Review Management": true,
      "Company Overview": true,
    },
  },
  {
    id: "2",
    email: "jane.smith@company.com",
    first_name: "Jane",
    last_name: "Smith",
    role: "editor",
    permissions: {
      "Product Edit": true,
      "Product Update": true,
      "Product Delete": false,
      "Product Create": true,
      "Compliance Documents": true,
      "Compliance Audit": true,
      "Compliance Activities": true,
      "Compliance Gap Analysis": true,
      "Audit Management": true,
      "User Management": false,
      "Company Settings": false,
      "Document Management": true,
      "Report Generation": true,
      "Review Management": true,
      "Company Overview": true,
    },
  },
  {
    id: "3",
    email: "mike.wilson@company.com",
    first_name: "Mike",
    last_name: "Wilson",
    role: "viewer",
    permissions: {
      "Product Edit": false,
      "Product Update": false,
      "Product Delete": false,
      "Product Create": false,
      "Compliance Documents": true,
      "Compliance Audit": false,
      "Compliance Activities": false,
      "Compliance Gap Analysis": true,
      "Audit Management": false,
      "User Management": false,
      "Company Settings": false,
      "Document Management": false,
      "Report Generation": true,
      "Review Management": false,
      "Company Overview": true,
    },
  },
  {
    id: "4",
    email: "sarah.johnson@company.com",
    first_name: "Sarah",
    last_name: "Johnson",
    role: "manager",
    permissions: {
      "Product Edit": true,
      "Product Update": true,
      "Product Delete": false,
      "Product Create": true,
      "Compliance Documents": true,
      "Compliance Audit": true,
      "Compliance Activities": true,
      "Compliance Gap Analysis": true,
      "Audit Management": true,
      "User Management": true,
      "Company Settings": false,
      "Document Management": true,
      "Report Generation": true,
      "Review Management": true,
      "Company Overview": true,
    },
  },
];



export default function ProductUserAccessPage() {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const { activeCompanyId } = useCompanyRole();
  const { lang } = useTranslation();

  // Check if User Access feature is enabled
  const { isMenuAccessKeyEnabled, isLoading: isLoadingPlanAccess, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(DEVICES_MENU_ACCESS.USER_ACCESS);
  const isRestricted = !isFeatureEnabled;
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [departmentRoles, setDepartmentRoles] = useState<Array<{id: string, name: string, department: string, departmentId: string}>>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("super-admin");
  const [activeTab, setActiveTab] = useState<string>("");
  const [userAccess, setUserAccess] = useState<any[]>([]);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Form state for Users box - Multi-select
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Dialog state - Multi-select for guest
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditAccessDialogOpen, setIsEditAccessDialogOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [guestSelectedDepartments, setGuestSelectedDepartments] = useState<string[]>([]);
  const [guestSelectedRoleIds, setGuestSelectedRoleIds] = useState<string[]>([]);
  const [productName, setProductName] = useState<string>("");
  

  // Fetch department roles from company department_structure
  useEffect(() => {
    const fetchDepartmentRoles = async () => {
      if (!activeCompanyId) return;
      
      setIsLoadingRoles(true);
      try {
        const { data: companyData, error } = await supabase
          .from('companies')
          .select('department_structure')
          .eq('id', activeCompanyId)
          .single();

        if (error) throw error;

        const departmentStructure = (companyData?.department_structure as any[]) || [];
        const allRoles: Array<{id: string, name: string, department: string, departmentId: string}> = [];
        const depts: Array<{id: string, name: string}> = [];
        
        departmentStructure.forEach((dept: any) => {
          // Only include enabled departments
          if (dept.isEnabled) {
            depts.push({
              id: dept.id,
              name: dept.name
            });
            
            const defaultRoles = dept.roles || [];
            const customRoles = dept.customRoles || [];
            const disabledRoles = dept.disabledRoles || [];
            const allDeptRoles = [...defaultRoles, ...customRoles];
            
            // Only include enabled roles
            allDeptRoles.forEach((roleName: string) => {
              if (!disabledRoles.includes(roleName)) {
                allRoles.push({
                  id: `${dept.id}-${roleName}`,
                  name: roleName,
                  department: dept.name,
                  departmentId: dept.id
                });
              }
            });
          }
        });

        setDepartments(depts);
        setDepartmentRoles(allRoles);
      } catch (error) {
        console.error('Error fetching department roles:', error);
        toast.error(lang('deviceUserAccess.toast.failedToLoadRoles'));
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchDepartmentRoles();
  }, [activeCompanyId]);

  // Fetch company users on mount
  useEffect(() => {
    const fetchCompanyUsers = async () => {
      if (!activeCompanyId) return;
      
      setIsLoadingUsers(true);
      try {
        // Fetch from user_profiles since that's where company users are stored
        const { data, error } = await supabase
          .from('user_company_access')
          .select(`
            user_id,
            user_profiles (
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('company_id', activeCompanyId);

        if (error) throw error;

        const users: User[] = (data || []).map((item: any) => ({
          id: item.user_profiles.id,
          email: item.user_profiles.email,
          first_name: item.user_profiles.first_name || '',
          last_name: item.user_profiles.last_name || '',
          role: 'editor', // Default role
        }));

        setCompanyUsers(users);
      } catch (error) {
        console.error('Error fetching company users:', error);
        toast.error(lang('deviceUserAccess.toast.failedToLoadUsers'));
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchCompanyUsers();
  }, [activeCompanyId]);

  // Fetch product details and user access on mount
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;
      
      setIsLoadingAccess(true);
      try {
        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('name')
          .eq('id', productId)
          .single();

        if (productError) throw productError;
        if (productData) {
          setProductName(productData.name);
        }

        // Fetch access data
        const accessData = await ProductUserAccessService.getProductAccess(productId);
        setUserAccess(accessData);
      } catch (error) {
        console.error('Error fetching product data:', error);
        toast.error(lang('deviceUserAccess.toast.failedToLoadProductData'));
      } finally {
        setIsLoadingAccess(false);
      }
    };

    fetchProductData();
  }, [productId]);
  // Handle adding user access
  const handleAddUserAccessFromDialog = async () => {
    if (!inviteEmail.trim()) {
      toast.error(lang('deviceUserAccess.toast.enterEmailAddress'));
      return;
    }

    if (guestSelectedRoleIds.length === 0) {
      toast.error(lang('deviceUserAccess.toast.selectAtLeastOneRole'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error(lang('deviceUserAccess.toast.enterValidEmail'));
      return;
    }
    
    try {
      // Get first selected role for invitation
      const firstRoleData = departmentRoles.find(r => r.id === guestSelectedRoleIds[0]);

      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-guest-people', {
        body: {
          email: inviteEmail,
          role: firstRoleData?.name,
          product_id: productId,
        },
      });
      if (inviteError) {
        toast.error(lang('deviceUserAccess.toast.failedToInviteGuest'));
        return;
      }
      if (inviteData) {
         // CRITICAL: Ensure guest user exists in profiles table (FK requirement)
         const { error: profileError } = await supabase
           .from('profiles')
           .upsert({
             id: inviteData.data.userId,
             email: inviteEmail,
             first_name: null,
             last_name: null,
           }, {
             onConflict: 'id'
           });

         if (profileError) {
           console.error('Error upserting guest profile:', profileError);
           toast.error(lang('deviceUserAccess.toast.failedToCreateGuestProfile'));
           return;
         }

         // Create access for each selected role
         for (const roleId of guestSelectedRoleIds) {
           const selectedRoleData = departmentRoles.find(r => r.id === roleId);
           
           await ProductUserAccessService.createAccess({
             product_id: productId!,
             user_id: inviteData.data.userId,
             user_type: "guest",
             role_id: roleId,
             role_name: selectedRoleData?.name || null,
             permissions: {},
             access_level: "read",
             is_active: true,
             invited_by: user?.id || null,
             expires_at: null,
             notes: "Invited by " + user?.email || null,
           });
         }

        // Insert into user_product_permissions table
        const { error: permError } = await supabase
          .from('user_product_permissions')
          .insert({
            user_id: inviteData.data.userId,
            product_id: productId!,
            permissions: [],
            override_company_permissions: false,
          });

        if (permError && permError.code !== '23505') { // Ignore duplicate key errors
          console.error('Error inserting into user_product_permissions:', permError);
        }

        toast.success(lang('deviceUserAccess.toast.accessGranted').replace('{{email}}', inviteEmail).replace('{{count}}', String(guestSelectedRoleIds.length)));
        
        // Refresh the user access list
        const accessData = await ProductUserAccessService.getProductAccess(productId!);
        setUserAccess(accessData);
        
        // Reset form
        setInviteEmail("");
        setGuestSelectedDepartments([]);
        setGuestSelectedRoleIds([]);
        setIsGuestDialogOpen(false);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(lang('deviceUserAccess.toast.failedToInviteGuest'));
      return;
    }


  };

  const handleAddUserAccess = async () => {
    if (!selectedUser) {
      toast.error(lang('deviceUserAccess.toast.selectUser'));
      return;
    }

    if (selectedRoleIds.length === 0) {
      toast.error(lang('deviceUserAccess.toast.selectAtLeastOneRole'));
      return;
    }

    if (!productId || !activeCompanyId) {
      toast.error(lang('deviceUserAccess.toast.missingProductOrCompany'));
      return;
    }

    try {
      const selectedUserData = companyUsers.find((u) => u.id === selectedUser);
      if (!selectedUserData) {
        toast.error(lang('deviceUserAccess.toast.userNotFound'));
        return;
      }

      // CRITICAL: Ensure user exists in profiles table (FK requirement)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: selectedUser,
          email: selectedUserData.email,
          first_name: selectedUserData.first_name,
          last_name: selectedUserData.last_name,
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Error upserting profile:', profileError);
        toast.error(lang('deviceUserAccess.toast.failedToCreateProfile'));
        return;
      }

      // Insert access for each selected role
      for (const roleId of selectedRoleIds) {
        const selectedRoleData = departmentRoles.find(r => r.id === roleId);
        
        await ProductUserAccessService.createAccess({
          product_id: productId,
          user_id: selectedUser,
          user_type: "editor" as any,
          role_id: roleId,
          role_name: selectedRoleData?.name || null,
          permissions: {},
          access_level: "write",
          is_active: true,
          invited_by: user?.id || null,
          expires_at: null,
          notes: `Added by ${user?.email || 'system'}`,
        });
      }

      // Insert into user_product_permissions table
      const { error: permError } = await supabase
        .from('user_product_permissions')
        .insert({
          user_id: selectedUser,
          product_id: productId,
          permissions: [],
          override_company_permissions: false,
        });

      if (permError && permError.code !== '23505') {
        console.error('Error inserting into user_product_permissions:', permError);
      }

      toast.success(lang('deviceUserAccess.toast.accessGranted').replace('{{email}}', selectedUserData.email).replace('{{count}}', String(selectedRoleIds.length)));

      // Refresh the user access list
      const accessData = await ProductUserAccessService.getProductAccess(productId);
      setUserAccess(accessData);

      // Reset form
      setSelectedUser("");
      setSelectedDepartments([]);
      setSelectedRoleIds([]);
    } catch (error) {
      console.error('Error adding user access:', error);
      toast.error(lang('deviceUserAccess.toast.failedToAddAccess'));
    }
  };
  // Invite user handler
  const handleInviteUser = () => {
    if (!inviteEmail.trim()) {
      toast.error(lang('deviceUserAccess.toast.enterEmailAddress'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error(lang('deviceUserAccess.toast.enterValidEmail'));
      return;
    }

    // Mock invite functionality
    toast.success(lang('deviceUserAccess.toast.invitationSent').replace('{{email}}', inviteEmail));
    setInviteEmail("");
    setIsInviteDialogOpen(false);
  };
  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('deviceUserAccess.featureName')}
    >
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {lang('deviceUserAccess.page.title')}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {lang('deviceUserAccess.page.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Users */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{lang('deviceUserAccess.users.title')}</CardTitle>
                  <div className="flex gap-2">
                    {/* <Button size="sm" className="h-8 px-3">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add User
                      </Button> */}
                    <Button
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => setIsGuestDialogOpen(true)}
                      disabled={isRestricted}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      {lang('deviceUserAccess.users.guest')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Add User Form */}
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  {/* User Dropdown */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {lang('deviceUserAccess.form.selectUser')}
                    </label>
                    <Select
                      value={selectedUser}
                      onValueChange={setSelectedUser}
                      disabled={isRestricted}
                    >
                      <SelectTrigger className="w-full" disabled={isRestricted}>
                        <SelectValue placeholder={lang('deviceUserAccess.form.chooseUser')} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingUsers ? (
                          <SelectItem value="loading" disabled>
                            {lang('deviceUserAccess.form.loadingUsers')}
                          </SelectItem>
                        ) : companyUsers.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            {lang('deviceUserAccess.form.noUsersAvailable')}
                          </SelectItem>
                        ) : (
                          companyUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {user.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                                    {user.last_name?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {user.first_name && user.last_name 
                                      ? `${user.first_name} ${user.last_name}`
                                      : user.email}
                                  </div>
                                  {user.first_name && user.last_name && (
                                    <div className="text-xs text-gray-500">
                                      {user.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department Multi-Select */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {lang('deviceUserAccess.form.departments')}
                    </label>
                    <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-background">
                      {isLoadingRoles ? (
                        <p className="text-sm text-muted-foreground">{lang('deviceUserAccess.form.loadingDepartments')}</p>
                      ) : departments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{lang('deviceUserAccess.form.noDepartmentsAvailable')}</p>
                      ) : (
                        <div className="space-y-2">
                          {departments.map((dept) => (
                            <div key={dept.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`dept-${dept.id}`}
                                checked={selectedDepartments.includes(dept.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedDepartments([...selectedDepartments, dept.id]);
                                  } else {
                                    setSelectedDepartments(selectedDepartments.filter(d => d !== dept.id));
                                    // Also remove roles from this department
                                    const deptRoleIds = departmentRoles
                                      .filter(r => r.departmentId === dept.id)
                                      .map(r => r.id);
                                    setSelectedRoleIds(selectedRoleIds.filter(id => !deptRoleIds.includes(id)));
                                  }
                                }}
                                disabled={isRestricted}
                              />
                              <label
                                htmlFor={`dept-${dept.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {dept.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role Multi-Select (filtered by selected departments) */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {lang('deviceUserAccess.form.roles')}
                    </label>
                    <div className="border rounded-md p-2 max-h-60 overflow-y-auto bg-background">
                      {selectedDepartments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{lang('deviceUserAccess.form.selectDepartmentFirst')}</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedDepartments.map(deptId => {
                            const dept = departments.find(d => d.id === deptId);
                            const deptRoles = departmentRoles.filter(r => r.departmentId === deptId);
                            
                            return (
                              <div key={deptId} className="space-y-2">
                                <div className="text-xs font-semibold text-muted-foreground uppercase">
                                  {dept?.name}
                                </div>
                                {deptRoles.map((role) => (
                                  <div key={role.id} className="flex items-center space-x-2 pl-2">
                                    <Checkbox
                                      id={`role-${role.id}`}
                                      checked={selectedRoleIds.includes(role.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedRoleIds([...selectedRoleIds, role.id]);
                                        } else {
                                          setSelectedRoleIds(selectedRoleIds.filter(id => id !== role.id));
                                        }
                                      }}
                                      disabled={isRestricted}
                                    />
                                    <label
                                      htmlFor={`role-${role.id}`}
                                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                      {role.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>


                  <Button
                    onClick={handleAddUserAccess}
                    className="w-full"
                    disabled={isRestricted || !selectedUser || selectedRoleIds.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('deviceUserAccess.form.addUserAccess')} {selectedRoleIds.length > 0 && `(${selectedRoleIds.length})`}
                  </Button>
                </div>

                <Separator />

                {/* User List */}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <div className="space-y-2">
              {isLoadingAccess ? (
                <div className="text-center py-8 text-gray-500">
                  {lang('deviceUserAccess.list.loading')}
                </div>
              ) : userAccess.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {lang('deviceUserAccess.list.empty')}
                </div>
              ) : (
                userAccess.map((access) => {
                  const userInfo = access.user;
                  const displayName = userInfo?.first_name && userInfo?.last_name 
                    ? `${userInfo.first_name} ${userInfo.last_name}`
                    : userInfo?.email || 'Unknown User';
                  const initials = userInfo?.first_name && userInfo?.last_name
                    ? `${userInfo.first_name[0]}${userInfo.last_name[0]}`
                    : userInfo?.email?.[0]?.toUpperCase() || 'U';

                  return (
                    <div
                      key={access.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {initials}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {displayName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {userInfo?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {access.role_name || access.user_type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingAccess(access);
                            setIsEditAccessDialogOpen(true);
                          }}
                          disabled={isRestricted}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {lang('deviceUserAccess.inviteDialog.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{lang('deviceUserAccess.inviteDialog.emailAddress')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={lang('deviceUserAccess.inviteDialog.enterEmail')}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="text-sm text-gray-500">
              {lang('deviceUserAccess.inviteDialog.description')}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
            >
              {lang('deviceUserAccess.inviteDialog.cancel')}
            </Button>
            <Button onClick={handleInviteUser}>{lang('deviceUserAccess.inviteDialog.sendInvitation')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guest Role & Permission Management Dialog */}
      <Dialog open={isGuestDialogOpen} onOpenChange={setIsGuestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {lang('deviceUserAccess.guestDialog.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="guestEmail">{lang('deviceUserAccess.guestDialog.emailAddress')}</Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder={lang('deviceUserAccess.guestDialog.enterEmail')}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Department Multi-Select */}
            <div className="space-y-2">
              <Label htmlFor="guestDepartment">{lang('deviceUserAccess.guestDialog.departments')}</Label>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-background">
                {isLoadingRoles ? (
                  <p className="text-sm text-muted-foreground">{lang('deviceUserAccess.form.loadingDepartments')}</p>
                ) : departments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{lang('deviceUserAccess.form.noDepartmentsAvailable')}</p>
                ) : (
                  <div className="space-y-2">
                    {departments.map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`guest-dept-${dept.id}`}
                          checked={guestSelectedDepartments.includes(dept.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setGuestSelectedDepartments([...guestSelectedDepartments, dept.id]);
                            } else {
                              setGuestSelectedDepartments(guestSelectedDepartments.filter(d => d !== dept.id));
                              // Also remove roles from this department
                              const deptRoleIds = departmentRoles
                                .filter(r => r.departmentId === dept.id)
                                .map(r => r.id);
                              setGuestSelectedRoleIds(guestSelectedRoleIds.filter(id => !deptRoleIds.includes(id)));
                            }
                          }}
                        />
                        <label
                          htmlFor={`guest-dept-${dept.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {dept.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Role Multi-Select (filtered by selected departments) */}
            <div className="space-y-2">
              <Label htmlFor="guestRole">{lang('deviceUserAccess.guestDialog.roles')}</Label>
              <div className="border rounded-md p-2 max-h-60 overflow-y-auto bg-background">
                {guestSelectedDepartments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{lang('deviceUserAccess.form.selectDepartmentFirst')}</p>
                ) : (
                  <div className="space-y-3">
                    {guestSelectedDepartments.map(deptId => {
                      const dept = departments.find(d => d.id === deptId);
                      const deptRoles = departmentRoles.filter(r => r.departmentId === deptId);
                      
                      return (
                        <div key={deptId} className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase">
                            {dept?.name}
                          </div>
                          {deptRoles.map((role) => (
                            <div key={role.id} className="flex items-center space-x-2 pl-2">
                              <Checkbox
                                id={`guest-role-${role.id}`}
                                checked={guestSelectedRoleIds.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setGuestSelectedRoleIds([...guestSelectedRoleIds, role.id]);
                                  } else {
                                    setGuestSelectedRoleIds(guestSelectedRoleIds.filter(id => id !== role.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`guest-role-${role.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {role.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGuestDialogOpen(false)}
            >
              {lang('deviceUserAccess.guestDialog.cancel')}
            </Button>
            <Button onClick={handleAddUserAccessFromDialog}>
              {lang('deviceUserAccess.guestDialog.addAccess')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Access Dialog */}
      <Dialog open={isEditAccessDialogOpen} onOpenChange={setIsEditAccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {lang('deviceUserAccess.editDialog.title')}
            </DialogTitle>
            {productName && (
              <p className="text-sm text-muted-foreground">
                {lang('deviceUserAccess.editDialog.product')}: {productName}
              </p>
            )}
          </DialogHeader>

          {editingAccess && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-300">{lang('deviceUserAccess.editDialog.productSpecificPermissions')}</AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-400 text-xs">
                  {lang('deviceUserAccess.editDialog.permissionsDescription').replace('{{productName}}', productName)}
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>{lang('deviceUserAccess.editDialog.user')}</Label>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {editingAccess.user?.first_name && editingAccess.user?.last_name
                        ? `${editingAccess.user.first_name[0]}${editingAccess.user.last_name[0]}`
                        : editingAccess.user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {editingAccess.user?.first_name && editingAccess.user?.last_name 
                        ? `${editingAccess.user.first_name} ${editingAccess.user.last_name}`
                        : editingAccess.user?.email || 'Unknown User'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {editingAccess.user?.email || 'No email'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{lang('deviceUserAccess.editDialog.currentRole')}</Label>
                <Badge variant="secondary">
                  {editingAccess.role_name || editingAccess.user_type}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>{lang('deviceUserAccess.editDialog.category')}</Label>
                <div className="flex flex-wrap gap-2">
                  {editingAccess.permissions && Object.keys(editingAccess.permissions).length > 0 ? (
                    Object.keys(editingAccess.permissions).map((category) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">{lang('deviceUserAccess.editDialog.noCategoryAssigned')}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{lang('deviceUserAccess.editDialog.permissions')}</Label>
                <div className="flex flex-wrap gap-2">
                  {editingAccess.permissions && Object.keys(editingAccess.permissions).length > 0 ? (
                    Object.entries(editingAccess.permissions).map(([category, perms]: [string, any]) => (
                      Object.entries(perms).map(([permission, granted]: [string, any]) =>
                        granted && (
                          <Badge key={`${category}-${permission}`} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        )
                      )
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">{lang('deviceUserAccess.editDialog.noPermissionsAssigned')}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{lang('deviceUserAccess.editDialog.status')}</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={editingAccess.is_active ? "default" : "secondary"}>
                    {editingAccess.is_active ? lang('deviceUserAccess.editDialog.active') : lang('deviceUserAccess.editDialog.inactive')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{lang('deviceUserAccess.editDialog.accessLevel')}</Label>
                <Badge variant="outline" className="capitalize">
                  {editingAccess.access_level}
                </Badge>
              </div>

              {editingAccess.notes && (
                <div className="space-y-2">
                  <Label>{lang('deviceUserAccess.editDialog.notes')}</Label>
                  <p className="text-sm text-muted-foreground">{editingAccess.notes}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p>{lang('deviceUserAccess.editDialog.invitedOn')}: {new Date(editingAccess.invited_at).toLocaleDateString()}</p>
                {editingAccess.last_accessed_at && (
                  <p className="mt-1">{lang('deviceUserAccess.editDialog.lastAccessed')}: {new Date(editingAccess.last_accessed_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditAccessDialogOpen(false);
                setEditingAccess(null);
              }}
            >
              {lang('deviceUserAccess.editDialog.close')}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!editingAccess) return;

                try {
                  const { error } = await supabase
                    .from('product_user_access')
                    .delete()
                    .eq('id', editingAccess.id);

                  if (error) throw error;

                  toast.success(lang('deviceUserAccess.toast.accessRemoved'));

                  // Refresh the list
                  const accessData = await ProductUserAccessService.getProductAccess(productId!);
                  setUserAccess(accessData);

                  setIsEditAccessDialogOpen(false);
                  setEditingAccess(null);
                } catch (error) {
                  console.error('Error removing access:', error);
                  toast.error(lang('deviceUserAccess.toast.failedToRemoveAccess'));
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {lang('deviceUserAccess.editDialog.removeAccess')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </RestrictedFeatureProvider>
  );
}
