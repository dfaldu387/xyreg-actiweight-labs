import { supabase } from '@/integrations/supabase/client';

export async function resolveCompanyToUuid(companyIdentifier: string): Promise<string | null> {
  if (!companyIdentifier) return null;

  const decoded = decodeURIComponent(companyIdentifier).trim();

  // Check if it's already a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(decoded)) {
    return decoded;
  }

  try {
    // console.log('[resolveCompanyToUuid] Resolving identifier:', decoded);

    // 1) Try SRN exact match first (prioritize company with most products)
    const { data: srnCompanies, error: srnError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('srn', decoded);

    if (srnError && srnError.code && srnError.code !== 'PGRST116') {
      console.warn('[resolveCompanyToUuid] SRN lookup error:', srnError);
    }
    
    if (srnCompanies && srnCompanies.length > 0) {
      // If multiple companies with same SRN, get product counts
      if (srnCompanies.length > 1) {
        const companiesWithCounts = await Promise.all(
          srnCompanies.map(async (company) => {
            const { count } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', company.id)
              .eq('is_archived', false);
            return { ...company, product_count: count || 0 };
          })
        );
        const bestCompany = companiesWithCounts.sort((a, b) => b.product_count - a.product_count)[0];
        // console.log('[resolveCompanyToUuid] Resolved by SRN with product count priority');
        return bestCompany.id;
      }
      // console.log('[resolveCompanyToUuid] Resolved by SRN');
      return srnCompanies[0].id;
    }

    // 2) Try exact name match (prioritize company with most products)
    const { data: nameCompanies, error: nameExactErr } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', decoded);

    if (nameExactErr && nameExactErr.code && nameExactErr.code !== 'PGRST116') {
      console.warn('[resolveCompanyToUuid] Exact name lookup error:', nameExactErr);
    }
    
    if (nameCompanies && nameCompanies.length > 0) {
      // If multiple companies with same name, get product counts
      if (nameCompanies.length > 1) {
        const companiesWithCounts = await Promise.all(
          nameCompanies.map(async (company) => {
            const { count } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', company.id)
              .eq('is_archived', false);
            return { ...company, product_count: count || 0 };
          })
        );
        const bestCompany = companiesWithCounts.sort((a, b) => b.product_count - a.product_count)[0];
        // console.log('[resolveCompanyToUuid] Resolved by exact name with product count priority');
        return bestCompany.id;
      }
      // console.log('[resolveCompanyToUuid] Resolved by exact name');
      return nameCompanies[0].id;
    }

    // 3) Try case-insensitive exact match - using ILIKE with exact word boundaries to prevent partial matches
    const { data: ilikeCompanies, error: nameIlikeErr } = await supabase
      .from('companies')
      .select('id, name')
      .ilike('name', decoded);

    if (nameIlikeErr) {
      console.error('[resolveCompanyToUuid] Case-insensitive name lookup error:', nameIlikeErr);
      return null;
    }

    if (ilikeCompanies && ilikeCompanies.length > 0) {
      // Filter for exact matches (case-insensitive) to prevent partial string matches like "AA Co" matching "Aesculap AG"
      const exactMatches = ilikeCompanies.filter(company => 
        company.name.toLowerCase().trim() === decoded.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        if (exactMatches.length > 1) {
          const companiesWithCounts = await Promise.all(
            exactMatches.map(async (company) => {
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company.id)
                .eq('is_archived', false);
              return { ...company, product_count: count || 0 };
            })
          );
          const bestCompany = companiesWithCounts.sort((a, b) => b.product_count - a.product_count)[0];
          // console.log('[resolveCompanyToUuid] Resolved by case-insensitive exact match with product count priority');
          return bestCompany.id;
        }
        // console.log('[resolveCompanyToUuid] Resolved by case-insensitive exact match');
        return exactMatches[0].id;
      }
      
      console.warn('[resolveCompanyToUuid] Found partial matches but no exact matches for:', decoded, 'Matches:', ilikeCompanies.map(c => c.name));
    }

    return null;
  } catch (error) {
    console.error('[resolveCompanyToUuid] Error resolving company:', error);
    return null;
  }
}
