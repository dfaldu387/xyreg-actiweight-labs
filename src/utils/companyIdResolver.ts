import { supabase } from "@/integrations/supabase/client";

export const isValidUuid = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const resolveToCompanyUuid = async (identifier: string): Promise<string | null> => {
  try {
    // If it's already a UUID, verify it exists and return it
    if (isValidUuid(identifier)) {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', identifier)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return identifier;
    }
    
    // Otherwise, try SRN first then resolve by name (URL-decoded)
    const decodedName = decodeURIComponent(identifier);

    // Try resolving by SRN exact match
    const { data: bySrn, error: srnError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('srn', decodedName)
      .order('inserted_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (bySrn?.id) {
      return bySrn.id;
    }

    // Try exact name match
    const { data: byNameExact, error: nameExactError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', decodedName)
      .limit(1)
      .maybeSingle();
    
    if (byNameExact?.id) {
      return byNameExact.id;
    }
    
    // Try case-insensitive search as fallback (deterministic)
    const { data: caseInsensitiveData, error: caseInsensitiveError } = await supabase
      .from('companies')
      .select('id, name')
      .ilike('name', decodedName)
      .limit(1)
      .maybeSingle();
      
    if (caseInsensitiveData?.id) {
      return caseInsensitiveData.id;
    }
    
    return null;
    
  } catch (error) {
    console.error('[CompanyResolver] Error resolving company identifier:', error);
    return null;
  }
};

export const getCurrentCompanyId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const pathParts = window.location.pathname.split('/');
  
  // Expected format: /app/company/{companyIdentifier}/...
  if (pathParts.length >= 4 && pathParts[1] === 'app' && pathParts[2] === 'company') {
    const companyIdentifier = pathParts[3];
    return companyIdentifier;
  }
  
  return null;
};
