import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, User, Building2, Save, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocumentControlRole {
  id: string;
  roleType: 'prepared_by' | 'reviewed_by' | 'approved_by';
  userId?: string;
  name: string;
  title: string;
  department: string;
  date: Date | null;
  signature?: string;
}

interface DocumentControlTableProps {
  documentId?: string;
  onControlDataChange?: (controlData: any) => void;
  className?: string;
}

interface CompanyUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  access_level: string;
  department?: string;
}

interface Department {
  id: string;
  name: string;
  departmentHead?: string;
  departmentHeadName?: string;
  keyResponsibilities: string;
  position: number;
  roles?: string[];
  isEnabled?: boolean;
  customRoles?: string[];
}

const DEFAULT_ROLES: Omit<DocumentControlRole, 'id' | 'name' | 'title' | 'department' | 'date'>[] = [
  { roleType: 'prepared_by' },
  { roleType: 'reviewed_by' },
  { roleType: 'approved_by' }
];

const ROLE_LABELS = {
  prepared_by: 'Issued By',
  reviewed_by: 'Reviewed By',
  approved_by: 'Approved By'
};

export function DocumentControlTable({ 
  documentId, 
  onControlDataChange, 
  className 
}: DocumentControlTableProps) {
  const { activeCompanyRole } = useCompanyRole();
  const [roles, setRoles] = useState<DocumentControlRole[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize roles
  useEffect(() => {
    const initialRoles: DocumentControlRole[] = DEFAULT_ROLES.map((roleTemplate, index) => ({
      id: `role-${index}`,
      ...roleTemplate,
      name: '',
      title: '',
      department: '',
      date: null
    }));
    setRoles(initialRoles);
  }, []);

  // Load company users and departments
  useEffect(() => {
    if (activeCompanyRole?.companyId) {
      loadCompanyData();
    }
  }, [activeCompanyRole?.companyId]);

  const loadCompanyData = async () => {
    try {
      setIsLoadingUsers(true);
      
      // Load company users with profiles
      const { data: userAccess, error: usersError } = await supabase
        .from('user_company_access')
        .select(`
          user_id,
          access_level,
          user_profiles!inner(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('company_id', activeCompanyRole.companyId);

      if (usersError) throw usersError;

      // Load company department structure
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('department_structure')
        .eq('id', activeCompanyRole.companyId)
        .single();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;

      // Process departments - filter to only enabled departments
      const departmentStructure = companyData?.department_structure || [];
      if (Array.isArray(departmentStructure)) {
        const depts = (departmentStructure as unknown as Department[])
          .filter(dept => dept.isEnabled !== false);
        setDepartments(depts);
        
        // Extract all roles from all enabled departments
        const extractedRoles = depts.flatMap(dept => {
          const defaultRoles = dept.roles || [];
          const customRoles = (dept as any).customRoles || [];
          return [...defaultRoles, ...customRoles];
        });
        const uniqueRoles = [...new Set(extractedRoles)];
        setAllRoles(uniqueRoles);
      }

      // Process users and map them to departments
      const users: CompanyUser[] = userAccess?.map(ua => {
        const profile = ua.user_profiles;
        
        // Find user's department from department structure
        const userDepartment = Array.isArray(departmentStructure) ? 
          departmentStructure.find((dept: any) => dept.departmentHead === profile.id) : null;

        return {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          access_level: ua.access_level,
          department: (userDepartment as any)?.name || 'Unassigned'
        };
      }) || [];

      setCompanyUsers(users);
      
      // Load saved document control data if exists
      await loadSavedDocumentControl();
      
    } catch (error) {
      console.error('Error loading company data:', error);
      toast.error('Failed to load company users and departments');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadSavedDocumentControl = async () => {
    if (!activeCompanyRole?.companyId) return;

    // Only load if we have a specific document ID - don't use shared 'current' fallback
    if (!documentId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('document_control_assignments')
        .select('control_data')
        .eq('document_id', documentId)
        .eq('company_id', activeCompanyRole.companyId)
        .maybeSingle();

      if (error) {
        console.error('[DocumentControlTable] Error loading from Supabase:', error);
        return;
      }

      if (data?.control_data) {
        const controlData = data.control_data;
        
        // Map saved data back to roles
        const updatedRoles = (roles.length ? roles : DEFAULT_ROLES.map((rt, i) => ({ id: `role-${i}`, ...rt, name: '', title: '', department: '', date: null })) ).map(role => {
          const savedRole = controlData[role.roleType];
          if (savedRole) {
            // Try to find user by id/name/email; fall back to saved fields
            const user = companyUsers.find(u => 
              u.id === savedRole.userId ||
              `${u.first_name || ''} ${u.last_name || ''}`.trim() === savedRole.name ||
              u.email === savedRole.name
            );
            
            return {
              ...role,
              userId: user?.id || savedRole.userId,
              name: savedRole.name,
              title: savedRole.title,
              department: savedRole.department,
              date: savedRole.date ? new Date(savedRole.date) : null,
              signature: savedRole.signature
            };
          }
          return role;
        });
        
        setRoles(updatedRoles);
        
        // IMPORTANT: Notify parent component of the loaded data
        if (onControlDataChange) {
          onControlDataChange(controlData);
        }
      }
    } catch (error) {
      console.error('[DocumentControlTable] Error loading saved document control:', error);
    }
  };

  const updateRole = (roleId: string, field: keyof DocumentControlRole, value: any) => {
    setRoles(prev => {
      const updated = prev.map(role => 
        role.id === roleId 
          ? { ...role, [field]: value }
          : role
      );
      
      // Check for conflicts only when assigning a user (not updating other fields)
      // and exclude the current role being updated from conflict check
      if (field === 'name' || field === 'userId') {
        const identifier = field === 'userId' ? value : value;
        
        // Check if this person is already assigned to a DIFFERENT role
        const hasConflict = updated.some(role => {
          if (role.id === roleId) return false; // Skip the current role being updated
          
          const roleIdentifier = role.userId || role.name;
          return roleIdentifier && 
                 roleIdentifier !== '[To be assigned]' && 
                 roleIdentifier !== '' &&
                 roleIdentifier === identifier;
        });
        
        if (hasConflict) {
          const personName = typeof value === 'string' ? value : 
            companyUsers.find(u => u.id === value)?.first_name + ' ' + companyUsers.find(u => u.id === value)?.last_name;
          toast.error(`${personName || 'This person'} is already assigned to another role`);
          return prev; // Don't update if there's a conflict
        }
      }
      
      setHasUnsavedChanges(true);
      
      // Notify parent of changes
      if (onControlDataChange) {
        const controlData = convertRolesToControlData(updated);
        onControlDataChange(controlData);
      }
      
      return updated;
    });
  };

  const checkRoleConflicts = (rolesList: DocumentControlRole[]) => {
    const conflicts: string[] = [];
    const assignedPeople = new Map<string, string[]>();
    
    rolesList.forEach(role => {
      const identifier = role.userId || role.name;
      if (identifier && identifier !== '[To be assigned]' && identifier !== '') {
        if (!assignedPeople.has(identifier)) {
          assignedPeople.set(identifier, []);
        }
        assignedPeople.get(identifier)!.push(ROLE_LABELS[role.roleType]);
      }
    });
    
    assignedPeople.forEach((rolesList, person) => {
      if (rolesList.length > 1) {
        const user = companyUsers.find(u => u.id === person);
        const personName = user ? `${user.first_name} ${user.last_name}` : person;
        conflicts.push(`${personName} is assigned to: ${rolesList.join(', ')}`);
      }
    });
    
    return conflicts;
  };

  const convertRolesToControlData = (rolesList: DocumentControlRole[]) => {
    const controlData: any = {};
    
    rolesList.forEach(role => {
      const key = role.roleType;
      controlData[key] = {
        userId: role.userId,
        name: role.name || '[To be assigned]',
        title: role.title || '[Title]',
        department: role.department || '[Department]',
        date: role.date || new Date(),
        signature: role.signature
      };
    });
    
    return controlData;
  };

  const handleUserSelect = (roleId: string, userId: string) => {
    const user = companyUsers.find(u => u.id === userId);
    if (user) {
      const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
      
      // Find user's title from department structure
      const userDepartment = departments.find(dept => dept.departmentHead === userId);
      const title = userDepartment ? `Head of ${userDepartment.name}` : 
        user.access_level === 'admin' ? 'Administrator' :
        user.access_level === 'editor' ? 'Editor' : 'User';
      
      updateRole(roleId, 'userId', userId);
      updateRole(roleId, 'name', displayName);
      updateRole(roleId, 'title', title);
      updateRole(roleId, 'department', user.department || 'Unassigned');
      
      // Set current date if not already set
      const role = roles.find(r => r.id === roleId);
      if (!role?.date) {
        updateRole(roleId, 'date', new Date());
      }
    }
  };

  const syncWithCompanySettings = async () => {
    toast.info('Syncing with company settings...');
    await loadCompanyData();
    toast.success('Document control synced with company users and departments');
  };

  const saveDocumentControl = async () => {
    if (!hasUnsavedChanges) return;
    if (!activeCompanyRole?.companyId) {
      toast.error('No active company selected');
      return;
    }
    
    // Only save if we have a specific document ID - don't use shared 'current' fallback
    if (!documentId) {
      toast.error('Document must be saved before assigning roles');
      console.error('[DocumentControlTable] No documentId provided, cannot save to avoid cross-document contamination');
      return;
    }
    
    setIsSaving(true);
    try {
      const controlData = convertRolesToControlData(roles);
      
      // Upsert to database
      const { error } = await supabase
        .from('document_control_assignments')
        .upsert({
          document_id: documentId,
          company_id: activeCompanyRole.companyId,
          control_data: controlData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'document_id,company_id'
        });

      if (error) {
        console.error('[DocumentControlTable] Error saving to Supabase:', error);
        throw error;
      }
      
      setHasUnsavedChanges(false);
      toast.success('Document control data saved successfully!');
    } catch (error) {
      console.error('[DocumentControlTable] Error saving document control:', error);
      toast.error('Failed to save document control data');
    } finally {
      setIsSaving(false);
    }
  };

  const conflicts = checkRoleConflicts(roles);
  const isComplete = roles.length > 0 && roles.every(role => 
    role.name && 
    role.name !== '[To be assigned]' && 
    role.title && 
    role.department && 
    role.date
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Document Control
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={syncWithCompanySettings}
              disabled={isLoadingUsers}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Sync with Company
            </Button>
            {conflicts.length > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">{conflicts.length} conflicts</span>
              </div>
            )}
            {hasUnsavedChanges && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={saveDocumentControl}
                disabled={isSaving}
                className="text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Assign users from your company to document control roles. Changes sync with Company Settings &gt; Department Structure.
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Role</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="w-44">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Initializing document control roles...
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    {ROLE_LABELS[role.roleType]}
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={role.userId || ''}
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          // Allow custom name entry
                          updateRole(role.id, 'userId', undefined);
                          updateRole(role.id, 'name', '');
                        } else {
                          handleUserSelect(role.id, value);
                        }
                      }}
                      disabled={isLoadingUsers}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={isLoadingUsers ? "Loading..." : "Select person"} />
                      </SelectTrigger>
                      <SelectContent>
                        {companyUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              <div className="flex flex-col">
                                <span>
                                  {user.first_name && user.last_name 
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.email}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {user.department} • {user.access_level}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span>Enter custom name...</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {(!role.userId && (!role.name || role.name === '')) && (
                      <Input
                        placeholder="Enter name"
                        value={role.name || ''}
                        onChange={(e) => updateRole(role.id, 'name', e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter title"
                        value={role.title || ''}
                        onChange={(e) => updateRole(role.id, 'title', e.target.value)}
                      />
                      
                      {/* Quick role selection from all company roles */}
                      {allRoles.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Quick select from company roles:</Label>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {allRoles.map((companyRole) => (
                              <Button
                                key={companyRole}
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => updateRole(role.id, 'title', companyRole)}
                              >
                                {companyRole}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-2">
                      <Select
                        value={role.department || ''}
                        onValueChange={(value) => updateRole(role.id, 'department', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              <div className="flex flex-col">
                                <span>{dept.name}</span>
                                {dept.roles && dept.roles.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {dept.roles.length} role{dept.roles.length > 1 ? 's' : ''} available
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">
                            Other (specify below)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {role.department === 'custom' && (
                        <Input
                          placeholder="Enter department name"
                          value=""
                          onChange={(e) => updateRole(role.id, 'department', e.target.value)}
                          className="mt-2"
                        />
                      )}
                      
                      {/* Show available roles for selected department */}
                      {role.department && role.department !== 'custom' && (() => {
                        const selectedDept = departments.find(d => d.name === role.department);
                        return selectedDept?.roles && selectedDept.roles.length > 0 ? (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Available roles in {role.department}:</Label>
                            <div className="flex flex-wrap gap-1">
                              {selectedDept.roles.map((deptRole) => (
                                <Button
                                  key={deptRole}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs border"
                                  onClick={() => updateRole(role.id, 'title', deptRole)}
                                >
                                  {deptRole}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-40 justify-start text-left font-normal whitespace-nowrap"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          {role.date ? format(role.date, "MMM dd, yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={role.date || undefined}
                          onSelect={(date) => updateRole(role.id, 'date', date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {conflicts.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Role Assignment Conflicts</p>
                  <ul className="text-xs text-destructive/80 mt-1 space-y-1">
                    {conflicts.map((conflict, index) => (
                      <li key={index}>• {conflict}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {roles.length === 0 
                ? 'Loading roles...' 
                : isComplete 
                  ? 'All roles assigned' 
                  : `${roles.filter(r => r.name && r.name !== '[To be assigned]').length} of ${roles.length} roles assigned`
              }
            </span>
            <div className="flex items-center gap-2">
              {companyUsers.length > 0 && (
                <span>{companyUsers.length} company users available</span>
              )}
              {hasUnsavedChanges && (
                <span className="text-orange-600">Unsaved changes</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}