import React, { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle, Circle, Filter, ArrowUpDown, GitCompare, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FDAProductCodeService } from '@/services/fdaProductCodeService';
import { FDAProductCodeInfo } from '@/types/fdaEnhanced';

interface ProductCodeSelectorProps {
  productCodes: string[];
  selectedCodes: string[];
  onSelectionChange: (codes: string[]) => void;
  onCompare: (codes: string[]) => void;
  getFrequency?: (code: string) => number;
  maxSelection?: number;
}

type SortType = 'frequency' | 'alphabetical' | 'deviceClass';
type FilterType = 'all' | '1' | '2' | '3';

export function ProductCodeSelector({ 
  productCodes, 
  selectedCodes, 
  onSelectionChange, 
  onCompare,
  getFrequency,
  maxSelection = 10 
}: ProductCodeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('frequency');
  const [filterBy, setFilterBy] = useState<FilterType>('all');
  const [codeInfos, setCodeInfos] = useState<Record<string, FDAProductCodeInfo | null>>({});
  const [loading, setLoading] = useState(false);

  // Fetch product code information
  useEffect(() => {
    const fetchCodeInfos = async () => {
      if (productCodes.length === 0) return;
      
      setLoading(true);
      try {
        const infos = await FDAProductCodeService.getMultipleProductCodeInfo(productCodes);
        const infoMap: Record<string, FDAProductCodeInfo | null> = {};
        
        productCodes.forEach((code, index) => {
          infoMap[code] = infos[index];
        });
        
        setCodeInfos(infoMap);
      } catch (error) {
        console.error('Error fetching product code info:', error);
        // Set fallback data
        const fallbackMap: Record<string, FDAProductCodeInfo | null> = {};
        productCodes.forEach(code => {
          fallbackMap[code] = null;
        });
        setCodeInfos(fallbackMap);
      } finally {
        setLoading(false);
      }
    };

    fetchCodeInfos();
  }, [productCodes]);

  const processedCodes = useMemo(() => {
    return productCodes.map(code => {
      const info = codeInfos[code];
      return {
        code,
        info,
        frequency: getFrequency?.(code) || 0,
        hasComparisonData: info !== null
      };
    });
  }, [productCodes, codeInfos, getFrequency]);

  const filteredAndSortedCodes = useMemo(() => {
    let filtered = processedCodes.filter(({ code, info }) => {
      // Search filter
      const matchesSearch = !searchQuery || 
        code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info?.medicalSpecialty?.toLowerCase().includes(searchQuery.toLowerCase());

      // Device class filter
      const matchesClass = filterBy === 'all' || info?.deviceClass === filterBy;

      return matchesSearch && matchesClass;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return b.frequency - a.frequency;
        case 'alphabetical':
          return a.code.localeCompare(b.code);
        case 'deviceClass':
          return (a.info?.deviceClass || '').localeCompare(b.info?.deviceClass || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [processedCodes, searchQuery, sortBy, filterBy]);

  const handleSelectAll = () => {
    const allCodes = filteredAndSortedCodes.slice(0, maxSelection).map(({ code }) => code);
    onSelectionChange(allCodes);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const handleSelectTop = (count: number) => {
    const topCodes = filteredAndSortedCodes.slice(0, count).map(({ code }) => code);
    onSelectionChange(topCodes);
  };

  const handleCodeToggle = (code: string) => {
    const isSelected = selectedCodes.includes(code);
    if (isSelected) {
      onSelectionChange(selectedCodes.filter(c => c !== code));
    } else {
      if (selectedCodes.length < maxSelection) {
        onSelectionChange([...selectedCodes, code]);
      }
    }
  };

  const canCompare = selectedCodes.length >= 2;
  const isAtMax = selectedCodes.length >= maxSelection;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Product Code Selection
          </span>
          <Badge variant="outline">
            {selectedCodes.length} / {maxSelection} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search codes or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-1">Sort By</label>
            <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frequency">Frequency</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="deviceClass">Device Class</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Filter by Class</label>
            <Select value={filterBy} onValueChange={(value: FilterType) => setFilterBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="1">Class I</SelectItem>
                <SelectItem value="2">Class II</SelectItem>
                <SelectItem value="3">Class III</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleSelectAll} 
            variant="outline" 
            size="sm"
            disabled={filteredAndSortedCodes.length === 0}
          >
            Select All Visible
          </Button>
          <Button 
            onClick={handleClearAll} 
            variant="outline" 
            size="sm"
            disabled={selectedCodes.length === 0}
          >
            Clear All
          </Button>
          <Button 
            onClick={() => handleSelectTop(5)} 
            variant="outline" 
            size="sm"
            disabled={filteredAndSortedCodes.length < 5}
          >
            Top 5
          </Button>
          <Button 
            onClick={() => handleSelectTop(8)} 
            variant="outline" 
            size="sm"
            disabled={filteredAndSortedCodes.length < 8}
          >
            Top 8
          </Button>
        </div>

        {/* Selection Warning */}
        {isAtMax && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              Maximum selection limit reached ({maxSelection} codes). Deselect codes to add others.
            </span>
          </div>
        )}

        {/* Product Code List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading product code information...
            </div>
          ) : (
            filteredAndSortedCodes.map(({ code, info, frequency, hasComparisonData }) => {
              const isSelected = selectedCodes.includes(code);
            return (
              <TooltipProvider key={code}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-primary/10 border-primary shadow-sm' 
                          : hasComparisonData 
                            ? 'hover:bg-muted border-border'
                            : 'border-dashed border-muted-foreground/30 hover:border-muted-foreground/50'
                      } ${isAtMax && !isSelected ? 'opacity-50' : ''}`}
                      onClick={() => handleCodeToggle(code)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={isSelected ? "default" : hasComparisonData ? "outline" : "secondary"}
                              className={info ? FDAProductCodeService.getDeviceClassColor(info.deviceClass) : 'text-muted-foreground'}
                            >
                              {code}
                            </Badge>
                            {info && (
                              <Badge variant="secondary" className="text-xs">
                                Class {info.deviceClass}
                              </Badge>
                            )}
                            {!hasComparisonData && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          <p className={`text-sm font-medium truncate mt-1 ${
                            hasComparisonData ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {info?.description || 'Unknown FDA product code'}
                          </p>
                          {info?.medicalSpecialty && (
                            <p className="text-xs text-muted-foreground">
                              {info.medicalSpecialty}
                            </p>
                          )}
                          {!hasComparisonData && (
                            <p className="text-xs text-amber-600">
                              Limited comparison data available
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Badge variant="secondary">
                          {frequency} devices
                        </Badge>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{code}</p>
                      <p className="text-sm">{info?.description || 'Unknown FDA product code'}</p>
                      {info ? (
                        <p className="text-xs text-muted-foreground">
                          Class {info.deviceClass} • {info.medicalSpecialty}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600">
                          ⚠️ Limited comparison data available
                        </p>
                      )}
                      <p className="text-xs">Found in {frequency} devices</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })
          )}
        </div>

        {/* Compare Action */}
        {canCompare && (
          <div className="pt-4 border-t">
            <Button 
              onClick={() => onCompare(selectedCodes)}
              className="w-full"
              size="lg"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare {selectedCodes.length} Selected Codes
            </Button>
          </div>
        )}

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedCodes.length} of {productCodes.length} product codes
          {searchQuery && ` matching "${searchQuery}"`}
          {filterBy !== 'all' && ` (Class ${filterBy} only)`}
        </div>
      </CardContent>
    </Card>
  );
}