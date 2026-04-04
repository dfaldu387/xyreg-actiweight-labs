
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Layers, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreatePlatformDialog } from './CreatePlatformDialog';

interface ProductPlatformSelectorProps {
  companyId: string;
  selectedPlatform?: string;
  onPlatformSelect: (platform: string) => void;
  onBaseProductSelect: (platform: string, baseProductId: string) => void;
  onPlatformAndBaseSelect?: (platform: string, baseProductId: string) => void;
  currentProductId?: string;
  className?: string;
}

interface Platform {
  platform: string;
  productCount: number;
  products: Array<{ id: string; name: string; }>;
}

export function ProductPlatformSelector({
  companyId,
  selectedPlatform,
  onPlatformSelect,
  onBaseProductSelect,
  onPlatformAndBaseSelect,
  currentProductId,
  className
}: ProductPlatformSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: platforms = [], isLoading, error } = useQuery({
    queryKey: ['product-platforms', companyId],
    queryFn: async (): Promise<Platform[]> => {
      // Get standalone company platforms
      const { data: companyPlatforms, error: platformError } = await supabase
        .from('company_platforms')
        .select('name')
        .eq('company_id', companyId)
        .order('name');

      if (platformError) {
        throw platformError;
      }

      // Get products with platforms
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name, product_platform')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .not('product_platform', 'is', null);

      if (productError) {
        throw productError;
      }

      // Group products by platform
      const platformMap = new Map<string, Array<{ id: string; name: string; }>>();
      
      // First add all company platforms (even if they have no products)
      companyPlatforms?.forEach(platform => {
        if (!platformMap.has(platform.name)) {
          platformMap.set(platform.name, []);
        }
      });

      // Then add products to their platforms
      products?.forEach(product => {
        if (product.product_platform) {
          if (!platformMap.has(product.product_platform)) {
            platformMap.set(product.product_platform, []);
          }
          platformMap.get(product.product_platform)!.push({
            id: product.id,
            name: product.name
          });
        }
      });

      const result = Array.from(platformMap.entries()).map(([platform, products]) => ({
        platform,
        productCount: products.length,
        products
      }));

      return result;
    },
    enabled: !!companyId,
    staleTime: 30000,
    gcTime: 300000
  });

const handlePlatformCreated = (platform: string, baseProductId: string) => {
  if (onPlatformAndBaseSelect) {
    onPlatformAndBaseSelect(platform, baseProductId);
  } else {
    onPlatformSelect(platform);
    onBaseProductSelect(platform, baseProductId);
  }
  setShowCreateDialog(false);
};

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={className} disabled={isLoading}>
            <Layers className="h-4 w-4 mr-2" />
            {isLoading ? (
              'Loading...'
            ) : selectedPlatform ? (
              <>
                {selectedPlatform}
                <Badge variant="secondary" className="ml-2">
                  Platform
                </Badge>
              </>
            ) : (
              'Select Device Platform'
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[9991] w-64 bg-popover">
          <DropdownMenuLabel>Device Platforms</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {platforms.length === 0 ? (
            <DropdownMenuItem disabled>
              No platforms found {error && `(Error: ${error.message})`}
            </DropdownMenuItem>
          ) : (
            platforms.map((platform) => (
              <DropdownMenuItem
                key={platform.platform}
                onClick={() => { setDropdownOpen(false); onPlatformSelect(platform.platform); }}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{platform.platform}</span>
                  <span className="text-xs text-muted-foreground">
                    {platform.productCount} device{platform.productCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {platform.platform === selectedPlatform && (
                  <Badge variant="secondary" className="text-xs">Selected</Badge>
                )}
              </DropdownMenuItem>
            ))
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => { setDropdownOpen(false); setShowCreateDialog(true); }}
            className="text-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Platform
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreatePlatformDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        companyId={companyId}
        currentProductId={currentProductId}
        onPlatformCreated={handlePlatformCreated}
      />
    </>
  );
}
