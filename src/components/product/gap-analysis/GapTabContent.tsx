
import React, { useState, useMemo } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import { GapAnalysisItem } from "@/types/client";
import { GapItem } from "./GapItem";
import { BulkActionsMenu } from "./BulkActionsMenu";
import { GapAnalysisStatusFilter } from "./GapAnalysisStatusFilter";
import { GapAnalysisRecommendedTeamsFilter } from "./GapAnalysisRecommendedTeamsFilter";
import { mapGapStatusToUI } from "@/utils/statusUtils";
import { EnhancedGapAnalysisView } from "./EnhancedGapAnalysisView";
import { useTranslation } from "@/hooks/useTranslation";
import { GapAnnexIILaunchView } from "./GapAnnexIILaunchView";
import { GapAnnexIISidebar } from "./GapAnnexIISidebar";

interface GapTabContentProps {
  value: string;
  items: GapAnalysisItem[];
  onRefresh?: () => void;
  onStatusChange?: (id: string, status: "Open" | "Closed" | "N/A") => void;
  companyId?: string;
  productId?: string;
  disabled?: boolean;
}

export function GapTabContent({
  value,
  items,
  onRefresh,
  onStatusChange,
  companyId,
  productId,
  disabled = false
}: GapTabContentProps) {
  const { lang } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [recommendedTeamsFilter, setRecommendedTeamsFilter] = useState<string>('all');
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Extract all unique recommended teams from items
  const availableTeams = useMemo(() => {
    const teamsSet = new Set<string>();
    
    items.forEach(item => {
      if (!item) return;
      const teams = (item as any).recommended_teams;
      if (!teams || teams === '[]' || teams.trim() === '') return;
      
      try {
        const parsed = JSON.parse(teams);
        if (Array.isArray(parsed)) {
          parsed.forEach((team: string) => teamsSet.add(team));
        } else if (typeof parsed === 'string') {
          teamsSet.add(parsed);
        }
      } catch {
        // Not JSON, treat as comma-separated string
        const teamList = teams.split(',').map((t: string) => t.trim()).filter((t: string) => t);
        teamList.forEach((team: string) => teamsSet.add(team));
      }
    });
    
    return Array.from(teamsSet).sort();
  }, [items]);
  
  // Filter items based on status and recommended teams
  const filteredItems = useMemo(() => {
    // First, filter out any invalid items (missing id or undefined)
    let validItems = items.filter(item => item && item.id);
    
    // Filter by status
    if (statusFilter !== 'all') {
      validItems = validItems.filter(item => {
        const uiStatus = mapGapStatusToUI(item.status);
        return uiStatus === statusFilter;
      });
    }
    
    // Filter by recommended teams
    if (recommendedTeamsFilter !== 'all') {
      validItems = validItems.filter(item => {
        const teams = (item as any).recommended_teams;
        if (!teams || teams === '[]' || teams.trim() === '') return false;
        
        try {
          const parsed = JSON.parse(teams);
          if (Array.isArray(parsed)) {
            return parsed.includes(recommendedTeamsFilter);
          } else if (typeof parsed === 'string') {
            return parsed === recommendedTeamsFilter;
          }
        } catch {
          // Not JSON, treat as comma-separated string
          const teamList = teams.split(',').map((t: string) => t.trim());
          return teamList.includes(recommendedTeamsFilter);
        }
        
        return false;
      });
    }
    
    return validItems;
  }, [items, statusFilter, recommendedTeamsFilter]);
  
  const handleReviewerAssign = (id: string, reviewerId: string) => {
    console.log("Reviewer assigned:", id, reviewerId);
    // This could be implemented to handle reviewer assignment
  };

  return (
    <TabsContent value={value} className="mt-0 max-w-full">
      {/* MDR Annex II gets the launch view + sidebar */}
      {value === 'MDR Annex II' ? (
        <div className="relative">
          <GapAnnexIILaunchView items={items} disabled={disabled} />
          <GapAnnexIISidebar items={items} disabled={disabled} />
        </div>
      ) : (
        <div className="space-y-4 max-w-full">
          {items.length === 0 ? (
            <div className="text-center py-8 max-w-full">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {lang('gapAnalysis.emptyState.noItemsFound')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {lang('gapAnalysis.emptyState.noItemsDescription').replace('{{framework}}', value)}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  {lang('gapAnalysis.emptyState.enableTemplatesHint').replace('{{framework}}', value)}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <p className="text-sm text-muted-foreground">
                    {lang('gapAnalysis.itemCount').replace('{{filtered}}', String(filteredItems.length)).replace('{{total}}', String(items.length)).replace('{{framework}}', value)}
                  </p>
                  <GapAnalysisStatusFilter
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  />
                  {availableTeams.length > 0 && (
                    <GapAnalysisRecommendedTeamsFilter
                      value={recommendedTeamsFilter}
                      onValueChange={setRecommendedTeamsFilter}
                      availableTeams={availableTeams}
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (disabled) return;
                      setShowDashboard(true);
                    }}
                    disabled={disabled}
                  >
                    <Compass className="h-4 w-4 mr-2" />
                    {lang('gapAnalysis.actions.enhancedAnalysis')}
                  </Button>
                  <BulkActionsMenu
                    items={filteredItems}
                    companyId={companyId}
                    onComplete={onRefresh}
                    disabled={disabled}
                  />
                </div>
              </div>
              
              <div className="space-y-3 max-w-full">
                {filteredItems.map((item, index) => (
                  <GapItem
                    key={item?.id || `gap-item-${index}`}
                    item={item}
                    onStatusChange={onStatusChange}
                    onReviewerAssign={handleReviewerAssign}
                    companyId={companyId}
                    productId={productId}
                    onRefresh={onRefresh}
                    disabled={disabled}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {showDashboard && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-4 z-50 bg-background border rounded-lg shadow-lg overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{lang('gapAnalysis.enhancedGapAnalysis')}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDashboard(false)}
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              <EnhancedGapAnalysisView 
                items={items}
                productId={productId}
                companyId={companyId}
                onClose={() => setShowDashboard(false)}
                onRefresh={onRefresh}
              />
            </div>
          </div>
        </div>
      )}
    </TabsContent>
  );
}
