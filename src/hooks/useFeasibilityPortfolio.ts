import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FeasibilityPortfolio {
  id: string;
  company_id: string;
  portfolio_name: string;
  description?: string;
  target_launch_date?: string;
  status?: string;
  source_bundle_id?: string;
  is_from_bundle: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeasibilityProduct {
  id: string;
  portfolio_id: string;
  product_id: string;
  role?: string;
  development_status?: string;
  quantity_in_bundle?: number;
  product: {
    id: string;
    name: string;
    trade_name?: string;
    description?: string;
    image?: string;
    images?: string[];
  };
}

export interface BudgetItem {
  id: string;
  portfolio_id: string;
  portfolio_product_id?: string | null;
  category: string;
  item_name: string;
  description?: string | null;
  worst_case?: number | null;
  likely_case?: number | null;
  best_case?: number | null;
  timing_months_from_start?: number | null;
  currency?: string | null;
}

export interface RevenueProjection {
  id: string;
  portfolio_id: string;
  portfolio_product_id: string;
  target_market: string;
  year_from_launch: number;
  worst_case_revenue?: number | null;
  likely_case_revenue?: number | null;
  best_case_revenue?: number | null;
  market_share_assumption?: number | null;
  currency?: string | null;
}

export function useFeasibilityBundles(companyId: string) {
  return useQuery({
    queryKey: ['feasibility-bundles', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_bundles')
        .select(`
          *,
          feasibility_portfolios!feasibility_portfolios_source_bundle_id_fkey(id, name, status)
        `)
        .eq('company_id', companyId)
        .eq('is_feasibility_study', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Flatten the portfolio data into each bundle
      return data?.map(bundle => ({
        ...bundle,
        portfolio_id: Array.isArray(bundle.feasibility_portfolios) && bundle.feasibility_portfolios.length > 0
          ? bundle.feasibility_portfolios[0].id
          : null,
        portfolio_name: Array.isArray(bundle.feasibility_portfolios) && bundle.feasibility_portfolios.length > 0
          ? bundle.feasibility_portfolios[0].name
          : null,
      })) || [];
    },
    enabled: !!companyId,
  });
}

export function useFeasibilityPortfolio(bundleId?: string) {
  return useQuery({
    queryKey: ['feasibility-portfolio', bundleId],
    queryFn: async () => {
      if (!bundleId) return null;

      const { data, error } = await supabase
        .from('feasibility_portfolios')
        .select(`
          *,
          product_bundles!feasibility_portfolios_source_bundle_id_fkey(target_markets)
        `)
        .eq('source_bundle_id', bundleId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Flatten the bundle data
      if (data && data.product_bundles) {
        return {
          ...data,
          target_markets: Array.isArray(data.product_bundles) 
            ? data.product_bundles[0]?.target_markets 
            : (data.product_bundles as any)?.target_markets
        };
      }
      
      return data;
    },
    enabled: !!bundleId,
  });
}

export function useCreateFeasibilityPortfolio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bundleId, companyId }: { bundleId: string; companyId: string }) => {
      // Check if portfolio already exists for this bundle
      const { data: existingPortfolio } = await supabase
        .from('feasibility_portfolios')
        .select('*')
        .eq('source_bundle_id', bundleId)
        .single();

      let portfolio = existingPortfolio;

      // If portfolio doesn't exist, create it
      if (!portfolio) {
        // Get bundle details
        const { data: bundle, error: bundleError } = await supabase
          .from('product_bundles')
          .select('bundle_name, description, target_markets')
          .eq('id', bundleId)
          .single();

        if (bundleError) throw bundleError;

        // Get current user for created_by
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Create portfolio
        const { data: newPortfolio, error: portfolioError } = await supabase
          .from('feasibility_portfolios')
          .insert({
            company_id: companyId,
            name: bundle.bundle_name,
            description: bundle.description,
            source_bundle_id: bundleId,
            is_from_bundle: true,
            status: 'concept',
            created_by: user.id,
          })
          .select()
          .single();

        if (portfolioError) throw portfolioError;
        portfolio = newPortfolio;
      }

      // Get bundle members
      const { data: members, error: membersError } = await supabase
        .from('product_bundle_members')
        .select('product_id, sibling_group_id, relationship_type, quantity, multiplier')
        .eq('bundle_id', bundleId);

      if (membersError) throw membersError;

      // Map relationship types to roles (valid: primary, accessory, software, consumable, other)
      const roleMap: Record<string, string> = {
        component: 'primary',
        required: 'primary',
        accessory: 'accessory',
        consumable: 'consumable',
        optional: 'accessory',
        replacement_part: 'consumable',
        software: 'software',
      };

      // Get product names for portfolio products
      if (members && members.length > 0) {
        // Collect both individual products and sibling groups
        const productIds = members
          .filter(m => m.product_id)
          .map(m => m.product_id!);
        
        const siblingGroupIds = members
          .filter(m => m.sibling_group_id && !m.product_id)
          .map(m => m.sibling_group_id!);

        // Get individual product names
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        // Get sibling group names from product_sibling_groups table
        const { data: siblingGroups } = siblingGroupIds.length > 0
          ? await supabase
              .from('product_sibling_groups')
              .select('id, name')
              .in('id', siblingGroupIds)
          : { data: null };

        const productNameMap = new Map(products?.map(p => [p.id, p.name]) || []);
        const siblingGroupNameMap = new Map(siblingGroups?.map(sg => [sg.id, sg.name]) || []);

        const portfolioProducts = members.map((member) => {
          // For sibling groups, product_id stays null to avoid FK violation
          const productId = member.product_id || null;
          const productName = member.product_id
            ? productNameMap.get(member.product_id!)
            : siblingGroupNameMap.get(member.sibling_group_id!);

          return {
            portfolio_id: portfolio.id,
            product_id: productId,
            product_name: productName || 'Unknown Product',
            role: roleMap[member.relationship_type] || 'other',
            quantity_in_bundle: member.quantity || member.multiplier || 1,
            development_status: 'existing',
          };
        });

        console.log('[CREATE FEASIBILITY] Portfolio products to insert:', portfolioProducts);

        // Delete existing products first (in case of re-sync)
        await supabase
          .from('feasibility_portfolio_products')
          .delete()
          .eq('portfolio_id', portfolio.id);

        const { error: productsError } = await supabase
          .from('feasibility_portfolio_products')
          .insert(portfolioProducts);

        if (productsError) {
          console.error('[CREATE FEASIBILITY] Error inserting products:', productsError);
          throw productsError;
        }

        console.log('[CREATE FEASIBILITY] Successfully inserted', portfolioProducts.length, 'products');
      }

      return portfolio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feasibility-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['feasibility-products'] });
      toast({
        title: 'Success',
        description: 'Feasibility study created from bundle',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create feasibility study: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useFeasibilityProducts(portfolioId?: string) {
  return useQuery({
    queryKey: ['feasibility-products', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return [];

      console.log('[FETCH FEASIBILITY] Fetching products for portfolio:', portfolioId);

      const { data, error } = await supabase
        .from('feasibility_portfolio_products')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('role', { ascending: true });

      if (error) {
        console.error('[FETCH FEASIBILITY] Error:', error);
        throw error;
      }

      console.log('[FETCH FEASIBILITY] Raw data:', data);

      // For each product, fetch details
      const enrichedProducts = await Promise.all(
        (data || []).map(async (item) => {
          // If product_id is null, use the stored product_name (sibling group)
          if (!item.product_id) {
            return {
              ...item,
              product: {
                id: item.id, // Use the feasibility product id
                name: item.product_name || 'Unknown Product',
                trade_name: undefined,
                description: undefined,
                image: undefined,
                images: [],
              },
            };
          }

          // Fetch from products table
          const { data: product } = await supabase
            .from('products')
            .select('id, name, trade_name, description, image, images')
            .eq('id', item.product_id)
            .maybeSingle();

          return {
            ...item,
            product: product || {
              id: item.product_id,
              name: item.product_name || 'Unknown Product',
              trade_name: undefined,
              description: undefined,
              image: undefined,
              images: [],
            },
          };
        })
      );

      console.log('[FETCH FEASIBILITY] Enriched products:', enrichedProducts);

      return enrichedProducts as FeasibilityProduct[];
    },
    enabled: !!portfolioId,
  });
}

export function useBudgetItems(portfolioId?: string, portfolioProductId?: string) {
  return useQuery({
    queryKey: ['budget-items', portfolioId, portfolioProductId],
    queryFn: async () => {
      if (!portfolioId) return [];

      let query = supabase
        .from('feasibility_budget_items')
        .select('*')
        .eq('portfolio_id', portfolioId);

      if (portfolioProductId) {
        query = query.eq('portfolio_product_id', portfolioProductId);
      }

      const { data, error } = await query.order('category', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!portfolioId,
  });
}

export function useRevenueProjections(portfolioId?: string, portfolioProductId?: string) {
  return useQuery({
    queryKey: ['revenue-projections', portfolioId, portfolioProductId],
    queryFn: async () => {
      if (!portfolioId) return [];

      let query = supabase
        .from('feasibility_revenue_projections')
        .select('*')
        .eq('portfolio_id', portfolioId);

      if (portfolioProductId) {
        query = query.eq('portfolio_product_id', portfolioProductId);
      }

      const { data, error } = await query.order('year_from_launch', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!portfolioId,
  });
}

export function useBundleRelationshipsForCalculation(bundleId: string) {
  return useQuery({
    queryKey: ['bundle-relationships-calculation', bundleId],
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from('product_bundle_members')
        .select(`
          *,
          products!product_bundle_members_product_id_fkey (id, name, trade_name),
          product_sibling_groups!product_bundle_members_sibling_group_id_fkey (id, name, basic_udi_di)
        `)
        .eq('bundle_id', bundleId);

      if (membersError) throw membersError;

      // Get sibling group IDs
      const siblingGroupIds = members
        ?.filter((m: any) => m.sibling_group_id)
        .map((m: any) => m.sibling_group_id) || [];

      // Fetch sibling assignments if there are any sibling groups
      let siblingAssignmentsMap = new Map();
      if (siblingGroupIds.length > 0) {
        const { data: siblingGroups } = await supabase
          .from('product_sibling_groups')
          .select(`
            id,
            product_sibling_assignments(
              id,
              product_id,
              percentage,
              products(id, name, trade_name)
            )
          `)
          .in('id', siblingGroupIds);

        siblingGroups?.forEach((group: any) => {
          siblingAssignmentsMap.set(group.id, group.product_sibling_assignments);
        });
      }

      // Enrich with product names and sibling assignments
      const enriched = (members || []).map((member: any) => {
        const productName = member.product_id
          ? member.products?.trade_name || member.products?.name || 'Unknown Product'
          : member.product_sibling_groups?.name || 'Unknown Group';

        const siblingAssignments = member.sibling_group_id 
          ? siblingAssignmentsMap.get(member.sibling_group_id) 
          : null;

        return {
          ...member,
          name: productName,
          sibling_assignments: siblingAssignments,
        };
      });

      return enriched;
    },
    enabled: !!bundleId,
  });
}
