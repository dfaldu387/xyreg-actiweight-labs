import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useEudamedProductImport } from '@/hooks/useEudamedProductImport';

import { EudamedEnrichmentSection } from './EudamedEnrichmentSection';
import { EudamedNameUpdateSection } from './EudamedNameUpdateSection';

interface EudamedProductImporterProps {
  companyId: string;
  companyName: string;
  onImportComplete?: () => void;
}

export function EudamedProductImporter({ companyId, companyName, onImportComplete }: EudamedProductImporterProps) {
  const { isImporting, progress, importMissingProducts, getImportStatus } = useEudamedProductImport();
  const [importStatus, setImportStatus] = useState({
    totalEudamedDevices: 0,
    currentProducts: 0,
    missingDevices: 0
  });

  useEffect(() => {
    loadImportStatus();
  }, [companyId]);

  const loadImportStatus = async () => {
    try {
      const status = await getImportStatus(companyId);
      setImportStatus(status);
    } catch (error) {
      console.error('Failed to load import status:', error);
    }
  };

  const handleImport = async () => {
    try {
      const result = await importMissingProducts(companyId);
      
      // Refresh status after import
      await loadImportStatus();
      
      if (onImportComplete) {
        onImportComplete();
      }
      
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const isFullyImported = importStatus.missingDevices === 0 && importStatus.totalEudamedDevices > 0;

  return (
    <div className="space-y-6">
      {/* Enrichment Section */}
      <EudamedEnrichmentSection 
        companyId={companyId}
        companyName={companyName}
        onEnrichmentComplete={loadImportStatus}
      />

      {/* Name Correction Section */}
      <EudamedNameUpdateSection
        companyId={companyId}
        companyName={companyName}
        onUpdateComplete={loadImportStatus}
      />
      
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            EUDAMED Product Import
          </CardTitle>
          <CardDescription>
            Import missing products from the EUDAMED database for {companyName}
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Import Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{importStatus.totalEudamedDevices}</div>
            <div className="text-sm text-muted-foreground">EUDAMED Devices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{importStatus.currentProducts}</div>
            <div className="text-sm text-muted-foreground">Current Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{importStatus.missingDevices}</div>
            <div className="text-sm text-muted-foreground">Missing Products</div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          {isFullyImported ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              All devices imported
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {importStatus.missingDevices} devices to import
            </Badge>
          )}
        </div>

        {/* Progress Bar (when importing) */}
        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progress.operation}</span>
              <span>{progress.processed}%</span>
            </div>
            <Progress value={progress.processed} className="w-full" />
          </div>
        )}

        {/* Import Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleImport}
            disabled={isImporting || isFullyImported}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isImporting 
              ? 'Importing...' 
              : isFullyImported 
                ? 'All Devices Imported' 
                : `Import ${importStatus.missingDevices} Missing Devices`
            }
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground">
          <p>
            This will import all missing UDI-DIs from the EUDAMED database as individual products. 
            Each device will use its trade name as the product name.
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}