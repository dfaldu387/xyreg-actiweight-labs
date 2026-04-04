import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from '@/hooks/useDebounce';
import { EudamedDevice } from '@/hooks/useEudamedRegistry';
import { DeviceCard } from './DeviceCard';
import { DeviceSelectionControls } from './DeviceSelectionControls';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { createLegacyProducts } from '@/services/legacyProductService';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeviceSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: EudamedDevice[];
  loading?: boolean;
  organizationName: string;
  onSelectionConfirm: (selectedDevices: EudamedDevice[]) => void;
  onCancel: () => void;
  preSelectedDevices?: Set<string>;
  companyId?: string;
  onImportComplete?: () => void;
}

const DEVICES_PER_PAGE = 10;

export function DeviceSelectionDialog({
  open,
  onOpenChange,
  devices,
  loading = false,
  organizationName,
  onSelectionConfirm,
  onCancel,
  preSelectedDevices = new Set(),
  companyId,
  onImportComplete
}: DeviceSelectionDialogProps) {
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set(preSelectedDevices));
  const [searchTerm, setSearchTerm] = useState('');
  const [riskClassFilter, setRiskClassFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    processed: number;
    total: number;
    currentDevice: string;
    errors: string[];
  } | null>(null);

  // Warn user on browser reload/close and back button during import
  useEffect(() => {
    if (!isImporting) return;

    // Handle reload / tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // Handle browser back button — push a guard state, intercept popstate
    window.history.pushState({ eudamedImporting: true }, '');
    const handlePopState = () => {
      // Re-push state to block navigation and show warning
      window.history.pushState({ eudamedImporting: true }, '');
      setShowLeaveWarning(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isImporting]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter and paginate devices
  const { filteredDevices, totalPages, availableRiskClasses } = useMemo(() => {
    let filtered = devices.filter(device => {
      // Search filter
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.toLowerCase();
        const searchableText = [
          device.device_name,
          device.device_model,
          device.udi_di,
          device.trade_names,
          device.basic_udi_di_code
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(term)) {
          return false;
        }
      }

      // Risk class filter
      if (riskClassFilter !== 'all' && device.risk_class !== riskClassFilter) {
        return false;
      }

      return true;
    });

    // Get unique risk classes for filter options
    const riskClasses = Array.from(
      new Set(devices.map(d => d.risk_class).filter(Boolean))
    ).sort();

    const totalPages = Math.ceil(filtered.length / DEVICES_PER_PAGE);

    return {
      filteredDevices: filtered,
      totalPages,
      availableRiskClasses: riskClasses
    };
  }, [devices, debouncedSearchTerm, riskClassFilter]);

  // Paginated devices for current page
  const paginatedDevices = useMemo(() => {
    const startIndex = (currentPage - 1) * DEVICES_PER_PAGE;
    return filteredDevices.slice(startIndex, startIndex + DEVICES_PER_PAGE);
  }, [filteredDevices, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, riskClassFilter]);

  const handleDeviceSelection = useCallback((deviceId: string, selected: boolean) => {
    setSelectedDeviceIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(deviceId);
      } else {
        newSet.delete(deviceId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedDeviceIds(prev => {
      const newSet = new Set(prev);
      filteredDevices.forEach(device => newSet.add(device.udi_di));
      return newSet;
    });
  }, [filteredDevices]);

  const handleDeselectAll = useCallback(() => {
    setSelectedDeviceIds(prev => {
      const newSet = new Set(prev);
      filteredDevices.forEach(device => newSet.delete(device.udi_di));
      return newSet;
    });
  }, [filteredDevices]);

  const handleSelectByRiskClass = useCallback((riskClass: string) => {
    setSelectedDeviceIds(prev => {
      const newSet = new Set(prev);
      devices
        .filter(device => device.risk_class === riskClass)
        .forEach(device => newSet.add(device.udi_di));
      return newSet;
    });
  }, [devices]);

  const handleConfirm = useCallback(async () => {
    const selectedDevices = devices.filter(device => selectedDeviceIds.has(device.udi_di));

    // If companyId is provided, actually import the devices
    if (companyId && selectedDevices.length > 0) {
      setIsImporting(true);
      setImportProgress({ processed: 0, total: selectedDevices.length, currentDevice: '', errors: [] });

      try {
       
        const result = await createLegacyProducts({
          companyId,
          devices: selectedDevices,
          onProgress: (progress) => {
            setImportProgress(progress);
          }
        });

        if (result.success && result.createdProducts.length > 0) {
          toast.success(`Successfully imported ${result.createdProducts.length} products`);
          onImportComplete?.();
          onSelectionConfirm(selectedDevices);
          onOpenChange(false);
        } else if (result.errors.length > 0) {
          toast.error(`Import completed with issues: ${result.errors.join(', ')}`);
        } else {
          toast.warning('No products were imported');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import products');
      } finally {
        setIsImporting(false);
        setImportProgress(null);
      }
    } else {
      // No companyId, just confirm selection without importing
      onSelectionConfirm(selectedDevices);
    }
  }, [devices, selectedDeviceIds, onSelectionConfirm, companyId, onImportComplete, onOpenChange]);

  const handleCancel = useCallback(() => {
    setSelectedDeviceIds(new Set(preSelectedDevices));
    setSearchTerm('');
    setRiskClassFilter('all');
    setCurrentPage(1);
    onCancel();
  }, [preSelectedDevices, onCancel]);

  const selectedCount = selectedDeviceIds.size;
  const filteredSelectedCount = filteredDevices.filter(device => selectedDeviceIds.has(device.udi_di)).length;

  return (
    <>
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (isImporting && !newOpen) {
        setShowLeaveWarning(true);
        return;
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] flex flex-col"
        onEscapeKeyDown={(e) => {
          if (isImporting) {
            e.preventDefault();
            setShowLeaveWarning(true);
          }
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Select Devices to Import</DialogTitle>
          <DialogDescription>
            Choose which devices from {organizationName} to import into your device catalog.
            Found {devices.length} devices in EUDAMED registry.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <DeviceSelectionControls
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCount={filteredSelectedCount}
            totalCount={devices.length}
            filteredCount={filteredDevices.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onSelectByRiskClass={handleSelectByRiskClass}
            riskClassFilter={riskClassFilter}
            onRiskClassFilterChange={setRiskClassFilter}
            availableRiskClasses={availableRiskClasses}
          />

          <ScrollArea className="flex-1 mt-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-3 pr-4">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4 mt-1" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </div>
                ))
              ) : paginatedDevices.length > 0 ? (
                paginatedDevices.map((device) => (
                  <DeviceCard
                    key={device.udi_di}
                    device={device}
                    isSelected={selectedDeviceIds.has(device.udi_di)}
                    onSelectionChange={handleDeviceSelection}
                    searchTerm={debouncedSearchTerm}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {filteredDevices.length === 0 ? (
                    debouncedSearchTerm || riskClassFilter !== 'all' ? (
                      <p>No devices match your search criteria.</p>
                    ) : (
                      <p>No devices found for this organization.</p>
                    )
                  ) : (
                    <p>No devices on this page.</p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Import Progress */}
          {isImporting && importProgress && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Importing Devices</span>
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
                  {importProgress.currentDevice}
                </p>
              )}
              
              {importProgress.errors.length > 0 && (
                <p className="text-xs text-destructive">
                  Errors: {importProgress.errors.length}
                </p>
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {(() => {
                  // Calculate the range of pages to show (sliding window)
                  const maxPagesToShow = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                  
                  // Adjust start page if we're near the end
                  if (endPage - startPage + 1 < maxPagesToShow) {
                    startPage = Math.max(1, endPage - maxPagesToShow + 1);
                  }
                  
                  const pages = [];
                  for (let page = startPage; page <= endPage; page++) {
                    pages.push(
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  return pages;
                })()}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (isImporting) {
                setShowLeaveWarning(true);
              } else {
                handleCancel();
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedCount === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Importing {importProgress?.processed || 0} of {importProgress?.total || 0}...
              </>
            ) : (
              `Import ${selectedCount} Selected Device${selectedCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showLeaveWarning} onOpenChange={setShowLeaveWarning}>
      <AlertDialogContent className="z-[9999]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Import in Progress
          </AlertDialogTitle>
          <AlertDialogDescription>
            Device import is still running. If you leave now, any partially imported data may be incomplete and will need to be cleaned up manually.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continue Import</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              setIsImporting(false);
              setImportProgress(null);
              setShowLeaveWarning(false);
              // Clean up the guard history entry
              window.history.back();
              onOpenChange(false);
            }}
          >
            Leave Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}