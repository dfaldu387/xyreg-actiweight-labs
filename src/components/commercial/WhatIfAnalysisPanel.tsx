import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calculator, Info, ChevronRight } from 'lucide-react';
import { BundleWhatIfCalculator, WhatIfResult } from '@/services/bundleWhatIfCalculator';
import { useBundleRelationshipsForCalculation } from '@/hooks/useFeasibilityPortfolio';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WhatIfAnalysisPanelProps {
  bundleId: string;
  companyId: string;
}

export function WhatIfAnalysisPanel({ bundleId, companyId }: WhatIfAnalysisPanelProps) {
  // Load persisted settings from localStorage
  const getPersistedSettings = useCallback(() => {
    try {
      const key = `whatif-${bundleId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load persisted What-If settings:', error);
    }
    return null;
  }, [bundleId]);

  const persistedSettings = getPersistedSettings();

  const [selectedProductId, setSelectedProductId] = useState<string>(persistedSettings?.selectedProductId || '');
  const [unitsSold, setUnitsSold] = useState<string>(persistedSettings?.unitsSold || '1000');
  const [timeframeMonths, setTimeframeMonths] = useState<string>(persistedSettings?.timeframeMonths || '12');
  const [increasePerYear, setIncreasePerYear] = useState<string>(persistedSettings?.increasePerYear || '0');
  const [results, setResults] = useState<WhatIfResult[]>([]);
  
  // Initialize all groups as collapsed by default
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const initialCollapsed = new Set<string>();
    return initialCollapsed;
  });

  // Persist settings whenever they change
  useEffect(() => {
    try {
      const key = `whatif-${bundleId}`;
      const settings = {
        selectedProductId,
        unitsSold,
        timeframeMonths,
        increasePerYear,
      };
      localStorage.setItem(key, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to persist What-If settings:', error);
    }
  }, [bundleId, selectedProductId, unitsSold, timeframeMonths, increasePerYear]);

  const { data: bundleRelationships, isLoading } = useBundleRelationshipsForCalculation(bundleId);

  const primaryProducts = useMemo(() => {
    return bundleRelationships?.filter((r) => 
      r.is_primary || r.relationship_type === 'component' || r.relationship_type === 'required'
    ) || [];
  }, [bundleRelationships]);

  // Auto-select the first primary product if there's only one
  useEffect(() => {
    if (primaryProducts.length === 1 && !selectedProductId) {
      setSelectedProductId(primaryProducts[0].product_id || primaryProducts[0].id);
    }
  }, [primaryProducts, selectedProductId]);

  const handleCalculate = useCallback(() => {
    if (!selectedProductId || !unitsSold || !bundleRelationships) return;

    const units = parseFloat(unitsSold);
    const months = parseFloat(timeframeMonths);
    const growthRate = parseFloat(increasePerYear) || 0;

    if (isNaN(units) || isNaN(months)) return;

    // Filter out the primary product from calculations (we're calculating dependent products)
    const dependentProducts = bundleRelationships.filter(
      (r) => {
        const rProductId = r.product_id || r.id;
        const isPrimary = r.is_primary || r.relationship_type === 'component' || r.relationship_type === 'required';
        return rProductId !== selectedProductId && !isPrimary;
      }
    );

    const calculatedResults = BundleWhatIfCalculator.calculateDependentSales(
      units,
      months,
      dependentProducts,
      growthRate
    );

    setResults(calculatedResults);
    
    // Set all groups as collapsed by default when results are calculated
    const groupNames = new Set<string>();
    calculatedResults.forEach(result => {
      if (result.productName.includes('(Group Total)')) {
        groupNames.add(result.productName.replace(' (Group Total)', ''));
      }
    });
    setCollapsedGroups(groupNames);
  }, [selectedProductId, unitsSold, timeframeMonths, increasePerYear, bundleRelationships]);

  // Auto-recalculate when inputs change
  useEffect(() => {
    if (selectedProductId && unitsSold && timeframeMonths) {
      const timer = setTimeout(() => {
        handleCalculate();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [unitsSold, timeframeMonths, increasePerYear, selectedProductId, handleCalculate]);


  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const getRelationshipBadgeVariant = (type: string) => {
    switch (type) {
      case 'accessory':
        return 'default';
      case 'consumable':
        return 'secondary';
      case 'component':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const visibleResults = useMemo(() => {
    return results.filter(result => {
      if (!result.isVariant) return true;
      return !collapsedGroups.has(result.parentGroup || '');
    });
  }, [results, collapsedGroups]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>What-If Analysis</CardTitle>
          <CardDescription>Loading bundle relationships...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!bundleRelationships || bundleRelationships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>What-If Analysis</CardTitle>
          <CardDescription>
            No bundle relationships found. Please add products to the bundle first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          What-If Analysis
        </CardTitle>
        <CardDescription>
          Calculate how many dependent products are needed based on primary product sales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-product">Primary Product</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="primary-product">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {primaryProducts.map((product) => (
                  <SelectItem key={product.id} value={product.product_id || product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="units-sold">Units Sold</Label>
            <Input
              id="units-sold"
              type="number"
              value={unitsSold}
              onChange={(e) => setUnitsSold(e.target.value)}
              placeholder="1000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe (months)</Label>
            <Input
              id="timeframe"
              type="number"
              value={timeframeMonths}
              onChange={(e) => setTimeframeMonths(e.target.value)}
              placeholder="12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="increase-per-year">Increase per Year (%)</Label>
            <Input
              id="increase-per-year"
              type="number"
              value={increasePerYear}
              onChange={(e) => setIncreasePerYear(e.target.value)}
              placeholder="0"
              step="1"
              min="0"
            />
          </div>
        </div>


        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Calculated Product Sales</h3>
              <p className="text-sm text-muted-foreground">
                Based on {unitsSold} units over {timeframeMonths} months
                {parseFloat(increasePerYear) > 0 && ` with ${increasePerYear}% annual growth`}
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Relationship</TableHead>
                  {results[0]?.unitsByYear && results[0].unitsByYear.map((_, index) => (
                    <TableHead key={index} className="text-right">Year {index + 1}</TableHead>
                  ))}
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleResults.map((result, index) => (
                  <TableRow 
                    key={`${result.productId}-${index}`}
                    className={result.isVariant ? 'bg-muted/30' : ''}
                  >
                    <TableCell className={result.isVariant ? 'pl-8' : ''}>
                      <div className="flex items-center gap-2">
                        {result.productName.includes('(Group Total)') && (
                          <ChevronRight 
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform cursor-pointer hover:text-foreground",
                              !collapsedGroups.has(result.productName.replace(' (Group Total)', '')) && "rotate-90"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroup(result.productName.replace(' (Group Total)', ''));
                            }}
                          />
                        )}
                        <div className="flex flex-col">
                          <span className={result.isVariant ? 'text-sm' : 'font-medium'}>
                            {result.productName}
                          </span>
                          {result.isVariant && (
                            <span className="text-xs text-muted-foreground">
                              → Variant of {result.parentGroup}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRelationshipBadgeVariant(result.relationshipType)}>
                        {result.relationshipType}
                      </Badge>
                    </TableCell>
                    {result.unitsByYear && result.unitsByYear.map((yearUnits, yearIndex) => (
                      <TableCell key={yearIndex} className="text-right font-mono">
                        {yearUnits.toLocaleString()}
                      </TableCell>
                    ))}
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p className="text-xs font-mono whitespace-pre-wrap">{result.calculationExplanation}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {results.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No dependent products found in this bundle
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
