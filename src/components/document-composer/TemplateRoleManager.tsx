import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, X, Plus, Users, Building, Settings } from 'lucide-react';
import { CompanyDataUpdateService } from '@/services/companyDataUpdateService';
import { UserSelector } from '@/components/common/UserSelector';
import { toast } from 'sonner';
import { TemplateRoleReplacementService } from '@/services/TemplateRoleReplacementService';

interface TemplateRole {
  id: string;
  templateSuggestion: string;
  selectedRole?: string;
  assignedPersonId?: string;
  assignedPersonName?: string;
  status: 'pending' | 'accepted' | 'modified' | 'added';
  department?: string;
}

interface TemplateRoleManagerProps {
  companyId: string;
  templateContent: string;
  onRolesUpdated: (roles: TemplateRole[]) => void;
  className?: string;
}

export function TemplateRoleManager({
  companyId,
  templateContent,
  onRolesUpdated,
  className = ""
}: TemplateRoleManagerProps) {
  const [templateRoles, setTemplateRoles] = useState<TemplateRole[]>([]);
  const [companyRoles, setCompanyRoles] = useState<string[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDepartment, setNewRoleDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Extract template-suggested roles from content
  useEffect(() => {
    if (templateContent) {
      extractTemplateRoles();
    }
  }, [templateContent]);

  // Load company data
  useEffect(() => {
    if (companyId) {
      loadCompanyData();
    }
  }, [companyId]);

  const extractTemplateRoles = () => {
    // Use the dedicated service to extract template roles
    const foundRoles = TemplateRoleReplacementService.extractTemplateRoles(templateContent);

    // Convert to TemplateRole objects
    const roles: TemplateRole[] = foundRoles.map((role, index) => ({
      id: `template-role-${index}`,
      templateSuggestion: role.role,
      status: 'pending'
    }));

    setTemplateRoles(roles);
    setIsLoading(false);
  };

  const loadCompanyData = async () => {
    try {
      const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);
      
      // Extract roles from departments
      if (orgData.departments && Array.isArray(orgData.departments)) {
        const roles = orgData.departments.flatMap((dept: any) => 
          (dept.roles || []) as string[]
        );
        setCompanyRoles([...new Set(roles)] as string[]);
        setDepartments(orgData.departments);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const handleAcceptTemplateRole = (roleId: string) => {
    setTemplateRoles(prev => prev.map(role => 
      role.id === roleId 
        ? { ...role, selectedRole: role.templateSuggestion, status: 'accepted' as const }
        : role
    ));
    
    // Notify parent of changes
    const updatedRoles = templateRoles.map(role => 
      role.id === roleId 
        ? { ...role, selectedRole: role.templateSuggestion, status: 'accepted' as const }
        : role
    );
    onRolesUpdated(updatedRoles);
  };

  const handleSelectDifferentRole = (roleId: string, selectedRole: string) => {
    setTemplateRoles(prev => prev.map(role => 
      role.id === roleId 
        ? { ...role, selectedRole, status: 'modified' as const }
        : role
    ));

    // Notify parent of changes
    const updatedRoles = templateRoles.map(role => 
      role.id === roleId 
        ? { ...role, selectedRole, status: 'modified' as const }
        : role
    );
    onRolesUpdated(updatedRoles);
  };

  const handleAssignPerson = (roleId: string, personId: string, personName: string) => {
    setTemplateRoles(prev => prev.map(role => 
      role.id === roleId 
        ? { ...role, assignedPersonId: personId, assignedPersonName: personName }
        : role
    ));

    // Notify parent of changes
    const updatedRoles = templateRoles.map(role => 
      role.id === roleId 
        ? { ...role, assignedPersonId: personId, assignedPersonName: personName }
        : role
    );
    onRolesUpdated(updatedRoles);
  };

  const handleAddNewRole = async () => {
    if (!newRoleName.trim() || !newRoleDepartment) return;

    setIsLoading(true);
    try {
      // Get current organizational data
      const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);
      
      // Update departments with new role
      let updatedDepartments = orgData.departments || [];
      const deptIndex = updatedDepartments.findIndex(dept => dept.name === newRoleDepartment);
      
      if (deptIndex >= 0) {
        if (!updatedDepartments[deptIndex].roles) updatedDepartments[deptIndex].roles = [];
        updatedDepartments[deptIndex].roles.push(newRoleName.trim());
      } else {
        // Create new department
        updatedDepartments.push({
          name: newRoleDepartment,
          roles: [newRoleName.trim()],
          head: '',
          responsibilities: []
        });
      }

      // Save to company settings
      await CompanyDataUpdateService.saveCompanyData(companyId, {
        type: 'department_structure',
        data: updatedDepartments
      });

      // Update local state
      setCompanyRoles(prev => [...prev, newRoleName.trim()]);
      setDepartments(updatedDepartments);

      // Add to template roles as a new role
      const newTemplateRole: TemplateRole = {
        id: `custom-role-${Date.now()}`,
        templateSuggestion: `Custom: ${newRoleName.trim()}`,
        selectedRole: newRoleName.trim(),
        status: 'added',
        department: newRoleDepartment
      };

      setTemplateRoles(prev => [...prev, newTemplateRole]);
      onRolesUpdated([...templateRoles, newTemplateRole]);

      // Reset form
      setNewRoleName('');
      setNewRoleDepartment('');
      setIsAddRoleDialogOpen(false);
      
      toast.success('New role added successfully');
    } catch (error) {
      console.error('Error adding new role:', error);
      toast.error('Failed to add new role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRole = (roleId: string) => {
    setTemplateRoles(prev => prev.filter(role => role.id !== roleId));
    const updatedRoles = templateRoles.filter(role => role.id !== roleId);
    onRolesUpdated(updatedRoles);
  };

  const openCompanySettings = () => {
    const currentUrl = new URL(window.location.href);
    const companyName = currentUrl.pathname.split('/')[3];
    window.open(`/app/company/${companyName}/settings?tab=general`, '_blank');
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-sm text-muted-foreground">Analyzing template roles...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4 text-primary" />
          Template Roles & Assignments
          <Badge variant="secondary" className="ml-auto">
            {templateRoles.length} roles
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {templateRoles.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm font-medium">No roles detected in template</div>
            <div className="text-xs text-muted-foreground">The template doesn't contain role placeholders</div>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {templateRoles.map((role) => (
              <AccordionItem key={role.id} value={role.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      {role.status === 'accepted' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {role.status === 'modified' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                      {role.status === 'added' && <Plus className="w-4 h-4 text-purple-600" />}
                      {role.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{role.templateSuggestion}</div>
                      {role.selectedRole && role.selectedRole !== role.templateSuggestion && (
                        <div className="text-xs text-muted-foreground">→ {role.selectedRole}</div>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      {role.status === 'accepted' && (
                        <Badge variant="default" className="text-xs">Template Role</Badge>
                      )}
                      {role.status === 'modified' && (
                        <Badge variant="secondary" className="text-xs">Company Role</Badge>
                      )}
                      {role.status === 'added' && (
                        <Badge variant="outline" className="text-xs">Custom Role</Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Template Suggestion */}
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <Label className="text-sm font-semibold text-primary mb-2 block">
                        Template Suggests: "{role.templateSuggestion}"
                      </Label>
                      {role.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptTemplateRole(role.id)}
                            className="text-xs"
                          >
                            ✓ Keep This Role
                          </Button>
                          <div className="text-xs text-muted-foreground self-center">
                            or choose different below
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Alternative Role Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Choose Different Role:</Label>
                      <Select 
                        value={role.selectedRole && role.selectedRole !== role.templateSuggestion ? role.selectedRole : ""} 
                        onValueChange={(value) => handleSelectDifferentRole(role.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select from company roles..." />
                        </SelectTrigger>
                        <SelectContent>
                          {companyRoles.length > 0 ? (
                            companyRoles.map((companyRole, index) => (
                              <SelectItem key={index} value={companyRole}>
                                <div className="flex items-center gap-2">
                                  <Building className="w-3 h-3" />
                                  <span>{companyRole}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1 text-xs text-muted-foreground">
                              No company roles defined yet
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Person Assignment */}
                    {role.selectedRole && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Assign Person to Role:</Label>
                          <UserSelector
                            companyId={companyId}
                            value={role.assignedPersonId || ''}
                            onValueChange={(personId) => {
                              // Get person details from the user selector component
                              // For now, just use the personId as name - this can be enhanced
                              handleAssignPerson(role.id, personId, personId);
                            }}
                            placeholder="Select person for this role..."
                            allowClear
                          />
                          {role.assignedPersonName && (
                            <div className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Assigned to: {role.assignedPersonName}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveRole(role.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                      
                      <div className="text-xs text-muted-foreground self-center">
                        Status: {role.status === 'pending' ? 'Needs action' : 
                                 role.status === 'accepted' ? 'Using template role' :
                                 role.status === 'modified' ? 'Using company role' : 'Custom role added'}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <Separator />

        {/* Add New Role */}
        <div className="flex gap-2">
          <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input
                    id="role-name"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g., Senior Quality Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-department">Department</Label>
                  <Select value={newRoleDepartment} onValueChange={setNewRoleDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept, index) => (
                        <SelectItem key={index} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                      <SelectItem value="Research & Development">Research & Development</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Regulatory Affairs">Regulatory Affairs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={openCompanySettings}>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage in Settings
                  </Button>
                  <Button 
                    onClick={handleAddNewRole} 
                    disabled={isLoading || !newRoleName.trim() || !newRoleDepartment}
                  >
                    {isLoading ? 'Adding...' : 'Add Role'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={openCompanySettings}>
            <Settings className="w-4 h-4 mr-2" />
            Manage Roles
          </Button>
        </div>

        {/* Summary */}
        {templateRoles.length > 0 && (
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <div className="font-medium mb-1">Summary:</div>
            <div>✓ {templateRoles.filter(r => r.status !== 'pending').length} roles configured</div>
            <div>👥 {templateRoles.filter(r => r.assignedPersonName).length} people assigned</div>
            {templateRoles.filter(r => r.status === 'pending').length > 0 && (
              <div>⚠️ {templateRoles.filter(r => r.status === 'pending').length} roles need attention</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}