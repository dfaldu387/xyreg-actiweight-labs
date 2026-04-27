
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
    try {
      // PARALLEL: Fetch companies and their products simultaneously
      const [companiesResult, productsResult] = await Promise.all([
        supabase
          .from('companies')
          .select(`
            id,
            name,
            country,
            srn,
            user_company_access!inner(user_id)
          `)
          .eq('is_archived', false)
          .eq('user_company_access.user_id', session?.user.id),
        supabase
          .from('products')
          .select(`
            id, name, company_id, status, progress,
            companies!inner(
              user_company_access!inner(user_id)
            )
          `)
          .eq('is_archived', false)
          .eq('companies.is_archived', false)
          .eq('companies.user_company_access.user_id', session?.user.id)
          .order('inserted_at', { ascending: false })
          .limit(1000)
      ]);

      const { data: companies, error: companiesError } = companiesResult;
      const { data: products, error: productsError } = productsResult;

      if (companiesError) throw companiesError;
      if (!companies || companies.length === 0) return [];

      // Build product index by company_id
      
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
