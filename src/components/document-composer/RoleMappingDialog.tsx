import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ArrowRight, Users, Building, Target, Plus, X } from 'lucide-react';
import { TemplateRoleReplacementService, ExtractedTemplateRole } from '@/services/TemplateRoleReplacementService';
import { CompanyDataUpdateService } from '@/services/companyDataUpdateService';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
  roles: string[];
  head?: string;
  responsibilities?: string;
}

interface RoleMapping {
  templateRole: string;
  companyRole: string;
  department: string;
}

interface RoleMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  templateContent: string;
  onMappingComplete: (mappings: RoleMapping[]) => void;
}

const DEFAULT_DEPARTMENTS = [
  { name: 'Quality Assurance', roles: ['Quality Manager', 'QA Specialist', 'Quality Engineer'] },
  { name: 'Research & Development', roles: ['R&D Director', 'Lead Engineer', 'Design Engineer'] },
  { name: 'Regulatory Affairs', roles: ['Regulatory Manager', 'Regulatory Specialist', 'Compliance Officer'] },
  { name: 'Manufacturing', roles: ['Manufacturing Manager', 'Production Supervisor', 'Process Engineer'] },
  { name: 'Clinical Affairs', roles: ['Clinical Manager', 'Clinical Specialist', 'CRA'] },
  { name: 'Post-Market Surveillance', roles: ['PMS Manager', 'Safety Officer', 'Vigilance Specialist'] },
  { name: 'Risk Management', roles: ['Risk Manager', 'Risk Analyst', 'Safety Engineer'] }
];

