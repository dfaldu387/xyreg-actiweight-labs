import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Client } from '@/types/client';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import { debounce } from '@/utils/debounce';
import { useStableCallback } from './useStableCallback';
import { createStableArray } from '@/utils/memoUtils';
import { CachedClientData } from '@/types/company';

// Configuration constants
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds
const DEBOUNCE_TIME = 500; // 500ms debounce time for frequent operations

// Helper function to validate UUID format
const isValidUuid = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * A custom hook for efficiently fetching and managing client data
 * with optimized rendering performance and caching via react-query
 */
export function useEfficientClients() {
  // Core state
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Auth and DevMode contexts
  const { session } = useAuth();
  const { isDevMode, selectedCompanies } = useDevMode();
  const queryClient = useQueryClient();
  
  // Stable references to prevent unnecessary re-renders
  const selectedCompaniesIds = useRef<string[]>([]);
  
  // Update the selectedCompaniesIds ref when selectedCompanies changes
  useEffect(() => {
    if (isDevMode && selectedCompanies && selectedCompanies.length > 0) {
      // Filter out any invalid UUIDs to prevent database errors
      const validCompanyIds = selectedCompanies
        .map(c => c.id)
        .filter(id => isValidUuid(id));
      
      // Log if any invalid IDs were filtered out
      if (validCompanyIds.length < selectedCompanies.length) {
        console.warn(
          `[useEfficientClients] Filtered out ${selectedCompanies.length - validCompanyIds.length} invalid company IDs. ` +
          `Original: [${selectedCompanies.map(c => c.id).join(', ')}], ` +
          `Valid: [${validCompanyIds.join(', ')}]`
        );
        
        toast.error("Some company IDs were invalid and have been filtered out", {
          description: "Please update your DevMode company selections"
        });
      }
      
      selectedCompaniesIds.current = validCompanyIds;
      // console.log("[useEfficientClients] DevMode companies updated:", validCompanyIds.length, "valid companies");
      // console.log("[useEfficientClients] Valid Company IDs for filtering:", validCompanyIds);
    } else {
      selectedCompaniesIds.current = [];
      if (isDevMode) {
        // console.log("[useEfficientClients] No companies selected in DevMode");
      }
    }
  }, [isDevMode, selectedCompanies]);
  
  // Enable/disable query based on session and devMode state
  const enabled = !!session || (isDevMode && selectedCompaniesIds.current.length > 0);

  // The main query key that will change based on dev mode and selected companies
  const queryKey = ['clients', isDevMode, selectedCompaniesIds.current];

  // The actual data fetching function used by react-query
  const fetchClientsData = useStableCallback(async (): Promise<Client[]> => {
    console.time('[useEfficientClients] fetchClients');
    
    if (!session && !isDevMode) {
      // console.log("[useEfficientClients] No session and not in DevMode - cannot fetch clients");
      throw new Error("You must be logged in to view clients");
    }
    
    try {
      // 1. Get companies based on DevMode status
      let companies;
      
      if (isDevMode && selectedCompaniesIds.current.length > 0) {
        // console.log("[useEfficientClients] DevMode active: Fetching selected companies:", selectedCompaniesIds.current);
        
        // Safety check: ensure all IDs are valid UUIDs
        const validCompanyIds = selectedCompaniesIds.current.filter(id => isValidUuid(id));
        
        if (validCompanyIds.length === 0) {
          console.error("[useEfficientClients] No valid company IDs to query");
          throw new Error("No valid company IDs found in DevMode selection");
        }
        
        // Test connectivity first for DevMode
        // console.log("[useEfficientClients] Testing Supabase connectivity in DevMode...");
        const { error: connectTest } = await supabase
          .from('companies')
          .select('count')
          .limit(1);
          
        if (connectTest) {
          console.error("[useEfficientClients] DevMode connectivity test failed:", connectTest);
          throw new Error(`Database connection failed: ${connectTest.message}`);
        }
        
        // Get only the selected companies in DevMode (including archived ones for testing)
        const { data: filteredCompanies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, country')
          .in('id', validCompanyIds);
          
        if (companiesError) {
          console.error(`[useEfficientClients] Failed to fetch companies: ${companiesError.message}`);
          throw new Error(`Failed to fetch companies: ${companiesError.message}`);
        }
        
        companies = filteredCompanies;
        // console.log("[useEfficientClients] Retrieved companies in DevMode:", companies?.length);
        
        // Debug: Check which companies were returned
        if (companies && companies.length > 0) {
          // console.log("[useEfficientClients] Companies returned:", companies.map(c => ({ id: c.id, name: c.name })));
        } else {
          console.warn("[useEfficientClients] No companies found matching the selected IDs in DevMode");
          console.warn("[useEfficientClients] Requested IDs:", validCompanyIds);
          console.warn("[useEfficientClients] This could mean the companies were deleted or the IDs are incorrect");
        }
        
      } else {
        // Standard behavior - get all non-archived companies
        const { data: allCompanies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, country')
          .eq('is_archived', false);
        
        if (companiesError) {
          console.error(`[useEfficientClients] Failed to fetch companies: ${companiesError.message}`);
          throw new Error(`Failed to fetch companies: ${companiesError.message}`);
        }
        
        companies = allCompanies;
        // console.log(`[useEfficientClients] Retrieved ${companies?.length || 0} companies from database (standard mode)`);
      }
      
      // Early return if no companies found
      if (!companies || companies.length === 0) {
        // console.log("[useEfficientClients] No companies found - returning empty array");
        return [];
      }
      
      const companyIds = companies.map(c => c.id);
      
      // 2. Batch fetch all products for all companies in a single query (including archived for DevMode)
      const productQuery = supabase
        .from('products')
        .select('id, name, company_id, status, progress')
        .in('company_id', companyIds);
        
      // Only filter archived products in standard mode
      if (!isDevMode) {
        productQuery.eq('is_archived', false);
      }
      
      const { data: products, error: productsError } = await productQuery;
        
      if (productsError) {
        console.error(`[useEfficientClients] Failed to fetch products: ${productsError.message}`);
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }
      
      // console.log(`[useEfficientClients] Retrieved ${products?.length || 0} products for ${companyIds.length} companies`);
      
      // 3. Generate a mapping of company_id to array of products
      const companyProducts: Record<string, any[]> = {};
      products?.forEach(product => {
        if (!companyProducts[product.company_id]) {
          companyProducts[product.company_id] = [];
        }
        companyProducts[product.company_id].push(product);
      });
      
      // 4. Calculate overall progress and derive status for each company
      const processedClients = companies.map(company => {
        const companyProds = companyProducts[company.id] || [];
        
        // Calculate average progress
        const progress = companyProds.length > 0
          ? Math.round(companyProds.reduce((sum, p) => sum + (p.progress || 0), 0) / companyProds.length)
          : 0;
        
        // Determine status based on products
        let status: "On Track" | "At Risk" | "Needs Attention" = "On Track";
        if (companyProds.some(p => p.status === "At Risk")) {
          status = "At Risk";
        } else if (companyProds.some(p => p.status === "Needs Attention")) {
          status = "Needs Attention";
        }
        
        return {
          id: company.id,
          name: company.name,
          country: company.country || 'Unknown',
          products: companyProds.length,
          progress,
          status,
          alerts: [], // Will populate in the next step
        };
      });
      
      // 5. Efficiently get company alerts using a single query pattern
      const clientsWithAlerts = await fetchBatchAlerts(processedClients, companyProducts);
      
      console.timeEnd('[useEfficientClients] fetchClients');
      // console.log(`[useEfficientClients] Successfully fetched ${clientsWithAlerts.length} clients`);
      
      return clientsWithAlerts;
      
    } catch (err) {
      console.error("[useEfficientClients] Error fetching clients:", err);
      throw err;
    }
  });

  // Batch fetch alerts for all companies
  const fetchBatchAlerts = useStableCallback(async (
    companies: Omit<Client, 'alerts'>[],
    companyProducts: Record<string, any[]>
  ): Promise<Client[]> => {
    if (companies.length === 0) return [];
    
    const companyMap = new Map(companies.map(c => [c.id, { ...c, alerts: [] as string[] }]));
    const allProductIds = Object.values(companyProducts).flat().map(p => p.id);
    
    try {
      // console.log("[useEfficientClients] Fetching batch alerts for products:", allProductIds.length);
      
      // Get overdue documents in a single query
      if (allProductIds.length > 0) {
        // Query for overdue documents
        const { data: overdueDocuments, error: overdueError } = await supabase
          .from('documents')
          .select('product_id')
          .in('product_id', allProductIds)
          .lt('due_date', new Date().toISOString())
          .eq('status', 'Pending');

        if (overdueError) {
          console.error("[useEfficientClients] Error fetching overdue documents:", overdueError);
        } else {
          // console.log(`[useEfficientClients] Found ${overdueDocuments?.length || 0} overdue documents`);
        }

        // Query for unscheduled audits
        const { data: unscheduledAudits, error: auditsError } = await supabase
          .from('product_audits')
          .select('product_id')
          .in('product_id', allProductIds)
          .eq('status', 'Planned')
          .lt('deadline_date', new Date().toISOString());
        
        if (auditsError) {
          console.error("[useEfficientClients] Error fetching unscheduled audits:", auditsError);
        } else {
          // console.log(`[useEfficientClients] Found ${unscheduledAudits?.length || 0} unscheduled audits`);
        }
        
        // Create product ID lookup maps for faster processing
        const overdueByProduct = new Map<string, number>();
        const auditsByProduct = new Map<string, number>();
        
        // Count overdue documents per product
        overdueDocuments?.forEach(doc => {
          const count = overdueByProduct.get(doc.product_id) || 0;
          overdueByProduct.set(doc.product_id, count + 1);
        });
        
        // Count unscheduled audits per product
        unscheduledAudits?.forEach(audit => {
          const count = auditsByProduct.get(audit.product_id) || 0;
          auditsByProduct.set(audit.product_id, count + 1);
        });
        
        // Process results into company alerts
        for (const [companyId, products] of Object.entries(companyProducts)) {
          const company = companyMap.get(companyId);
          if (!company) continue;

          const productIds = products.map(p => p.id);
          
          // Count overdue documents for this company's products
          let overdueDocs = 0;
          productIds.forEach(productId => {
            overdueDocs += overdueByProduct.get(productId) || 0;
          });
          
          if (overdueDocs > 0) {
            company.alerts.push(`${overdueDocs} document${overdueDocs === 1 ? '' : 's'} overdue`);
          }
          
          // Count unscheduled audits for this company's products
          let unscheduled = 0;
          productIds.forEach(productId => {
            unscheduled += auditsByProduct.get(productId) || 0;
          });
          
          if (unscheduled > 0) {
            company.alerts.push(`${unscheduled} audit${unscheduled === 1 ? '' : 's'} unscheduled`);
          }
        }
      }
    } catch (error) {
      console.error("[useEfficientClients] Error fetching batch alerts:", error);
    }
    
    return Array.from(companyMap.values());
  });
  
  // The main react-query hook
  const { 
    data: clients = [], 
    isLoading, 
    error, 
    refetch
  } = useQuery<Client[], Error>({
    queryKey,
    queryFn: fetchClientsData,
    enabled,
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION * 2,
    retry: (failureCount, error) => {
      // In DevMode, be more aggressive about retrying
      if (isDevMode && failureCount < 3) {
        // console.log(`[useEfficientClients] DevMode retry attempt ${failureCount + 1}/3`);
        return true;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: Error) => {
        console.error("[useEfficientClients] Query error:", error);
        toast.error("Failed to fetch clients", {
          description: error.message || "Please check your connection and try again.",
        });
      },
      onSuccess: () => {
        setIsDataLoaded(true);
      }
    }
  });

  // Create a debounced version of the refetch function
  const debouncedRefetch = useCallback(
    debounce((force: boolean) => {
      if (force) {
        queryClient.invalidateQueries({ queryKey });
      }
      refetch();
      // console.log("[useEfficientClients] Manual refresh triggered", force ? "(forced)" : "");
    }, DEBOUNCE_TIME),
    [refetch, queryClient, queryKey]
  );

  // Stable refresh function for consumers
  const refreshClients = useCallback((force = true) => {
    return debouncedRefetch(force);
  }, [debouncedRefetch]);

  // Get client by ID - first check cache, then fetch if needed
  const getClientById = useCallback(async (id: string): Promise<Client | null> => {
    // First check the current clients array
    const cachedClient = clients.find(c => c.id === id);
    if (cachedClient) return cachedClient;
    
    // If not in cache, fetch individually
    try {
      // Check if this client is already in query cache
      const queryCache = queryClient.getQueryData<Client[]>(queryKey);
      const cachedResult = queryCache?.find(c => c.id === id);
      if (cachedResult) return cachedResult;
      
      // If still not found, fetch from API
      // console.log(`[useEfficientClients] Client ${id} not found in cache, fetching from API`);
      
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, country')
        .eq('id', id)
        .maybeSingle();
        
      if (!company) return null;
      
      // Get products for this company
      const { data: products } = await supabase
        .from('products')
        .select('id, name, status, progress')
        .eq('company_id', id)
        .eq('is_archived', false);
      
      // Calculate status and progress
      let status: "On Track" | "At Risk" | "Needs Attention" = "On Track";
      if (products?.some(p => p.status === "At Risk")) {
        status = "At Risk";
      } else if (products?.some(p => p.status === "Needs Attention")) {
        status = "Needs Attention";
      }
      
      const progress = products && products.length > 0
        ? Math.round(products.reduce((sum, p) => sum + (p.progress || 0), 0) / products.length)
        : 0;
      
      // Fetch alerts for this specific company's products
      const companyProducts: Record<string, any[]> = {};
      companyProducts[id] = products || [];
      
      // Process alerts
      const alerts: string[] = [];
      
      if (products && products.length > 0) {
        const productIds = products.map(p => p.id);
        
        // Check for overdue documents
        const { data: overdueDocuments } = await supabase
          .from('documents')
          .select('id')
          .in('product_id', productIds)
          .lt('due_date', new Date().toISOString())
          .eq('status', 'Pending');
          
        if (overdueDocuments && overdueDocuments.length > 0) {
          alerts.push(`${overdueDocuments.length} document${overdueDocuments.length === 1 ? '' : 's'} overdue`);
        }
        
        // Check for unscheduled audits
        const { data: unscheduledAudits } = await supabase
          .from('product_audits')
          .select('id')
          .in('product_id', productIds)
          .eq('status', 'Planned')
          .lt('deadline_date', new Date().toISOString());
          
        if (unscheduledAudits && unscheduledAudits.length > 0) {
          alerts.push(`${unscheduledAudits.length} audit${unscheduledAudits.length === 1 ? '' : 's'} unscheduled`);
        }
      }
      
      const client: Client = {
        id: company.id,
        name: company.name,
        country: company.country || 'Unknown',
        products: products?.length || 0,
        progress,
        status,
        alerts
      };
      
      return client;
      
    } catch (err) {
      console.error("[useEfficientClients] Error fetching client by ID:", err);
      return null;
    }
  }, [clients, queryClient, queryKey]);
  
  // Find client by name in the current dataset
  const findClientByName = useCallback((name: string): Client | undefined => {
    return clients.find(client => client.name === name);
  }, [clients]);

  // Return a stable array of clients to prevent unnecessary re-renders
  const stableClients = createStableArray(clients);
  
  // Return a stable object reference to prevent unnecessary re-renders
  return {
    clients: createStableArray(clients),
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    isDataLoaded,
    refreshClients,
    getClientById,
    findClientByName
  };
}
