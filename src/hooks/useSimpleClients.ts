
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import { useEffectiveUserRole } from '@/hooks/useEffectiveUserRole';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  status?: "On Track" | "At Risk" | "Needs Attention";
  progress?: number;
  company_id: string;
}

interface Client {
  id: string;
  name: string;
  country: string;
  products: number;
  progress: number;
  status: "On Track" | "At Risk" | "Needs Attention";
  alerts: any[];
  productList: Product[];
}

/**
 * Simplified client data fetching hook with minimal complexity
 */
export function useSimpleClients() {
  const { session } = useAuth();
  const { isDevMode, selectedCompanies } = useDevMode();
  const { effectiveRole, isAdmin } = useEffectiveUserRole();
  const { companyRoles } = useCompanyRole();
  const [companyAccess, setCompanyAccess] = useState<any[]>([]);
  
  // Simple query key
  const queryKey = ['simple-clients', isDevMode, selectedCompanies?.length || 0, isAdmin, companyRoles.length];

  // Helper function to ensure proper status type
  const normalizeStatus = (status: string | null | undefined): "On Track" | "At Risk" | "Needs Attention" => {
    if (status === "At Risk") return "At Risk";
    if (status === "Needs Attention") return "Needs Attention";
    return "On Track";
  };

  // Simplified data fetching
  const fetchClients = async (): Promise<Client[]> => {
    try {
      // Get companies based on user role and DevMode
      let companies;
      
      // If user is admin, show all companies (unless in dev mode with specific selection)
      if (isAdmin && (!isDevMode || !selectedCompanies || selectedCompanies.length === 0)) {
        // console.log('[useSimpleClients] Admin user - showing all companies');
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, country, srn')
          .eq('is_archived', false);
        
        if (error) throw error;
        companies = data || [];
      } else if (isDevMode && selectedCompanies && selectedCompanies.length > 0) {
        // Dev mode with specific company selection
        // console.log('[useSimpleClients] Dev mode - filtering by selected companies');
        const companyIds = selectedCompanies.map(c => c.id).filter(id => id);
        
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, country')
          .in('id', companyIds);
          
        if (error) throw error;
        companies = data || [];
      } else if (!isAdmin && companyRoles.length > 0) {
        // Non-admin user - only show assigned companies
        // console.log('[useSimpleClients] Non-admin user - filtering by assigned companies');
        const assignedCompanyIds = companyRoles.map(role => role.companyId).filter(id => id);
        
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, country, srn')
          .in('id', assignedCompanyIds)
          .eq('is_archived', false);
        
        if (error) throw error;
        companies = data || [];
      } else if (!isAdmin) {
        // Non-admin user with no company roles - return empty
        // console.log('[useSimpleClients] Non-admin user with no company roles - returning empty list');
        return [];
      } else {
        // Fallback for edge cases
        // console.log('[useSimpleClients] Using fallback company fetching');
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, country, srn')
          .eq('is_archived', false);
        
        if (error) throw error;
        companies = data || [];
      }

      if (!companies.length) {
        // console.log('[useSimpleClients] No companies found after filtering');
        return [];
      }

      // console.log('[useSimpleClients] Found companies:', companies.length);

      // Get products for all companies with detailed information
      const companyIds = companies.map(c => c.id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, company_id, status, progress')
        .in('company_id', companyIds)
        .eq('is_archived', false);

      if (productsError) throw productsError;

      // console.log('[useSimpleClients] Found products:', products?.length || 0);

      // Build product index by company_id
      const productsByCompany = new Map<string, Product[]>();
      (products || []).forEach(p => {
        const arr = productsByCompany.get(p.company_id) || [];
        arr.push({ id: p.id, name: p.name, status: normalizeStatus(p.status), progress: p.progress || 0, company_id: p.company_id });
        productsByCompany.set(p.company_id, arr);
      });

      // Group companies by SRN (preferred) or normalized name
      const groups = new Map<string, { companies: any[]; key: string }>();
      companies.forEach((c: any) => {
        const key = c.srn && c.srn.trim() ? `srn:${c.srn.trim().toLowerCase()}` : `name:${c.name.trim().toLowerCase()}`;
        const existing = groups.get(key);
        if (existing) {
          existing.companies.push(c);
        } else {
          groups.set(key, { companies: [c], key });
        }
      });

      // Aggregate into client format
      const clients: Client[] = Array.from(groups.values()).map(group => {
        const memberIds = group.companies.map(c => c.id);
        const allProducts = memberIds.flatMap((id: string) => productsByCompany.get(id) || []);

        // Choose display company: prefer the one with most products (fixes duplicate SRN issue)
        const primary = group.companies
          .map((c: any) => ({ c, count: (productsByCompany.get(c.id) || []).length }))
          .sort((a: any, b: any) => b.count - a.count)[0]?.c || group.companies[0];

        const progress = allProducts.length > 0
          ? Math.round(allProducts.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / allProducts.length)
          : 0;

        let status: "On Track" | "At Risk" | "Needs Attention" = "On Track";
        if (allProducts.some((p: any) => normalizeStatus(p.status) === "At Risk")) {
          status = "At Risk";
        } else if (allProducts.some((p: any) => normalizeStatus(p.status) === "Needs Attention")) {
          status = "Needs Attention";
        }

        return {
          id: primary.id,
          name: primary.name,
          country: primary.country || 'Unknown',
          products: allProducts.length,
          progress,
          status,
          alerts: [],
          productList: allProducts
        };
      });

      return clients;
      
    } catch (error) {
      console.error('[useSimpleClients] Error:', error);
      throw error;
    }
  };

  const query = useQuery({
    queryKey,
    queryFn: fetchClients,
    enabled: !!session || (isDevMode && selectedCompanies && selectedCompanies.length > 0),
    staleTime: 30 * 1000, // 30 seconds - prevents duplicate calls within same page load
    gcTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data when possible
    retry: 2,
    meta: {
      onError: (error: Error) => {
        console.error('[useSimpleClients] Query failed:', error);
        toast.error('Failed to load clients', {
          description: error.message
        });
      }
    }
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isDataLoaded: !query.isLoading && query.data !== undefined,
    refreshClients: query.refetch
  };
}
