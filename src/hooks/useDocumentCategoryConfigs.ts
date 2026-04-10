import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CategoryNumberingConfig, DEFAULT_NUMBERING_CONFIG } from '@/types/documentCategories';
import { TEMPLATE_CATEGORIES } from '@/types/templateManagement';

/**
 * Hook to fetch document category numbering configs from template_settings.
 * Mirrors the logic in DocumentCategoryNumberingSystem for reading configs.
 * Also provides getNextDocumentNumber() to auto-generate IDs.
 */
export function useDocumentCategoryConfigs(companyId: string | undefined) {
  const [configs, setConfigs] = useState<CategoryNumberingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getDefaultPrefix = (key: string, label: string): string => {
    const prefixMap: Record<string, string> = {
      'quality-system-procedures': 'SOP',
      'design-development': 'DD',
      'safety-risk-management': 'RISK',
      'regulatory-clinical': 'REG',
      'operations-production': 'OPS',
      'forms-logs': 'FORM',
    };
    return prefixMap[key] || label.substring(0, 3).toUpperCase();
  };

  useEffect(() => {
    if (!companyId) return;

    const loadConfigs = async () => {
      setIsLoading(true);
      console.debug('[useDocumentCategoryConfigs] Loading configs for companyId:', companyId);
      try {
        const { data: settings, error } = await supabase
          .from('template_settings')
          .select('*')
          .eq('company_id', companyId);

        if (error) {
          console.error('Error fetching category configs:', error);
          return;
        }

        // Build predefined categories
        const predefinedConfigs: CategoryNumberingConfig[] = Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => {
          const existingSetting = (settings || []).find((s: any) =>
            s.category === 'defaults' &&
            s.setting_key === `document_numbering_${key}`
          );

          if (existingSetting?.setting_value && typeof existingSetting.setting_value === 'object') {
            return {
              categoryKey: key,
              categoryName: category.label,
              description: category.description,
              isCustom: false,
              prefix: existingSetting.setting_value.prefix || getDefaultPrefix(key, category.label),
              numberFormat: existingSetting.setting_value.numberFormat || DEFAULT_NUMBERING_CONFIG.numberFormat,
              startingNumber: existingSetting.setting_value.startingNumber || DEFAULT_NUMBERING_CONFIG.startingNumber,
              versionFormat: existingSetting.setting_value.versionFormat || DEFAULT_NUMBERING_CONFIG.versionFormat,
            };
          }

          return {
            categoryKey: key,
            categoryName: category.label,
            description: category.description,
            isCustom: false,
            prefix: getDefaultPrefix(key, category.label),
            numberFormat: DEFAULT_NUMBERING_CONFIG.numberFormat,
            startingNumber: DEFAULT_NUMBERING_CONFIG.startingNumber,
            versionFormat: DEFAULT_NUMBERING_CONFIG.versionFormat,
          };
        });

        // Add custom categories
        const customSettings = (settings || []).filter((s: any) =>
          s.category === 'defaults' &&
          s.setting_key.startsWith('custom_category_')
        );

        const customConfigs: CategoryNumberingConfig[] = customSettings.map((s: any) => ({
          categoryKey: s.setting_key.replace('custom_category_', ''),
          categoryName: s.setting_value?.categoryName || 'Custom',
          description: s.setting_value?.description || '',
          isCustom: true,
          prefix: s.setting_value?.prefix || 'CUST',
          numberFormat: s.setting_value?.numberFormat || DEFAULT_NUMBERING_CONFIG.numberFormat,
          startingNumber: s.setting_value?.startingNumber || DEFAULT_NUMBERING_CONFIG.startingNumber,
          versionFormat: s.setting_value?.versionFormat || DEFAULT_NUMBERING_CONFIG.versionFormat,
        }));

        console.debug('[useDocumentCategoryConfigs] Loaded', predefinedConfigs.length, 'predefined +', customConfigs.length, 'custom configs');
        setConfigs([...predefinedConfigs, ...customConfigs]);
      } catch (err) {
        console.error('Error loading category configs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfigs();

    // Listen for settings updates
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.companyId === companyId && detail?.type === 'document_category_numbering') {
        loadConfigs();
      }
    };
    window.addEventListener('company-data-updated', handleUpdate);
    return () => window.removeEventListener('company-data-updated', handleUpdate);
  }, [companyId]);

  /**
   * Generate next document number for a category.
   * Counts existing documents with the same prefix and increments.
   */
  /**
   * Fetch used number suffixes for a given prefix (e.g., "SOP" → ["001", "002"]).
   */
  const getUsedNumbers = useCallback(async (prefix: string, filterCompanyId?: string): Promise<Set<string>> => {
    let query = supabase
      .from('phase_assigned_document_template')
      .select('document_number')
      .like('document_number', `${prefix}-%`);

    if (filterCompanyId) {
      query = query.eq('company_id', filterCompanyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching used numbers for prefix:', error);
      return new Set();
    }

    const used = new Set<string>();
    (data || []).forEach((row: any) => {
      const match = row.document_number?.match(new RegExp(`^${prefix}-(?:[A-Z]+-)?([\\d]+)`));
      if (match) {
        used.add(match[1]);
      }
    });
    return used;
  }, []);

  const getNextDocumentNumber = useCallback(async (categoryKey: string): Promise<string> => {
    const config = configs.find(c => c.categoryKey === categoryKey);
    if (!config) return '';

    const prefix = config.prefix;

    // Count existing docs with this prefix
    const { count, error } = await supabase
      .from('phase_assigned_document_template')
      .select('id', { count: 'exact', head: true })
      .like('document_number', `${prefix}-%`);

    if (error) {
      console.error('Error counting docs for prefix:', error);
    }

    const existingCount = count || 0;
    const startNum = parseInt(config.startingNumber, 10) || 1;
    const nextNum = existingCount + startNum;

    // Format number based on numberFormat
    let formatted: string;
    switch (config.numberFormat) {
      case 'XXXX':
        formatted = String(nextNum).padStart(4, '0');
        break;
      case 'XX-XX': {
        const padded = String(nextNum).padStart(4, '0');
        formatted = `${padded.slice(0, 2)}-${padded.slice(2)}`;
        break;
      }
      case 'XXX':
      default:
        formatted = String(nextNum).padStart(3, '0');
        break;
    }

    return `${prefix}-${formatted}`;
  }, [configs]);

  return { configs, isLoading, getNextDocumentNumber, getUsedNumbers };
}
