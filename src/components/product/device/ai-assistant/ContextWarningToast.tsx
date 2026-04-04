import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface MissingField {
  label: string;
  tab: string;
  subtab?: string;
}

interface ContextWarningToastProps {
  missingFields: MissingField[];
  onNavigate?: () => void;
}

/**
 * Toast content component that displays missing fields with clickable links
 * to navigate users directly to the appropriate tabs.
 */
export function ContextWarningToast({ missingFields, onNavigate }: ContextWarningToastProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFieldClick = (field: MissingField) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', field.tab);
    if (field.subtab) {
      newParams.set('subtab', field.subtab);
    } else {
      newParams.delete('subtab');
    }
    setSearchParams(newParams);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">Cannot generate - no context available</p>
          <p className="text-xs text-muted-foreground">
            Please complete these fields first:
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 ml-6">
        {missingFields.map((field, index) => (
          <button
            key={field.label}
            onClick={() => handleFieldClick(field)}
            className="inline-flex items-center gap-1 text-xs text-primary underline hover:text-primary/80 font-medium cursor-pointer bg-transparent border-none p-0"
          >
            {field.label}
            <ArrowRight className="h-3 w-3" />
            {index < missingFields.length - 1 && <span className="text-muted-foreground ml-1">,</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Field navigation mapping for AI context validation.
 * Maps field names to their tab/subtab locations.
 */
export const FIELD_NAVIGATION_MAP: Record<string, MissingField> = {
  'Product Name': { label: 'Product Name', tab: 'basics', subtab: 'identification' },
  'Device Category': { label: 'Device Category', tab: 'basics', subtab: 'identification' },
  'Description': { label: 'Description', tab: 'basics', subtab: 'definition' },
  'EMDN Code': { label: 'EMDN Code', tab: 'basics', subtab: 'classification' },
};

/**
 * Get the missing field objects with navigation info from field name strings.
 */
export function getMissingFieldsWithNavigation(fieldNames: string[]): MissingField[] {
  return fieldNames.flatMap(fieldName => {
    // Handle combined field names like "Device Category, Description, or EMDN Code"
    if (fieldName.includes(',') || fieldName.includes(' or ')) {
      const parts = fieldName.split(/,\s*|\s+or\s+/).map(s => s.trim()).filter(Boolean);
      return parts.map(part => 
        FIELD_NAVIGATION_MAP[part] || { label: part, tab: 'basics', subtab: 'definition' }
      );
    }
    return FIELD_NAVIGATION_MAP[fieldName] || { label: fieldName, tab: 'basics', subtab: 'definition' };
  });
}

/**
 * Get human-readable context sources from device context
 */
export function getContextSources(context?: {
  deviceDescription?: string;
  emdnCode?: string;
  emdnDescription?: string;
  deviceCategory?: string;
  primaryRegulatoryType?: string;
  keyFeatures?: string[];
}): string[] {
  const sources: string[] = [];
  
  if (context?.deviceDescription?.trim()) sources.push('Description');
  if (context?.emdnCode?.trim() || context?.emdnDescription?.trim()) sources.push('EMDN Classification');
  if (context?.deviceCategory?.trim() && !['new device', 'device'].includes(context.deviceCategory.toLowerCase().split(' (')[0])) {
    sources.push('Device Category');
  }
  if (context?.primaryRegulatoryType?.trim()) sources.push('Regulatory Type');
  if (context?.keyFeatures && context.keyFeatures.length > 0) sources.push('Key Features');
  
  return sources;
}
