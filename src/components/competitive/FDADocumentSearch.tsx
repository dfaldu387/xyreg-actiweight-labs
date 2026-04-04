import React, { useState, useEffect } from 'react';
import { Search, FileText, GitBranch, Lightbulb, ExternalLink, GitCompare, Wand2, Tags, Eye, Filter, HelpCircle, ArrowRight, MousePointer2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFDAPredicateSearch } from '@/hooks/useFDAPredicateSearch';
import { useEmdnCodeDetails } from '@/hooks/useEmdnCodeDetails';
import { DocumentSearchParams } from '@/types/fdaPredicateTrail';
import { FDAProductCodeService } from '@/services/fdaProductCodeService';
import { FDAProductCodeComparison } from './FDAProductCodeComparison';
import { ProductCodeSelector } from './ProductCodeSelector';
import { EmdnKeywordService } from '@/services/emdnKeywordService';
import { PredicateTrailVisualization } from './PredicateTrailVisualization';
import { FDAPredicateHelp } from './FDAPredicateHelp';
import { PredicateTrailSuggestions } from './PredicateTrailSuggestions';
import { BatchPredicateProcessor } from './BatchPredicateProcessor';
import { SmartPredicateRecommendations } from './SmartPredicateRecommendations';
import { AutomaticPredicateAnalysis } from './AutomaticPredicateAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface FDADocumentSearchProps {
  emdnCode?: string;
  productId?: string;
  companyId?: string;
  currentFdaCode?: string;
  onFdaCodeSelected?: () => void;
}

