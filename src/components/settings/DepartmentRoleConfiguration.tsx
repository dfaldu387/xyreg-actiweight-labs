import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from '@/hooks/useTranslation';

interface Department {
  id: string;
  name: string;
  departmentHead?: string;
  keyResponsibilities: string;
  position: number;
  roles?: string[];
  isEnabled: boolean;
  customRoles: string[];
  disabledRoles?: string[]; // New field to track which roles are disabled
  // Existing visualization fields
  x?: number;
  y?: number;
  color?: string;
  width?: number;
  height?: number;
}

interface DepartmentRoleConfigurationProps {
  companyId: string;
}

const DEFAULT_DEPARTMENTS: Partial<Department>[] = [
  {
    name: 'Quality Assurance',
    roles: [
      'QA Director', 'QA Manager', 'Senior QA Manager', 'QA Team Lead',
      'Quality Engineer', 'Senior Quality Engineer', 'Quality Systems Engineer',
      'Validation Engineer', 'Senior Validation Engineer', 'Validation Specialist',
      'QA Analyst', 'Quality Analyst', 'Quality Coordinator',
      'Compliance Officer', 'Quality Compliance Manager', 'Regulatory Compliance Officer',
      'Audit Manager', 'Internal Auditor', 'Quality Auditor', 'Audit Specialist',
      'Quality Inspector', 'Quality Control Technician', 'QC Analyst',
      'Document Control Specialist', 'Change Control Coordinator'
    ],
    isEnabled: true,
    customRoles: [],
    keyResponsibilities: 'Quality management and compliance'
  },
  {
    name: 'Regulatory Affairs',
    roles: [
      'Head of Regulatory', 'Regulatory Director', 'Regulatory Manager', 'Senior Regulatory Manager',
      'Regulatory Specialist', 'Senior Regulatory Specialist', 'Regulatory Associate',
      'Compliance Manager', 'Compliance Officer', 'Regulatory Compliance Specialist',
      'Regulatory Consultant', 'External Regulatory Consultant',
      'Clinical Affairs Manager', 'Clinical Regulatory Manager', 'Clinical Affairs Specialist',
      'Market Access Manager', 'Market Access Specialist', 'Reimbursement Specialist',
      'Regulatory Writer', 'Regulatory Documentation Specialist', 'Submission Manager',
      'Notified Body Liaison', 'FDA Liaison', 'International Regulatory Manager',
      'RA Manager', 'RA Specialist', 'Submissions Lead', 'Head of Regulatory',
      'Senior Regulatory Specialist', 'Regulatory Associate', 'Compliance Manager',
      'Compliance Manager'
    ],
    isEnabled: true,
    customRoles: [],
    keyResponsibilities: 'Regulatory submissions and compliance'
  },
  {
    name: 'Research & Development',
    roles: [
      'Head of R&D', 'R&D Director', 'R&D Manager', 'Senior R&D Manager',
      'Product Manager', 'Senior Product Manager', 'Product Owner',
      'Design Engineer', 'Senior Design Engineer', 'Lead Design Engineer', 'Principal Engineer',
      'Research Scientist', 'Senior Research Scientist', 'Research Associate',
      'Clinical Research Associate', 'Clinical Research Coordinator', 'Clinical Scientist',
      'Biomedical Engineer', 'Senior Biomedical Engineer', 'Medical Device Engineer',
      'Software Engineer', 'Senior Software Engineer', 'Firmware Engineer', 'Embedded Systems Engineer',
      'Innovation Manager', 'Technology Transfer Specialist', 'Project Engineer', 'Development Engineer'
    ],
    isEnabled: true,
    customRoles: [],
    keyResponsibilities: 'Product research and development'
  },
  {
    name: 'Clinical Affairs',
    roles: [
      'Clinical Director', 'Clinical Manager', 'Senior Clinical Manager',
      'Clinical Research Manager', 'Clinical Operations Manager',
      'Clinical Research Associate', 'Senior CRA', 'Clinical Research Coordinator',
      'Clinical Data Manager', 'Clinical Data Analyst', 'Clinical Database Manager',
      'Medical Affairs Manager', 'Medical Affairs Director', 'Medical Science Liaison',
      'Clinical Specialist', 'Clinical Application Specialist', 'Clinical Training Manager',
      'Principal Investigator', 'Clinical Monitor', 'Clinical Quality Assurance Manager'
    ],
    isEnabled: true,
    customRoles: [],
    keyResponsibilities: 'Clinical trials and data management'
  },
  {
    name: 'Manufacturing',
    roles: [
      'Manufacturing Director', 'Manufacturing Manager', 'Senior Manufacturing Manager',
      'Production Manager', 'Production Supervisor', 'Production Lead',
      'Process Engineer', 'Senior Process Engineer', 'Manufacturing Engineer',
      'Production Engineer', 'Operations Engineer', 'Industrial Engineer',
      'Manufacturing Technician', 'Production Technician', 'Assembly Technician',
      'Operations Manager', 'Plant Manager', 'Facility Manager',
      'Supply Chain Manager', 'Materials Manager', 'Inventory Manager',
      'Continuous Improvement Manager', 'Lean Manufacturing Specialist'
    ],
    isEnabled: true,
    customRoles: [],
    keyResponsibilities: 'Production and manufacturing operations'
  },
  {
    name: 'Engineering',
    roles: [
      'Engineering Director', 'Engineering Manager', 'Senior Engineering Manager',
      'Design Engineer', 'Senior Design Engineer', 'Lead Design Engineer',
      'Test Engineer', 'Senior Test Engineer', 'Validation Engineer',
      'Systems Engineer', 'Hardware Engineer', 'Software Engineer',
      'Mechanical Engineer', 'Electrical Engineer', 'Electronics Engineer',
      'CAD Engineer', 'CAD Designer', 'Product Development Engineer'
    ],
    isEnabled: true,
    customRoles: [],
    keyResponsibilities: 'Product design and engineering'
  },
  {
    name: 'Post-Market Surveillance',
    roles: [
      'PMS Director', 'PMS Manager', 'Post-Market Surveillance Manager',
      'Vigilance Manager', 'Safety Manager', 'Product Safety Manager',
      'Vigilance Officer', 'Safety Officer', 'Pharmacovigilance Specialist',
      'Complaint Manager', 'Complaint Handler', 'Customer Complaint Specialist',
      'Risk Manager', 'Risk Assessment Specialist', 'Risk Management Coordinator',
      'Surveillance Analyst', 'Safety Data Analyst', 'Market Surveillance Specialist',
      'Field Safety Corrective Action Manager', 'FSCA Coordinator'
    ],
    isEnabled: true,
    customRoles: [],
    keyResponsibilities: 'Post-market monitoring and reporting'
  },
  {
    name: 'Risk Management',
    roles: [
      'Risk Manager', 'Risk Director', 'Senior Risk Manager',
      'Risk Analyst', 'Risk Assessment Specialist', 'Risk Management Coordinator',
      'Compliance Risk Manager', 'Enterprise Risk Manager'
    ],
    isEnabled: true,
    customRoles: [],
    keyResponsibilities: 'Risk assessment and mitigation'
  }
];

