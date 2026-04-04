
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, ChevronDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { DocumentUIStatus } from "@/utils/statusUtils";

interface DocumentFiltersProps {
  statusFilter: string[];
  onStatusFilterChange: (status: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function DocumentFilters({ 
  statusFilter, 
  onStatusFilterChange, 
  searchQuery = "", 
  onSearchChange 
}: DocumentFiltersProps) {
  const statusOptions: DocumentUIStatus[] = ["Not Started", "In Review", "Approved", "Report", "Rejected", "N/A"];
  const isShowingAll = statusFilter.length === 0;
  
  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-background">
          <Filter className="h-4 w-4" />
          <span>
            {isShowingAll 
              ? "Filter by Status" 
              : statusFilter.length === 1 
                ? statusFilter[0]
                : `${statusFilter.length} Statuses`
            }
          </span>
          {isShowingAll ? (
            <Badge variant="outline" className="ml-1">All</Badge>
          ) : (
            <Badge variant="secondary" className="ml-1">
              {statusFilter.length}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border z-50">
        <DropdownMenuLabel>Document Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem 
          checked={isShowingAll}
          onCheckedChange={() => onStatusFilterChange('__SHOW_ALL__')}
          className="font-medium"
        >
          All Statuses
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[200px] overflow-y-auto">
          {statusOptions.map((status) => (
            <DropdownMenuCheckboxItem 
              key={status}
              checked={statusFilter.includes(status)}
              onCheckedChange={(checked) => {
                onStatusFilterChange(status);
              }}
              onSelect={(e) => e.preventDefault()}
            >
              {status}
            </DropdownMenuCheckboxItem>
          ))}
        </ScrollArea>
        {statusFilter.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem 
              checked={false}
              onCheckedChange={() => onStatusFilterChange('__CLEAR_ALL__')}
              className="text-muted-foreground"
            >
              Clear all filters
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    
    {/* Search field */}
    {onSearchChange && (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-64 !bg-background shadow-sm"
        />
      </div>
    )}
    </div>
  );
}
