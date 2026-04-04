import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { 
  HierarchicalBulkService, 
  DetailedHierarchyStats,
  CategoryStats,
  PlatformStats,
  ModelStats 
} from "@/services/hierarchicalBulkService";
import { 
  Package, 
  CheckCircle, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Layers,
  Grid3X3,
  Box,
  Hash,
  Target
} from 'lucide-react';

interface DetailedPortfolioOverviewProps {
  companyId: string;
  basicStats?: any; // For backward compatibility
}

export function DetailedPortfolioOverview({ companyId }: DetailedPortfolioOverviewProps) {
  const [detailedStats, setDetailedStats] = useState<DetailedHierarchyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDetailedStats();
  }, [companyId]);

  const loadDetailedStats = async () => {
    try {
      setLoading(true);
      console.log('[DetailedPortfolioOverview] Loading stats for company:', companyId);
      const stats = await HierarchicalBulkService.getDetailedHierarchyStats(companyId);
      console.log('[DetailedPortfolioOverview] Loaded stats:', stats);
      setDetailedStats(stats);
    } catch (error) {
      console.error('[DetailedPortfolioOverview] Failed to load detailed portfolio stats:', error);
      // Set a default empty state to prevent complete failure
      setDetailedStats({
        totalProducts: 0,
        totalVariants: 0,
        configuredProducts: 0,
        categoriesConfigured: 0,
        platformsConfigured: 0,
        modelsConfigured: 0,
        categories: [],
        platforms: [],
        models: []
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePlatform = (platformId: string) => {
    const newExpanded = new Set(expandedPlatforms);
    if (newExpanded.has(platformId)) {
      newExpanded.delete(platformId);
    } else {
      newExpanded.add(platformId);
    }
    setExpandedPlatforms(newExpanded);
  };

  const getConfigurationBadge = (configured: boolean) => {
    return (
      <Badge variant={configured ? "default" : "secondary"} className="ml-2">
        {configured ? "Configured" : "Not Configured"}
      </Badge>
    );
  };

  const getConfigurationColor = (configured: boolean) => {
    return configured ? "text-green-600" : "text-gray-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!detailedStats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Failed to load portfolio data.</p>
        </CardContent>
      </Card>
    );
  }

  const configurationPercentage = detailedStats.totalProducts > 0 
    ? (detailedStats.configuredProducts / detailedStats.totalProducts) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{detailedStats.totalProducts}</p>
                <p className="text-sm text-muted-foreground">Device</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{detailedStats.categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{detailedStats.platforms.length}</p>
                <p className="text-sm text-muted-foreground">Platforms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Box className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{detailedStats.models.length}</p>
                <p className="text-sm text-muted-foreground">Models</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Configuration</span>
                <span className="text-sm font-bold text-green-600">
                  {Math.round(configurationPercentage)}%
                </span>
              </div>
              <Progress value={configurationPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Device Categories
          </CardTitle>
          <CardDescription>
            Device categories with their platforms, models, and configuration status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detailedStats.categories.length === 0 ? (
            <p className="text-muted-foreground">No device categories configured yet.</p>
          ) : (
            detailedStats.categories.map((category) => (
              <Collapsible
                key={category.id}
                open={expandedCategories.has(category.id)}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <Card className="border-l-4 border-l-primary">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="sm" className="p-0 h-auto">
                            {expandedCategories.has(category.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {category.name}
                              {getConfigurationBadge(category.configured)}
                            </CardTitle>
                            {category.description && (
                              <CardDescription className="mt-1">
                                {category.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{category.productCount} Devices</span>
                          <span>{category.platformCount} Platforms</span>
                          <span>{category.modelCount} Models</span>
                          <span>{category.variantCount} Variants</span>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {category.platforms.length === 0 ? (
                        <div className="space-y-3">
                          <p className="text-muted-foreground text-sm">No platforms configured in this category yet.</p>
                          {category.modelCount > 0 && (
                            <div>
                              <p className="text-sm text-blue-600 font-medium">
                                {category.modelCount} models and {category.productCount} devices are available but not yet organized into platforms.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {category.platforms.map((platform) => (
                            <Collapsible
                              key={platform.id}
                              open={expandedPlatforms.has(platform.id)}
                              onOpenChange={() => togglePlatform(platform.id)}
                            >
                              <Card className="border-l-4 border-l-orange-500">
                                <CollapsibleTrigger asChild>
                                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Button variant="ghost" size="sm" className="p-0 h-auto">
                                          {expandedPlatforms.has(platform.id) ? (
                                            <ChevronDown className="h-3 w-3" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3" />
                                          )}
                                        </Button>
                                        <div>
                                          <CardTitle className="text-base flex items-center">
                                            <Layers className="h-4 w-4 mr-2 text-orange-600" />
                                            {platform.name}
                                            {getConfigurationBadge(platform.configured)}
                                          </CardTitle>
                                          {platform.description && (
                                            <CardDescription className="mt-1 text-sm">
                                              {platform.description}
                                            </CardDescription>
                                          )}
                                        </div>
                                      </div>
                                       <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                         <span>{platform.productCount} Devices</span>
                                         <span>{platform.modelCount} Models</span>
                                         <span>{platform.variantCount} Variants</span>
                                       </div>
                                    </div>
                                  </CardHeader>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                  <CardContent className="pt-0 pl-8">
                                    {platform.models.length === 0 ? (
                                      <p className="text-muted-foreground text-sm">No models in this platform yet.</p>
                                    ) : (
                                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                        {platform.models.map((model) => (
                                          <Card key={model.id} className="border-l-4 border-l-blue-500">
                                            <CardContent className="p-3">
                                              <div className="flex items-center gap-2 mb-2">
                                                <Box className={`h-4 w-4 ${getConfigurationColor(model.configured)}`} />
                                                <h5 className="font-medium text-sm">{model.name}</h5>
                                                <Badge 
                                                  variant={model.configured ? "default" : "secondary"} 
                                                  className="text-xs"
                                                >
                                                  {model.configured ? "✓" : "○"}
                                                </Badge>
                                              </div>
                                              {model.description && (
                                                <p className="text-xs text-muted-foreground mb-2">
                                                  {model.description}
                                                </p>
                                              )}
                                               <div className="flex justify-between text-xs text-muted-foreground">
                                                 <span>{model.productCount} Devices</span>
                                                 <span>{model.variantCount} Variants</span>
                                               </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    )}
                                  </CardContent>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>

      {/* Platforms Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Platform Summary
          </CardTitle>
          <CardDescription>
            All platforms across categories with their model distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {detailedStats.platforms.map((platform) => (
              <Card key={platform.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className={`h-4 w-4 ${getConfigurationColor(platform.configured)}`} />
                    <h5 className="font-medium">{platform.name}</h5>
                    <Badge variant={platform.configured ? "default" : "secondary"} className="text-xs">
                      {platform.configured ? "✓" : "○"}
                    </Badge>
                  </div>
                  {platform.categoryName && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Category: {platform.categoryName}
                    </p>
                  )}
                  {platform.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {platform.description}
                    </p>
                  )}
                   <div className="grid grid-cols-3 gap-2 text-center text-xs">
                     <div>
                       <div className="font-semibold text-primary">{platform.productCount}</div>
                       <div className="text-muted-foreground">Devices</div>
                     </div>
                     <div>
                       <div className="font-semibold text-green-600">{platform.modelCount}</div>
                       <div className="text-muted-foreground">Models</div>
                     </div>
                     <div>
                       <div className="font-semibold text-blue-600">{platform.variantCount}</div>
                       <div className="text-muted-foreground">Variants</div>
                     </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}