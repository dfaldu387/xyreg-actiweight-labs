import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ValueChainView } from "@/components/settings/ValueChainView";
import { useTranslation } from "@/hooks/useTranslation";

interface Department {
  id: string;
  name: string;
  departmentHead?: string;
  departmentHeadName?: string;
  keyResponsibilities: string;
  position: number;
  color?: string;
  category?: 'support' | 'primary';
}

interface CompanyUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  functional_area?: string;
  avatar_url?: string | null;
}

const normalizeDepartmentName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

interface ReadOnlyValueChainProps {
  companyId: string;
}

export function ReadOnlyValueChain({ companyId }: ReadOnlyValueChainProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employeesByDept, setEmployeesByDept] = useState<Record<string, { employees: CompanyUser[]; totalFTE: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { lang } = useTranslation();

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from('user_department_assignments')
          .select('user_id, department_name, fte_allocation')
          .eq('company_id', companyId);

        if (assignmentsError) throw assignmentsError;

        const userIds = [...new Set(assignments?.map(a => a.user_id) || [])];

        // Fetch profiles and access levels in parallel
        const [profilesResult, accessResult] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('id, email, first_name, last_name, avatar_url')
            .in('id', userIds.length > 0 ? userIds : ['none']),
          supabase
            .from('user_company_access')
            .select('user_id, access_level')
            .eq('company_id', companyId)
            .in('user_id', userIds.length > 0 ? userIds : ['none'])
        ]);

        // Build consultant set
        const consultantUserIds = new Set(
          (accessResult.data || [])
            .filter(a => a.access_level === 'consultant')
            .map(a => a.user_id)
        );

        const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);

        // Group employees by department
        const groupedEmployees: Record<string, { employees: CompanyUser[]; totalFTE: number }> = {};
        assignments?.forEach((a: any) => {
          // Include consultants in their assigned departments
          const profile = profilesMap.get(a.user_id);
          if (!profile) return;

          const normalizedDept = normalizeDepartmentName(a.department_name);
          if (!groupedEmployees[normalizedDept]) {
            groupedEmployees[normalizedDept] = { employees: [], totalFTE: 0 };
          }
          groupedEmployees[normalizedDept].employees.push({
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
          });
          groupedEmployees[normalizedDept].totalFTE += ((a.fte_allocation || 0) * 100);
        });
        setEmployeesByDept(groupedEmployees);

        // Fetch department structure
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('department_structure')
          .eq('id', companyId)
          .single();

        if (companyError) throw companyError;

        const departmentStructure = (companyData as any)?.department_structure;
        if (departmentStructure && Array.isArray(departmentStructure)) {
          // Fetch user profiles for department heads
          const { data: allUsers } = await supabase
            .from('user_company_access')
            .select('user_id, user_profiles!inner(id, email, first_name, last_name)')
            .eq('company_id', companyId);

          const userMap = new Map(
            allUsers?.map(u => [u.user_profiles.id, u.user_profiles]) || []
          );

          const deps = (departmentStructure as Department[])
            .filter(dept => {
              const norm = normalizeDepartmentName(dept.name);
              return groupedEmployees[norm] && groupedEmployees[norm].employees.length > 0;
            })
            .map(dept => {
              const headUser = dept.departmentHead ? userMap.get(dept.departmentHead) : undefined;
              return {
                ...dept,
                departmentHeadName: headUser
                  ? `${headUser.first_name || ''} ${headUser.last_name || ''}`.trim() || headUser.email
                  : undefined,
              };
            });
          setDepartments(deps);
        }
      } catch (error) {
        console.error('Error fetching value chain data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {lang('companyDashboard.organizationValueChain') || 'Organization Value Chain'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (departments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {lang('companyDashboard.organizationValueChain') || 'Organization Value Chain'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {lang('companyDashboard.noValueChainData') || 'No department structure configured yet. Set up departments in Settings.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          {lang('companyDashboard.organizationValueChain') || 'Organization Value Chain'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ValueChainView
          departments={departments}
          employeesByDept={employeesByDept}
          normalizeDepartmentName={normalizeDepartmentName}
          onDepartmentClick={() => {}}
          onUserUpdate={() => {}}
          onCategoryChange={() => {}}
          onReorder={() => {}}
          companyId={companyId}
          readOnly
        />
      </CardContent>
    </Card>
  );
}
