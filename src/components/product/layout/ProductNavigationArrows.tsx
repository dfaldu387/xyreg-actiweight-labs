import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface CompanyProduct {
  id: string;
  name: string;
  is_master_device: boolean;
  parent_product_id: string | null;
}

interface ProductFamily {
  master: CompanyProduct;
  members: CompanyProduct[];
}

interface ProductFamilySwitcherProps {
  productId: string;
  companyId: string;
  className?: string;
}

export function ProductNavigationArrows({ 
  productId, 
  companyId, 
  className = "" 
}: ProductFamilySwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Fetch ALL company products
  const { data: allProducts } = useQuery<CompanyProduct[]>({
    queryKey: ['company-products-nav', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, is_master_device, parent_product_id')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as CompanyProduct[];
    },
    enabled: !!companyId,
  });

  // Group into families + standalone
  const { families, standalone, flatList } = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return { families: [] as ProductFamily[], standalone: [] as CompanyProduct[], flatList: [] as CompanyProduct[] };
    }

    const mastersMap = new Map<string, ProductFamily>();
    const assignedIds = new Set<string>();

    // First pass: identify masters
    allProducts.forEach(p => {
      if (p.is_master_device) {
        mastersMap.set(p.id, { master: p, members: [p] });
        assignedIds.add(p.id);
      }
    });

    // Second pass: assign children to their master
    allProducts.forEach(p => {
      if (!p.is_master_device && p.parent_product_id && mastersMap.has(p.parent_product_id)) {
        mastersMap.get(p.parent_product_id)!.members.push(p);
        assignedIds.add(p.id);
      }
    });

    // Sort members within each family
    mastersMap.forEach(family => {
      family.members.sort((a, b) => a.name.localeCompare(b.name));
    });

    const familiesArr = Array.from(mastersMap.values()).sort((a, b) =>
      a.master.name.localeCompare(b.master.name)
    );

    const standaloneArr = allProducts
      .filter(p => !assignedIds.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Build flat navigation list: families first (members in order), then standalone
    const flat: CompanyProduct[] = [];
    familiesArr.forEach(f => flat.push(...f.members));
    flat.push(...standaloneArr);

    return { families: familiesArr, standalone: standaloneArr, flatList: flat };
  }, [allProducts]);

  const currentIndex = flatList.findIndex(p => p.id === productId);

  if (flatList.length <= 1) {
    return null;
  }

  const handleNavigate = (newId: string) => {
    queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key.some(k => k === newId);
      },
    });

    const newPath = location.pathname.replace(
      `/product/${productId}`,
      `/product/${newId}`
    );
    navigate(newPath + location.search);
  };

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < flatList.length - 1;

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={!hasPrevious}
        onClick={() => hasPrevious && handleNavigate(flatList[currentIndex - 1].id)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} of {flatList.length}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto min-w-[220px]">
          {families.map((family, fi) => (
            <React.Fragment key={family.master.id}>
              {fi > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                {family.master.name} family
              </DropdownMenuLabel>
              {family.members.map((member) => (
                <DropdownMenuItem
                  key={member.id}
                  onClick={() => handleNavigate(member.id)}
                  className="flex items-center justify-between gap-2 pl-4"
                >
                  <span className={member.id === productId ? 'font-semibold' : ''}>
                    {member.name}
                  </span>
                  {member.id === productId && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </React.Fragment>
          ))}
          {standalone.length > 0 && families.length > 0 && <DropdownMenuSeparator />}
          {standalone.length > 0 && families.length > 0 && (
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Individual devices
            </DropdownMenuLabel>
          )}
          {standalone.map((product) => (
            <DropdownMenuItem
              key={product.id}
              onClick={() => handleNavigate(product.id)}
              className="flex items-center justify-between gap-2"
            >
              <span className={product.id === productId ? 'font-semibold' : ''}>
                {product.name}
              </span>
              {product.id === productId && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={!hasNext}
        onClick={() => hasNext && handleNavigate(flatList[currentIndex + 1].id)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
