import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBundleDetails } from '@/hooks/useProductBundleGroups';
import { useBundleSpecificStats } from '@/hooks/useBundleSpecificStats';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BundleDropdownSelector } from './BundleDropdownSelector';
import { BundleContextHeader } from './BundleContextHeader';
import { EditBundleDialog } from './EditBundleDialog';
import { DeleteBundleDialog } from './DeleteBundleDialog';
import { BundleProductHierarchyDiagram } from './BundleProductHierarchyDiagram';
import { BundleRelationshipLegend } from './BundleRelationshipLegend';
import { useTranslation } from '@/hooks/useTranslation';

interface BundleOverviewTabProps {
  productId: string;
  companyId: string;
  companyName?: string;
  selectedBundleId: string | null;
  bundles: any[];
  onNavigateToRelationships: () => void;
  disabled?: boolean;
}

export function BundleOverviewTab({
  productId,
  companyId,
  companyName = 'Company',
  selectedBundleId,
  bundles,
  onNavigateToRelationships,
  disabled = false
}: BundleOverviewTabProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { data: bundleDetails, isLoading: bundleLoading } = useBundleDetails(selectedBundleId || '');
  const { data: stats, isLoading: statsLoading } = useBundleSpecificStats(selectedBundleId);

  const handleSelectBundle = (bundleId: string) => {
    if (disabled) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('bundleId', bundleId);
    setSearchParams(newParams);
  };

  if (bundleLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!selectedBundleId || !bundleDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{lang('bundles.overview.noBundleSelected')}</CardTitle>
          <CardDescription>{lang('bundles.overview.selectBundleToView')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasAnyRelationships = stats && stats.totalProducts > 0;

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Bundle Selector */}
      <BundleDropdownSelector
        bundles={bundles}
        selectedBundleId={selectedBundleId}
        onSelectBundle={handleSelectBundle}
        disabled={disabled}
      />

      {/* Bundle Context Header */}
      <BundleContextHeader
        bundleName={bundleDetails.bundle_name}
        description={bundleDetails.description}
        memberCount={bundleDetails.members?.length || 0}
        isFeasibilityStudy={bundleDetails.is_feasibility_study}
        companyName={companyName}
        bundleId={selectedBundleId}
        onEdit={() => { if (!disabled) setEditDialogOpen(true); }}
        onDelete={() => { if (!disabled) setDeleteDialogOpen(true); }}
        onAddProducts={onNavigateToRelationships}
        disabled={disabled}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{lang('bundles.overview.totalDevices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('bundles.overview.devicesInBundle')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{lang('bundles.overview.totalVariants')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalVariants || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('bundles.overview.acrossAllDevices')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{lang('bundles.overview.relationshipTypes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.relationshipTypes.size || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('bundles.overview.activeRelationshipTypes')}
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Bundle Members - with view toggle */}
      <Tabs defaultValue="diagram" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{lang('bundles.overview.bundleDevices')}</h3>
            <p className="text-sm text-muted-foreground">
              {lang('bundles.overview.devicesInThisBundle').replace('{count}', String(bundleDetails.members?.length || 0))}
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="diagram">{lang('bundles.overview.diagram')}</TabsTrigger>
            <TabsTrigger value="list">{lang('bundles.overview.list')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="diagram" className="space-y-4">
          <BundleRelationshipLegend 
            activeTypes={stats?.relationshipTypes || new Set()} 
          />
          <BundleProductHierarchyDiagram members={bundleDetails.members || []} />
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {bundleDetails.members
                  ?.slice()
                  .sort((a: any, b: any) => {
                    // Sort order: component -> accessory -> consumable -> others
                    const order = { component: 1, accessory: 2, consumable: 3 };
                    const aOrder = order[a.relationship_type as keyof typeof order] || 99;
                    const bOrder = order[b.relationship_type as keyof typeof order] || 99;
                    
                    if (aOrder !== bOrder) return aOrder - bOrder;
                    
                    // Within same type, primary comes first
                    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
                    
                    return 0;
                  })
                  .map((member: any) => {
                  const productName = member.products?.name || member.product_sibling_groups?.name || lang('bundles.overview.unknown');
                  const isGroup = !member.product_id && member.sibling_group_id;
                  const productCount = member.product_sibling_groups?.product_count;
                  const displayType = isGroup ? `${productName} (${lang('bundles.overview.group')})` : productName;
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        {member.product_id ? (
                          <Link 
                            to={`/app/product/${member.product_id}/device-information`}
                            className="font-medium hover:underline text-primary"
                          >
                            {displayType}
                          </Link>
                        ) : (
                          <div className="font-medium">
                            {displayType}
                            {isGroup && productCount !== undefined && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({lang('bundles.overview.deviceCount').replace('{count}', String(productCount))})
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {member.relationship_type}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.multiplier && member.multiplier !== 1 && (
                          <span className="text-sm text-muted-foreground">
                            ×{member.multiplier}
                          </span>
                        )}
                        {member.is_primary && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {lang('bundles.overview.primary')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditBundleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        bundleId={selectedBundleId}
        currentName={bundleDetails.bundle_name}
        currentDescription={bundleDetails.description}
        isFeasibilityStudy={bundleDetails.is_feasibility_study}
        currentTargetMarkets={bundleDetails.target_markets || []}
      />

      <DeleteBundleDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        bundleId={selectedBundleId}
        bundleName={bundleDetails.bundle_name}
        memberCount={bundleDetails.members?.length || 0}
      />
    </div>
  );
}
