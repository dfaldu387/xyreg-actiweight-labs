import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Package, Layers, Grid3X3, Filter, ArrowRight } from 'lucide-react';
import { OptimizedProduct } from '@/hooks/useOptimizedCompanyProducts';

interface CategorizedPortfolioViewProps {
  products: OptimizedProduct[];
  isLoading?: boolean;
}

interface CategoryGroup {
  name: string;
  products: OptimizedProduct[];
  platforms: PlatformGroup[];
}

interface PlatformGroup {
  name: string;
  products: OptimizedProduct[];
  category: string;
}

export function CategorizedPortfolioView({ products, isLoading }: CategorizedPortfolioViewProps) {
  const navigate = useNavigate();
  const [classificationType, setClassificationType] = useState<'categories' | 'platforms' | 'models' | 'variations' | 'classifications'>('categories');
  const [activeTab, setActiveTab] = useState<string>('');

  // Dynamically group products based on classification type
  const groupedData = useMemo(() => {
    const getClassificationValue = (product: OptimizedProduct) => {
      switch (classificationType) {
        case 'categories':
          // Map medical device classes to friendly names
          const classValue = product.class || 'Uncategorized';
          if (classValue === 'class-i') return 'Cat A';
          if (classValue === 'class-iia') return 'Cat B';
          if (classValue === 'class-iib') return 'Cat C';
          if (classValue === 'class-iii') return 'Cat D';
          return classValue;
        case 'platforms':
          return product.product_platform || 'No Platform';
        case 'models':
          return product.model_reference || 'No Model';
        case 'variations':
          return product.variant || 'No Variation';
        case 'classifications':
          return product.class || 'No Classification';
        default:
          return 'Unknown';
      }
    };

    const groupMap = new Map<string, OptimizedProduct[]>();
    
    products.forEach(product => {
      const groupValue = getClassificationValue(product);
      if (!groupMap.has(groupValue)) {
        groupMap.set(groupValue, []);
      }
      groupMap.get(groupValue)!.push(product);
    });

    return Array.from(groupMap.entries())
      .map(([name, groupProducts]) => ({
        name,
        products: groupProducts
      }))
      .sort((a, b) => b.products.length - a.products.length);
  }, [products, classificationType]);

  // Set initial active tab
  React.useEffect(() => {
    if (groupedData.length > 0 && !activeTab) {
      setActiveTab(groupedData[0].name);
    }
  }, [groupedData, activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'At Risk':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Needs Attention':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/app/product/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getClassificationIcon = () => {
    switch (classificationType) {
      case 'categories':
        return Grid3X3;
      case 'platforms':
        return Layers;
      case 'models':
        return Package;
      case 'variations':
        return Package;
      case 'classifications':
        return Filter;
      default:
        return Package;
    }
  };

  const getClassificationTitle = () => {
    switch (classificationType) {
      case 'categories':
        return 'Categories';
      case 'platforms':
        return 'Platforms';
      case 'models':
        return 'Models';
      case 'variations':
        return 'Variations';
      case 'classifications':
        return 'Classifications';
      default:
        return 'Classification';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Categorisation</h2>
          <p className="text-muted-foreground">
            Choose how to organize and view your products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            {products.length} Products
          </span>
        </div>
      </div>

      {/* Classification Type Selector */}
      <Tabs value={classificationType} onValueChange={(value) => {
        setClassificationType(value as 'categories' | 'platforms' | 'models' | 'variations' | 'classifications');
        setActiveTab(''); // Reset active tab when classification type changes
      }}>
        <TabsList className="grid w-fit grid-cols-5">
          <TabsTrigger value="categories" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Category
          </TabsTrigger>
          <TabsTrigger value="platforms" className="gap-2">
            <Layers className="h-4 w-4" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-2">
            <Package className="h-4 w-4" />
            Model
          </TabsTrigger>
          <TabsTrigger value="variations" className="gap-2">
            <Package className="h-4 w-4" />
            Variation
          </TabsTrigger>
          <TabsTrigger value="classifications" className="gap-2">
            <Filter className="h-4 w-4" />
            Classification
          </TabsTrigger>
        </TabsList>

        {/* Classification Type Content */}
        {groupedData.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-fit" style={{ gridTemplateColumns: `repeat(${Math.min(groupedData.length, 6)}, 1fr)` }}>
              {groupedData.slice(0, 6).map((group) => {
                const Icon = getClassificationIcon();
                return (
                  <TabsTrigger key={group.name} value={group.name} className="gap-2">
                    <Icon className="h-4 w-4" />
                    {group.name}
                    <Badge variant="secondary" className="ml-1">
                      {group.products.length}
                    </Badge>
                  </TabsTrigger>
                );
              })}
              {groupedData.length > 6 && (
                <TabsTrigger value="more" className="gap-2">
                  <Package className="h-4 w-4" />
                  +{groupedData.length - 6} more
                </TabsTrigger>
              )}
            </TabsList>

            {/* Dynamic content for each group */}
            {groupedData.map((group) => (
              <TabsContent key={group.name} value={group.name} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.products.map((product) => (
                    <Card 
                      key={product.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleProductClick(product.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base truncate" title={product.name}>
                            {product.name}
                          </CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(product.status)}`}
                          >
                            {product.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          {classificationType !== 'categories' && product.class && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Category:</span>
                              <span className="font-medium">{product.class}</span>
                            </div>
                          )}
                          {classificationType !== 'platforms' && product.product_platform && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Platform:</span>
                              <span className="font-medium">{product.product_platform}</span>
                            </div>
                          )}
                          {classificationType !== 'models' && product.model_reference && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Model:</span>
                              <span className="font-medium">{product.model_reference}</span>
                            </div>
                          )}
                          {classificationType !== 'variations' && product.variant && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Variation:</span>
                              <span className="font-medium">{product.variant}</span>
                            </div>
                          )}
                          {product.phase && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Phase:</span>
                              <span className="font-medium">{product.phase}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-muted-foreground">
                            Click to view details
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {group.products.length === 0 && (
                  <div className="text-center py-12 space-y-4">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">No products found</p>
                      <p className="text-sm text-muted-foreground">
                        There are no products in this {classificationType.slice(0, -1)}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-12 space-y-4">
            <Package className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">No {getClassificationTitle()} Found</p>
              <p className="text-sm text-muted-foreground">
                No products have been assigned to any {getClassificationTitle().toLowerCase()}
              </p>
            </div>
          </div>
        )}
      </Tabs>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {React.createElement(getClassificationIcon(), { className: "h-5 w-5 text-muted-foreground" })}
              <div>
                <p className="text-2xl font-bold">{groupedData.length}</p>
                <p className="text-sm text-muted-foreground">{getClassificationTitle()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}