import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DepartmentEmployeeAvatars } from "./DepartmentEmployeeAvatars";
import { Building2 } from "lucide-react";

interface Department {
  name: string;
  isEnabled: boolean;
  keyResponsibilities: string;
  roles: string[];
}

interface DepartmentEmployee {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string | null;
  fte_percentage: number;
}

interface DepartmentStructureViewProps {
  companyId: string;
}

// Normalize department names for matching (handles "Regulatory Affairs" vs "regulatory_affairs")
const normalizeDepartmentName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export function DepartmentStructureView({ companyId }: DepartmentStructureViewProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employeesByDepartment, setEmployeesByDepartment] = useState<Record<string, DepartmentEmployee[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartmentData();
  }, [companyId]);

  const loadDepartmentData = async () => {
    try {
      setLoading(true);

      // Load department structure from company settings
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('department_structure')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      const departmentStructure = companyData?.department_structure as Department[] || [];

      // Load ALL employee assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_department_assignments')
        .select('user_id, department_name, fte_allocation')
        .eq('company_id', companyId);

      if (assignmentsError) throw assignmentsError;

      // Get unique user IDs from assignments
      const userIds = [...new Set(assignments?.map(a => a.user_id) || [])];
      
      // Fetch user profiles for those user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles for quick lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Create a map of all departments that have employees
      const departmentEmployeeMap = new Map<string, { originalName: string; totalFTE: number; employees: any[] }>();
      
      assignments?.forEach((a: any) => {
        const profile = profilesMap.get(a.user_id);
        if (!profile) return;

        const normalized = normalizeDepartmentName(a.department_name);
        const existing = departmentEmployeeMap.get(normalized);
        const ftePercentage = (a.fte_allocation || 0) * 100; // Convert to percentage
        
        if (existing) {
          existing.totalFTE += ftePercentage;
          existing.employees.push({
            ...profile,
            fte_percentage: ftePercentage
          });
        } else {
          departmentEmployeeMap.set(normalized, {
            originalName: a.department_name,
            totalFTE: ftePercentage,
            employees: [{
              ...profile,
              fte_percentage: ftePercentage
            }]
          });
        }
      });

      // Build final department list - prioritize departments with employees
      const finalDepartments: Department[] = [];
      const groupedEmployees: { [key: string]: any[] } = {};
      
      // First, add all departments that have employees
      departmentEmployeeMap.forEach((data, normalizedName) => {
        // Try to find matching department in structure for metadata
        const structureDept = departmentStructure.find(
          dept => normalizeDepartmentName(dept.name) === normalizedName
        );
        
        const department: Department = structureDept || {
          name: data.originalName,
          isEnabled: true,
          keyResponsibilities: '',
          roles: []
        };
        
        finalDepartments.push(department);
        groupedEmployees[normalizedName] = data.employees;
      });

      // Then add enabled departments from structure that don't have employees yet
      departmentStructure.forEach(dept => {
        const normalized = normalizeDepartmentName(dept.name);
        if (dept.isEnabled && !departmentEmployeeMap.has(normalized)) {
          finalDepartments.push(dept);
        }
      });
      
      setDepartments(finalDepartments);
      setEmployeesByDepartment(groupedEmployees);
    } catch (error) {
      console.error('Error loading department data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (departments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No departments have been enabled yet.</p>
        <p className="text-sm mt-2">Enable departments in Company Settings to see the organizational structure.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map((department) => {
        const normalizedDeptName = normalizeDepartmentName(department.name);
        const deptEmployees = employeesByDepartment[normalizedDeptName] || [];
        const totalFTE = deptEmployees.reduce((sum, emp) => sum + (emp.fte_percentage || 0), 0);
        
        // Map DepartmentEmployee to Employee format for avatar component
        const employees = deptEmployees.map(emp => ({
          id: emp.id,
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email,
          email: emp.email,
          avatar_url: emp.avatar_url,
          fte_allocation: emp.fte_percentage / 100
        }));

        return (
          <Card key={department.name} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{department.name}</span>
                {totalFTE > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {Math.round(totalFTE)}% FTE
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {department.keyResponsibilities && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Key Responsibilities</h4>
                  <p className="text-sm text-foreground/80">{department.keyResponsibilities}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Team Members</h4>
                <DepartmentEmployeeAvatars employees={employees} />
              </div>

              {department.roles && department.roles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    Available Roles ({department.roles.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {department.roles.slice(0, 3).map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground"
                      >
                        {role}
                      </span>
                    ))}
                    {department.roles.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground">
                        +{department.roles.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
