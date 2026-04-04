import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Search, Building2, Users, RotateCcw } from "lucide-react";
import { useEmdnCodes, buildEmdnHierarchy, filterEmdnCodes, type EmdnHierarchy } from "@/hooks/useEmdnCodes";
import { getEmdnDisplayText } from "@/utils/emdnNaming";
import { cn } from "@/lib/utils";
import { emdnCompetitiveStatsService, type EmdnCompetitiveStats } from '@/services/emdnCompetitiveStatsService';
import { Badge } from '@/components/ui/badge';

interface EmdnNavigationTreeProps {
  currentEmdnCode: string;
  startingEmdnCode: string;
  onEmdnCodeChange?: (newCode: string) => void;
}

interface HierarchyNodeProps {
  node: EmdnHierarchy;
  currentCode?: string;
  onNavigate: (code: string) => void;
  searchTerm: string;
  level?: number;
  competitiveStats: Map<string, EmdnCompetitiveStats>;
  loadingStats: Set<string>;
  expansionPath: Set<string>;
}

function HierarchyNode({ 
  node, 
  currentCode, 
  onNavigate, 
  searchTerm, 
  level = 0,
  competitiveStats,
  loadingStats,
  expansionPath
}: HierarchyNodeProps) {
  const [isOpen, setIsOpen] = useState(
    searchTerm.trim() !== '' || expansionPath.has(node.emdn_code)
  );
  const hasChildren = node.children && node.children.length > 0;
  
  // Highlight matching text in search results
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900">{part}</mark>
      ) : part
    );
  };

  const handleNavigate = () => {
    onNavigate(node.emdn_code);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const isCurrent = currentCode === node.emdn_code;
  const stats = competitiveStats.get(node.emdn_code);
  const isLoadingStats = loadingStats.has(node.emdn_code);

  return (
    <>
      <CommandItem
        onSelect={handleNavigate}
        className={cn(
          "flex items-center gap-2 cursor-pointer relative py-3",
          isCurrent && "bg-primary/10 border-l-2 border-primary"
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={toggleOpen}
          >
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        {!hasChildren && <div className="w-4" />}
        
        <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
              <span className="text-primary font-mono">{highlightMatch(node.emdn_code, searchTerm)}</span>
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Level {node.level}</span>
              {isCurrent && (
                <Badge variant="secondary" className="text-xs">Current</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {highlightMatch(getEmdnDisplayText(node.emdn_code, node.description, node.level).split(' - ').slice(1).join(' - '), searchTerm)}
            </div>
          </div>
          
          {/* Competitive Stats - Disabled to prevent database timeouts */}
          {/* Stats can be viewed on the analysis page after selecting a code */}
        </div>
      </CommandItem>
      
      {hasChildren && isOpen && (
        <div>
          {node.children?.map(child => (
            <HierarchyNode
              key={child.id}
              node={child}
              currentCode={currentCode}
              onNavigate={onNavigate}
              searchTerm={searchTerm}
              level={level + 1}
              competitiveStats={competitiveStats}
              loadingStats={loadingStats}
              expansionPath={expansionPath}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Helper function to calculate all parent codes in the path
function getExpansionPath(emdnCode: string): Set<string> {
  const path = new Set<string>();
  for (let i = 1; i < emdnCode.length; i++) {
    path.add(emdnCode.substring(0, i));
  }
  return path;
}

export function EmdnNavigationTree({ 
  currentEmdnCode, 
  startingEmdnCode,
  onEmdnCodeChange 
}: EmdnNavigationTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [competitiveStats, setCompetitiveStats] = useState<Map<string, EmdnCompetitiveStats>>(new Map());
  const [loadingStats, setLoadingStats] = useState<Set<string>>(new Set());
  
  const { data: allEmdnCodes = [], isLoading, error } = useEmdnCodes();
  
  // Calculate which nodes should be auto-expanded to show the current code
  const expansionPath = useMemo(() => getExpansionPath(currentEmdnCode), [currentEmdnCode]);
  
  // Build hierarchy based on search
  const hierarchy = useMemo(() => {
    if (searchTerm.trim()) {
      // For search results, show flat list of matching codes
      const filtered = filterEmdnCodes(allEmdnCodes, searchTerm);
      return filtered.map(code => ({ ...code, children: [] }));
    }
    
    // For normal display, build full tree hierarchy
    return buildEmdnHierarchy(allEmdnCodes);
  }, [allEmdnCodes, searchTerm]);

  // DISABLED: Competitive stats loading to prevent database timeouts
  // The database queries for stats were causing timeouts and preventing 
  // the tree from displaying all EMDN codes (like Z12100585)
  // Stats can be viewed on the selected code's analysis page instead
  
  // useEffect(() => {
  //   // Stats loading code removed to fix display issues
  // }, [hierarchy, competitiveStats]);

  const handleNavigate = useCallback((code: string) => {
    if (onEmdnCodeChange && code !== currentEmdnCode) {
      onEmdnCodeChange(code);
    }
  }, [onEmdnCodeChange, currentEmdnCode]);

  const handleReturnToStart = () => {
    if (startingEmdnCode !== currentEmdnCode) {
      handleNavigate(startingEmdnCode);
    }
  };

  if (error) {
    console.error('EMDN codes loading error:', error);
    return (
      <div className="text-sm text-red-600 p-4">
        Error loading EMDN codes. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with Return Button */}
      {currentEmdnCode !== startingEmdnCode && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReturnToStart}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-3 w-3" />
            Return to {startingEmdnCode}
          </Button>
        </div>
      )}

      {/* Search and Hierarchy Tree */}
      <Command shouldFilter={false} className="border rounded-lg">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            placeholder="Search EMDN codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <CommandList className="max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <CommandEmpty>Loading EMDN codes...</CommandEmpty>
          ) : hierarchy.length === 0 ? (
            <CommandEmpty>
              {searchTerm ? "No matching EMDN codes found." : "No EMDN codes available."}
            </CommandEmpty>
          ) : (
            <CommandGroup>
              {hierarchy.map(node => (
                <HierarchyNode
                  key={node.id}
                  node={node}
                  currentCode={currentEmdnCode}
                  onNavigate={handleNavigate}
                  searchTerm={searchTerm}
                  competitiveStats={competitiveStats}
                  loadingStats={loadingStats}
                  expansionPath={expansionPath}
                />
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>

      {/* Info Note */}
      <div className="text-xs text-muted-foreground px-2">
        💡 Select an EMDN code to view detailed competitive analysis with manufacturer and product counts
      </div>
    </div>
  );
}
