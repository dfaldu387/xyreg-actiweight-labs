import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Check, Search } from "lucide-react";
import { useEmdnCodes, buildEmdnHierarchy, formatEmdnDisplay, filterEmdnCodes, buildEmdnBreadcrumb, type EmdnCode, type EmdnHierarchy } from "@/hooks/useEmdnCodes";
import { getEmdnDisplayText } from "@/utils/emdnNaming";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EmdnSelectorProps {
  value?: string; // emdn_category_id
  onValueChange?: (categoryId: string, code: string, name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  productData?: any; // For auto-populating from EUDAMED data
}

interface HierarchyNodeProps {
  node: EmdnHierarchy;
  selectedId?: string;
  onSelect: (node: EmdnHierarchy) => void;
  searchTerm: string;
  level?: number;
}

function HierarchyNode({ node, selectedId, onSelect, searchTerm, level = 0 }: HierarchyNodeProps) {
  const [isOpen, setIsOpen] = useState(searchTerm.trim() !== ''); // Only open when searching, start closed otherwise
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

  const handleSelect = () => {
    onSelect(node);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const isSelected = selectedId === node.id;

  return (
    <>
      <CommandItem
        onSelect={handleSelect}
        className={cn(
          "flex items-center gap-2 cursor-pointer relative",
          isSelected && "bg-accent text-accent-foreground"
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
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm flex items-center gap-2">
            <span className="text-primary font-mono">{highlightMatch(node.emdn_code, searchTerm)}</span>
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Level {node.level}</span>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {highlightMatch(getEmdnDisplayText(node.emdn_code, node.description, node.level).split(' - ').slice(1).join(' - '), searchTerm)}
          </div>
          {node.risk_class && (
            <div className="text-xs text-amber-600 dark:text-amber-400">
              Risk Class: {node.risk_class}
            </div>
          )}
        </div>
        
        {isSelected && <Check className="h-4 w-4" />}
      </CommandItem>
      
      {hasChildren && isOpen && (
        <div>
          {node.children?.map(child => (
            <HierarchyNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              searchTerm={searchTerm}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function EmdnSelector({ value, onValueChange, placeholder = "Select EMDN code...", disabled, productData }: EmdnSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);
  
  const { data: allEmdnCodes = [], isLoading, error } = useEmdnCodes();
  
  
  
  // Find selected code
  const selectedCode = useMemo(() => {
    if (!value || !allEmdnCodes.length) return null;
    
    // First try to find by ID (standard behavior)
    let found = allEmdnCodes.find(code => code.id === value);
    
    // If not found by ID, try to find by EMDN code (for backwards compatibility)
    if (!found) {
      found = allEmdnCodes.find(code => code.emdn_code === value);
      
      // If we found it by EMDN code, auto-update to use the correct ID
      if (found && onValueChange) {
        
        // Update the parent component to use the correct ID
        setTimeout(() => onValueChange(found.id, found.emdn_code, found.description), 0);
      }
    }
    
    return found;
  }, [value, allEmdnCodes, onValueChange]);

  // Auto-populate from EUDAMED data
  useEffect(() => {
    
    
    if (
      !value && // No current value
      !hasAutoPopulated && // Haven't auto-populated yet
      allEmdnCodes.length > 0 &&
      onValueChange
    ) {
      // Check for EUDAMED nomenclature codes in different possible locations
      const eudamedCodes = 
        productData?.eudamed_nomenclature_codes || // Direct field
        productData?.key_features?.eudamed_data?.nomenclature_codes || // Nested in key_features
        null;
      
     
      
      if (eudamedCodes) {
        
        
        // Handle both string and array formats
        const codesArray = Array.isArray(eudamedCodes) ? eudamedCodes : [eudamedCodes];
        
        // Try to find matching EMDN code in our database
        for (const eudamedCode of codesArray) {
          const codeString = typeof eudamedCode === 'string' ? eudamedCode : String(eudamedCode);
          
          // Extract just the code part (before the colon) if it's in format "Z12100580: DESCRIPTION"
          const extractedCode = codeString.split(':')[0].trim();
          
         
          
          const matchingEmdn = allEmdnCodes.find(emdn => 
            emdn.emdn_code === extractedCode || 
            emdn.emdn_code === codeString ||
            emdn.emdn_code.startsWith(extractedCode) ||
            extractedCode.startsWith(emdn.emdn_code)
          );
          
          if (matchingEmdn) {
            
            
            onValueChange(matchingEmdn.id, matchingEmdn.emdn_code, matchingEmdn.description);
            setHasAutoPopulated(true);
            
            // Show notification
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('showToast', {
                detail: {
                  title: 'EMDN Code Auto-Populated',
                  description: `Set to "${matchingEmdn.emdn_code}" from EUDAMED data`,
                  type: 'success'
                }
              }));
            }
            break;
          } else {
            
          }
        }
      } else {
        
      }
    }
  }, [value, hasAutoPopulated, productData, allEmdnCodes, onValueChange]);

  // Filter codes based on search and build hierarchy
  const { filteredCodes, hierarchy } = useMemo(() => {
    const filtered = searchTerm.trim() ? filterEmdnCodes(allEmdnCodes, searchTerm) : allEmdnCodes;
    
    if (searchTerm.trim()) {
      // For search results, show flat list
      return {
        filteredCodes: filtered,
        hierarchy: filtered.map(code => ({ ...code, children: [] }))
      };
    }
    
    // For normal hierarchy display, build tree structure
    const builtHierarchy = buildEmdnHierarchy(allEmdnCodes);
    
    
    
    return {
      filteredCodes: allEmdnCodes,
      hierarchy: builtHierarchy
    };
  }, [allEmdnCodes, searchTerm]);

  const handleSelect = useCallback((node: EmdnHierarchy) => {
    onValueChange?.(node.id, node.emdn_code, node.description);
    setOpen(false);
    setSearchTerm(""); // Clear search when selecting
  }, [onValueChange]);

  const displayValue = selectedCode 
    ? formatEmdnDisplay(selectedCode)
    : placeholder;

  if (error) {
    console.error('EMDN codes loading error:', error);
    return (
      <div className="text-sm text-red-600">
        Error loading EMDN codes. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="emdn-selector">EMDN Code</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="emdn-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              !selectedCode && "text-muted-foreground"
            )}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[800px] p-0 bg-popover z-50" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Search EMDN codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList className="max-h-[500px] overflow-y-auto">
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
                      selectedId={value}
                      onSelect={handleSelect}
                      searchTerm={searchTerm}
                    />
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedCode && (
        <div className="text-xs text-muted-foreground">
          {buildEmdnBreadcrumb(allEmdnCodes, selectedCode)}
        </div>
      )}
    </div>
  );
}