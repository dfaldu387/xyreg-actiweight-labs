import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BundleOverviewTab } from '@/components/product/bundle/BundleOverviewTab';
import { BundleBuildTab } from '@/components/product/bundle/BundleBuildTab';

import { ProductFamilyTab } from './ProductFamilyTab';
import { useProductBundles } from '@/hooks/useProductBundleGroups';
import { FlaskConical } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface BundlesTabSectionProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function BundlesTabSection({ productId, companyId, disabled = false }: BundlesTabSectionProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active tab from URL or default to 'overview'
  const subTabFromUrl = searchParams.get('subTab');
  const [activeSubTab, setActiveSubTab] = useState(subTabFromUrl || 'overview');
  
  // Fetch bundles this product belongs to
  const { data: bundles, isLoading: bundlesLoading, isFetching: bundlesFetching } = useProductBundles(productId);
  
  // Get or set the selected bundle ID from URL
  const bundleIdFromUrl = searchParams.get('bundleId');
  
  // Validate that the bundle ID from URL actually exists in bundles
  const bundleExists = bundles?.some(b => b.id === bundleIdFromUrl);
  const selectedBundleId = bundleExists ? bundleIdFromUrl : (bundles?.[0]?.id || null);
  
  // Auto-select first bundle if none selected or if selected bundle doesn't exist
  // BUT: Don't reset if bundles are currently fetching (to avoid race conditions during bundle creation)
  useEffect(() => {
    if (!bundlesLoading && !bundlesFetching && bundles) {
      if (bundles.length === 0) {
        // No bundles exist - clear bundleId from URL
        if (bundleIdFromUrl) {
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('bundleId');
          setSearchParams(newParams, { replace: true });
        }
      } else if (!bundleExists && bundles.length > 0 && bundleIdFromUrl) {
        // Invalid bundle ID in URL - replace with first bundle
        // Only do this if there's actually a bundleId in the URL to avoid unnecessary updates
        const newParams = new URLSearchParams(searchParams);
        newParams.set('bundleId', bundles[0].id);
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [bundles, bundlesLoading, bundlesFetching, bundleIdFromUrl, bundleExists, searchParams, setSearchParams]);

  const handleBundleChange = (value: string) => {
    if (disabled) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('bundleId', value);
    setSearchParams(newParams);
  };

  const handleNavigateToBuild = () => {
    if (disabled) return;
    setActiveSubTab('build');
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subTab', 'build');
    setSearchParams(newParams);
  };

  const currentBundle = bundles?.find(b => b.id === selectedBundleId);

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Bundle Selector */}
      {bundles && bundles.length > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">{lang('bundles.currentBundle')}</label>
          <Select value={selectedBundleId || ''} onValueChange={handleBundleChange} disabled={disabled}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder={lang('bundles.selectBundle')} />
            </SelectTrigger>
            <SelectContent>
              {bundles.map(bundle => (
                <SelectItem key={bundle.id} value={bundle.id}>
                  <div className="flex items-center gap-2">
                    <span>{bundle.bundle_name}</span>
                    {bundle.is_feasibility_study && (
                      <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                        <FlaskConical className="h-3 w-3" />
                        {lang('bundles.feasibility')}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentBundle && (
            <div className="text-sm text-muted-foreground">
              {currentBundle.is_feasibility_study && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <FlaskConical className="h-3 w-3" />
                  {lang('bundles.feasibilityStudy')}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      <Tabs value={activeSubTab} onValueChange={(value) => { if (!disabled) setActiveSubTab(value); }} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{lang('bundles.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="build">{lang('bundles.tabs.build')}</TabsTrigger>
          <TabsTrigger value="family">{lang('bundles.tabs.family')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BundleOverviewTab 
            productId={productId} 
            companyId={companyId}
            selectedBundleId={selectedBundleId}
            bundles={bundles || []}
            onNavigateToRelationships={handleNavigateToBuild}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="build" className="space-y-6">
          <BundleBuildTab
            key={selectedBundleId}
            productId={productId}
            companyId={companyId}
            selectedBundleId={selectedBundleId}
            onNavigateToBuild={handleNavigateToBuild}
            disabled={disabled}
          />
        </TabsContent>


        <TabsContent value="family" className="space-y-6">
          <ProductFamilyTab
            productId={productId}
            companyId={companyId}
            disabled={disabled}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
