import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, UserX, ChevronRight, Building, Package, Layers } from "lucide-react";
import { useDevMode } from "@/context/DevModeContext";
import { supabase } from "@/integrations/supabase/client";

interface HierarchicalProductSelectorProps {
  currentProductId?: string;
  onProductChange: (value: string) => void;
  isLoading?: boolean;
  companyId?: string;
}

interface GroupedProduct {
  id: string;
  name: string;
  company_id: string;
  company_name: string;
  class?: string;
  product_platform?: string;
}

export function HierarchicalProductSelector({ 
  currentProductId, 
  onProductChange, 
  isLoading: externalLoading,
  companyId
}: HierarchicalProductSelectorProps) {
  const { isDevMode, getCompanyInternalStatus } = useDevMode();
  const [allProducts, setAllProducts] = useState<GroupedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products with hierarchy data
  useEffect(() => {
    const fetchHierarchicalProducts = async () => {
      setIsLoading(true);
      try {
        // First get companies
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name')
          .eq('is_archived', false);

        if (companiesError) throw companiesError;

        if (!companies || companies.length === 0) {
          setAllProducts([]);
          return;
        }

        // Then get products with hierarchy fields
        const companyIds = companies.map(c => c.id);
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, company_id, class, product_platform')
          .in('company_id', companyIds)
          .eq('is_archived', false);

        if (productsError) throw productsError;

        // Map products with company names
        const productsWithCompanyNames: GroupedProduct[] = (products || []).map(product => {
          const company = companies.find(c => c.id === product.company_id);
          return {
            ...product,
            company_name: company?.name || 'Unknown Company'
          };
        });

        setAllProducts(productsWithCompanyNames);
      } catch (error) {
        console.error('Error fetching hierarchical products:', error);
        setAllProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHierarchicalProducts();
  }, []);

  // Group products hierarchically: Company > Category > Platform > Products
  const groupedProducts = React.useMemo(() => {
    const groups: Record<string, Record<string, Record<string, GroupedProduct[]>>> = {};
    
    allProducts.forEach(product => {
      const companyName = product.company_name;
      const categoryName = product.class ? getCategoryDisplayName(product.class) : 'Uncategorized';
      const platformName = product.product_platform || 'No Platform';
      
      if (!groups[companyName]) {
        groups[companyName] = {};
      }
      if (!groups[companyName][categoryName]) {
        groups[companyName][categoryName] = {};
      }
      if (!groups[companyName][categoryName][platformName]) {
        groups[companyName][categoryName][platformName] = [];
      }
      
      groups[companyName][categoryName][platformName].push(product);
    });
    
    return groups;
  }, [allProducts]);

  // Map medical device classes to friendly names (consistent with CategorizedPortfolioView)
  const getCategoryDisplayName = (classValue: string) => {
    if (classValue === 'class-i') return 'Cat A';
    if (classValue === 'class-iia') return 'Cat B';
    if (classValue === 'class-iib') return 'Cat C';
    if (classValue === 'class-iii') return 'Cat D';
    return classValue;
  };

  const renderHierarchicalOptions = () => {
    const options: React.ReactNode[] = [];
    
    Object.entries(groupedProducts).forEach(([companyName, categories]) => {
      // Company header (disabled)
      options.push(
        <SelectItem key={`company-${companyName}`} value={`company-${companyName}`} disabled>
          <div className="flex items-center gap-2 font-medium text-primary">
            <Building className="h-4 w-4" />
            {companyName}
          </div>
        </SelectItem>
      );
      
      Object.entries(categories).forEach(([categoryName, platforms]) => {
        // Category header (disabled)
        options.push(
          <SelectItem key={`category-${companyName}-${categoryName}`} value={`category-${companyName}-${categoryName}`} disabled>
            <div className="flex items-center gap-2 ml-4 font-medium text-muted-foreground">
              <Layers className="h-3 w-3" />
              {categoryName}
            </div>
          </SelectItem>
        );
        
        Object.entries(platforms).forEach(([platformName, products]) => {
          // Platform header (disabled) 
          options.push(
            <SelectItem key={`platform-${companyName}-${categoryName}-${platformName}`} value={`platform-${companyName}-${categoryName}-${platformName}`} disabled>
              <div className="flex items-center gap-2 ml-8 font-medium text-muted-foreground/80">
                <Package className="h-3 w-3" />
                {platformName}
              </div>
            </SelectItem>
          );
          
          // Individual products
          products.forEach(product => {
            const isInternalForCompany = isDevMode && process.env.NODE_ENV === 'development'
              ? getCompanyInternalStatus(product.company_id)
              : null;
              
            options.push(
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center justify-between w-full ml-12">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    <span>{product.name}</span>
                  </div>
                  {isDevMode && process.env.NODE_ENV === 'development' && isInternalForCompany !== null && (
                    isInternalForCompany 
                      ? <UserCheck className="h-3 w-3 ml-2 text-green-600" /> 
                      : <UserX className="h-3 w-3 ml-2 text-amber-600" />
                  )}
                </div>
              </SelectItem>
            );
          });
        });
      });
    });
    
    return options;
  };

  if (isLoading || externalLoading) {
    return (
      <div className="w-[200px]">
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading products..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="w-[200px]">
      <Select
        value={currentProductId}
        onValueChange={onProductChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select product" />
        </SelectTrigger>
        <SelectContent className="max-h-[400px] overflow-y-auto">
          {renderHierarchicalOptions()}
        </SelectContent>
      </Select>
    </div>
  );
}