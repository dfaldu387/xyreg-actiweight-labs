import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useEudamedRegistry } from '@/hooks/useEudamedRegistry';
import { createLegacyProducts } from '@/services/legacyProductService';

interface EudamedLegacyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companySrn: string;
  companyName: string;
  onImportComplete?: () => void;
}

export function EudamedLegacyImportDialog({
  open,
  onOpenChange,
  companyId,
  companySrn,
  companyName,
  onImportComplete
}: EudamedLegacyImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { searchBySrn } = useEudamedRegistry();
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({
    processed: 0,
    total: 0,
    currentDevice: '',
    errors: [] as string[]
  });
  const [totalCount, setTotalCount] = useState<number | null>(null);

  React.useEffect(() => {
    if (open && companySrn) {
      loadDeviceData();
    }
  }, [open, companySrn]);

  const loadDeviceData = async () => {
    setIsLoading(true);
    try {
      const result = await searchBySrn(companySrn);
      if (result.devices && result.devices.length > 0) {
        setDeviceData(result.devices);
        setTotalCount(typeof result.totalCount === 'number' ? result.totalCount : result.devices.length);
      } else {
        toast.error('Failed to load EUDAMED device data');
      }
    } catch {
      toast.error('Error loading EUDAMED data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!deviceData.length) {
      toast.error('No devices to import');
      return;
    }

    setIsImporting(true);
    setImportProgress({ processed: 0, total: deviceData.length, currentDevice: '', errors: [] });

    try {
      const result = await createLegacyProducts({
        companyId,
        devices: deviceData,
        onProgress: (progress) => {
          setImportProgress(progress);
        }
      });

      if (result.success) {
        toast.success(`Successfully imported ${result.createdProducts.length} legacy products`);
        onImportComplete?.();
        onOpenChange(false);
      } else {
        toast.error(`Import completed with issues: ${result.errors.join(', ')}`);
      }
    } catch {
      toast.error('Failed to import legacy products');
    } finally {
      setIsImporting(false);
      setImportProgress({ processed: 0, total: 0, currentDevice: '', errors: [] });
    }
  };

  const deviceTypeStats = React.useMemo(() => {
    if (!deviceData.length) return {};
    
    const stats: Record<string, number> = {};
    deviceData.forEach(device => {
      const type = device.device_model || 'Unknown';
      stats[type] = (stats[type] || 0) + 1;
    });
    
    return stats;
  }, [deviceData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Import EUDAMED Legacy Products
          </DialogTitle>
          <DialogDescription>
            Import existing medical devices from EUDAMED registry for {companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading EUDAMED data...</span>
            </div>
          ) : deviceData.length > 0 ? (
            <>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4" />
                  <span className="font-medium">Devices Found: {deviceData.length}{typeof totalCount === 'number' && totalCount > deviceData.length ? ` of ${totalCount}` : ''}</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Device Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(deviceTypeStats).map(([type, count]) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">What will be imported:</p>
                  <ul className="mt-1 text-blue-700 space-y-1">
                    <li>• All devices as "Legacy Devices"</li>
                    <li>• EUDAMED registration details</li>
                    <li>• Device specifications and classifications</li>
                    <li>• Automatic phase assignment</li>
                  </ul>
                </div>
              </div>

              {isImporting && (
                <div className="space-y-3 p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Import Progress</span>
                    <span className="text-muted-foreground">
                      {importProgress.processed} of {importProgress.total} ({Math.round((importProgress.processed / importProgress.total) * 100)}%)
                    </span>
                  </div>
                  
                  <Progress 
                    value={(importProgress.processed / importProgress.total) * 100} 
                    className="h-2"
                  />
                  
                  {importProgress.currentDevice && (
                    <p className="text-xs text-muted-foreground">
                      Processing: {importProgress.currentDevice}
                    </p>
                  )}
                  
                  {importProgress.errors.length > 0 && (
                    <p className="text-xs text-destructive">
                      Errors: {importProgress.errors.length}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No EUDAMED devices found for this company</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || deviceData.length === 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing {importProgress.processed} of {importProgress.total}...
              </>
            ) : (
              `Import ${deviceData.length} Products`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}