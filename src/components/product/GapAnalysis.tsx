
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert } from "lucide-react";
import { GapAnalysisItem } from "@/types/client";
import { ComplianceStats } from "./gap-analysis/ComplianceStats";
import { GapTabContent } from "./gap-analysis/GapTabContent";
import { FrameworkComplianceSummary } from "./gap-analysis/FrameworkComplianceSummary";
import { AdminApprovalSection } from "./gap-analysis/AdminApprovalSection";
import { toast } from "sonner";
import { updateGapItemStatus } from "@/services/gapAnalysisService";
import { mapUIStatusToGap } from "@/utils/statusUtils";
import { queryClient } from "@/lib/query-client";
import { useTranslation } from "@/hooks/useTranslation";

interface GapAnalysisProps {
  items?: GapAnalysisItem[];
  showDetailedView?: boolean;
  showOnlyIso13485?: boolean;
  productId?: string;
  companyId?: string;
  onRefresh?: () => void;
  disabled?: boolean;
}

export function GapAnalysis({
  items = [],
  showDetailedView = false,
  showOnlyIso13485 = false,
  productId,
  companyId,
  onRefresh,
  disabled = false
}: GapAnalysisProps) {
  const { lang } = useTranslation();

  // Define all possible frameworks with their mapping
  const allFrameworks = [
    { id: "MDR Annex I", title: "MDR Annex I", frameworkValue: "MDR_ANNEX_I" },
    { id: "MDR Annex II", title: "MDR Annex II", frameworkValue: "MDR_ANNEX_II" },
    { id: "MDR Annex III", title: "MDR Annex III", frameworkValue: "MDR_ANNEX_III" },
    { id: "ISO 14971", title: "ISO 14971", frameworkValue: "ISO_14971" },
    { id: "ISO 13485", title: "ISO 13485", frameworkValue: "ISO_13485" },
    { id: "FDA 21 CFR Part 820", title: "FDA 21 CFR Part 820", frameworkValue: "FDA_21_CFR_820" },
    { id: "FDA QMSR", title: "FDA QMSR", frameworkValue: "FDA_QMSR" },
    { id: "IEC 62304", title: "IEC 62304", frameworkValue: "IEC_62304" },
    { id: "IEC 60601-1", title: "IEC 60601-1", frameworkValue: "IEC_60601_1" },
    { id: "IEC 60601-1-2", title: "IEC 60601-1-2", frameworkValue: "IEC_60601_1_2" },
    { id: "IEC 60601-1-6", title: "IEC 60601-1-6", frameworkValue: "IEC_60601_1_6" },
    { id: "IEC 20957", title: "IEC 20957", frameworkValue: "IEC_20957" },
  ];

  // Filter items based on context (product-specific vs company-wide)
  const contextFilteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    if (productId) {
      return items; // All items are already filtered by the service
    } else {
      return items.filter(item => !item.product_id);
    }
  }, [items, productId]);

  // Dynamically determine which frameworks to show based on context-filtered data
  const availableFrameworks = useMemo(() => {
    if (showOnlyIso13485) {
      return allFrameworks.filter(f => f.id === "ISO 13485");
    }

    const frameworksWithData = new Set(contextFilteredItems.map(item => item.framework));
    return allFrameworks.filter(framework => 
      frameworksWithData.has(framework.frameworkValue)
    );
  }, [contextFilteredItems, showOnlyIso13485, allFrameworks]);

  // Set initial active tab to first available framework or fallback
  const [activeTab, setActiveTab] = useState(() => {
    if (showOnlyIso13485) return "ISO 13485";
    return availableFrameworks.length > 0 ? availableFrameworks[0].id : "MDR Annex I";
  });

  // Update active tab when available frameworks change
  useEffect(() => {
    if (availableFrameworks.length > 0 && !availableFrameworks.some(f => f.id === activeTab)) {
      setActiveTab(availableFrameworks[0].id);
    }
  }, [availableFrameworks, activeTab]);

  // Removed console.logs for production performance

  // Optimized: Memoize filtered items to prevent unnecessary recalculations
  const filteredItems = useMemo(() => {
    if (!contextFilteredItems?.length) return [];
    
    const activeFramework = allFrameworks.find(f => f.id === activeTab);
    if (!activeFramework) return [];
    
    return contextFilteredItems.filter(item => item.framework === activeFramework.frameworkValue);
  }, [activeTab, contextFilteredItems, allFrameworks]);

  // Optimized tab change handler
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  // Optimized status change handler with useCallback and ref for debouncing
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleStatusChange = useCallback(async (itemId: string, status: "Open" | "Closed" | "N/A") => {
    if (disabled) return;
    if (!itemId) {
      toast.error(lang('gapAnalysis.toast.itemIdMissing'));
      return;
    }

    try {
      const dbStatus = mapUIStatusToGap(status);
      const success = await updateGapItemStatus(itemId, dbStatus);

      if (success) {
        toast.success(lang('gapAnalysis.toast.statusUpdated').replace('{{status}}', status));
        
        // CRITICAL: DO NOT use optimistic cache update - it causes auto-switching
        // Instead, wait for proper refetch to ensure data consistency
        if (productId) {
          // Clear existing timeout
          if (refetchTimeoutRef.current) {
            clearTimeout(refetchTimeoutRef.current);
          }
          
          // Debounce refetch to batch multiple rapid updates
          // Longer delay ensures database commit completes and prevents race conditions
          // CRITICAL: This refetch will update ALL items, but each GapItem's lock prevents cross-item interference
          refetchTimeoutRef.current = setTimeout(() => {
            queryClient.invalidateQueries({ 
              queryKey: ['productDetails', productId],
              exact: true
            });
            queryClient.refetchQueries({ 
              queryKey: ['productDetails', productId],
              type: 'active'
            });
            refetchTimeoutRef.current = null;
          }, 1000); // 1000ms delay - ensures DB commit completes and prevents cross-item interference
        }
      } else {
        toast.error(lang('gapAnalysis.toast.updateFailed'));
        if (onRefresh) await onRefresh();
      }
    } catch (error) {
      toast.error(lang('gapAnalysis.toast.updateError'));
      if (onRefresh) await onRefresh();
    }
  }, [productId, onRefresh, lang]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  // Group items by framework for summary view
  const getFrameworkItems = (frameworkId: string) => {
    const framework = allFrameworks.find(f => f.id === frameworkId);
    if (!framework) return [];
    
    const frameworkItems = contextFilteredItems.filter(item => item.framework === framework.frameworkValue);
    return frameworkItems;
  };

  const hasData = contextFilteredItems && contextFilteredItems.length > 0;
  const dataSource = hasData ? lang('gapAnalysis.dataSource.databaseData') : lang('gapAnalysis.dataSource.noDataAvailable');

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardContent className="p-4 max-w-full">
        <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{lang('gapAnalysis.regulatoryGapAnalysis')}</span>
          <span className={`text-xs flex-shrink-0 ${hasData ? 'text-green-600' : 'text-orange-600'}`}>
            ({dataSource})
          </span>
        </h4>
        
        {showDetailedView ? (
          // Detailed view with tabs for Product Gap Analysis page
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange} 
            className="w-full max-w-full"
          >
            <TabsList className="w-full justify-start flex-wrap h-auto p-1 mb-4 gap-1">
              {availableFrameworks.length > 0 ? (
                availableFrameworks.map(framework => (
                  <TabsTrigger key={framework.id} value={framework.id} className="flex-shrink-0 text-xs sm:text-sm">
                    {framework.title}
                  </TabsTrigger>
                ))
              ) : (
                <div className="text-sm text-muted-foreground p-2">
                  {lang('gapAnalysis.emptyState.noDataAvailable')}
                </div>
              )}
            </TabsList>
            
            <GapTabContent
              value={activeTab}
              items={filteredItems}
              onRefresh={onRefresh}
              onStatusChange={handleStatusChange}
              companyId={companyId}
              productId={productId}
              disabled={disabled}
            />
            
            {/* Admin Approval Section - only show in detailed view with product context */}
            {productId && (
              <div className="mt-6">
                <AdminApprovalSection
                  items={contextFilteredItems}
                  productId={productId}
                  onApprovalChange={() => onRefresh?.()}
                  disabled={disabled}
                />
              </div>
            )}
          </Tabs>
        ) : (
          // Summary view for Product Dashboard
          <div className="max-w-full">
            <ComplianceStats items={contextFilteredItems} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 max-w-full">
              {availableFrameworks.length > 0 ? (
                availableFrameworks.map(framework => (
                  <FrameworkComplianceSummary
                    key={framework.id}
                    title={framework.title}
                    items={getFrameworkItems(framework.id)}
                    productId={productId}
                    companyId={companyId}
                  />
                ))
              ) : (
                <div className="text-sm text-muted-foreground p-4 text-center col-span-full">
                  {lang('gapAnalysis.emptyState.noFrameworksAvailable')}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
