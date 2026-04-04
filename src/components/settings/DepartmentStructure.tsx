import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Plus, Save, Sparkles, Users } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DepartmentCard } from "./DepartmentCard";

interface Department {
  id: string;
  name: string;
  departmentHead?: string;
  departmentHeadName?: string;
  keyResponsibilities: string;
  position: number;
}

interface CompanyUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface DepartmentStructureProps {
  companyId: string;
}

export function DepartmentStructure({ companyId }: DepartmentStructureProps) {
  console.log('[DepartmentStructure] Component rendered with companyId:', companyId);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch company users
      const { data: companyUsers, error: usersError } = await supabase
        .from('user_company_access')
        .select(`
          user_id,
          user_profiles!inner(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('company_id', companyId);

      if (usersError) throw usersError;

      const usersList = companyUsers?.map(u => ({
        id: u.user_profiles.id,
        email: u.user_profiles.email,
        first_name: u.user_profiles.first_name,
        last_name: u.user_profiles.last_name,
      })) || [];

      setUsers(usersList);

      // Fetch existing department structure
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;

      // Check if department_structure exists and parse it safely
      const departmentStructure = (companyData as any)?.department_structure;
      if (departmentStructure && Array.isArray(departmentStructure)) {
        const deps = departmentStructure as Department[];
        // Add user names for department heads
        const depsWithNames = deps.map(dept => {
          const headUser = usersList.find(u => u.id === dept.departmentHead);
          return {
            ...dept,
            departmentHeadName: headUser ? `${headUser.first_name || ''} ${headUser.last_name || ''}`.trim() || headUser.email : undefined
          };
        });
        setDepartments(depsWithNames);
      } else {
        // Initialize with default departments
        setDepartments([
          { id: '1', name: 'Quality Assurance', keyResponsibilities: 'Quality management, regulatory compliance, audits', position: 0 },
          { id: '2', name: 'Research & Development', keyResponsibilities: 'Product development, clinical trials, design controls', position: 1 },
          { id: '3', name: 'Regulatory Affairs', keyResponsibilities: 'Regulatory submissions, market approvals, compliance monitoring', position: 2 },
          { id: '4', name: 'Manufacturing', keyResponsibilities: 'Production, process validation, supply chain management', position: 3 },
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load department structure",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDepartment = () => {
    console.log('[DepartmentStructure] addDepartment called');
    try {
      const newDept: Department = {
        id: Date.now().toString(),
        name: '',
        keyResponsibilities: '',
        position: departments.length
      };
      console.log('[DepartmentStructure] Creating new department:', newDept);
      setDepartments([...departments, newDept]);
      console.log('[DepartmentStructure] Departments updated, new length:', departments.length + 1);
    } catch (error) {
      console.error('Error adding department:', error);
      toast({
        title: "Error",
        description: "Failed to add department",
        variant: "destructive"
      });
    }
  };

  const updateDepartment = (id: string, field: keyof Department, value: string) => {
    setDepartments(departments.map(dept => {
      if (dept.id === id) {
        const updated = { ...dept, [field]: value };
        if (field === 'departmentHead') {
          const headUser = users.find(u => u.id === value);
          updated.departmentHeadName = headUser ? `${headUser.first_name || ''} ${headUser.last_name || ''}`.trim() || headUser.email : undefined;
        }
        return updated;
      }
      return dept;
    }));
  };

  const removeDepartment = (id: string) => {
    setDepartments(departments.filter(dept => dept.id !== id));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedDepts = Array.from(departments);
    const [removed] = reorderedDepts.splice(result.source.index, 1);
    reorderedDepts.splice(result.destination.index, 0, removed);

    // Update positions
    const updatedDepts = reorderedDepts.map((dept, index) => ({
      ...dept,
      position: index
    }));

    setDepartments(updatedDepts);
  };

  const saveDepartmentStructure = async () => {
    try {
      setIsSaving(true);
      
      // Remove UI-only fields before saving
      const cleanDepartments = departments.map(({ departmentHeadName, ...dept }) => dept);
      
      const { error } = await supabase
        .from('companies')
        .update({ department_structure: cleanDepartments } as any)
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Department structure saved successfully"
      });
    } catch (error) {
      console.error('Error saving department structure:', error);
      toast({
        title: "Error",
        description: "Failed to save department structure",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('[DepartmentStructure] Current departments state:', departments);

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Department Structure</h2>
              <p className="text-sm text-muted-foreground font-normal">
                Define your company's organizational structure, department heads, and key responsibilities.
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Click on any department card to expand and edit details
              </span>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={saveDepartmentStructure} 
                disabled={isSaving}
                size="sm"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {departments.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-muted/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Building className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No departments defined yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first department to start organizing your company structure
              </p>
              <Button onClick={addDepartment} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Department
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="departments">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {departments.map((department, index) => (
                      <Draggable key={department.id} draggableId={department.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <DepartmentCard
                              department={department}
                              index={index}
                              users={users}
                              onUpdate={updateDepartment}
                              onDelete={removeDepartment}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {departments.length > 0 && (
            <div className="mt-8 p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {departments.length} department{departments.length !== 1 ? 's' : ''} configured •{' '}
                  {departments.filter(d => d.departmentHead).length} with assigned heads •{' '}
                  {departments.filter(d => d.keyResponsibilities).length} with responsibilities defined
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}