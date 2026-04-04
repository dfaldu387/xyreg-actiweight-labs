import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Filter, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  Info,
  Zap
} from 'lucide-react';
import { SmartFilterService, DeviceCharacteristics, SmartFilterResult } from '@/services/SmartFilterService';
import { ComprehensiveMdrItem } from '@/data/comprehensiveMdrAnnexI';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SmartFilterPanelProps {
  items: ComprehensiveMdrItem[];
  deviceCharacteristics?: DeviceCharacteristics;
  onFilterApplied?: (filteredItems: ComprehensiveMdrItem[]) => void;
  onManualOverride?: (itemId: string, included: boolean) => void;
  manualOverrides?: Record<string, boolean>;
}

export function SmartFilterPanel({
  items,
  deviceCharacteristics,
  onFilterApplied,
  onManualOverride,
  manualOverrides = {}
}: SmartFilterPanelProps) {
  const [filterResult, setFilterResult] = useState<SmartFilterResult | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (deviceCharacteristics && items.length > 0) {
      const result = SmartFilterService.applySmartFilter(
        items,
        deviceCharacteristics,
        manualOverrides
      );
      setFilterResult(result);
      
      if (onFilterApplied) {
        onFilterApplied(result.applicable);
      }
    }
  }, [items, deviceCharacteristics, manualOverrides, onFilterApplied]);

  if (!filterResult || !deviceCharacteristics) {
    return null;
  }

  const { summary, applicable, excluded } = filterResult;
  const autoExcluded = excluded.filter(e => e.isAutomatic);
  const manuallyExcluded = excluded.filter(e => !e.isAutomatic);

  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Smart Filter Results
          <Badge variant="secondary" className="ml-auto">
            {applicable.length} of {summary.totalItems} applicable
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{applicable.length}</div>
            <div className="text-sm text-muted-foreground">Applicable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{autoExcluded.length}</div>
            <div className="text-sm text-muted-foreground">Auto-Excluded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{manuallyExcluded.length}</div>
            <div className="text-sm text-muted-foreground">Manual Override</div>
          </div>
        </div>

        {/* Device Characteristics Summary */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Device Characteristics
              </span>
              <Info className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Active Device:</span>
                <Badge variant={deviceCharacteristics.isActive ? "default" : "secondary"}>
                  {deviceCharacteristics.isActive ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Body Contact:</span>
                <Badge variant={deviceCharacteristics.hasBodyContact ? "default" : "secondary"}>
                  {deviceCharacteristics.bodyContactType || "None"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Contains Software:</span>
                <Badge variant={deviceCharacteristics.containsSoftware ? "default" : "secondary"}>
                  {deviceCharacteristics.containsSoftware ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Provided Sterile:</span>
                <Badge variant={deviceCharacteristics.isProvidedSterile ? "default" : "secondary"}>
                  {deviceCharacteristics.isProvidedSterile ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Excluded Items Section */}
        {excluded.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Excluded Items ({excluded.length})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExcluded(!showExcluded)}
                className="text-xs"
              >
                {showExcluded ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show
                  </>
                )}
              </Button>
            </div>

            {showExcluded && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {excluded.map(({ item, reason, isAutomatic }) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.clause} - {item.requirement}</div>
                      <div className="text-muted-foreground text-xs flex items-center gap-1">
                        {isAutomatic ? (
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                        ) : (
                          <Settings className="h-3 w-3 text-blue-500" />
                        )}
                        {reason}
                      </div>
                    </div>
                    
                    {isAutomatic && onManualOverride && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Switch
                              checked={manualOverrides[item.id] === true}
                              onCheckedChange={(checked) => onManualOverride(item.id, checked)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Override automatic exclusion</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExcluded(!showExcluded)}
            disabled={excluded.length === 0}
          >
            <Filter className="h-4 w-4 mr-1" />
            {showExcluded ? 'Hide' : 'Review'} Excluded ({excluded.length})
          </Button>
          
          {autoExcluded.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Smart filtering saved {autoExcluded.length} items
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}