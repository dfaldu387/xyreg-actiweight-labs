import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Zap, CheckCircle } from 'lucide-react';
import { useEudamedEnrichment } from '@/hooks/useEudamedEnrichment';

interface EudamedEnrichmentSectionProps {
  companyId: string;
  companyName: string;
  onEnrichmentComplete?: () => void;
}

export function EudamedEnrichmentSection({ 
  companyId, 
  companyName, 
  onEnrichmentComplete 
}: EudamedEnrichmentSectionProps) {
  const { isEnriching, progress, enrichExistingProducts, completeReinstallFromEudamed } = useEudamedEnrichment();

  const handleEnrichment = async () => {
    try {
      const result = await enrichExistingProducts(companyId);
      
      if (onEnrichmentComplete) {
        onEnrichmentComplete();
      }
      
    } catch (error) {
      console.error('Enrichment failed:', error);
    }
  };

  const handleCompleteReinstall = async () => {
    try {
      const result = await completeReinstallFromEudamed(companyId);
      
      if (onEnrichmentComplete) {
        onEnrichmentComplete();
      }
      
    } catch (error) {
      console.error('Complete reinstallation failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          EUDAMED Enrichment
        </CardTitle>
        <CardDescription>
          Enrich existing products with EUDAMED data for {companyName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar (when enriching) */}
        {isEnriching && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progress.operation}</span>
              <span>{progress.processed}%</span>
            </div>
            <Progress value={progress.processed} className="w-full" />
          </div>
        )}

        {/* Enrichment Buttons */}
        <div className="flex flex-col items-center space-y-3">
          <Button
            onClick={handleEnrichment}
            disabled={isEnriching}
            className="flex items-center gap-2 w-full"
            variant="secondary"
          >
            <Zap className={`h-4 w-4 ${isEnriching ? 'animate-spin' : ''}`} />
            {isEnriching 
              ? 'Enriching Products...' 
              : 'Enrich Missing EUDAMED Data'
            }
          </Button>

          <Button
            onClick={handleCompleteReinstall}
            disabled={isEnriching}
            className="flex items-center gap-2 w-full"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${isEnriching ? 'animate-spin' : ''}`} />
            {isEnriching 
              ? 'Reinstalling...' 
              : 'Complete EUDAMED Reinstallation'
            }
          </Button>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            Auto-match by UDI-DI
          </Badge>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="bg-muted/50 p-3 rounded-md space-y-2">
            <div>
              <div className="font-medium mb-1">Standard Enrichment:</div>
              <ul className="text-xs space-y-1">
                <li>• Finds products without EUDAMED data</li>
                <li>• Matches them with EUDAMED devices by UDI-DI</li>
                <li>• Only processes high-confidence matches</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">Complete Reinstallation:</div>
              <ul className="text-xs space-y-1">
                <li>• Updates ALL products with latest EUDAMED data</li>
                <li>• Refreshes trade names, EMDN codes, issuing agencies</li>
                <li>• Ensures complete synchronization with EUDAMED</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}