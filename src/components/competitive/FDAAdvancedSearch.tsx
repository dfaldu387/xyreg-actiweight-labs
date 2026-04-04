import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Plus, X, Sparkles } from 'lucide-react';
import { ProductCodeBadges } from './ProductCodeBadges';
import { FDAMultiSearchParams } from '@/types/fdaEnhanced';
import { useEmdnCodeDetails } from '@/hooks/useEmdnCodeDetails';

interface FDAAdvancedSearchProps {
  emdnCode: string;
  onSearch: (params: FDAMultiSearchParams) => void;
  isLoading?: boolean;
  initialParams?: Partial<FDAMultiSearchParams>;
}

export function FDAAdvancedSearch({ emdnCode, onSearch, isLoading, initialParams }: FDAAdvancedSearchProps) {
  const { data: emdnDetails } = useEmdnCodeDetails(emdnCode);
  
  // Search parameters state
  const [keywords, setKeywords] = useState<string[]>(initialParams?.keywords || []);
  const [productCodes, setProductCodes] = useState<string[]>(initialParams?.productCodes || []);
  const [deviceClass, setDeviceClass] = useState<string>(initialParams?.deviceClass || '');
  const [applicant, setApplicant] = useState<string>(initialParams?.applicant || '');
  const [brandName, setBrandName] = useState<string>(initialParams?.brandName || '');
  const [companyName, setCompanyName] = useState<string>(initialParams?.companyName || '');
  const [searchTypes, setSearchTypes] = useState<Array<'fda510k' | 'udi' | 'registration'>>(
    initialParams?.searchTypes || ['fda510k', 'udi', 'registration']
  );
  
  // Input states
  const [newKeyword, setNewKeyword] = useState('');
  const [newProductCode, setNewProductCode] = useState('');

  // Extract suggested keywords from EMDN description
  const suggestedKeywords = React.useMemo(() => {
    if (!emdnDetails?.description) return [];
    
    const description = emdnDetails.description.toLowerCase();
    const commonWords = ['needle', 'catheter', 'syringe', 'surgical', 'diagnostic', 'injection', 'aspiration', 'biopsy', 'tube', 'balloon'];
    
    return commonWords.filter(word => 
      description.includes(word) && !keywords.includes(word)
    ).slice(0, 5);
  }, [emdnDetails?.description, keywords]);

  const addKeyword = useCallback((keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords(prev => [...prev, trimmed]);
    }
    setNewKeyword('');
  }, [keywords]);

  const removeKeyword = useCallback((keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword));
  }, []);

  const addProductCode = useCallback((code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed && !productCodes.includes(trimmed)) {
      setProductCodes(prev => [...prev, trimmed]);
    }
    setNewProductCode('');
  }, [productCodes]);

  const removeProductCode = useCallback((code: string) => {
    setProductCodes(prev => prev.filter(c => c !== code));
  }, []);

  const handleSearch = useCallback(() => {
    const params: FDAMultiSearchParams = {
      keywords: keywords.length > 0 ? keywords : undefined,
      productCodes: productCodes.length > 0 ? productCodes : undefined,
      deviceClass: deviceClass || undefined,
      applicant: applicant || undefined,
      brandName: brandName || undefined,
      companyName: companyName || undefined,
      searchTypes,
      emdnCode,
      limit: 500,
      skip: 0
    };
    
    onSearch(params);
  }, [keywords, productCodes, deviceClass, applicant, brandName, companyName, searchTypes, emdnCode, onSearch]);

  const toggleSearchType = useCallback((type: 'fda510k' | 'udi' | 'registration') => {
    setSearchTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Comprehensive FDA Search
        </CardTitle>
        <CardDescription>
          Search across FDA 510(k), UDI/GUDID, and Registration databases for comprehensive device analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* EMDN Context */}
        {emdnDetails && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-1">Current EMDN Code</div>
            <div className="font-mono text-sm">{emdnCode}</div>
            <div className="text-sm text-muted-foreground mt-1">{emdnDetails.description}</div>
          </div>
        )}

        <Tabs defaultValue="search-terms" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search-terms">Search Terms</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search-terms" className="space-y-4">
            {/* Keywords */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Keywords</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter keyword (e.g., needle, catheter)"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword(newKeyword)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => addKeyword(newKeyword)}
                  disabled={!newKeyword.trim()}
                  size="icon"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Suggested keywords */}
              {suggestedKeywords.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    Suggested from EMDN description
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suggestedKeywords.map(keyword => (
                      <Button
                        key={keyword}
                        variant="outline"
                        size="sm"
                        onClick={() => addKeyword(keyword)}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {keyword}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Current keywords */}
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {keywords.map(keyword => (
                    <Badge key={keyword} variant="secondary" className="pr-1">
                      {keyword}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeKeyword(keyword)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Product Codes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">FDA Product Codes</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter FDA product code (e.g., FMI, KNW)"
                  value={newProductCode}
                  onChange={(e) => setNewProductCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && addProductCode(newProductCode)}
                  className="flex-1 font-mono"
                />
                <Button 
                  onClick={() => addProductCode(newProductCode)}
                  disabled={!newProductCode.trim()}
                  size="icon"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Current product codes */}
              {productCodes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {productCodes.map(code => (
                    <div key={code} className="flex items-center gap-1">
                      <ProductCodeBadges productCode={code} className="cursor-pointer" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeProductCode(code)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Device Class</Label>
                <Select value={deviceClass} onValueChange={setDeviceClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any device class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any device class</SelectItem>
                    <SelectItem value="1">Class I - Low Risk</SelectItem>
                    <SelectItem value="2">Class II - Moderate Risk</SelectItem>
                    <SelectItem value="3">Class III - High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Applicant/Manufacturer</Label>
                <Input
                  placeholder="Company name"
                  value={applicant}
                  onChange={(e) => setApplicant(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Brand Name</Label>
                <Input
                  placeholder="Device brand name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Company Name</Label>
                <Input
                  placeholder="Manufacturing company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">FDA Databases to Search</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">FDA 510(k) Clearances</div>
                    <div className="text-sm text-muted-foreground">
                      Pre-market clearances and submissions (~300k+ devices)
                    </div>
                  </div>
                  <Switch
                    checked={searchTypes.includes('fda510k')}
                    onCheckedChange={() => toggleSearchType('fda510k')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">UDI/GUDID Database</div>
                    <div className="text-sm text-muted-foreground">
                      Global Unique Device Identification Database (~4M+ devices)
                    </div>
                  </div>
                  <Switch
                    checked={searchTypes.includes('udi')}
                    onCheckedChange={() => toggleSearchType('udi')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Registration & Listing</div>
                    <div className="text-sm text-muted-foreground">
                      Registered manufacturers and facilities (~300k+ companies)
                    </div>
                  </div>
                  <Switch
                    checked={searchTypes.includes('registration')}
                    onCheckedChange={() => toggleSearchType('registration')}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Search Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSearch}
            disabled={isLoading || searchTypes.length === 0}
            className="px-8"
          >
            {isLoading ? 'Searching...' : 'Search FDA Databases'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}