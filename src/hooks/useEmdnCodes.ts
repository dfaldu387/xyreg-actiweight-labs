import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProperEmdnName, buildProperEmdnBreadcrumb, getEmdnDisplayText, isGenericName } from '@/utils/emdnNaming';

export interface EmdnCode {
  id: string;
  emdn_code: string;
  description: string;
  level: number;
  parent_id: string | null;
  full_path: string;
  risk_class: string | null;
  regulatory_notes: string | null;
}

export interface EmdnHierarchy extends EmdnCode {
  children?: EmdnHierarchy[];
}

export function useEmdnCodes() {
  return useQuery({
    queryKey: ['emdn-codes'],
    queryFn: async (): Promise<EmdnCode[]> => {
      // Use NEW edge function v2 to bypass deployment issues
      const { data, error } = await supabase.functions.invoke('fetch-emdn-codes-v2');

      if (error) {
        console.error('Error fetching EMDN codes:', error);
        throw error;
      }

      const mappedData = (data as any[])
        ?.filter(row => {
          // Filter out invalid rows - using field names from transformed RPC data
          return row && 
                 row.code && 
                 row.LEVEL !== null && 
                 row.LEVEL !== undefined && 
                 !isNaN(Number(row.LEVEL)) &&
                 row.description;
        })
        ?.map(row => {
          const level = Number(row.LEVEL);
          const originalDescription = row.description;
          // Use specific description first, fallback to temp field
          const properDescription = originalDescription || row.temp || 'No description';
            
          return {
            id: String(row.code || ''),
            emdn_code: row.code,
            description: properDescription,
            level: level,
            parent_id: row.parent_code && row.parent_code.trim() !== '' ? row.parent_code : null,
            full_path: row.code, // Use the code as full path for now
            risk_class: null, // Not available in EUDAMED schema
            regulatory_notes: null // Not available in EUDAMED schema
          };
        }) || [];

      return mappedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - EMDN codes are fairly static
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus due to large dataset
    retry: 2, // Reduce retries for large dataset
  });
}

export function buildEmdnHierarchy(codes: EmdnCode[]): EmdnHierarchy[] {
  const codeMap = new Map<string, EmdnHierarchy>();
  const rootCodes: EmdnHierarchy[] = [];

  // Debug: Check level distribution
  const levelDistribution = codes.reduce((acc, code) => {
    acc[code.level] = (acc[code.level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Debug: Check all level 1 codes
  const level1Codes = codes.filter(code => code.level === 1);

  // First pass: create map of all codes using EMDN code as key
  codes.forEach(code => {
    codeMap.set(code.emdn_code, { ...code, children: [] });
  });

  // Second pass: build hierarchy using EMDN code relationships
  // IMPORTANT: Treat ALL level 1 codes as root codes regardless of parent_id
  codes.forEach(code => {
    const node = codeMap.get(code.emdn_code)!;
    
    // Level 1 codes should always be root codes
    if (code.level === 1) {
      rootCodes.push(node);
    } else if (code.parent_id && codeMap.has(code.parent_id)) {
      // Non-level-1 codes with valid parents
      const parent = codeMap.get(code.parent_id)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      // Non-level-1 codes without valid parents - add as root with warning
      console.warn('🔧 Orphaned code added as root:', code.emdn_code, 'level:', code.level, 'parent_id:', code.parent_id);
      rootCodes.push(node);
    }
  });

  // Sort root codes by their code for consistent display
  rootCodes.sort((a, b) => {
    const codeA = a.emdn_code || '';
    const codeB = b.emdn_code || '';
    return codeA.localeCompare(codeB);
  });

  // Validate that we have all expected level 1 codes
  const rootCodeLetters = rootCodes.map(c => c.emdn_code).sort();

  return rootCodes;
}

export function findEmdnCodeById(codes: EmdnCode[], id: string): EmdnCode | undefined {
  return codes.find(code => code.emdn_code === id || code.id === id);
}

export function buildEmdnBreadcrumb(codes: EmdnCode[], selectedCode: EmdnCode): string {
  // Build breadcrumb directly from dataset relationships (parent_id), fallback to naming utility if needed
  if (!selectedCode) return '';
  try {
    const codeMap = new Map<string, EmdnCode>();
    codes.forEach(c => {
      if (c && c.emdn_code) codeMap.set(c.emdn_code, c);
    });

    const path: EmdnCode[] = [];
    const visited = new Set<string>();
    let current: EmdnCode | undefined = codeMap.get(selectedCode.emdn_code) || selectedCode;

    // Walk up to root using parent_id, guarding against cycles and missing parents
    while (current && !visited.has(current.emdn_code)) {
      path.unshift(current);
      visited.add(current.emdn_code);

      if (current.level === 1 || !current.parent_id) break;
      const parent = codeMap.get(current.parent_id);
      if (!parent) break;
      current = parent;
    }

    // Fallback if we couldn't build a meaningful path for a non-root code
    if (selectedCode.level > 1 && path.length < 2) {
      return buildProperEmdnBreadcrumb(selectedCode.emdn_code, selectedCode.level);
    }

    const breadcrumb = path
      .map(n => `${n.emdn_code} - ${n.description || 'No description'}`)
      .join(' > ');

    // Debug info
    console.debug('🔧 EMDN breadcrumb built from dataset:', {
      selected: selectedCode.emdn_code,
      path: path.map(p => ({ code: p.emdn_code, level: p.level })),
      breadcrumb,
    });

    return breadcrumb;
  } catch (e) {
    console.warn('⚠️ Failed to build EMDN breadcrumb from dataset, using fallback.', e);
    return buildProperEmdnBreadcrumb(selectedCode.emdn_code, selectedCode.level);
  }
}

export function formatEmdnDisplay(code: EmdnCode): string {
  // Use the proper display text with level indicator
  return `${getEmdnDisplayText(code.emdn_code, code.description, code.level)} (Level ${code.level})`;
}

export function filterEmdnCodes(codes: EmdnCode[], searchTerm: string): EmdnCode[] {
  if (!searchTerm.trim()) return codes;
  
  const search = searchTerm.toLowerCase();
  return codes.filter(code => 
    code.emdn_code.toLowerCase().includes(search) ||
    code.description.toLowerCase().includes(search)
  );
}