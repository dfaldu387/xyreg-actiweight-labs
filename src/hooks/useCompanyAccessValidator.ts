import { useState, useEffect } from 'react';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { resolveToCompanyUuid } from '@/utils/companyIdResolver';

interface CompanyAccessValidationResult {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  resolvedCompanyId: string | null;
}

/**
 * CRITICAL SECURITY HOOK: Validates user access to company routes
 * Prevents data isolation breaches by verifying user permissions
 */
export function useCompanyAccessValidator(companyIdentifier: string | undefined): CompanyAccessValidationResult {
  const { companyRoles, isLoading: rolesLoading } = useCompanyRole();
  const [validationState, setValidationState] = useState<CompanyAccessValidationResult>({
    hasAccess: false,
    isLoading: true,
    error: null,
    resolvedCompanyId: null
  });

  useEffect(() => {
    const validateAccess = async () => {
      if (!companyIdentifier) {
        setValidationState({
          hasAccess: false,
          isLoading: false,
          error: 'No company identifier provided',
          resolvedCompanyId: null
        });
        return;
      }

      if (rolesLoading) {
        setValidationState(prev => ({ ...prev, isLoading: true }));
        return;
      }

      try {
        // CRITICAL FIX: Check user's roles FIRST before doing database resolution
        // This prevents duplicate company name issues from causing wrong company access
        const decodedIdentifier = decodeURIComponent(companyIdentifier);
        
        // Try to find matching role by name first (case-insensitive)
        const matchingRole = companyRoles.find(role => 
          role.companyName.toLowerCase() === decodedIdentifier.toLowerCase()
        );
        
        if (matchingRole) {
          // User has this company in their roles - grant access immediately
          setValidationState({
            hasAccess: true,
            isLoading: false,
            error: null,
            resolvedCompanyId: matchingRole.companyId
          });
          return;
        }
        
        // Fallback: Resolve from database (for edge cases)
        const resolvedCompanyId = await resolveToCompanyUuid(companyIdentifier);
        
        if (!resolvedCompanyId) {
          setValidationState({
            hasAccess: false,
            isLoading: false,
            error: `Company "${companyIdentifier}" not found`,
            resolvedCompanyId: null
          });
          return;
        }

        // Check if user has access to this company
        const hasAccess = companyRoles.some(role => role.companyId === resolvedCompanyId);

        if (!hasAccess) {
          console.error('[CompanyAccessValidator] SECURITY BREACH PREVENTED: User attempted to access unauthorized company:', {
            requestedCompany: companyIdentifier,
            resolvedCompanyId,
            userCompanies: companyRoles.map(r => r.companyName)
          });
        }

        setValidationState({
          hasAccess,
          isLoading: false,
          error: hasAccess ? null : `Access denied to company "${companyIdentifier}"`,
          resolvedCompanyId
        });

      } catch (error) {
        setValidationState({
          hasAccess: false,
          isLoading: false,
          error: `Failed to validate company access: ${error}`,
          resolvedCompanyId: null
        });
      }
    };

    validateAccess();
  }, [companyIdentifier, companyRoles, rolesLoading]);

  return validationState;
}