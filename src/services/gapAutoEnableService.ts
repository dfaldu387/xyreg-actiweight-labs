import { supabase } from "@/integrations/supabase/client";
import { CompanyGapTemplateService } from "@/services/CompanyGapTemplateService";
import { GapAnalysisSyncService } from "@/services/gapAnalysisSyncService";

/**
 * Check company products for condition matches.
 * Shared between useCompanyGapTemplates (settings page) and reactive triggers.
 */
export async function getCompanyConditions(companyId: string): Promise<Set<string>> {
  const conditions = new Set<string>();
  conditions.add('always');

  const { data: products } = await supabase
    .from('products')
    .select('id, markets, is_software_project, isActiveDevice')
    .eq('company_id', companyId);

  if (!products) return conditions;

  for (const p of products) {
    if (Array.isArray(p.markets)) {
      const markets = p.markets as any[];
      if (markets.some((m: any) => m.code === 'EU' && m.selected)) conditions.add('market_eu');
      if (markets.some((m: any) => (m.code === 'US' || m.code === 'USA') && m.selected)) conditions.add('market_us');
      if (markets.some((m: any) => m.code === 'CA' && m.selected)) conditions.add('market_ca');
      if (markets.some((m: any) => m.code === 'AU' && m.selected)) conditions.add('market_au');
      if (markets.some((m: any) => m.code === 'JP' && m.selected)) conditions.add('market_jp');
      if (markets.some((m: any) => m.code === 'CN' && m.selected)) conditions.add('market_cn');
      if (markets.some((m: any) => m.code === 'BR' && m.selected)) conditions.add('market_br');
      if (markets.some((m: any) => m.code === 'IN' && m.selected)) conditions.add('market_in');
      if (markets.some((m: any) => (m.code === 'UK' || m.code === 'GB') && m.selected)) conditions.add('market_uk');
      if (markets.some((m: any) => m.code === 'CH' && m.selected)) conditions.add('market_ch');
      if (markets.some((m: any) => m.code === 'KR' && m.selected)) conditions.add('market_kr');
    }
    if (p.is_software_project) conditions.add('device_samd');
    if (p.isActiveDevice) conditions.add('device_active');
  }

  // Check patient contact via BOM items
  if (!conditions.has('device_patient_contact') && products.length > 0) {
    const productIds = products.map(p => p.id);
    const { data: bomRevisions } = await supabase
      .from('bom_revisions')
      .select('id')
      .in('product_id', productIds)
      .limit(100);

    if (bomRevisions && bomRevisions.length > 0) {
      const revisionIds = bomRevisions.map(r => r.id);
      const { count } = await supabase
        .from('bom_items')
        .select('id', { count: 'exact', head: true })
        .in('bom_revision_id', revisionIds)
        .in('patient_contact', ['direct', 'indirect']);

      if (count && count > 0) {
        conditions.add('device_patient_contact');
      }
    }
  }

  return conditions;
}

/**
 * Check conditions and auto-enable any templates whose condition is now met.
 * Returns list of newly enabled framework names.
 */
export async function checkAndAutoEnable(companyId: string): Promise<string[]> {
  try {
    const [conditions, companyTemplates, availableTemplates] = await Promise.all([
      getCompanyConditions(companyId),
      CompanyGapTemplateService.getCompanyTemplates(companyId),
      CompanyGapTemplateService.getAvailableTemplates()
    ]);

    const enabledIds = new Set(companyTemplates.filter(ct => ct.is_enabled).map(ct => ct.template_id));
    const existingIds = new Set(companyTemplates.map(ct => ct.template_id));

    const templatesToAutoEnable = availableTemplates.filter((t: any) => {
      const condition = t.auto_enable_condition;
      if (!condition) return false;
      if (!conditions.has(condition)) return false;
      if (condition === 'always') return !enabledIds.has(t.id);
      return !existingIds.has(t.id);
    });

    if (templatesToAutoEnable.length === 0) return [];

    // Enable templates
    await Promise.all(
      templatesToAutoEnable.map(t => CompanyGapTemplateService.enableTemplate(companyId, t.id))
    );

    // Sync gap items for newly enabled templates in background
    templatesToAutoEnable.forEach(t => {
      GapAnalysisSyncService.syncAfterTemplateChange(companyId, t.id, true).catch(console.error);
    });

    return templatesToAutoEnable.map(t => t.name);
  } catch (error) {
    console.error('Error in auto-enable check:', error);
    return [];
  }
}
