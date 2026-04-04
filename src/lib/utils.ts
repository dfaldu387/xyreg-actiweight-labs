
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to check if a company is selected in DevMode
export function isCompanySelectedInDevMode(
  companyId: string | null, 
  companyName: string | null, 
  selectedCompanies: Array<{id: string, name: string}> | null, 
  isDevMode: boolean
): boolean {
  // If not in DevMode or no companies selected, return true (no filtering)
  if (!isDevMode || !selectedCompanies || selectedCompanies.length === 0) {
    return true;
  }

  // If we have neither ID nor name, we can't check
  if (!companyId && !companyName) {
    console.log("Cannot check company selection - no ID or name provided");
    return false;
  }

  // Check if the company is in the selected companies list
  const isSelected = selectedCompanies.some(company => 
    (companyId && company.id === companyId) || 
    (companyName && company.name === companyName)
  );

  console.log(`Company ${companyName || companyId} is ${isSelected ? '' : 'not '}in DevMode selection`);
  return isSelected;
}

// Function to get a readable status label for whether a company is available in DevMode
export function getCompanyDevModeStatusLabel(
  companyId: string | null, 
  companyName: string | null,
  selectedCompanies: Array<{id: string, name: string}> | null,
  isDevMode: boolean
): { available: boolean, reason: string } {
  if (!isDevMode) {
    return { available: true, reason: "DevMode inactive" };
  }
  
  if (!selectedCompanies || selectedCompanies.length === 0) {
    return { available: false, reason: "No companies selected in DevMode" };
  }
  
  const isSelected = isCompanySelectedInDevMode(
    companyId, 
    companyName, 
    selectedCompanies, 
    isDevMode
  );
  
  return {
    available: isSelected,
    reason: isSelected 
      ? "Company is selected in DevMode" 
      : "Company not available in current DevMode selection"
  };
}

// New helper to safely get company name by ID from DevMode selected companies
export function getCompanyNameById(
  companyId: string | null,
  selectedCompanies: Array<{id: string, name: string}> | null
): string | null {
  if (!companyId || !selectedCompanies || selectedCompanies.length === 0) {
    return null;
  }
  
  const company = selectedCompanies.find(c => c.id === companyId);
  return company?.name || null;
}

// New helper to get all selected company names from DevMode
export function getSelectedCompanyNames(
  selectedCompanies: Array<{id: string, name: string}> | null
): string[] {
  if (!selectedCompanies || selectedCompanies.length === 0) {
    return [];
  }
  
  return selectedCompanies.map(company => company.name);
}
