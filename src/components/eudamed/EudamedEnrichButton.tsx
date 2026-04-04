import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { useEudamedEnrichment } from '@/hooks/useEudamedEnrichment';
import { toast } from 'sonner';

interface EudamedEnrichButtonProps {
  productId: string;
  productName: string;
  companyId: string;
  hasEudamedData?: boolean;
  currentUdiDi?: string | null;
  onEnrichmentComplete?: () => void;
  className?: string;
}

export function EudamedEnrichButton({ 
  productId, 
  productName, 
  companyId,
  hasEudamedData = false,
  currentUdiDi,
  onEnrichmentComplete,
  className = ""
}: EudamedEnrichButtonProps) {
  const { getProductMatches, enrichSingleProduct } = useEudamedEnrichment();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnrichment = async () => {
    setIsLoading(true);
    
    try {
      // Get potential matches for this product
      const matches = await getProductMatches(companyId);
      const productMatch = matches.find(m => m.productId === productId);
      
      if (!productMatch || productMatch.potentialMatches.length === 0) {
        toast.info(`No EUDAMED matches found for ${productName}`);
        return;
      }
      
      // Find the best exact UDI match
      const exactUdiMatch = productMatch.potentialMatches.find(
        m => m.matchType === 'exact_udi' && m.confidence >= 0.9
      );
      
      if (exactUdiMatch) {
        const result = await enrichSingleProduct(productId, exactUdiMatch.eudamedDevice);
        
        if (result.success) {
          toast.success(`Successfully enriched ${productName} with EUDAMED data`);
          if (onEnrichmentComplete) {
            onEnrichmentComplete();
          }
        } else {
          toast.error(`Failed to enrich ${productName}: ${result.error}`);
        }
      } else {
        // Show potential matches for manual review
        const matchCount = productMatch.potentialMatches.length;
        toast.info(
          `Found ${matchCount} potential matches for ${productName}. Manual review may be needed for name-based matches.`
        );
      }
      
    } catch (error) {
      console.error('Enrichment failed:', error);
      toast.error(`Failed to enrich ${productName}: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if product already has EUDAMED data
  if (hasEudamedData) {
    return (
      <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
        <CheckCircle className="h-3 w-3" />
        EUDAMED Data Present
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={handleEnrichment}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Database className={`h-3 w-3 ${isLoading ? 'animate-pulse' : ''}`} />
        {isLoading ? 'Checking EUDAMED...' : 'Enrich with EUDAMED'}
      </Button>
      
      {!currentUdiDi && (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          No UDI-DI
        </Badge>
      )}
    </div>
  );
}