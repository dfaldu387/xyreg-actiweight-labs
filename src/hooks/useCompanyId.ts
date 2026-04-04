
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useCompanyRole } from "@/context/CompanyRoleContext";

export function useCompanyId(): string | undefined {
  const { companyName: paramCompanyName, productId: paramProductId } = useParams<{ companyName: string; productId: string }>();
  const { companyRoles, activeCompanyRole, isLoading: rolesLoading } = useCompanyRole();
  const [companyId, setCompanyId] = useState<string | undefined>();
  const location = useLocation();
  const previousCompanyName = useRef<string | undefined>();
  const isResolving = useRef(false);

  // Derive company name and product ID from URL pathname as fallback
  // This is critical for components mounted outside <Routes> (e.g. FeedbackSystem)
  const { companyName, productId } = useMemo(() => {
    if (paramCompanyName || paramProductId) {
      return { companyName: paramCompanyName, productId: paramProductId };
    }
    const pathname = location.pathname;
    const companyMatch = pathname.match(/\/app\/company\/([^/]+)/);
    const productMatch = pathname.match(/\/app\/product\/([^/]+)/);
    return {
      companyName: companyMatch ? decodeURIComponent(companyMatch[1]) : undefined,
      productId: productMatch ? decodeURIComponent(productMatch[1]) : undefined,
    };
  }, [paramCompanyName, paramProductId, location.pathname]);
  
  const resolveCompanyId = useCallback(async () => {
    if (isResolving.current) return;
    isResolving.current = true;
    
    try {
      // CASE 1: No company name in URL - check if we're on a product route
      if (!companyName && productId && location.pathname.includes('/product/')) {
        const { data: product, error } = await supabase
          .from('products')
          .select('company_id')
          .eq('id', productId)
          .single();

        if (!error && product?.company_id) {
          setCompanyId(product.company_id);
          return;
        }

        setCompanyId(undefined);
        return;
      }

      // CASE 2: No company name - fall back to activeCompanyRole (not first role)
      if (!companyName) {
        if (activeCompanyRole) {
          setCompanyId(activeCompanyRole.companyId);
          return;
        }
        setCompanyId(undefined);
        return;
      }

      // CASE 3: We have a company name - resolve it to UUID
      const decodedName = companyName; // already decoded from useMemo
      
      // Check if it's already a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(decodedName)) {
        setCompanyId(decodedName);
        return;
      }

      // Check user's roles FIRST to avoid duplicate company name issues
      const matchingRole = companyRoles.find(role =>
        role.companyName.toLowerCase() === decodedName.toLowerCase()
      );

      if (matchingRole) {
        setCompanyId(matchingRole.companyId);
        return;
      }

      // Fallback: Look up company by name in database, filtered by user's access
      const { data: { user } } = await supabase.auth.getUser();
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, user_company_access!inner(user_id)')
        .eq('name', decodedName)
        .eq('user_company_access.user_id', user?.id || '');

      if (error || !companies || companies.length === 0) {
        setCompanyId(undefined);
        return;
      }
      
      setCompanyId(companies[0].id);
    } catch {
      setCompanyId(undefined);
    } finally {
      isResolving.current = false;
    }
  }, [companyName, productId, companyRoles, activeCompanyRole, location.pathname, rolesLoading]);

  // Reset when company name changes
  useEffect(() => {
    if (companyName !== previousCompanyName.current) {
      previousCompanyName.current = companyName;
      setCompanyId(undefined);
      isResolving.current = false;
    }
  }, [companyName]);

  // Main resolution effect
  useEffect(() => {
    if (rolesLoading) return;
    resolveCompanyId();
  }, [companyName, productId, rolesLoading, resolveCompanyId]);
  
  return companyId;
}
