import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useEudamedNameUpdate } from '@/hooks/useEudamedNameUpdate';

interface QuickNameFixProps {
  companyId: string;
  companyName: string;
}

export function QuickNameFix({ companyId, companyName }: QuickNameFixProps) {
  const { isUpdating, progress, updateProductNames } = useEudamedNameUpdate();

  const handleQuickFix = async () => {
    try {
      console.log(`Starting immediate name fix for company: ${companyName} (${companyId})`);
      const result = await updateProductNames(companyId);
      console.log('Quick fix result:', result);
    } catch (error) {
      console.error('Quick fix failed:', error);
    }
  };

  return (
    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <h3 className="font-semibold text-orange-800">Product Name Issue Detected</h3>
      </div>
      
      <p className="text-sm text-orange-700 mb-4">
        Some products are using trade names instead of proper EUDAMED device names. 
        Click below to fix this immediately.
      </p>

      {isUpdating && (
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{progress.operation}</span>
            <span>{progress.processed}%</span>
          </div>
          <div className="w-full bg-orange-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.processed}%` }}
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleQuickFix}
        disabled={isUpdating}
        variant="destructive"
        size="sm"
        className="flex items-center gap-2"
      >
        {isUpdating ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Fixing Names...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            Fix Product Names Now
          </>
        )}
      </Button>
    </div>
  );
}