import { supabase } from '@/integrations/supabase/client';
import { getMarketLaunchStatus } from '@/utils/launchStatusUtils';
import { DEFAULT_SUB_PREFIXES } from '@/types/documentCategories';

export async function aggregateAdvisoryContext(companyId: string): Promise<string> {
  try {
    // Use separate awaits to avoid TS2589 deep type instantiation
    const companyPromise = supabase.from('companies').select('name, country, notified_body_id').eq('id', companyId).single();
    const productsPromise = supabase.from('products').select('name, class, device_category, markets, current_lifecycle_phase').eq('company_id', companyId).eq('is_archived', false);
    const documentsPromise = supabase.from('documents').select('status, document_reference').eq('company_id', companyId);
    const settingsPromise = supabase.from('template_settings').select('setting_key, setting_value').eq('company_id', companyId);

    const [companyRes, productsRes, documentsRes, settingsRes] = await Promise.all([
      companyPromise, productsPromise, documentsPromise, settingsPromise
    ] as const);

    let ctx = `\n\n--- COMPANY SYSTEM CONTEXT ---`;

    // Company info
    const company = companyRes.data;
    if (company) {
      ctx += `\nCompany: ${company.name}`;
      if (company.country) ctx += ` (${company.country})`;
    }

    // Products
    const products = productsRes.data || [];
    if (products.length > 0) {
      ctx += `\n\nProducts (${products.length}):`;
      for (const p of products) {
        let line = `\n- ${p.name}`;
        if (p.class) line += ` | ${p.class}`;
        if (p.device_category) line += ` | ${p.device_category}`;
        if (p.current_lifecycle_phase) line += ` | Phase: ${p.current_lifecycle_phase}`;

        if (p.markets && Array.isArray(p.markets)) {
          const marketParts: string[] = [];
          (p.markets as any[]).filter((m: any) => m.selected).forEach((m: any) => {
            const status = getMarketLaunchStatus(m);
            marketParts.push(`${m.code || m.name || 'Unknown'} (${status.isLaunched ? 'launched' : 'planned'})`);
          });
          if (marketParts.length) line += ` | Markets: ${marketParts.join(', ')}`;
        }
        ctx += line;
      }
    }

    // Documents summary
    const docs = documentsRes.data || [];
    if (docs.length > 0) {
      const byStatus: Record<string, number> = {};
      const byPrefix: Record<string, number> = {};
      for (const d of docs) {
        const s = d.status || 'Unknown';
        byStatus[s] = (byStatus[s] || 0) + 1;
        if (d.document_reference) {
          const prefix = d.document_reference.split('-')[0];
          if (prefix && prefix.length <= 6) byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
        }
      }
      ctx += `\n\nDocuments Summary:`;
      ctx += `\n- Total: ${docs.length}`;
      const statusParts = Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`);
      if (statusParts.length) ctx += ` | ${statusParts.join(' | ')}`;
      const prefixParts = Object.entries(byPrefix).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`);
      if (prefixParts.length) ctx += `\n- By category: ${prefixParts.join(', ')}`;
    }

    // Document numbering prefixes from settings
    const settings = settingsRes.data || [];
    const numberingEntries = settings.filter(s => s.setting_key.startsWith('document_numbering_'));
    if (numberingEntries.length > 0) {
      const prefixes = numberingEntries.map(e => {
        try {
          const val = e.setting_value as any;
          return val?.prefix;
        } catch { return null; }
      }).filter(Boolean);
      if (prefixes.length) ctx += `\n\nConfigured Document Prefixes: ${prefixes.join(', ')}`;
    }

    // Sub-prefixes
    const subPrefixSetting = settings.find(s => s.setting_key === 'functional_sub_prefixes');
    let subPrefixes = DEFAULT_SUB_PREFIXES;
    if (subPrefixSetting?.setting_value) {
      try {
        const parsed = subPrefixSetting.setting_value as any;
        if (Array.isArray(parsed)) subPrefixes = parsed;
      } catch {}
    }
    ctx += `\nFunctional Sub-prefixes: ${subPrefixes.map(sp => `${sp.code} (${sp.label})`).join(', ')}`;

    ctx += `\n--- END COMPANY SYSTEM CONTEXT ---`;

    if (ctx.length > 3000) ctx = ctx.slice(0, 2950) + '\n... (truncated)\n--- END COMPANY SYSTEM CONTEXT ---';

    return ctx;
  } catch (err) {
    console.warn('[advisoryContextAggregator] Failed to aggregate context:', err);
    return '';
  }
}
