import React, { useMemo, useState, useEffect } from 'react';
import { ChevronUp, Network, RotateCcw, Building2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEmdnCodes, type EmdnCode } from '@/hooks/useEmdnCodes';
import { emdnCompetitiveStatsService, type EmdnCompetitiveStats } from '@/services/emdnCompetitiveStatsService';

interface EmdnNavigationBreadcrumbsProps {
  currentEmdnCode: string;
  startingEmdnCode: string;
  onEmdnCodeChange?: (newCode: string) => void;
}

interface NavigationContext {
  parent: EmdnCode | null;
  current: EmdnCode | null;
  siblings: EmdnCode[];
}

export function EmdnNavigationBreadcrumbs({ 
  currentEmdnCode, 
  startingEmdnCode,
  onEmdnCodeChange 
}: EmdnNavigationBreadcrumbsProps) {
  const { data: codes = [], isLoading } = useEmdnCodes();
  const [competitiveStats, setCompetitiveStats] = useState<Map<string, EmdnCompetitiveStats>>(new Map());
  const [loadingStats, setLoadingStats] = useState<Set<string>>(new Set());

  const navigationContext = useMemo((): NavigationContext => {
    if (!codes.length || !currentEmdnCode) {
      return { parent: null, current: null, siblings: [] };
    }

    // Find current code (case-insensitive)
    const current = codes.find(code => 
      code.emdn_code.toLowerCase() === currentEmdnCode.toLowerCase()
    );

    if (!current) {
      return { parent: null, current: null, siblings: [] };
    }

    // Find parent (one level up)
    const parent = current.parent_id ? 
      codes.find(code => code.emdn_code === current.parent_id) : null;

    // Find all siblings under the same parent (including current for stats)
    const siblings = codes.filter(code => 
      code.parent_id === current.parent_id && 
      code.emdn_code !== current.emdn_code
    ).sort((a, b) => a.emdn_code.localeCompare(b.emdn_code));

    return { parent, current, siblings };
  }, [codes, currentEmdnCode]);

  // Load competitive stats for relevant EMDN codes
  useEffect(() => {
    const loadStatsForCodes = async () => {
      const { parent, current, siblings } = navigationContext;
      const codesToLoad = [];
      
      if (current && !competitiveStats.has(current.emdn_code)) {
        codesToLoad.push(current.emdn_code);
      }
      if (parent && !competitiveStats.has(parent.emdn_code)) {
        codesToLoad.push(parent.emdn_code);
      }
      siblings.forEach(sibling => {
        if (!competitiveStats.has(sibling.emdn_code)) {
          codesToLoad.push(sibling.emdn_code);
        }
      });

      if (codesToLoad.length === 0) return;

      // Mark codes as loading
      setLoadingStats(prev => new Set([...prev, ...codesToLoad]));

      // Load stats for all codes
      const statsPromises = codesToLoad.map(async (code) => {
        try {
          const stats = await emdnCompetitiveStatsService.getCompetitiveStats(code);
          return { code, stats };
        } catch (error) {
          console.error(`Failed to load stats for ${code}:`, error);
          return { code, stats: { manufacturers: 0, totalProducts: 0, totalDevices: 0 } };
        }
      });

      try {
        const results = await Promise.all(statsPromises);
        
        setCompetitiveStats(prev => {
          const newStats = new Map(prev);
          results.forEach(({ code, stats }) => {
            newStats.set(code, stats);
          });
          return newStats;
        });
      } finally {
        setLoadingStats(prev => {
          const newSet = new Set(prev);
          codesToLoad.forEach(code => newSet.delete(code));
          return newSet;
        });
      }
    };

    loadStatsForCodes();
  }, [navigationContext, competitiveStats]);

  // Get stats for an EMDN code (with loading state)
  const getEmdnStats = (code: string): EmdnCompetitiveStats => {
    const stats = competitiveStats.get(code);
    const isLoading = loadingStats.has(code);
    
    if (stats) {
      return stats;
    }
    
    if (isLoading) {
      return { manufacturers: 0, totalProducts: 0, totalDevices: 0, isLoading: true };
    }
    
    // Fallback to prevent blank display
    return { manufacturers: 0, totalProducts: 0, totalDevices: 0 };
  };

  const handleCodeClick = (code: string) => {
    if (onEmdnCodeChange && code !== currentEmdnCode) {
      onEmdnCodeChange(code);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Network className="h-4 w-4 animate-pulse" />
            Loading EMDN navigation...
          </div>
        </CardContent>
      </Card>
    );
  }

  const { parent, current, siblings } = navigationContext;

  if (!current) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Network className="h-4 w-4" />
            EMDN code "{currentEmdnCode}" not found
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStats = getEmdnStats(current.emdn_code);
  const parentStats = parent ? getEmdnStats(parent.emdn_code) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Network className="h-5 w-5" />
            EMDN Navigation
          </CardTitle>
          {currentEmdnCode !== startingEmdnCode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCodeClick(startingEmdnCode)}
              className="flex items-center gap-2 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Return to {startingEmdnCode}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parent Level (One Level Up) */}
        {parent && parentStats && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ChevronUp className="h-4 w-4" />
              Parent Level {parent.level}
            </div>
            <Button
              variant="outline"
              onClick={() => handleCodeClick(parent.emdn_code)}
              className="h-auto p-3 text-left justify-start w-full"
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex-1">
                  <div className="font-medium">{parent.emdn_code}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-md">
                    {parent.description}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {parentStats.isLoading ? '...' : parentStats.manufacturers}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                     <Users className="h-3 w-3" />
                     {parentStats.isLoading ? '...' : parentStats.totalProducts}
                   </div>
                </div>
              </div>
            </Button>
          </div>
        )}

        {parent && <Separator />}

        {/* Current Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              Current Level {current.level}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {currentStats.isLoading ? '...' : currentStats.manufacturers} manufacturers
              </div>
               <div className="flex items-center gap-1">
                 <Users className="h-3 w-3" />
                 {currentStats.isLoading ? '...' : currentStats.totalProducts} products
               </div>
            </div>
          </div>
          <div className="p-3 bg-primary/5 border-2 border-primary/20 rounded-md">
            <div className="font-medium text-primary">{current.emdn_code}</div>
            <div className="text-sm text-muted-foreground">
              {current.description}
            </div>
          </div>
        </div>

        {/* All Parallel Codes Under Parent (No Max Limit) */}
        {siblings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Parallel Codes Under Parent (Level {current.level})
              </div>
              <div className="text-xs text-muted-foreground">
                {siblings.length} codes
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {siblings.map((sibling) => {
                const siblingStats = getEmdnStats(sibling.emdn_code);
                return (
                  <Button
                    key={sibling.emdn_code}
                    variant="ghost"
                    onClick={() => handleCodeClick(sibling.emdn_code)}
                    className="h-auto p-2 text-left justify-start border hover:border-primary/20"
                  >
                    <div className="w-full">
                      <div className="font-medium text-sm">{sibling.emdn_code}</div>
                      <div className="text-xs text-muted-foreground truncate mb-1">
                        {sibling.description}
                      </div>
                       <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-2 w-2" />
                          {siblingStats.isLoading ? '...' : siblingStats.manufacturers}
                        </span>
                         <span className="flex items-center gap-1">
                           <Users className="h-2 w-2" />
                           {siblingStats.isLoading ? '...' : siblingStats.totalProducts}
                         </span>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}