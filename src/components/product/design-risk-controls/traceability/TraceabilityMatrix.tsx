import React, { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Download, Filter, Link, ExternalLink, Columns } from "lucide-react";
import { traceabilityService } from "@/services/enhancedTraceabilityService";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

// Map item types to their navigation tab/subTab
const TYPE_TO_ROUTE: Record<string, { tab: string; subTab?: string }> = {
  'bom_item': { tab: 'bom' },
  'device_component': { tab: 'device-architecture' },
  'feature': { tab: 'general', subTab: 'features' },
  'user_need': { tab: 'requirement-specifications', subTab: 'user-needs' },
  'system_requirement': { tab: 'requirement-specifications', subTab: 'system-requirements' },
  'software_requirement': { tab: 'requirement-specifications', subTab: 'software-requirements' },
  'hardware_requirement': { tab: 'requirement-specifications', subTab: 'hardware-requirements' },
  'hazard': { tab: 'risk-management', subTab: 'hazard-traceability' },
  'risk_control': { tab: 'risk-management', subTab: 'hazard-traceability' },
  'test_case': { tab: 'verification-validation', subTab: 'test-cases' },
};

interface TraceabilityMatrixProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function TraceabilityMatrix({ productId, companyId, disabled = false }: TraceabilityMatrixProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const navigateToItem = useCallback((itemType: string) => {
    const route = TYPE_TO_ROUTE[itemType];
    if (!route) return;
    // Use setSearchParams to preserve existing params (matrixSource, matrixTargets)
    // and avoid race conditions with navigate()
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', route.tab);
    if (route.subTab) newParams.set('subTab', route.subTab);
    newParams.set('returnTo', 'matrix');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const defaultTargets = ['device_component', 'feature', 'system_requirement', 'software_requirement', 'hardware_requirement', 'hazard', 'risk_control', 'test_case'];
  const isInitialMount = useRef(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Helper to read persisted settings from localStorage
  const getPersistedSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem(`matrix-settings-${productId}`);
      if (stored) return JSON.parse(stored) as { source: string; targets: string[] };
    } catch {}
    return null;
  }, [productId]);

  // Helper to save settings to localStorage
  const persistSettings = useCallback((source: string, targets: string[]) => {
    try {
      localStorage.setItem(`matrix-settings-${productId}`, JSON.stringify({ source, targets }));
    } catch {}
  }, [productId]);

  const [selectedSourceType, setSelectedSourceType] = useState(() => {
    const fromUrl = searchParams.get('matrixSource');
    if (fromUrl) return fromUrl;
    const persisted = (() => { try { const s = localStorage.getItem(`matrix-settings-${productId}`); return s ? JSON.parse(s) : null; } catch { return null; } })();
    return persisted?.source || 'user_need';
  });
  const [selectedTargetTypes, setSelectedTargetTypes] = useState<string[]>(() => {
    const param = searchParams.get('matrixTargets');
    if (param) return param.split(',').filter(Boolean);
    const persisted = (() => { try { const s = localStorage.getItem(`matrix-settings-${productId}`); return s ? JSON.parse(s) : null; } catch { return null; } })();
    return persisted?.targets || defaultTargets;
  });

  // Single unified list of all item types - used for both source and target selection
  const itemTypeOptions = [
    { value: 'bom_item', label: 'BOM Items' },
    { value: 'device_component', label: 'Components' },
    { value: 'feature', label: 'Features' },
    { value: 'user_need', label: lang('traceability.matrix.userNeeds') },
    { value: 'system_requirement', label: lang('traceability.matrix.systemRequirements') },
    { value: 'software_requirement', label: lang('traceability.matrix.softwareRequirements') },
    { value: 'hardware_requirement', label: lang('traceability.matrix.hardwareRequirements') },
    { value: 'hazard', label: lang('traceability.matrix.hazards') },
    { value: 'risk_control', label: lang('traceability.matrix.riskControls') },
    { value: 'test_case', label: lang('traceability.matrix.testCases') }
  ];

  // Canonical column order
  const CANONICAL_ORDER = ['bom_item', 'device_component', 'feature', 'user_need', 'system_requirement', 'software_requirement', 'hardware_requirement', 'hazard', 'risk_control', 'test_case'];

  // Target types = all types except the currently selected source type
  const availableTargetTypes = itemTypeOptions.filter(opt => opt.value !== selectedSourceType);

  // Sort selected targets by canonical order so columns always render consistently
  const sortedTargetTypes = [...selectedTargetTypes].sort(
    (a, b) => CANONICAL_ORDER.indexOf(a) - CANONICAL_ORDER.indexOf(b)
  );

  const { data: matrixData, isLoading, refetch } = useQuery({
    queryKey: ['traceability-matrix', companyId, productId, selectedSourceType, selectedTargetTypes],
    queryFn: () => traceabilityService.getTraceabilityMatrix(
      companyId, 
      productId, 
      [selectedSourceType], 
      selectedTargetTypes
    ),
    enabled: !!selectedSourceType && selectedTargetTypes.length > 0
  });

  // Sync state to URL params and localStorage - skip initial mount to avoid overwriting URL params
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.set('matrixSource', selectedSourceType);
    newParams.set('matrixTargets', selectedTargetTypes.join(','));
    setSearchParams(newParams, { replace: true });
    persistSettings(selectedSourceType, selectedTargetTypes);
  }, [selectedSourceType, selectedTargetTypes]);

  const handleSourceTypeChange = (type: string) => {
    if (disabled) return;
    setSelectedSourceType(type);
    setSelectedTargetTypes(prev => prev.filter(t => t !== type));
  };

  const handleTargetTypeChange = (type: string, checked: boolean) => {
    if (disabled) return;
    if (checked) {
      setSelectedTargetTypes(prev => [...prev, type]);
    } else {
      setSelectedTargetTypes(prev => prev.filter(t => t !== type));
    }
  };

  const handleExportMatrix = () => {
    if (disabled) return;
    toast.info(lang('traceability.matrix.exportComingSoon'));
  };

  const getCellContent = (sourceId: string, targetType: string) => {
    const links = matrixData?.matrix[sourceId]?.[targetType] || [];
    
    if (links.length === 0) {
      return <span className="text-muted-foreground">–</span>;
    }

    // Get identifiers from targetItems for each linked item
    const linkedIdentifiers = links.map(link => {
      const target = matrixData?.targetItems.find(t => t.id === link.target_id);
      return target?.identifier || 'Unknown';
    }).filter(id => id !== 'Unknown');

    if (linkedIdentifiers.length === 0) {
      // Fallback if we can't find identifiers
      return (
        <Badge variant="outline" className="gap-1">
          <Link className="h-3 w-3" />
          {links.length}
        </Badge>
      );
    }

    // Show all identifiers as clickable badges with tooltips
    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {linkedIdentifiers.map((id, idx) => {
          const target = matrixData?.targetItems.find(t => t.identifier === id);
          // Color logic: Green = Passed/Verified, Yellow = tests exist but pending, Red = Failed/Not Verified/no tests
          const vStatus = target?.verificationStatus;
          // Color is driven purely by verificationStatus now (computed for all items)
          const statusClass = 
            vStatus === 'Verified' ? 'bg-green-100 text-green-800 border-green-200' :
            vStatus === 'Verification Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
            'bg-red-100 text-red-800 border-red-200';
          return (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`gap-1 cursor-pointer text-xs hover:opacity-80 transition-opacity ${statusClass}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToItem(targetType);
                  }}
                >
                  {id}
                  <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px]">
                <p className="text-xs font-medium">{id}</p>
                {target?.name && <p className="text-xs text-muted-foreground">{target.name}</p>}
                {vStatus && <p className="text-xs font-medium">{vStatus}</p>}
                {target?.status && <p className="text-xs text-muted-foreground italic">Status: {target.status}</p>}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{lang('traceability.matrix.title')}</h3>
          <div className="flex gap-2">
            <Button disabled variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              {lang('traceability.matrix.configure')}
            </Button>
            <Button disabled variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {lang('traceability.matrix.export')}
            </Button>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-8">
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-foreground">{lang('traceability.matrix.title')}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleExportMatrix} disabled={disabled}>
              <Download className="h-4 w-4 mr-2" />
              {lang('traceability.matrix.exportMatrix')}
            </Button>
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={disabled}>
                  <Settings className="h-4 w-4" />
                  Matrix Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72"
                align="end"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{lang('traceability.matrix.sourceTypes')} (Rows)</Label>
                    <Select value={selectedSourceType} onValueChange={handleSourceTypeChange} disabled={disabled}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {itemTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm font-medium">{lang('traceability.matrix.targetTypes')} (Columns)</Label>
                    {availableTargetTypes.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`target-${option.value}`}
                          checked={selectedTargetTypes.includes(option.value)}
                          onCheckedChange={(checked) => handleTargetTypeChange(option.value, !!checked)}
                          disabled={disabled}
                        />
                        <label
                          htmlFor={`target-${option.value}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {lang('traceability.matrix.description')} (Click on badges to view link details. Empty cells (–) indicate missing traceability.)
        </p>
      </div>

      {matrixData && (
        <div>
          <div className="overflow-x-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">{lang('traceability.matrix.sourceItem')}</TableHead>
                    {sortedTargetTypes.map((targetType) => (
                      <TableHead key={targetType} className="text-center min-w-[120px]">
                        {itemTypeOptions.find(opt => opt.value === targetType)?.label || targetType}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixData.sourceItems.map((sourceItem) => (
                    <TableRow key={`${sourceItem.type}-${sourceItem.id}`}>
                      <TableCell className="font-medium align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                                    sourceItem.verificationStatus === 'Verified' ? 'bg-green-100 text-green-800 border-green-200' :
                                    sourceItem.verificationStatus === 'Verification Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    sourceItem.verificationStatus === 'Verification Failed' || sourceItem.verificationStatus === 'Not Verified' ? 'bg-red-100 text-red-800 border-red-200' :
                                    ''
                                  }`}
                                  onClick={() => navigateToItem(sourceItem.type)}
                                >
                                  {sourceItem.identifier}
                                  <ExternalLink className="h-2.5 w-2.5 ml-1" />
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[250px]">
                                <p className="text-xs font-medium">{sourceItem.identifier}</p>
                                {sourceItem.name && <p className="text-xs text-muted-foreground">{sourceItem.name}</p>}
                                {sourceItem.verificationStatus && <p className="text-xs font-medium">{sourceItem.verificationStatus}</p>}
                                {sourceItem.status && <p className="text-xs text-muted-foreground italic">Status: {sourceItem.status}</p>}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {sourceItem.name}
                          </span>
                        </div>
                      </TableCell>
                      {sortedTargetTypes.map((targetType) => (
                        <TableCell key={targetType} className="text-center align-middle">
                          {getCellContent(sourceItem.id, targetType)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">{lang('traceability.matrix.legend')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground mb-2">Verification Status</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs bg-green-100 border-green-500 text-green-800">
                ID-001
              </Badge>
              <span className="text-sm">Verified (all tests passed)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs bg-yellow-100 border-yellow-500 text-yellow-800">
                ID-001
              </Badge>
              <span className="text-sm">Pending (tests not yet executed)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs bg-red-100 border-red-500 text-red-800">
                ID-001
              </Badge>
              <span className="text-sm">Not Verified (failed or no test coverage)</span>
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Link Types</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">–</span>
              <span className="text-sm">{lang('traceability.matrix.noLink')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                ID-001
              </Badge>
              <span className="text-sm">{lang('traceability.matrix.singleLink')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1 text-xs">
                ID-001, ID-002, ID-003
              </Badge>
              <span className="text-sm">{lang('traceability.matrix.multipleLinks')}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>{lang('traceability.matrix.tip')}:</strong> {lang('traceability.matrix.tipDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}