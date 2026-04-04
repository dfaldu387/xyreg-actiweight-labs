
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import { Phase, PhaseCategory } from "./ConsolidatedPhaseDataService";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { sortPhasesInCategory } from "@/utils/phaseOrderingUtils";

interface AvailablePhasesCardProps {
  phases: Phase[];
  categories: PhaseCategory[];
  loading: boolean;
  loadingError: string | null;
  onAddPhase: () => void;
  onAddExistingPhase: (phaseId: string) => void;
  onAddAllPhases: (phaseIds: string[]) => void;
  onRetry: () => void;
  operationInProgress?: Set<string>;
}

export function AvailablePhasesCard({
  phases,
  categories,
  loading,
  loadingError,
  onAddPhase,
  onAddExistingPhase,
  onAddAllPhases,
  onRetry,
  operationInProgress = new Set()
}: AvailablePhasesCardProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleAllCategories = () => {
    const allKeys = Object.keys(groupedPhases);
    const allClosed = allKeys.every(key => !openCategories[key]);
    
    if (allClosed) {
      // Open all
      const newState = allKeys.reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setOpenCategories(newState);
    } else {
      // Close all
      setOpenCategories({});
    }
  };

  const removeAllPhases = () => {
    onAddAllPhases(phases.map(p => p.id));
  };

  const toggleCategory = (categoryKey: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return undefined;
    return categories.find(cat => cat.id === categoryId)?.name;
  };

  const getCategoryInfo = (categoryId?: string) => {
    if (!categoryId) return undefined;
    return categories.find(cat => cat.id === categoryId);
  };

  // Group phases by category
  const groupedPhases = phases.reduce((groups, phase) => {
    const categoryInfo = getCategoryInfo(phase.category_id);
    const categoryKey = phase.category_id || 'uncategorized';
    const categoryName = categoryInfo?.name || 'Uncategorized';
    const isSystemCategory = categoryInfo?.is_system_category || false;

    if (!groups[categoryKey]) {
      groups[categoryKey] = {
        categoryName,
        isSystemCategory,
        phases: []
      };
    }
    groups[categoryKey].phases.push(phase);
    return groups;
  }, {} as Record<string, { categoryName: string; isSystemCategory: boolean; phases: Phase[] }>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Available Phases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading available phases...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Available Phases - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-destructive text-sm">{loadingError}</p>
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Available Phases
            <Badge variant="secondary">{phases.length}</Badge>
          </CardTitle>
          {phases.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllCategories}
                className="h-8 text-xs"
              >
                {Object.keys(groupedPhases).every(key => !openCategories[key]) ? (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Expand All
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3 mr-1" />
                    Collapse All
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removeAllPhases}
                className="h-8 text-xs"
              >
                <ChevronsRight className="h-3 w-3 mr-1" />
                Add All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {phases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No available phases</p>
            <p className="text-xs mt-1">Create a new phase to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPhases).map(([categoryKey, group]) => {
              const isOpen = openCategories[categoryKey] === true; // Changed: Default to closed

              return (
                <Collapsible
                  key={categoryKey}
                  open={isOpen}
                  onOpenChange={() => toggleCategory(categoryKey)}
                >
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`flex-1 justify-between h-auto p-3 ${group.isSystemCategory
                          ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                          : 'bg-green-50 hover:bg-green-100 border border-green-200'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{group.categoryName}</span>
                          <Badge
                            variant={group.isSystemCategory ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {group.isSystemCategory ? "System" : "Custom"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {group.phases.length}
                          </Badge>
                        </div>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddAllPhases(group.phases.map(p => p.id));
                      }}
                      className="h-8 px-3 text-xs"
                      title={`Add all ${group.phases.length} phases from ${group.categoryName}`}
                    >
                      <ChevronsRight className="h-3 w-3 mr-1" />
                      Add All
                    </Button>
                  </div>

                  <CollapsibleContent className="space-y-2 mt-2">
                    {sortPhasesInCategory(group.phases, group.isSystemCategory).map((phase) => (
                      <div
                        key={phase.id}
                        className="p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {phase.name}
                              </span>
                            </div>
                            {phase.description && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {phase.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 ml-2">
                            {(() => {
                              const isAddingPhase = operationInProgress.has(phase.id);
                              return (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onAddExistingPhase(phase.id)}
                                  className="h-7 px-2 text-xs"
                                  title={isAddingPhase ? "Adding..." : "Add to active phases"}
                                  disabled={isAddingPhase}
                                >
                                  {isAddingPhase ? (
                                    <>
                                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                      Adding
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add
                                    </>
                                  )}
                                </Button>
                              );
                            })()}

                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
