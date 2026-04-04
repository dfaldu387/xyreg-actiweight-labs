import { useTemplateSettings } from './useTemplateSettings';

export interface TraceabilityPrefixEntry {
  key: string;       // e.g. "user_needs", "system_requirements", or custom like "biocompatibility"
  label: string;     // Display name
  prefix: string;    // e.g. "UN-", "SYSR-"
  scope: string;     // Description
  isDefault: boolean; // Whether this is a built-in entry
}

export const DEFAULT_TRACEABILITY_ENTRIES: TraceabilityPrefixEntry[] = [
  { key: 'user_needs', label: 'User Needs', prefix: 'UN-', scope: 'Voice of the Patient/Doctor', isDefault: true },
  { key: 'system_requirements', label: 'System Requirements', prefix: 'SYSR-', scope: 'High-level device specs', isDefault: true },
  { key: 'software_requirements', label: 'Software Requirements', prefix: 'SWR-', scope: 'Code-level logic', isDefault: true },
  { key: 'hardware_requirements', label: 'Hardware Requirements', prefix: 'HWR-', scope: 'Physical specs', isDefault: true },
  { key: 'risk_measures', label: 'Risk Measures', prefix: 'RM-', scope: 'Safety controls', isDefault: true },
];

export function useTraceabilityPrefixes(companyId: string) {
  const { settings, updateSetting, saveSettings, isLoading } = useTemplateSettings(companyId);

  // Build entries from stored data, merging with defaults
  const getEntries = (): TraceabilityPrefixEntry[] => {
    const stored = settings.traceability_prefixes as TraceabilityPrefixEntry[] | undefined;
    if (stored && Array.isArray(stored)) {
      return stored;
    }
    // Legacy format or no data: return defaults
    return [...DEFAULT_TRACEABILITY_ENTRIES];
  };

  const entries = getEntries();

  const getPrefix = (key: string): string => {
    const entry = entries.find(e => e.key === key);
    const defaultEntry = DEFAULT_TRACEABILITY_ENTRIES.find(e => e.key === key);
    return entry?.prefix || defaultEntry?.prefix || '';
  };

  const saveEntries = async (newEntries: TraceabilityPrefixEntry[]) => {
    updateSetting('traceability_prefixes', newEntries);
    await saveSettings({ traceability_prefixes: newEntries });
  };

  return { entries, getPrefix, saveEntries, isLoading };
}
