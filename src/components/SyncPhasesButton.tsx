import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { syncProductPhases } from '@/services/phaseSync';
import { toast } from 'sonner';

interface SyncPhasesButtonProps {
  productId: string;
  companyId: string;
  onSync: () => void;
}

export function SyncPhasesButton({ productId, companyId, onSync }: SyncPhasesButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const result = await syncProductPhases(productId, companyId);
      
      if (result.success) {
        toast.success(`Successfully synced ${result.syncedCount} phases`);
        onSync();
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Unexpected error during sync');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Phases
        </>
      )}
    </Button>
  );
}