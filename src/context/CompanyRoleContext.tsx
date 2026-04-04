
import React, { createContext, useContext, ReactNode } from 'react';
import { UserRole } from '@/types/documentTypes';
import { CompanyRole, RoleSwitchResult, CompanyRoleContextOptions } from '@/types/companyRole';
import { useCompanyRoles } from '@/hooks/useCompanyRoles';

interface CompanyRoleContextType {
  companyRoles: CompanyRole[];
  activeCompanyRole: CompanyRole | null;
  isLoading: boolean;
  switchCompanyRole: (companyId: string, options?: CompanyRoleContextOptions) => Promise<RoleSwitchResult>;
  updateCompanyRole: (companyId: string, newRole: UserRole) => Promise<RoleSwitchResult>;
  refreshCompanyRoles: () => Promise<void>;
  activeCompanyId: string | null;
  activeRole: UserRole;
}

const CompanyRoleContext = createContext<CompanyRoleContextType | undefined>(undefined);

export function CompanyRoleProvider({ children }: { children: ReactNode }) {
  const companyRoleUtils = useCompanyRoles();
  
  return (
    <CompanyRoleContext.Provider value={companyRoleUtils}>
      {children}
    </CompanyRoleContext.Provider>
  );
}

export function useCompanyRole() {
  const context = useContext(CompanyRoleContext);
  if (context === undefined) {
    throw new Error('useCompanyRole must be used within a CompanyRoleProvider');
  }
  return context;
}