export function RoleMappingDialog({
  isOpen,
  onClose,
  companyId,
  templateContent,
  onMappingComplete
}: RoleMappingDialogProps) {
  const [templateRoles, setTemplateRoles] = useState<ExtractedTemplateRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedTemplateRole, setSelectedTemplateRole] = useState<string>('');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [mappings, setMappings] = useState<RoleMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingRoleForDept, setAddingRoleForDept] = useState<string>('');
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    if (isOpen) {
      initializeData();
    }
  }, [isOpen, templateContent, companyId]);

  const initializeData = async () => {
    setIsLoading(true);
    
    // Extract template roles
    const extractedRoles = TemplateRoleReplacementService.extractTemplateRoles(templateContent);
    setTemplateRoles(extractedRoles);
    
    // Load company departments
    await loadCompanyDepartments();
    
    setIsLoading(false);
  };

  const loadCompanyDepartments = async () => {
    try {
      const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);
      
      if (orgData.departments && Array.isArray(orgData.departments) && orgData.departments.length > 0) {
        const companyDepts = orgData.departments.map((dept: any) => ({
          id: dept.id || dept.name,
          name: dept.name,
          roles: dept.roles || [],
          head: dept.departmentHead,
          responsibilities: dept.keyResponsibilities
        }));
        setDepartments(companyDepts);
        setExpandedDepartments(new Set(companyDepts.slice(0, 3).map(d => d.id)));
      } else {
        // Use default departments
        const defaultDepts = DEFAULT_DEPARTMENTS.map((dept, index) => ({
          id: `dept-${index}`,
          name: dept.name,
          roles: dept.roles,
          head: undefined,
          responsibilities: undefined
        }));
        setDepartments(defaultDepts);
        setExpandedDepartments(new Set(defaultDepts.slice(0, 3).map(d => d.id)));
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      // Fallback to default departments
      const defaultDepts = DEFAULT_DEPARTMENTS.map((dept, index) => ({
        id: `dept-${index}`,
        name: dept.name,
        roles: dept.roles,
        head: undefined,
        responsibilities: undefined
      }));
      setDepartments(defaultDepts);
      setExpandedDepartments(new Set(defaultDepts.slice(0, 3).map(d => d.id)));
    }
  };

  const toggleDepartment = (departmentId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  const handleRoleMapping = (companyRole: string, department: string) => {
    if (!selectedTemplateRole) {
      toast.error('Please select a template role first');
      return;
    }

    const newMapping: RoleMapping = {
      templateRole: selectedTemplateRole,
      companyRole,
      department
    };

    // Remove any existing mapping for this template role
    const updatedMappings = mappings.filter(m => m.templateRole !== selectedTemplateRole);
    updatedMappings.push(newMapping);
    
    setMappings(updatedMappings);
    
    // Clear selection to encourage next mapping
    setSelectedTemplateRole('');
    
    toast.success(`Mapped "${selectedTemplateRole}" to "${companyRole}" in ${department}`);
  };

  const removeMapping = (templateRole: string) => {
    setMappings(prev => prev.filter(m => m.templateRole !== templateRole));
    toast.info('Mapping removed');
  };

  const handleComplete = async () => {
    // For now, just pass mappings to parent - we can enhance with persistence later
    onMappingComplete(mappings);
    onClose();
    toast.success(`${mappings.length} role mappings completed and will be applied to the document`);
  };

  const isMapped = (templateRole: string) => {
    return mappings.some(m => m.templateRole === templateRole);
  };

  const getMappingForRole = (templateRole: string) => {
    return mappings.find(m => m.templateRole === templateRole);
  };

  const handleAddRole = (departmentId: string, departmentName: string) => {
    if (!newRoleName.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    // Add the new role to the department
    const updatedDepartments = departments.map(dept => 
      dept.id === departmentId 
        ? { ...dept, roles: [...dept.roles, newRoleName.trim()] }
        : dept
    );
    setDepartments(updatedDepartments);
    
    // If there's a selected template role, automatically map it to the new role
    if (selectedTemplateRole) {
      handleRoleMapping(newRoleName.trim(), departmentName);
    }
    
    // Clear the add role state
    setAddingRoleForDept('');
    setNewRoleName('');
    
    toast.success(`Added "${newRoleName.trim()}" to ${departmentName}`);
  };

  const cancelAddRole = () => {
    setAddingRoleForDept('');
    setNewRoleName('');
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[85vh]">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-lg font-medium">Loading role mapping...</div>
              <div className="text-sm text-muted-foreground mt-2">
                Extracting template roles and loading company structure
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Fill Document Roles
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Click on a template role, then select the company person/role to assign to it
          </p>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-5 gap-6 overflow-hidden">
          {/* Template Roles Panel */}
          <div className="col-span-2 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Template Roles ({templateRoles.length})</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              <RadioGroup value={selectedTemplateRole} onValueChange={setSelectedTemplateRole}>
                {templateRoles.map((role, index) => {
                  const mapping = getMappingForRole(role.role);
                  const mapped = isMapped(role.role);
                  
                  return (
                    <div key={index} className={`p-3 border rounded-lg ${mapped ? 'bg-green-50 border-green-200' : selectedTemplateRole === role.role ? 'bg-primary/5 border-primary' : ''}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={role.role} id={`role-${index}`} disabled={mapped} />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`role-${index}`} className="text-sm font-medium cursor-pointer">
                            {role.role}
                          </Label>
                          {role.section && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Section: {role.section}
                            </div>
                          )}
                          {mapped && mapping && (
                            <div className="flex items-center gap-1 mt-2">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-700">
                                → {mapping.companyRole} ({mapping.department})
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMapping(role.role)}
                                className="ml-auto h-6 px-2 text-xs"
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </div>

          <Separator orientation="vertical" className="col-span-0" />

          {/* Company Structure Panel */}
          <div className="col-span-3 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                <h3 className="font-medium">Company Structure</h3>
              </div>
              {selectedTemplateRole && (
                <Badge variant="outline" className="text-xs">
                  Select role for: {selectedTemplateRole}
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {departments.map((department) => {
                  const isExpanded = expandedDepartments.has(department.id);
                  
                  return (
                    <Card key={department.id} className="h-fit">
                      <CardHeader 
                        className="cursor-pointer hover:bg-muted/50 transition-colors pb-3"
                        onClick={() => toggleDepartment(department.id)}
                      >
                        <CardTitle className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Building className="w-3 h-3 text-primary" />
                            {department.name}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {department.roles.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="pt-0 space-y-1">
                          {department.roles.map((role, roleIndex) => (
                            <Button
                              key={roleIndex}
                              variant="ghost"
                              size="sm"
                              className={`w-full justify-start h-auto p-2 text-left ${
                                !selectedTemplateRole ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              onClick={() => handleRoleMapping(role, department.name)}
                              disabled={!selectedTemplateRole}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <Users className="w-3 h-3" />
                                <span className="text-xs">{role}</span>
                                {selectedTemplateRole && (
                                  <ArrowRight className="w-3 h-3 ml-auto text-primary" />
                                )}
                              </div>
                            </Button>
                          ))}
                          
                          {/* Add Role Section */}
                          {addingRoleForDept === department.id ? (
                            <div className="flex items-center gap-2 p-2 border border-dashed border-primary rounded">
                              <Users className="w-3 h-3 text-primary" />
                              <Input
                                placeholder="Enter role name..."
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                className="h-6 text-xs flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddRole(department.id, department.name);
                                  } else if (e.key === 'Escape') {
                                    cancelAddRole();
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddRole(department.id, department.name)}
                                className="h-6 px-2"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelAddRole}
                                className="h-6 px-2"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start h-auto p-3 text-left border-2 border-dashed border-primary/60 hover:border-primary hover:bg-primary/5 mt-2"
                              onClick={() => setAddingRoleForDept(department.id)}
                            >
                              <div className="flex items-center gap-2 w-full text-primary font-medium">
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Add New Role</span>
                              </div>
                            </Button>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {mappings.length} of {templateRoles.length} roles mapped
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={mappings.length === 0}
            >
              Save Mappings ({mappings.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}