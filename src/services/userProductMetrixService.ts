import { supabase } from "@/integrations/supabase/client";




export class UserProductMetrixService {

    static async getCompnayDepartments(companyId: string) {
        try {
            const { data: departments, error } = await supabase.from('companies').select('department_structure').eq('id', companyId)
            if (error) {
                console.error('Error fetching company departments:', error);
                return [];
            }
            if (departments && departments.length > 0) {
                // Flatten the array - department_structure is an array, and departments could be an array too
                const filterDepartments = departments
                    .flatMap((department: any) =>
                        department.department_structure
                            ? department.department_structure.map((dept: any) => dept.name)
                            : []
                    ); 
                // Remove duplicates and filter out null/undefined
                return [...new Set(filterDepartments.filter(Boolean))];
            }
            return [];
        }
        catch (error) {
            console.error('Error fetching company departments:', error);
            return [];
        }
    }
    static async getCompanyUsers(companyId: string) {
        try {
            const { data: companyUsers, error: companyUsersError } = await supabase.from('user_company_access').select('*').eq('company_id', companyId)
            
            if (companyUsersError) {
                console.error('Error fetching company users:', companyUsersError);
                return [];
            }
            if (companyUsers && companyUsers.length > 0) {
                return companyUsers
            }
        }
        catch (error) {
            console.error('Error fetching company users:', error);
            return [];
        }
    }

}