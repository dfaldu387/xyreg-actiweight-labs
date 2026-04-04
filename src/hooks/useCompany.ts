
import { useContext } from 'react';
import { useCompanyRole } from '@/context/CompanyRoleContext';

export function useCompany() {
  const { activeCompanyId } = useCompanyRole();
  
  return {
    companyId: activeCompanyId,
    company: null, // Simplified for now
    setCompany: () => {} // Simplified for now
  };
}
