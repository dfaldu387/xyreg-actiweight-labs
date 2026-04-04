import React, { useState, useEffect } from 'react';
import { Globe, Download, ExternalLink, Check, Search, Settings, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompanyApiKeys } from '@/hooks/useCompanyApiKeys';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GoogleImageSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  tradeName?: string;
  companyName?: string;
  companyId?: string;
  onImagesSelect: (imageUrls: string[]) => void;
}

interface ImageResult {
  url: string;
  title?: string;
  source?: string;
}

export function GoogleImageSearchModal({
  open,
  onOpenChange,
  productName,
  tradeName,
  companyName,
  companyId,
  onImagesSelect
}: GoogleImageSearchModalProps) {
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const { toast } = useToast();
  
  // Get API keys to check if SerpAPI key is available
  const { apiKeys, getApiKey } = useCompanyApiKeys(companyId || '');

  // Reset selected images when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedImages(new Set());
      setCustomSearchQuery('');
      setHasAutoSearched(false);
      setCurrentSearchQuery('');

    }
  }, [open]);

  // Trigger auto-search when modal is open and data is ready
  useEffect(() => {
    if (open && productName && !hasAutoSearched && !apiKeys.isLoading) {
      // Check if SerpAPI key exists before auto-searching
      const serpapiKey = getApiKey('serpapi');
      
      if (serpapiKey?.encrypted_key?.trim()) {
        setHasAutoSearched(true);
        handleAutoSearch();
      }
    }
  }, [open, productName, companyName, apiKeys.isLoading, hasAutoSearched]);

  // Check if SerpAPI key is missing
  const serpapiKey = getApiKey('serpapi');
  const isSerpApiKeyMissing = !apiKeys.isLoading && !serpapiKey;

  const handleAutoSearch = async () => {
    // Create search query with product name and company name
    // Strategy: Be specific about what we're looking for to avoid unrelated results

    // Build the search query - focus on product + manufacturer context
    const queryParts: string[] = [];

    // Add product name (the main search term)
    queryParts.push(productName);

    // Add company name with "brand" context to make it clear this is a manufacturer
    if (companyName) {
      queryParts.push(companyName);
    }

    // Add specific product context - "product photo" helps filter for actual product images
    queryParts.push('product photo');

    const searchQuery = queryParts.join(' ');

    setCurrentSearchQuery(searchQuery);
    await performSearch(searchQuery);
  };

  const handleCustomSearch = async () => {
    if (!customSearchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term to find more images.",
        variant: "default"
      });
      return;
    }

    setCurrentSearchQuery(customSearchQuery);
    await performSearch(customSearchQuery);
  };

  const performSearch = async (searchQuery: string) => {
    // Check if SerpAPI key is available before attempting search
    if (isSerpApiKeyMissing) {
      toast({
        title: "SerpAPI Key Required",
        description: (
          <div className="space-y-2">
            <p>Please add your SerpAPI key to enable real image search.</p>
            <a 
              href={`/app/company/${encodeURIComponent(companyId || '')}/settings?section=general`}
              className="text-primary underline hover:text-primary/80 block"
              onClick={() => onOpenChange(false)}
            >
              → Go to Company Settings to add API key
            </a>
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // Use the Supabase websearch function to find images
      const { data, error } = await supabase.functions.invoke('websearch', {
        body: {
          query: searchQuery,
          imageLinks: 12, // Request multiple image links
          numResults: 5,
          companyId: companyId
        }
      });

      if (error) {
        // Check for specific API key errors
        if (error.message?.includes('no_api_key') || error.message?.includes('No SerpAPI key')) {
          throw new Error('no_api_key');
        }
        throw new Error(error.message || 'Search failed');
      }
      
      // Extract image URLs from search results
      const images: ImageResult[] = [];
      
      if (data.results) {
        data.results.forEach((result: any) => {
          if (result.imageLinks && result.imageLinks.length > 0) {
            result.imageLinks.forEach((imageUrl: string) => {
              images.push({
                url: imageUrl,
                title: result.title || `${productName} image`,
                source: result.url
              });
            });
          }
        });
      }

      setImageResults(images);
      
      if (images.length === 0) {
        toast({
          title: "No images found",
          description: `No images found for "${searchQuery}". Try searching manually.`,
          variant: "default"
        });
      } else {
        const isDemo = data.note?.includes('demo data');
        toast({
          title: isDemo ? "Demo results loaded" : "Search completed",
          description: data.note || `Found ${images.length} images`,
          variant: isDemo ? "default" : "default"
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      
      // Check if it's an API key error
      if (error.message && error.message.includes('no_api_key')) {
        toast({
          title: "SerpAPI Key Required",
          description: (
            <div className="space-y-2">
              <p>Please add your SerpAPI key to enable real image search.</p>
              <a 
                href={`/app/company/${encodeURIComponent(companyId || '')}/settings?section=general`}
                className="text-primary underline hover:text-primary/80 block"
                onClick={() => onOpenChange(false)}
              >
                → Go to Company Settings to add API key
              </a>
            </div>
          ),
          variant: "destructive",
          duration: 10000,
        });
        
        setImageResults([]);
        return;
      }
      
      // Fallback to mock results for other errors
      const mockImages: ImageResult[] = [
        {
          url: `https://picsum.photos/300/200?random=1`,
          title: `${productName} - Sample Image 1`,
          source: 'https://example.com'
        },
        {
          url: `https://picsum.photos/300/200?random=2`,
          title: `${productName} - Sample Image 2`,
          source: 'https://example.com'
        }
      ];
      
      setImageResults(mockImages);
      
      toast({
        title: "Using demo results",
        description: "Search integration will be available soon. These are demo images.",
        variant: "default"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageToggle = (imageUrl: string) => {
    setSelectedImages(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(imageUrl)) {
        newSelected.delete(imageUrl);
      } else {
        newSelected.add(imageUrl);
      }
      return newSelected;
    });
  };

  const handleAddSelectedImages = () => {
    const selectedUrls = Array.from(selectedImages);
    if (selectedUrls.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to add.",
        variant: "default"
      });
      return;
    }

    onImagesSelect(selectedUrls);
    
    toast({
      title: `${selectedUrls.length} image${selectedUrls.length !== 1 ? 's' : ''} added`,
      description: "Selected images have been added to your product.",
    });
    
    onOpenChange(false);
  };

  // Build default search query display - same logic as handleAutoSearch
  const defaultSearchQuery = (() => {
    const queryParts: string[] = [];
    queryParts.push(productName);
    if (companyName) queryParts.push(companyName);
    queryParts.push('product photo');
    return queryParts.join(' ');
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl flex flex-col">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Google Image Search Results
          </DialogTitle>
          <div className="flex items-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Searching for: <span className="font-medium text-foreground">{currentSearchQuery || defaultSearchQuery}</span>
              </p>
              {companyName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Company: <span className="font-medium text-primary">{companyName}</span>
                </p>
              )}
            </div>
            {imageResults.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedImages.size === imageResults.length) {
                    setSelectedImages(new Set());
                  } else {
                    setSelectedImages(new Set(imageResults.map(img => img.url)));
                  }
                }}
                className="text-xs"
              >
                {selectedImages.size === imageResults.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* API Key Warning */}
        {isSerpApiKeyMissing && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <div className="space-y-2">
                <p className="font-medium">SerpAPI Key Required</p>
                <p className="text-sm">
                  To search for real device images, you need to configure your SerpAPI key. 
                  Without it, you'll see random placeholder images instead of relevant results.
                </p>
                <a 
                  href={`/app/company/${encodeURIComponent(companyId || '')}/settings?section=general`}
                  className="inline-flex items-center gap-1 text-sm text-orange-700 dark:text-orange-300 underline hover:text-orange-900 dark:hover:text-orange-100"
                  onClick={() => onOpenChange(false)}
                >
                  <Settings className="h-3 w-3" />
                  Add SerpAPI Key in Company Settings
                </a>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Custom Search Section */}
        <div className="border-b pb-4 mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter custom search terms (e.g., 'medical device', 'orthopedic implant', etc.)"
              value={customSearchQuery}
              onChange={(e) => setCustomSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleCustomSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleCustomSearch}
              disabled={isSearching || !customSearchQuery.trim() || isSerpApiKeyMissing}
              className="flex items-center gap-2"
              title={isSerpApiKeyMissing ? "SerpAPI key required for image search" : undefined}
            >
              <Search className="h-4 w-4" />
              {isSearching ? 'Searching...' : 'Find More Images'}
            </Button>
          </div>
        </div>
        
        <div className="h-[50vh] overflow-y-auto min-h-0">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground">Searching for product images...</p>
            </div>
          ) : imageResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {imageResults.map((image, index) => {
                const isSelected = selectedImages.has(image.url);
                return (
                  <div 
                    key={index} 
                    className={`relative group border-2 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => handleImageToggle(image.url)}
                  >
                    <img
                      src={image.url}
                      alt={image.title || 'Product image'}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/300/200?grayscale&text=Image+Not+Available`;
                      }}
                    />
                    
                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <div className={`p-1 rounded transition-all ${isSelected ? 'bg-primary' : 'bg-black/50'}`}>
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => handleImageToggle(image.url)}
                          className="h-4 w-4 text-white border-white"
                        />
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-white rounded-full p-2">
                          <Check className="h-6 w-6" />
                        </div>
                      </div>
                    )}
                    
                    {/* Source link button */}
                    {image.source && (
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(image.source, '_blank');
                          }}
                          className="h-6 w-6 p-0 bg-white/80 border-white/50 text-gray-700 hover:bg-white"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Image title tooltip */}
                    {image.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate">{image.title}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images found for this search.</p>
              <p className="text-sm mt-2">Try entering different search terms above.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {imageResults.length} image{imageResults.length !== 1 ? 's' : ''} found
            </p>
            {selectedImages.size > 0 && (
              <p className="text-sm font-medium text-primary">
                {selectedImages.size} selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {selectedImages.size > 0 && (
              <Button onClick={handleAddSelectedImages}>
                Add {selectedImages.size} Image{selectedImages.size !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}