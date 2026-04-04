
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';

interface SimpleProduct {
  id: string;
  name: string;
  status?: "On Track" | "At Risk" | "Needs Attention";
  progress?: number;
  company_id: string;
}

interface SimpleClient {
  id: string;
  name: string;
  country: string;
  products: number;
  progress: number;
  status: "On Track" | "At Risk" | "Needs Attention";
  alerts: string[];
  productList: SimpleProduct[];
}

export function useSimpleClientsFixed() {
  const { session } = useAuth();
  const { isDevMode, selectedCompanies } = useDevMode();

  const normalizeStatus = (status: string | null | undefined): "On Track" | "At Risk" | "Needs Attention" => {
    if (status === "At Risk") return "At Risk";
    if (status === "Needs Attention") return "Needs Attention";
    return "On Track";
  };

  const fetchClients = async (): Promise<SimpleClient[]> => {
    const startTime = performance.now();
    const timings: { [key: string]: number } = {};
    
    try {
      // Get companies based on DevMode - OPTIMIZED: Single query with join
      const companiesStart = performance.now();
      
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select(`
          id, 
          name, 
          country, 
          srn,
          user_company_access!inner(user_id)
        `)
        .eq('is_archived', false)
        .eq('user_company_access.user_id', session?.user.id);
      
      const companiesEnd = performance.now();
      timings.companies = companiesEnd - companiesStart;
      
      if (companiesError) throw companiesError;
      if (!companies || companies.length === 0) return [];

      // OPTIMIZED: Single query for all products instead of pagination loop
      const productsStart = performance.now();
      const companyIds = companies.map(c => c.id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, company_id, status, progress')
        .in('company_id', companyIds)
        .eq('is_archived', false)
        .order('inserted_at', { ascending: false })
        .limit(1000); // Reasonable limit for performance

      const productsEnd = performance.now();
      timings.products = productsEnd - productsStart;
    
      // OPTIMIZED: Batch EUDAMED calls and add timeout protection
      const eudamedStart = performance.now();
      
      const eudamedPromises = companies
        .filter(c => c.srn?.trim() || c.name?.trim())
        .map(async (c) => {
          const srn = c.srn?.trim();
          const companyName = c.name?.trim();
          
          try {
            // Use Promise.race to add timeout protection
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('EUDAMED timeout')), 5000)
            );
            
            const eudamedPromise = Promise.all([
              srn ? supabase.rpc('count_eudamed_devices_by_srn', { p_srn: srn }) : Promise.resolve({ data: null }),
              companyName ? supabase.rpc('count_eudamed_company_devices', { company_identifier: companyName }) : Promise.resolve({ data: null })
            ]);
            
            const [srnResult, nameResult] = await Promise.race([eudamedPromise, timeoutPromise]) as any[];
            
            return {
              companyId: c.id,
              srn: srn,
              srnCount: srnResult?.data || 0,
              nameCount: nameResult?.data || 0
            };
          } catch (e) {
            return {
              companyId: c.id,
              srn: srn,
              srnCount: 0,
              nameCount: 0
            };
          }
        });

      const eudamedResults = await Promise.allSettled(eudamedPromises);
      const eudamedCounts = new Map();
      
      eudamedResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { companyId, srn, srnCount, nameCount } = result.value;
          if (srn) eudamedCounts.set(`srn:${srn}`, srnCount);
          eudamedCounts.set(`name:${companyId}`, nameCount);
        }
      });
      
      const eudamedEnd = performance.now();
      timings.eudamed = eudamedEnd - eudamedStart;
    
      // Build product index by company_id
      const processingStart = performance.now();
      
      const productsByCompany = new Map<string, SimpleProduct[]>();
      (products || []).forEach(p => {
        const arr = productsByCompany.get(p.company_id) || [];
        arr.push({ id: p.id, name: p.name, status: normalizeStatus(p.status), progress: p.progress || 0, company_id: p.company_id });
        productsByCompany.set(p.company_id, arr);
      });

      // Group companies by SRN (preferred) or normalized name
      const groups = new Map<string, { companies: typeof companies; key: string }>();
      companies.forEach((c) => {
        // Ensure company has a valid name
        if (!c.name || !c.name.trim()) {
          return; // Skip companies without names
        }
        
        const key = c.srn && c.srn.trim() 
          ? `srn:${c.srn.trim().toLowerCase()}` 
          : `name:${c.name.trim().toLowerCase()}`;
        const existing = groups.get(key);
        if (existing) {
          existing.companies.push(c);
        } else {
          groups.set(key, { companies: [c], key });
        }
      });

      // Aggregate into clients
      const clients: SimpleClient[] = Array.from(groups.values()).map(group => {
        const memberIds = group.companies.map(c => c.id);
        const allProducts = memberIds.flatMap(id => productsByCompany.get(id) || []);

        // Choose display company: prefer the one with most products (fixes duplicate SRN issue)
        const primary = group.companies
          .map(c => ({ c, count: (productsByCompany.get(c.id) || []).length }))
          .sort((a, b) => b.count - a.count)[0]?.c || group.companies[0];

        const progress = allProducts.length > 0
          ? Math.round(allProducts.reduce((sum, p) => sum + (p.progress || 0), 0) / allProducts.length)
          : 0;

        let status: "On Track" | "At Risk" | "Needs Attention" = "On Track";
        if (allProducts.some(p => normalizeStatus(p.status) === "At Risk")) {
          status = "At Risk";
        } else if (allProducts.some(p => normalizeStatus(p.status) === "Needs Attention")) {
          status = "Needs Attention";
        }

        // Use the new eudamedCounts map
        let eudamedTotal = 0;
        const srnInGroup = group.companies.find(c => c.srn && c.srn.trim())?.srn?.trim();
        if (srnInGroup) {
          eudamedTotal = eudamedCounts.get(`srn:${srnInGroup}`) || 0;
        }
        if (!eudamedTotal) {
          eudamedTotal = Math.max(0, ...group.companies.map(c => eudamedCounts.get(`name:${c.id}`) || 0));
        }

        return {
          id: primary.id,
          name: primary.name, // No fallback needed since we filter out companies without names
          country: primary.country || 'Unknown',
          products: Math.max(allProducts.length),
          progress,
          status,
          alerts: [],
          productList: allProducts
        };
      });
      
      const processingEnd = performance.now();
      timings.processing = processingEnd - processingStart;
      return clients;
      
    } catch (error) {
      throw error;
    }
  };

  const query = useQuery({
    queryKey: ['simple-clients-fixed', isDevMode, selectedCompanies?.length || 0],
    queryFn: fetchClients,
    enabled: !!session,
    staleTime: 30 * 1000, // 30 seconds - prevents duplicate calls within same page load
    gcTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data when possible
    retry: (failureCount) => {
      return failureCount < 2; // Reduced retries for faster failure
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Faster retry delays
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isDataLoaded: !query.isLoading && query.data !== undefined,
    refreshClients: query.refetch
  };
}
