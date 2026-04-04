import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { DeviceMediaUpload } from '../../DeviceMediaUpload';
import { Device3DViewer } from '../../Device3DViewer';
import { MediaHeader } from '../../../MediaHeader';
import { Device3DModel } from '@/types';
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';
import { useTranslation } from '@/hooks/useTranslation';
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { resolveFieldValue, normalizeScopeValue } from '@/hooks/useAutoSyncScope';
import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';


interface MediaTabProps {
  productName: string;
  tradeName?: string;
  images?: string[];
  videos?: string[];
  models3D?: Device3DModel[];
  company_id?: string;
  companyName?: string;
  onImagesChange?: (value: string[]) => void;
  onVideosChange?: (value: string[]) => void;
  onModels3DChange?: (value: Device3DModel[]) => void;
  isLoading?: boolean;
  // Governance & scope
  belongsToFamily?: boolean;
  isMaster?: boolean;
  isVariant?: boolean;
  getFieldScope?: (key: string) => 'individual' | 'product_family';
  onFieldScopeChange?: (key: string, scope: 'individual' | 'product_family') => void;
  getGovernanceSection?: (key: string) => any;
  productId?: string;
  masterDeviceId?: string;
  masterDeviceName?: string;
  classificationExclusion?: {
    getExclusionScope: (itemId: string) => import('@/hooks/useInheritanceExclusion').ItemExclusionScope;
    setExclusionScope: (itemId: string, scope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => void;
    getExclusionSummary: (itemId: string, totalProducts: number) => string;
  };
  autoSyncScope?: (fieldKey: string, newValue: any) => void;
  familyProductIds?: string[];
  familyProducts?: any[];
  onScopeChangeWithPropagation?: (fieldKey: string, oldScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope, newScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => Promise<void>;
}

export function MediaTab({
  productName,
  tradeName,
  images = [],
  videos = [],
  models3D = [],
  company_id,
  companyName,
  onImagesChange,
  onVideosChange,
  onModels3DChange,
  isLoading,
  belongsToFamily = false,
  isMaster = false,
  isVariant = false,
  getFieldScope,
  onFieldScopeChange,
  getGovernanceSection,
  productId,
  masterDeviceId,
  masterDeviceName,
  classificationExclusion,
  autoSyncScope,
  familyProductIds,
  familyProducts,
  onScopeChangeWithPropagation,
}: MediaTabProps) {
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || returnTo === 'gap-analysis';

  const getGovIcon = (sectionKey: string) => {
    const gov = getGovernanceSection?.(sectionKey);
    if (gov && gov.status !== 'draft') {
      return (
        <GovernanceBookmark
          status={gov.status}
          designReviewId={gov.design_review_id}
          verdictComment={gov.verdict_comment}
          approvedAt={gov.approved_at}
          productId={productId}
          sectionLabel={sectionKey}
        />
      );
    }
    return <GovernanceBookmark status={null} />;
  };

  // --- Value-matching helpers ---
  const getMatchingProductIds = useCallback((fieldKey: string, currentValue: any): string[] | undefined => {
    if (!familyProducts?.length || !productId) return undefined;
    const currentNormalized = JSON.stringify(normalizeScopeValue(fieldKey, currentValue));
    return familyProducts
      .filter(p => {
        if (p.id === productId) return true;
        return JSON.stringify(normalizeScopeValue(fieldKey, resolveFieldValue(p, fieldKey))) === currentNormalized;
      })
      .map(p => p.id);
  }, [familyProducts, productId]);

  const getMatchSummary = useCallback((fieldKey: string, currentValue: any) => {
    const matchIds = getMatchingProductIds(fieldKey, currentValue);
    if (!matchIds || !familyProducts?.length) return undefined;
    return `${matchIds.length}/${familyProducts.length}`;
  }, [getMatchingProductIds, familyProducts]);

  const createValueMatchScopeChange = useCallback((fieldKey: string, currentValue: any) => {
    return (id: string, newScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => {
      if (onScopeChangeWithPropagation && familyProducts?.length) {
        const matchIds = getMatchingProductIds(fieldKey, currentValue);
        const nonMatchingIds = matchIds
          ? (familyProductIds || []).filter(pid => !matchIds.includes(pid))
          : [];
        const oldScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope = {
          excludedProductIds: nonMatchingIds,
          excludedCategories: [],
          isManualGroup: true,
        };
        return onScopeChangeWithPropagation(id, oldScope, newScope);
      } else if (classificationExclusion) {
        return classificationExclusion.setExclusionScope(id, newScope);
      }
    };
  }, [onScopeChangeWithPropagation, familyProducts, getMatchingProductIds, familyProductIds, classificationExclusion]);

  const renderScopeAndGov = (fieldKey: string, currentValue?: any) => (
    <div className="flex items-center gap-0.5 ml-auto">
      {belongsToFamily && company_id && productId && classificationExclusion ? (
        <InheritanceExclusionPopover
          companyId={company_id}
          currentProductId={productId}
          itemId={fieldKey}
          exclusionScope={classificationExclusion.getExclusionScope(fieldKey)}
          onScopeChange={createValueMatchScopeChange(fieldKey, currentValue)}
          defaultCurrentDeviceOnly
          familyProductIds={familyProductIds}
          summaryText={getMatchSummary(fieldKey, currentValue)}
          valueMatchingProductIds={getMatchingProductIds(fieldKey, currentValue)}
        />
      ) : null}
      {getGovIcon(fieldKey)}
    </div>
  );

  const wrapWithOverlay = (_fieldKey: string, children: React.ReactNode) => children;

  const handleImageSelect = (imageUrl: string) => {
    if (onImagesChange) {
      const newImages = [...images, imageUrl];
      onImagesChange(newImages);
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Media Upload */}
      <div className={isInGenesisFlow ? `p-3 rounded-lg transition-colors ${images.length > 0 ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}>
        <div className="flex items-center gap-2 mb-3">
          <Label className="text-sm font-medium">{lang('deviceBasics.media.deviceMediaLabel')}</Label>
          <InvestorVisibleBadge />
          {renderScopeAndGov('media_deviceMedia', images)}
        </div>
        {wrapWithOverlay('media_deviceMedia', (
          <>
            <MediaHeader
              productName={productName || ''}
              tradeName={tradeName}
              companyName={companyName}
              companyId={company_id}
              onImageSelect={handleImageSelect}
              onImagesSelect={(imageUrls) => {
                if (onImagesChange) {
                  const newImages = [...images, ...imageUrls];
                  onImagesChange(newImages);
                }
              }}
            />
            <DeviceMediaUpload
              images={images}
              videos={videos}
              models3D={models3D}
              onImagesChange={(newImages) => {
                onImagesChange?.(newImages);
              }}
              onVideosChange={onVideosChange}
              onModels3DChange={onModels3DChange}
              disabled={isLoading}
              companyId={company_id}
              onImageDeleted={() => {
                console.log('🔄 Image deleted, refreshing');
              }}
            />
          </>
        ))}
      </div>

      {/* 3D Models Management */}
      {models3D && models3D.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-3 block">{lang('deviceBasics.media.model3dLabel')}</Label>
          <Device3DViewer models={models3D} selectedModelIndex={0} onModelSelect={() => {}} />
        </div>
      )}
    </div>
  );
}
