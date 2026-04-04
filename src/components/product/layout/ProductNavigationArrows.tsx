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
} from '@/components/ui/dropdown-menu';

interface FamilyMember {
  id: string;
  name: string;
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

  // Step 1: Get current product's parent info
  const { data: productInfo } = useQuery({
    queryKey: ['product-family-info', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, is_master_device, parent_product_id')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Step 2: Determine the family root ID
  const rootId = React.useMemo(() => {
    if (!productInfo) return null;
    if (productInfo.is_master_device) return productInfo.id;
    if (productInfo.parent_product_id) return productInfo.parent_product_id;
    return null;
  }, [productInfo]);

  // Step 3: Fetch all family members (root + all children)
  const { data: familyMembers } = useQuery<FamilyMember[]>({
    queryKey: ['product-family-members', rootId, companyId],
    queryFn: async () => {
      if (!rootId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .or(`id.eq.${rootId},parent_product_id.eq.${rootId}`)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as FamilyMember[];
    },
    enabled: !!rootId && !!companyId,
  });

  const sortedMembers = React.useMemo(() => {
    if (!familyMembers || familyMembers.length === 0) return [];
    return [...familyMembers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [familyMembers]);

  const currentIndex = sortedMembers.findIndex(p => p.id === productId);

  if (sortedMembers.length <= 1) {
    return null;
  }

  const handleNavigate = (newId: string) => {
    // Remove all cached queries for the target device so fresh data must be fetched
    // (invalidateQueries only triggers background refetch and still shows stale cache)
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
  const hasNext = currentIndex < sortedMembers.length - 1;

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={!hasPrevious}
        onClick={() => hasPrevious && handleNavigate(sortedMembers[currentIndex - 1].id)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} of {sortedMembers.length}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto min-w-[200px]">
          {sortedMembers.map((member) => (
            <DropdownMenuItem
              key={member.id}
              onClick={() => handleNavigate(member.id)}
              className="flex items-center justify-between gap-2"
            >
              <span className={member.id === productId ? 'font-semibold' : ''}>
                {member.name}
              </span>
              {member.id === productId && (
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
        onClick={() => hasNext && handleNavigate(sortedMembers[currentIndex + 1].id)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
