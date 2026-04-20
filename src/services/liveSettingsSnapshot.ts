import { supabase } from '@/integrations/supabase/client';
import { TEMPLATE_CATEGORIES } from '@/types/templateManagement';
import {
  DEFAULT_NUMBERING_CONFIG,
  DEFAULT_SUB_PREFIXES,
  SubPrefixEntry,
} from '@/types/documentCategories';

interface NumberingCategory {
  categoryKey: string;
  categoryName: string;
  prefix: string;
  numberFormat: string;
  startingNumber: string;
  versionFormat: string;
  isCustom: boolean;
}

function previewForCategory(c: NumberingCategory, subPrefixCode: string): string {
  const digits = c.numberFormat === 'XXXX' ? '0001' : c.numberFormat === 'XX-XX' ? '01-01' : '001';
  const sub = subPrefixCode ? `-${subPrefixCode}` : '';
  return `${c.prefix}${sub}-${digits} ${c.versionFormat}`;
}

const DEFAULT_PREFIX_MAP: Record<string, string> = {
  'quality-system-procedures': 'SOP',
  'design-development': 'DD',
  'safety-risk-management': 'RISK',
  'regulatory-clinical': 'REG',
  'operations-production': 'OPS',
  'forms-logs': 'FORM',
};

function getDefaultPrefix(key: string, label: string): string {
  return DEFAULT_PREFIX_MAP[key] || label.substring(0, 3).toUpperCase();
}

/**
 * Fetches live company settings (prefixes, sub-prefixes) and returns a compact
 * snapshot block to inject into an AI prompt.
 *
 * Always hits the DB fresh — bypasses any cached advisoryContext — so the user
 * always sees current configuration when they type @settings.
 */
export async function fetchLiveCompanySettings(companyId: string): Promise<string> {
  if (!companyId) return '';
  try {
    const { data: settings, error } = await supabase
      .from('template_settings')
      .select('setting_key, setting_value, category')
      .eq('company_id', companyId);
    if (error) {
      console.warn('[liveSettingsSnapshot] fetch error', error);
      return '';
    }
    const rows = settings || [];

    // Predefined categories
    const categories: NumberingCategory[] = Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => {
      const existing = rows.find(
        (s: any) => s.category === 'defaults' && s.setting_key === `document_numbering_${key}`,
      );
      const val = (existing?.setting_value || {}) as any;
      return {
        categoryKey: key,
        categoryName: cat.label,
        prefix: val.prefix || getDefaultPrefix(key, cat.label),
        numberFormat: val.numberFormat || DEFAULT_NUMBERING_CONFIG.numberFormat,
        startingNumber: val.startingNumber || DEFAULT_NUMBERING_CONFIG.startingNumber,
        versionFormat: val.versionFormat || DEFAULT_NUMBERING_CONFIG.versionFormat,
        isCustom: false,
      };
    });

    // Custom categories — match by setting_key prefix only (ignore `category`
    // column value in case it varies between companies or got migrated).
    const customRows = rows.filter((r: any) => typeof r.setting_key === 'string' && r.setting_key.startsWith('custom_category_'));
    console.debug('[liveSettingsSnapshot] custom category rows found:', customRows.length, customRows);
    for (const s of customRows) {
      const val = (s.setting_value || {}) as any;
      categories.push({
        categoryKey: s.setting_key.replace('custom_category_', ''),
        categoryName: val.categoryName || val.name || 'Custom',
        prefix: val.prefix || 'CUST',
        numberFormat: val.numberFormat || DEFAULT_NUMBERING_CONFIG.numberFormat,
        startingNumber: val.startingNumber || DEFAULT_NUMBERING_CONFIG.startingNumber,
        versionFormat: val.versionFormat || DEFAULT_NUMBERING_CONFIG.versionFormat,
        isCustom: true,
      });
    }

    // Sub-prefixes
    const subRow = rows.find((r: any) =>
      r.setting_key === 'global_sub_prefixes' || r.setting_key === 'functional_sub_prefixes',
    );
    let subPrefixes: SubPrefixEntry[] = DEFAULT_SUB_PREFIXES;
    if (subRow?.setting_value && Array.isArray(subRow.setting_value)) {
      subPrefixes = subRow.setting_value as unknown as SubPrefixEntry[];
    }

    const sampleSub = subPrefixes[0]?.code || 'QA';
    const lines: string[] = [];
    lines.push('--- COMPANY SETTINGS SNAPSHOT (LIVE) ---');
    lines.push('Prefix Categories (Company Settings → General → Prefixes & Document Numbering):');
    for (const c of categories) {
      lines.push(
        `  ${c.prefix.padEnd(5)} ${c.categoryName} | number=${c.numberFormat} | start=${c.startingNumber} | version=${c.versionFormat} | preview=${previewForCategory(c, sampleSub)}${c.isCustom ? ' (custom)' : ''}`,
      );
    }
    lines.push('Functional Sub-prefixes (departments):');
    lines.push('  ' + subPrefixes.map(sp => `${sp.code}=${sp.label}`).join(', '));
    lines.push('Format rule: TYPE-SUBPREFIX-NUMBER (e.g., SOP-QA-001). Never reverse the order.');
    lines.push('--- END COMPANY SETTINGS SNAPSHOT ---');

    return lines.join('\n');
  } catch (err) {
    console.warn('[liveSettingsSnapshot] unexpected error', err);
    return '';
  }
}
