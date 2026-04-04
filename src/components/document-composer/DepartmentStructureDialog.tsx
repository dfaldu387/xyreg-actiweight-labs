import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Building, Users, Maximize } from 'lucide-react';
import { CompanyDataUpdateService } from '@/services/companyDataUpdateService';

interface Department {
  id: string;
  name: string;
  roles: string[];
  head?: string;
  responsibilities?: string;
}

interface DepartmentStructureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onRoleSelect?: (role: string, department: string) => void;
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

export function DepartmentStructureDialog({ 
  isOpen, 
  onClose, 
  companyId, 
  onRoleSelect 
}: DepartmentStructureDialogProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && companyId) {
      loadDepartments();
    }
  }, [isOpen, companyId]);

  const loadDepartments = async () => {
    try {
      setIsLoading(true);
      
      // Always start with default departments as fallback
      const defaultDepts = DEFAULT_DEPARTMENTS.map((dept, index) => ({
        id: `dept-${index}`,
        name: dept.name,
        roles: dept.roles,
        head: undefined,
        responsibilities: undefined
      }));
      
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
          setDepartments(defaultDepts);
          setExpandedDepartments(new Set(defaultDepts.slice(0, 3).map(d => d.id)));
        }
      } catch (apiError) {
        setDepartments(defaultDepts);
        setExpandedDepartments(new Set(defaultDepts.slice(0, 3).map(d => d.id)));
      }
    } catch (error) {
      console.error('Error in loadDepartments:', error);
      // Always ensure we have departments even if everything fails
      const defaultDepts = DEFAULT_DEPARTMENTS.map((dept, index) => ({
        id: `dept-${index}`,
        name: dept.name,
        roles: dept.roles,
        head: undefined,
        responsibilities: undefined
      }));
      setDepartments(defaultDepts);
      setExpandedDepartments(new Set(defaultDepts.slice(0, 3).map(d => d.id)));
    } finally {
      setIsLoading(false);
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

  const handleRoleClick = (role: string, departmentName: string) => {
    if (onRoleSelect) {
      onRoleSelect(role, departmentName);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Maximize className="w-5 h-5" />
            Company Department Structure
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">Loading department structure...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((department) => {
                const isExpanded = expandedDepartments.has(department.id);
                
                return (
                  <Card key={department.id} className="h-fit">
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleDepartment(department.id)}
                    >
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" />
                          {department.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {department.roles.length} roles
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </CardTitle>
                      {department.head && (
                        <p className="text-sm text-muted-foreground">
                          Head: {department.head}
                        </p>
                      )}
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0">
                        {department.responsibilities && (
                          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              {department.responsibilities}
                            </p>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Roles:
                          </h4>
                          {department.roles.map((role, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-auto p-2 text-left"
                              onClick={() => handleRoleClick(role, department.name)}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <div className="w-2 h-2 bg-primary rounded-full" />
                                <span className="text-sm">{role}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}