import React, { useState } from 'react';
import { Search, Download, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  companyId?: string;
  onImageSelect: (imageUrl: string) => void;
}

interface ImageResult {
  url: string;
  title?: string;
  source?: string;
}

export function ImageSearchModal({ open, onOpenChange, productName, companyId, onImageSelect }: ImageSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(`${productName} medical device`);
  const [directUrl, setDirectUrl] = useState('');
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (!companyId) {
      toast({
        title: "Company ID required",
        description: "Unable to search without company information.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      // Use the Supabase websearch function
      const { data, error } = await supabase.functions.invoke('websearch', {
        body: {
          query: searchQuery,
          imageLinks: 12,
          numResults: 5,
          companyId: companyId
        }
      });

      if (error) {
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
                title: result.title || `Image for ${searchQuery}`,
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
          description: `No images found for "${searchQuery}". Try different search terms.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Search completed",
          description: data.note || `Found ${images.length} images`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      
      // Fallback to mock results for demo
      const mockImages: ImageResult[] = [
        {
          url: `https://via.placeholder.com/300x200?text=${encodeURIComponent(searchQuery)}`,
          title: `${searchQuery} - Sample Image`,
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

  const handleImageSelect = async (imageUrl: string) => {
    // Skip proxy attempts - directly copy URL and allow user to paste it
    try {
      await navigator.clipboard.writeText(imageUrl);
      setDirectUrl(imageUrl);
      toast({
        title: "URL copied and ready",
        description: "Image URL copied to the Direct URL field. Click 'Add Image' to use it.",
      });
    } catch (clipboardError) {
      // Fallback if clipboard doesn't work
      setDirectUrl(imageUrl);
      toast({
        title: "URL ready",
        description: "Image URL added to the Direct URL field. Click 'Add Image' to use it.",
      });
    }
  };

  const handleDirectUrlAdd = () => {
    if (directUrl.trim()) {
      onImageSelect(directUrl.trim());
      toast({
        title: "Image URL added",
        description: "The image URL has been added to your product media.",
      });
      setDirectUrl('');
      onOpenChange(false);
    }
  };

  const handleUrlInput = () => {
    const url = prompt("Enter image URL to add:");
    if (url && url.trim()) {
      onImageSelect(url.trim());
      toast({
        title: "Image URL added",
        description: "The image URL has been added to your product media.",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Find Product Images</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Direct URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Direct Image URL</label>
            <div className="flex gap-2">
              <Input
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => e.key === 'Enter' && directUrl.trim() && handleDirectUrlAdd()}
              />
              <Button 
                onClick={handleDirectUrlAdd} 
                disabled={!directUrl.trim()}
                variant="outline"
              >
                Add Image
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Images</label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for product images..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="overflow-y-auto max-h-96">
            {imageResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imageResults.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={image.url}
                      alt={image.title || 'Product image'}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleImageSelect(image.url)}
                        className="text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                      {image.source && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(image.source, '_blank')}
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !isSearching && (
                <div className="text-center py-8 text-muted-foreground">
                  {imageResults.length === 0 && searchQuery ? 
                    'No images found. Try different search terms.' : 
                    'Enter a search term to find images.'
                  }
                </div>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}