export function FDADocumentSearch({ emdnCode, productId, companyId, currentFdaCode, onFdaCodeSelected }: FDADocumentSearchProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useState<DocumentSearchParams>({
    query: '',
    searchType: 'fulltext',
    limit: 50
  });
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonCodes, setComparisonCodes] = useState<string[]>([]);
  const [showAllProductCodes, setShowAllProductCodes] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [excludedCodes, setExcludedCodes] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [pendingKNumbers, setPendingKNumbers] = useState<string[]>([]);
  const [showFdaModal, setShowFdaModal] = useState(false);
  const [selectedFdaDevice, setSelectedFdaDevice] = useState<any>(null);
  const [productCodeDescription, setProductCodeDescription] = useState<string>('');
  const [isSelectingCode, setIsSelectingCode] = useState(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [batchKNumbers, setBatchKNumbers] = useState<string[]>([]);
  const [showAutoSuggestions, setShowAutoSuggestions] = useState(true);

  const { data: searchResults, isLoading, error } = useFDAPredicateSearch(searchParams, {
    enabled: Boolean(searchParams.query || searchParams.productCode) && searchParams.searchType !== 'predicate'
  });

  const { data: emdnDetails } = useEmdnCodeDetails(emdnCode);

  // Load excluded codes from localStorage on component mount and listen for changes
  useEffect(() => {
    const loadExcludedCodes = () => {
      const storedExcludedCodes = localStorage.getItem('fdaExcludedCodes');
      if (storedExcludedCodes) {
        setExcludedCodes(JSON.parse(storedExcludedCodes));
      }
    };

    // Load on mount
    loadExcludedCodes();

    // Listen for storage changes (when other tabs/components update localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fdaExcludedCodes') {
        loadExcludedCodes();
      }
    };

    // Listen for custom events from within the same tab
    const handleExcludedCodesChanged = (e: CustomEvent) => {
      setExcludedCodes(e.detail.excludedCodes);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('fdaExcludedCodesChanged', handleExcludedCodesChanged as EventListener);
    
    // Also listen for focus events (when navigating back to this component)
    const handleFocus = () => {
      loadExcludedCodes();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fdaExcludedCodesChanged', handleExcludedCodesChanged as EventListener);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleSearch = () => {
    // Trigger search by updating params (query will auto-refresh)
    setSearchParams({ ...searchParams });
  };

  const handleSearchTypeChange = (type: 'fulltext' | 'predicate' | 'similarity') => {
    setSearchParams({ ...searchParams, searchType: type });
  };

  const getUniqueProductCodes = () => {
    if (!searchResults?.results) return [];
    const codes = Array.from(new Set(
      searchResults.results
        .map(result => result.device.productCode)
        .filter(Boolean)
        .filter(code => !excludedCodes.includes(code)) // Filter out excluded codes
    ));
    
    // Sort by frequency and include count information
    const codeFrequency = searchResults.results.reduce((acc, result) => {
      if (result.device.productCode && !excludedCodes.includes(result.device.productCode)) {
        acc[result.device.productCode] = (acc[result.device.productCode] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return codes.sort((a, b) => (codeFrequency[b] || 0) - (codeFrequency[a] || 0));
  };

  const getProductCodeFrequency = (code: string) => {
    if (!searchResults?.results) return 0;
    return searchResults.results.filter(result => 
      result.device.productCode === code && !excludedCodes.includes(code)
    ).length;
  };

  // Filter search results to exclude documents with excluded product codes
  // and include only selected product codes when codes are selected
  const filteredResults = searchResults ? {
    ...searchResults,
    results: searchResults.results.filter(result => {
      // First filter out excluded codes
      if (result.device.productCode && excludedCodes.includes(result.device.productCode)) {
        return false;
      }
      
      // If specific codes are selected, only include those
      if (selectedCodes.length > 0) {
        return result.device.productCode && selectedCodes.includes(result.device.productCode);
      }
      
      // If no codes selected, include all (except excluded)
      return true;
    })
  } : null;

  const handleSuggestKeywords = async () => {
    if (!emdnCode) return;
    
    setLoadingKeywords(true);
    try {
      const keywords = await EmdnKeywordService.getSuggestedKeywords(
        emdnCode, 
        emdnDetails?.description,
        companyId
      );
      setSuggestedKeywords(keywords);
    } catch (error) {
      console.error('Error generating keywords:', error);
    } finally {
      setLoadingKeywords(false);
    }
  };

  const handleApplySuggestedKeywords = () => {
    const keywordString = suggestedKeywords.join(' ');
    setSearchParams({ ...searchParams, query: keywordString });
  };

  const handleToggleProductCodeView = () => {
    setShowAllProductCodes(!showAllProductCodes);
  };

  const handleCodeSelection = (code: string) => {
    setSelectedCodes(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleCompareSelectedCodes = () => {
    if (selectedCodes.length >= 2) {
      setComparisonCodes(selectedCodes);
      setShowComparison(true);
    }
  };

  const handleCompareProductCodes = () => {
    const uniqueCodes = getUniqueProductCodes();
    setComparisonCodes(uniqueCodes);
    setShowComparison(true);
  };

  const handleCloseComparison = () => {
    setShowComparison(false);
    setComparisonCodes([]);
  };

  const handleDocumentSelection = (kNumber: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(kNumber)) {
        newSet.delete(kNumber);
      } else {
        newSet.add(kNumber);
      }
      return newSet;
    });
  };

  const handleMoveToPredicateTrail = () => {
    if (selectedDocuments.size > 0) {
      const selectedKNumbers = Array.from(selectedDocuments);
      if (selectedKNumbers.length === 1) {
        // Single selection - go directly to predicate trail
        setSearchParams({ 
          ...searchParams, 
          searchType: 'predicate', 
          kNumber: selectedKNumbers[0] 
        });
        setSelectedDocuments(new Set());
      } else {
        // Multiple selections - store them and let user choose
        setPendingKNumbers(selectedKNumbers);
        setSearchParams({ 
          ...searchParams, 
          searchType: 'predicate', 
          kNumber: selectedKNumbers[0] // Start with first one
        });
        setSelectedDocuments(new Set());
      }
    }
  };

  const handleSelectKNumber = (kNumber: string) => {
    setSearchParams({ ...searchParams, kNumber });
    setPendingKNumbers([]); // Clear pending list once selected
  };

  // Handle clicking on FDA documents to show details and selection options
  const handleDocumentClick = async (device: any) => {
    setSelectedFdaDevice(device);
    
    // Try to get product code description from database
    if (device.productCode) {
      try {
        const productCodeInfo = await FDAProductCodeService.getProductCodeInfo(device.productCode);
        
        if (productCodeInfo) {
          setProductCodeDescription(`${productCodeInfo.code} - ${productCodeInfo.description}`);
        } else {
          setProductCodeDescription(`${device.productCode} - ${device.deviceName}`);
        }
      } catch (error) {
        console.error('Error fetching product code description:', error);
        setProductCodeDescription(`${device.productCode} - ${device.deviceName}`);
      }
    } else {
      setProductCodeDescription(device.deviceName);
    }
    
    setShowFdaModal(true);
  };

  // Select FDA codes for the product (support multiple codes)
  const handleSelectFdaCodes = async () => {
    if (!productId || !selectedFdaDevice) return;
    
    setIsSelectingCode(true);
    try {
      // Get all product codes from the selected device
      const allCodes = [
        ...(selectedFdaDevice.productCode ? [selectedFdaDevice.productCode] : []),
        ...(selectedFdaDevice.productCodes || [])
      ].filter((code, index, arr) => arr.indexOf(code) === index);

      if (allCodes.length === 0) {
        toast.error('No product codes found for selected device');
        return;
      }

      // Store as JSON array to support multiple codes
      const { error } = await supabase
        .from('products')
        .update({ 
          fda_product_code: allCodes[0], // Primary code for backward compatibility
          fda_product_codes: JSON.stringify(allCodes) // All codes as JSON array
        })
        .eq('id', productId);

      if (error) throw error;

      toast.success(`FDA product codes ${allCodes.join(', ')} selected successfully`);
      setShowFdaModal(false);
      onFdaCodeSelected?.();
    } catch (error) {
      console.error('Error saving FDA product codes:', error);
      toast.error('Failed to save FDA product codes');
    } finally {
      setIsSelectingCode(false);
    }
  };

  // Handle predicate trail suggestions
  const handlePredicateTrailStarted = (kNumber: string) => {
    setSearchParams({ 
      ...searchParams, 
      searchType: 'predicate', 
      kNumber 
    });
    setSelectedDocuments(new Set());
    setShowAutoSuggestions(false);
  };

  // Handle batch predicate processing
  const handleBatchProcessing = (kNumbers: string[]) => {
    setBatchKNumbers(kNumbers);
    setShowBatchProcessor(true);
  };

  const handleBatchComplete = (results: any[]) => {
    toast.success(`Batch processing completed: ${results.filter(r => r.trail).length}/${results.length} successful`);
    setShowBatchProcessor(false);
  };

  // Get available devices for auto-suggestions
  const availableDevices = filteredResults?.results?.map(result => ({
    kNumber: result.device.kNumber,
    deviceName: result.device.deviceName,
    productCode: result.device.productCode,
    deviceClass: result.device.deviceClass,
    applicant: result.device.applicant
  })) || [];

  // Show batch processor if active
  if (showBatchProcessor) {
    return (
      <div className="space-y-6">
        <BatchPredicateProcessor
          kNumbers={batchKNumbers}
          onComplete={handleBatchComplete}
          onClose={() => setShowBatchProcessor(false)}
        />
      </div>
    );
  }

  // Show comparison view if active
  if (showComparison) {
    return (
      <div className="space-y-6">
        <FDAProductCodeComparison 
          productCodes={comparisonCodes}
          onClose={handleCloseComparison}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {lang('regulatory.fdaSearch.title')}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              {lang('regulatory.fdaSearch.helpGuide')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={searchParams.searchType} onValueChange={handleSearchTypeChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fulltext" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {lang('regulatory.fdaSearch.fullText')}
              </TabsTrigger>
              <TabsTrigger value="predicate" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                {lang('regulatory.fdaSearch.predicateTrail')}
              </TabsTrigger>
              <TabsTrigger value="similarity" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                {lang('regulatory.fdaSearch.similarDevices')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fulltext" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{lang('regulatory.fdaSearch.searchQuery')}</label>
                  <Textarea
                    placeholder={lang('regulatory.fdaSearch.searchPlaceholder')}
                    value={searchParams.query}
                    onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">{lang('regulatory.fdaSearch.deviceClass')}</label>
                    <Select
                      value={searchParams.deviceClass || 'any'}
                      onValueChange={(value) => setSearchParams({ ...searchParams, deviceClass: value === 'any' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={lang('regulatory.fdaSearch.anyClass')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{lang('regulatory.fdaSearch.anyClass')}</SelectItem>
                        <SelectItem value="1">Class I</SelectItem>
                        <SelectItem value="2">Class II</SelectItem>
                        <SelectItem value="3">Class III</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{lang('regulatory.fdaSearch.productCode')}</label>
                    <Input
                      placeholder={lang('regulatory.fdaSearch.productCodePlaceholder')}
                      value={searchParams.productCode || ''}
                      onChange={(e) => setSearchParams({ ...searchParams, productCode: e.target.value || undefined })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="predicate" className="space-y-4">
              <div>
                <label className="text-sm font-medium">K-Number</label>
                <Input
                  placeholder="Enter K-number to find its predicate trail (e.g., K964924)"
                  value={searchParams.kNumber || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, kNumber: e.target.value || undefined })}
                />
                
                {/* Predicate Trail Visualization */}
                {searchParams.kNumber && (
                  <div className="mt-4">
                    <PredicateTrailVisualization 
                      kNumber={searchParams.kNumber}
                      maxDepth={3}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Searches both upstream predicates (devices this references) and downstream references (devices that reference this)
                </p>
              </div>
              
              {/* Smart Predicate Recommendations */}
              {!searchParams.kNumber && (emdnDetails?.description || emdnCode) && (
                <SmartPredicateRecommendations
                  deviceName={emdnDetails?.description}
                  emdnCode={emdnCode}
                  onPredicateSelected={(kNumber) => setSearchParams({ ...searchParams, kNumber })}
                />
              )}
            </TabsContent>

            <TabsContent value="similarity" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Device Description</label>
                <Textarea
                  placeholder="Describe your device to find similar FDA-cleared devices..."
                  value={searchParams.query}
                  onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Auto-suggestions for predicate trails */}
          {showAutoSuggestions && availableDevices.length > 0 && searchParams.searchType !== 'predicate' && (
            <PredicateTrailSuggestions
              devices={availableDevices}
              onTrailStarted={handlePredicateTrailStarted}
              onBatchProcessing={handleBatchProcessing}
            />
          )}

          <div className="space-y-3">
            {/* EMDN Keyword Suggestions - Only show for fulltext and similarity searches */}
            {emdnCode && searchParams.searchType !== 'predicate' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSuggestKeywords}
                    disabled={loadingKeywords}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    {loadingKeywords ? 'Generating...' : 'Suggest Keywords from EMDN'}
                  </Button>
                  {suggestedKeywords.length > 0 && (
                    <Button 
                      onClick={handleApplySuggestedKeywords}
                      size="sm"
                      variant="secondary"
                    >
                      Apply Suggestions
                    </Button>
                  )}
                </div>
                
                {suggestedKeywords.length > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Suggested keywords for EMDN {emdnCode}:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestedKeywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={
                  isLoading ||
                  (searchParams.searchType === 'predicate' && !searchParams.kNumber) ||
                  (searchParams.searchType !== 'predicate' && !searchParams.query && !searchParams.productCode)
                }
                className="flex-1"
              >
                {isLoading ? lang('regulatory.fdaSearch.searching') : lang('regulatory.fdaSearch.searchButton')}
              </Button>
              {searchResults && getUniqueProductCodes().length >= 2 && (
                <Button 
                  onClick={handleCompareProductCodes}
                  variant="outline"
                  disabled={isLoading}
                >
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare Codes
                </Button>
              )}
              {selectedDocuments.size > 0 && searchParams.searchType !== 'predicate' && (
                <Button 
                  onClick={handleMoveToPredicateTrail}
                  variant="secondary"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Analyze in Predicate Trail ({selectedDocuments.size})
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">Error: {error.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Excluded Codes Info */}
      {excludedCodes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-amber-800">Excluded Product Codes</h4>
                <p className="text-sm text-amber-600 mt-1">
                  {excludedCodes.length} code(s) excluded from results: {excludedCodes.join(', ')}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setExcludedCodes([]);
                  localStorage.removeItem('fdaExcludedCodes');
                }}
                className="text-amber-600 border-amber-300 hover:bg-amber-100"
              >
                Clear Exclusions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multiple K-Number Selection */}
      {pendingKNumbers.length > 1 && searchParams.searchType === 'predicate' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Multiple Devices Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              You selected {pendingKNumbers.length} devices. Choose which one to analyze in detail:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {pendingKNumbers.map((kNumber) => (
                <Button
                  key={kNumber}
                  variant={searchParams.kNumber === kNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectKNumber(kNumber)}
                  className="justify-start"
                >
                  {kNumber}
                  {searchParams.kNumber === kNumber && <span className="ml-2 text-xs">(Current)</span>}
                </Button>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPendingKNumbers([])}
              className="mt-3"
            >
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      )}


      {/* Search Results */}
      {filteredResults && searchParams.searchType !== 'predicate' && (
        <div className="space-y-6">
          {/* Results Summary with Product Code Extraction */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {excludedCodes.length > 0 ? filteredResults.results.length : (searchResults?.totalResults || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">FDA Submissions</div>
                  <div className="text-xs text-muted-foreground/70">
                    {excludedCodes.length > 0 ? 'After filtering exclusions' : '510(k) documents found'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{filteredResults.results.length}</div>
                  <div className="text-sm text-muted-foreground">Devices Analyzed</div>
                  <div className="text-xs text-muted-foreground/70">After filtering exclusions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {getUniqueProductCodes().length}
                  </div>
                  <div className="text-sm text-muted-foreground">Product Categories</div>
                  <div className="text-xs text-muted-foreground/70">Unique FDA product codes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {filteredResults.intelligence?.commonPredicates?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Common Predicates</div>
                  <div className="text-xs text-muted-foreground/70">Frequently cited devices</div>
                </div>
              </div>

              {/* Enhanced Product Code Selection */}
              {getUniqueProductCodes().length > 0 && (
                <div className="border-t pt-4">
                  <div className="mb-4">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Tags className="h-4 w-4" />
                      Product Codes Found ({getUniqueProductCodes().length})
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Select product codes to include in your comparison analysis. You can filter, sort, and bulk select codes below.
                    </p>
                  </div>
                  
                  {!showAllProductCodes ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {getUniqueProductCodes().slice(0, 10).map(code => {
                          // For now, use a simpler badge without dynamic class info
                          const isSelected = selectedCodes.includes(code);
                          const frequency = getProductCodeFrequency(code);
                          return (
                            <Badge 
                              key={code} 
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer transition-all ${
                                isSelected ? 'ring-2 ring-primary/50' : 'hover:bg-primary/10'
                              }`}
                              onClick={() => handleCodeSelection(code)}
                            >
                              {code} ({frequency})
                            </Badge>
                          );
                        })}
                        {getUniqueProductCodes().length > 10 && (
                          <Badge variant="secondary">
                            +{getUniqueProductCodes().length - 10} more
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleToggleProductCodeView}
                          variant="outline"
                          size="sm"
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Enhanced Selection View
                        </Button>
                        {selectedCodes.length >= 2 && (
                          <Button 
                            onClick={handleCompareSelectedCodes}
                            size="sm"
                          >
                            <GitCompare className="h-4 w-4 mr-2" />
                            Compare Selected ({selectedCodes.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Button 
                        onClick={handleToggleProductCodeView}
                        variant="outline"
                        size="sm"
                        className="mb-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Simple View
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Product Code Selector */}
              {showAllProductCodes && getUniqueProductCodes().length > 0 && (
                <div className="border-t pt-4">
                  <ProductCodeSelector
                    productCodes={getUniqueProductCodes()}
                    selectedCodes={selectedCodes}
                    onSelectionChange={setSelectedCodes}
                    onCompare={(codes) => {
                      setComparisonCodes(codes);
                      setShowComparison(true);
                    }}
                    getFrequency={getProductCodeFrequency}
                    maxSelection={10}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Automatic Predicate Trail Analysis */}
          <AutomaticPredicateAnalysis
            devices={searchResults ? searchResults.results.map(r => r.device) : []}
            isVisible={Boolean(searchResults && 
                      searchResults.results.length > 0 && 
                      (searchParams.searchType as any) !== 'predicate' && 
                      showAutoSuggestions)}
            onTrailSelected={handlePredicateTrailStarted}
          />

          {/* Document Results */}
          <div className="grid gap-4">
            {filteredResults.results.map((result, index) => (
               <Card 
                 key={index} 
                 className={`hover:shadow-md transition-all cursor-pointer ${
                   selectedDocuments.has(result.device.kNumber) ? 'ring-2 ring-primary/50 bg-primary/5' : ''
                 }`}
                 onClick={() => handleDocumentClick(result.device)}
               >
                 <CardContent className="pt-6">
                   <div className="space-y-3">
                     <div className="flex items-start justify-between">
                       <div className="flex items-start gap-3 flex-1">
                         {/* Selection checkbox */}
                          <Checkbox
                            checked={selectedDocuments.has(result.device.kNumber)}
                            onCheckedChange={() => handleDocumentSelection(result.device.kNumber)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                         
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                             <Badge variant="outline">{result.device.kNumber}</Badge>
                             {result.device.productCode && (
                               <Badge 
                                 variant="secondary"
                                 className="text-amber-600 bg-amber-50"
                               >
                                 {result.device.productCode}
                               </Badge>
                             )}
                             {result.device.deviceClass && (
                               <Badge variant="outline">Class {result.device.deviceClass}</Badge>
                             )}
                             {searchParams.searchType === 'similarity' && (
                               <Badge variant="secondary">
                                 {Math.round(result.relevanceScore * 100)}% match
                               </Badge>
                             )}
                             <Badge variant="outline" className="text-xs">
                               <MousePointer2 className="h-3 w-3 mr-1" />
                               Click for details
                             </Badge>
                           </div>
                           <h3 className="font-medium text-lg">{result.device.deviceName}</h3>
                           <p className="text-sm text-muted-foreground">{result.device.applicant}</p>
                           {result.device.decisionDate && (
                             <p className="text-sm text-muted-foreground">
                               Cleared: {new Date(result.device.decisionDate).toLocaleDateString()}
                             </p>
                           )}
                         </div>
                       </div>
                       {result.device.documentUrl && (
                         <Button 
                           variant="outline" 
                           size="sm" 
                           asChild
                           onClick={(e) => e.stopPropagation()}
                         >
                           <a href={result.device.documentUrl} target="_blank" rel="noopener noreferrer">
                             <ExternalLink className="h-4 w-4" />
                             View FDA Document
                           </a>
                         </Button>
                       )}
                    </div>

                    {result.matchedContent && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{result.matchedContent}</p>
                      </div>
                    )}

                    {result.predicateReferences.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Referenced Predicates:</p>
                        <div className="flex flex-wrap gap-2">
                          {result.predicateReferences.map((ref, refIndex) => (
                            <Badge key={refIndex} variant="outline" className="text-xs">
                              {ref.predicateKNumber}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Intelligence Insights */}
          {searchResults?.intelligence && (
            <Card>
              <CardHeader>
                <CardTitle>Document Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="predicates">
                  <TabsList>
                    <TabsTrigger value="predicates">Common Predicates</TabsTrigger>
                    <TabsTrigger value="patterns">Regulatory Patterns</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline Analysis</TabsTrigger>
                  </TabsList>

                  <TabsContent value="predicates" className="space-y-3">
                    {searchResults.intelligence.commonPredicates.map((predicate, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <span className="font-medium">{predicate.kNumber}</span>
                          {predicate.deviceName && (
                            <span className="text-sm text-muted-foreground ml-2">{predicate.deviceName}</span>
                          )}
                        </div>
                        <Badge variant="secondary">{predicate.count} references</Badge>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="patterns" className="space-y-3">
                    {searchResults.intelligence.regulatoryPatterns.map((pattern, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{pattern.pattern}</span>
                          <Badge variant="secondary">{pattern.frequency} occurrences</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Examples: {pattern.examples.join(', ')}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-3">
                    {searchResults.intelligence.timelineAnalysis.slice(-10).map((timePoint, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">{timePoint.year}</span>
                        <div className="text-right">
                          <div className="font-medium">{timePoint.approvals} approvals</div>
                          <div className="text-sm text-muted-foreground">
                            ~{timePoint.avgProcessingTime} days avg
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Help Modal */}
      <FDAPredicateHelp 
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* FDA Device Details Modal */}
      <Dialog open={showFdaModal} onOpenChange={setShowFdaModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              FDA Device Details
            </DialogTitle>
            <DialogDescription>
              {selectedFdaDevice?.kNumber} - Detailed information and selection options
            </DialogDescription>
          </DialogHeader>
          
          {selectedFdaDevice && (
            <div className="space-y-4">
              {/* Device Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {selectedFdaDevice.kNumber}
                  </Badge>
                  {selectedFdaDevice.productCode && (
                    <Badge variant="secondary" className="text-amber-600 bg-amber-50">
                      {selectedFdaDevice.productCode}
                    </Badge>
                  )}
                  {selectedFdaDevice.deviceClass && (
                    <Badge variant="outline">Class {selectedFdaDevice.deviceClass}</Badge>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg">{selectedFdaDevice.deviceName}</h3>
                  <p className="text-muted-foreground">{selectedFdaDevice.applicant}</p>
                  {selectedFdaDevice.decisionDate && (
                    <p className="text-sm text-muted-foreground">
                      Cleared: {new Date(selectedFdaDevice.decisionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Product Code Description */}
              {productCodeDescription && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Product Code Description</h4>
                  <p className="text-sm">{productCodeDescription}</p>
                </div>
              )}

              {/* Current FDA Code Status */}
              {currentFdaCode && (
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Current FDA Code</p>
                      <Badge variant="secondary" className="mt-1">{currentFdaCode}</Badge>
                    </div>
                    {currentFdaCode === selectedFdaDevice.productCode && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {productId && selectedFdaDevice.productCode && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={handleSelectFdaCodes}
                    disabled={isSelectingCode || currentFdaCode === selectedFdaDevice.productCode}
                    className="flex-1"
                  >
                    {isSelectingCode ? 'Selecting...' : 
                     currentFdaCode === selectedFdaDevice.productCode ? 'Already Selected' : 
                     `Select ${selectedFdaDevice.productCode} for Product`}
                  </Button>
                  <Button variant="outline" onClick={() => setShowFdaModal(false)}>
                    Close
                  </Button>
                </div>
              )}

              {!productId && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    FDA code selection not available - no product ID provided
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}