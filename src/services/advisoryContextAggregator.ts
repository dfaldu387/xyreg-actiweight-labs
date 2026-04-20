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
    const prefixes: string[] = [];
    const numberingDetails: string[] = [];
    if (numberingEntries.length > 0) {
      for (const e of numberingEntries) {
        try {
          const val = e.setting_value as any;
          if (val?.prefix) {
            prefixes.push(val.prefix);
            numberingDetails.push(`${val.prefix}: format=${val.numberFormat || 'XXX'}, starting=${val.startingNumber || '001'}, version=${val.versionFormat || 'V1.0'}`);
          }
        } catch {}
      }
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

    // Document numbering system explanation
    ctx += `\n\nDocument Numbering System:`;
    ctx += `\nFormat: TYPE-SUBPREFIX-NUMBER (e.g., SOP-QA-001 V1.0)`;
    ctx += `\n- TYPE comes first (document category prefix), then the functional SUB-PREFIX (department), then the sequential number.`;
    ctx += `\n- Example: SOP-QA-001 = SOP (Standard Operating Procedure) + QA (Quality Assurance) + 001 (first document)`;
    if (prefixes.length) {
      ctx += `\nConfigured Document Type Prefixes: ${prefixes.join(', ')}`;
      for (const detail of numberingDetails) {
        ctx += `\n  - ${detail}`;
      }
    }
    ctx += `\nFunctional Sub-prefixes (departments): ${subPrefixes.map(sp => `${sp.code} (${sp.label})`).join(', ')}`;
    ctx += `\nIMPORTANT: Always use the format TYPE-SUBPREFIX-NUMBER. Never put sub-prefix before the type.`;

    ctx += `\n--- END COMPANY SYSTEM CONTEXT ---`;

    if (ctx.length > 3000) ctx = ctx.slice(0, 2950) + '\n... (truncated)\n--- END COMPANY SYSTEM CONTEXT ---';

    return ctx;
  } catch (err) {
    console.warn('[advisoryContextAggregator] Failed to aggregate context:', err);
    return '';
  }
}
