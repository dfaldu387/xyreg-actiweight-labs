/**
 * Utility functions for managing company context in URLs and preventing wrong company data access
 */

/**
 * Extracts company name from the current URL path
 * @returns The company name if found in URL, null otherwise
 */
export function getCompanyFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const pathname = window.location.pathname;
  const match = pathname.match(/\/app\/company\/([^\/]+)/);
  
  if (match) {
    return decodeURIComponent(match[1]);
  }
  
  return null;
}

/**
 * Validates that the current URL context matches the expected company
 * @param expectedCompany The company name that should be in the URL
 * @returns true if URL context matches expected company, false otherwise
 */
export function validateCompanyContext(expectedCompany: string): boolean {
  const urlCompany = getCompanyFromUrl();
  
  if (!urlCompany || !expectedCompany) return false;
  
  // Case-insensitive comparison
  return urlCompany.toLowerCase() === expectedCompany.toLowerCase();
}

/**
 * Builds a company-aware URL preserving the current company context
 * @param path The target path
 * @param companyName Optional company name to use (defaults to current URL company)
 * @returns The full URL with company context
 */
export function buildCompanyAwareUrl(path: string, companyName?: string): string {
  const company = companyName || getCompanyFromUrl();
  
  if (!company) return path;
  
  // If path already includes company context, return as-is
  if (path.includes('/app/company/')) return path;
  
  // For paths starting with /app/, inject company context
  if (path.startsWith('/app/')) {
    const pathPart = path.substring(4); // Remove '/app'
    return `/app/company/${encodeURIComponent(company)}${pathPart}`;
  }
  
  return path;
}

/**
 * Security check to prevent cross-company data access
 * @param requestedCompanyId The company ID being requested
 * @param userCompanyRoles Array of company roles for the current user
 * @returns true if user has access to the requested company
 */
export function validateCompanyAccess(
  requestedCompanyId: string, 
  userCompanyRoles: Array<{ companyId: string; companyName: string }>
): boolean {
  return userCompanyRoles.some(role => role.companyId === requestedCompanyId);
}