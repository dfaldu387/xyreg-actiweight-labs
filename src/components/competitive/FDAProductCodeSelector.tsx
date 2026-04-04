import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface FDADevice {
  kNumber: string;
  deviceName: string;
  applicant: string;
  productCode: string;
  decisionDate: string;
}

interface FDAProductCodeSelectorProps {
  productId: string;
  currentFdaCode?: string;
  onCodeSelected?: (code: string) => void;
  className?: string;
}

export function FDAProductCodeSelector({ 
  productId, 
  currentFdaCode, 
  onCodeSelected, 
  className 
}: FDAProductCodeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FDADevice[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | undefined>(currentFdaCode);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fda-predicate-search', {
        body: {
          query: searchQuery,
          searchType: 'fulltext',
          limit: 20
        }
      });

      if (error) throw error;

      if (data?.success && data?.data?.results) {
        setSearchResults(data.data.results.map((result: any) => result.device));
      } else {
        setSearchResults([]);
        toast.info('No FDA devices found for your search');
      }
    } catch (error) {
      console.error('Error searching FDA devices:', error);
      toast.error('Failed to search FDA devices');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCodeSelect = async (productCode: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ fda_product_code: productCode })
        .eq('id', productId);

      if (error) throw error;

      setSelectedCode(productCode);
      onCodeSelected?.(productCode);
      toast.success(`FDA product code ${productCode} selected successfully`);
      
      // Clear search results after successful selection
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error saving FDA product code:', error);
      toast.error('Failed to save FDA product code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCodeRemove = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          fda_product_code: null,
          fda_product_codes: null
        })
        .eq('id', productId);

      if (error) throw error;

      setSelectedCode(undefined);
      onCodeSelected?.('');
      toast.success('FDA product code removed successfully');
    } catch (error) {
      console.error('Error removing FDA product code:', error);
      toast.error('Failed to remove FDA product code');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          FDA Product Code Selection
        </CardTitle>
        <CardDescription>
          Search and select an FDA product code to enhance competitive analysis with US market data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current FDA Code Display */}
        {selectedCode && (
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">FDA Code</Badge>
              <span className="font-mono font-semibold">{selectedCode}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCodeRemove}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Search Interface */}
        <div className="flex gap-2">
          <Input
            placeholder="Search FDA devices (e.g., 'catheter', 'implant', 'surgical')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h4 className="font-semibold text-sm">Search Results ({searchResults.length})</h4>
            {searchResults.map((device, index) => (
              <div
                key={`${device.kNumber}-${index}`}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono">
                      {device.productCode}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      K{device.kNumber}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">
                    {device.deviceName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {device.applicant} • {device.decisionDate}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleCodeSelect(device.productCode)}
                  disabled={isSaving || selectedCode === device.productCode}
                  className="ml-2 shrink-0"
                >
                  {selectedCode === device.productCode ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Selected
                    </>
                  ) : (
                    'Select'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && searchQuery && !isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No FDA devices found for "{searchQuery}"</p>
            <p className="text-sm">Try different search terms or check spelling</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}