export function DepartmentRoleConfiguration({ companyId }: DepartmentRoleConfigurationProps) {
  const { lang } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, [companyId]);

  const loadDepartments = async () => {
    try {
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('department_structure')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      let departmentStructure = companyData?.department_structure as any[];
      
      // ALWAYS merge with defaults to ensure all 8 default departments exist
      // Create a map of existing departments by name
      const existingDepts = new Map(
        (departmentStructure || []).map(d => [d.name, d])
      );
      
      // Merge with defaults - ALL default departments should be present
      const mergedDepartments = DEFAULT_DEPARTMENTS.map((defaultDept, index) => {
        const existing = existingDepts.get(defaultDept.name!);
        
        if (existing) {
          // MERGE: Combine existing roles with new default roles (remove duplicates)
          const existingRoles = existing.roles || [];
          const defaultRoles = defaultDept.roles || [];
          const combinedRoles = Array.from(new Set([...existingRoles, ...defaultRoles]));
          
          return {
            ...existing,
            roles: combinedRoles,
            isEnabled: existing.isEnabled !== undefined ? existing.isEnabled : true,
            customRoles: existing.customRoles || [],
            keyResponsibilities: existing.keyResponsibilities || defaultDept.keyResponsibilities,
            disabledRoles: existing.disabledRoles || []
          };
        } else {
          // Add new department from defaults as DISABLED by default
          return {
            id: `dept-${defaultDept.name}-${Date.now()}-${index}`,
            name: defaultDept.name,
            keyResponsibilities: defaultDept.keyResponsibilities || '',
            position: index,
            roles: defaultDept.roles || [],
            isEnabled: false, // New departments start disabled
            customRoles: [],
            disabledRoles: []
          };
        }
      });
      
      // Add any existing custom departments not in defaults
      (departmentStructure || []).forEach((dept: any) => {
        if (!DEFAULT_DEPARTMENTS.find(d => d.name === dept.name)) {
          mergedDepartments.push({
            ...dept,
            isEnabled: dept.isEnabled !== undefined ? dept.isEnabled : true,
            customRoles: dept.customRoles || [],
            roles: dept.roles || [],
            disabledRoles: dept.disabledRoles || []
          });
        }
      });
      
      departmentStructure = mergedDepartments;
      
      // Save the enriched structure back to database if anything was added
      if (mergedDepartments.length !== (companyData?.department_structure as any[] || []).length) {
        await saveDepartments(departmentStructure as Department[]);
      }

      setDepartments(departmentStructure as Department[]);
      
      // Select first department by default
      if (departmentStructure.length > 0 && !selectedDepartmentId) {
        setSelectedDepartmentId(departmentStructure[0].id);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error(lang('settings.departments.loadError'));
    }
  };

  const saveDepartments = async (updatedDepartments: Department[]) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ department_structure: updatedDepartments })
        .eq('id', companyId);

      if (error) throw error;

      setDepartments(updatedDepartments);
      toast.success(lang('settings.departments.updateSuccess'));
    } catch (error) {
      console.error('Error saving departments:', error);
      toast.error(lang('settings.departments.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDepartment = (id: string) => {
    const updated = departments.map(dept =>
      dept.id === id ? { ...dept, isEnabled: !dept.isEnabled } : dept
    );
    saveDepartments(updated);
  };

  const moveDepartment = (id: string, direction: 'up' | 'down') => {
    const index = departments.findIndex(d => d.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === departments.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...departments];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    // Update positions
    updated.forEach((dept, i) => {
      dept.position = i;
    });

    saveDepartments(updated);
  };

  const addDepartment = () => {
    if (!newDepartmentName.trim()) {
      toast.error(lang('settings.departments.enterDepartmentName'));
      return;
    }

    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: newDepartmentName.trim(),
      keyResponsibilities: '',
      position: departments.length,
      roles: [],
      isEnabled: true,
      customRoles: []
    };

    const updated = [...departments, newDept];
    saveDepartments(updated);
    setNewDepartmentName('');
    setSelectedDepartmentId(newDept.id);
  };

  const deleteDepartment = (id: string) => {
    if (departments.length === 1) {
      toast.error(lang('settings.departments.cannotDeleteLast'));
      return;
    }

    const updated = departments.filter(d => d.id !== id);
    // Update positions
    updated.forEach((dept, i) => {
      dept.position = i;
    });
    
    saveDepartments(updated);
    
    if (selectedDepartmentId === id) {
      setSelectedDepartmentId(updated[0]?.id || null);
    }
  };

  const addRole = () => {
    if (!selectedDepartmentId || !newRoleName.trim()) {
      toast.error(lang('settings.departments.enterRoleName'));
      return;
    }

    const updated = departments.map(dept => {
      if (dept.id === selectedDepartmentId) {
        const allRoles = [...(dept.roles || []), ...(dept.customRoles || [])];
        if (allRoles.includes(newRoleName.trim())) {
          toast.error(lang('settings.departments.roleExists'));
          return dept;
        }
        return {
          ...dept,
          customRoles: [...dept.customRoles, newRoleName.trim()]
        };
      }
      return dept;
    });

    saveDepartments(updated);
    setNewRoleName('');
  };

  const deleteRole = (role: string, isCustom: boolean) => {
    if (!selectedDepartmentId) return;

    const updated = departments.map(dept => {
      if (dept.id === selectedDepartmentId) {
        if (isCustom) {
          return {
            ...dept,
            customRoles: dept.customRoles.filter(r => r !== role)
          };
        } else {
          // Don't allow deleting default roles, just warn
          toast.info(lang('settings.departments.cannotDeleteDefaultRole'));
          return dept;
        }
      }
      return dept;
    });

    saveDepartments(updated);
  };

  const toggleRole = (role: string) => {
    if (!selectedDepartmentId) return;

    const updated = departments.map(dept => {
      if (dept.id === selectedDepartmentId) {
        const disabledRoles = dept.disabledRoles || [];
        const isCurrentlyDisabled = disabledRoles.includes(role);
        
        return {
          ...dept,
          disabledRoles: isCurrentlyDisabled
            ? disabledRoles.filter(r => r !== role)
            : [...disabledRoles, role]
        };
      }
      return dept;
    });

    saveDepartments(updated);
  };

  const selectedDepartment = departments.find(d => d.id === selectedDepartmentId);
  const allRoles = selectedDepartment
    ? [...(selectedDepartment.roles || []), ...(selectedDepartment.customRoles || [])]
    : [];
  const enabledRolesCount = selectedDepartment
    ? allRoles.filter(role => !(selectedDepartment.disabledRoles || []).includes(role)).length
    : 0;

  const enabledCount = departments.filter(d => d.isEnabled).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Panel - Department List */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{lang('settings.departments.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {lang('settings.departments.enabledCount', { enabled: enabledCount, total: departments.length })}
                </p>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {departments.map((dept, index) => (
                  <div
                    key={dept.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      selectedDepartmentId === dept.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    } ${!dept.isEnabled ? 'opacity-50' : ''}`}
                    onClick={() => setSelectedDepartmentId(dept.id)}
                  >
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveDepartment(dept.id, 'up');
                        }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveDepartment(dept.id, 'down');
                        }}
                        disabled={index === departments.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <Switch
                      checked={dept.isEnabled}
                      onCheckedChange={() => toggleDepartment(dept.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{dept.name}</p>
                      <Badge variant="secondary" className="mt-1">
                        {lang('settings.departments.rolesCount', { count: (dept.roles || []).length + (dept.customRoles || []).length - (dept.disabledRoles || []).length })}
                      </Badge>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDepartment(dept.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder={lang('settings.departments.newDepartmentPlaceholder')}
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
              />
              <Button onClick={addDepartment} disabled={isSaving}>
                <Plus className="h-4 w-4 mr-2" />
                {lang('common.add')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Role Management */}
      <Card>
        <CardContent className="p-4">
          {selectedDepartment ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedDepartment.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {lang('settings.departments.manageRoles')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{lang('settings.departments.roles')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {lang('settings.departments.rolesEnabledCount', { enabled: enabledRolesCount, total: allRoles.length })}
                  </p>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {/* Default Roles */}
                    {selectedDepartment.roles && selectedDepartment.roles.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground font-medium mt-2">
                          {lang('settings.departments.defaultRoles')}
                        </p>
                        {selectedDepartment.roles.map((role) => {
                          const isDisabled = (selectedDepartment.disabledRoles || []).includes(role);
                          return (
                            <div
                              key={role}
                              className={`flex items-center justify-between gap-2 p-2 rounded-md border ${
                                isDisabled ? 'opacity-50 bg-muted/20' : 'bg-muted/30'
                              }`}
                            >
                              <Switch
                                checked={!isDisabled}
                                onCheckedChange={() => toggleRole(role)}
                              />
                              <span className="text-sm flex-1">{role}</span>
                              <Badge variant="outline" className="text-xs">
                                {lang('settings.departments.default')}
                              </Badge>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* Custom Roles */}
                    {selectedDepartment.customRoles && selectedDepartment.customRoles.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground font-medium mt-4">
                          {lang('settings.departments.customRoles')}
                        </p>
                        {selectedDepartment.customRoles.map((role) => {
                          const isDisabled = (selectedDepartment.disabledRoles || []).includes(role);
                          return (
                            <div
                              key={role}
                              className={`flex items-center justify-between gap-2 p-2 rounded-md border ${
                                isDisabled ? 'opacity-50' : ''
                              }`}
                            >
                              <Switch
                                checked={!isDisabled}
                                onCheckedChange={() => toggleRole(role)}
                              />
                              <span className="text-sm flex-1">{role}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteRole(role, true)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {allRoles.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {lang('settings.departments.noRoles')}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label>{lang('settings.departments.addNewRole')}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={lang('settings.departments.rolePlaceholder')}
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRole()}
                  />
                  <Button onClick={addRole} disabled={isSaving}>
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('common.add')}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {lang('settings.departments.tip')}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <p>{lang('settings.departments.selectDepartment')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
