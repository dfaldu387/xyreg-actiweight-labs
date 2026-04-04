import type { ScopeOfSupply } from '@/types/supplier';

export function formatScopeOfSupply(scope: string | ScopeOfSupply | undefined): string {
  if (!scope) return '-';
  
  // Handle legacy string format
  if (typeof scope === 'string') {
    return scope;
  }
  
  // Handle new object format
  const category = scope.category;
  const customDescription = scope.custom_description;
  
  if (category === 'Other' && customDescription) {
    return customDescription;
  }
  
  if (customDescription) {
    return `${category}: ${customDescription}`;
  }
  
  return category;
}

export function createScopeOfSupply(category: string, customDescription?: string): ScopeOfSupply {
  return {
    category: category as ScopeOfSupply['category'],
    custom_description: customDescription
  };
}

export function parseLegacyScopeOfSupply(legacyScope: string): ScopeOfSupply {
  // Convert existing string data to new format by treating it as "Other" category
  return {
    category: 'Other',
    custom_description: legacyScope
  };
}