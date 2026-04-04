import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, RefreshCw } from 'lucide-react';
import { useEudamedNameUpdate } from '@/hooks/useEudamedNameUpdate';

interface EudamedNameUpdateSectionProps {
  companyId: string;
  companyName: string;
  onUpdateComplete?: () => void;
}

export function EudamedNameUpdateSection({ companyId, companyName, onUpdateComplete }: EudamedNameUpdateSectionProps) {
  const { isUpdating, progress, updateProductNames } = useEudamedNameUpdate();

  const handleUpdate = async () => {
    try {
      const result = await updateProductNames(companyId);
      
      if (onUpdateComplete) {
        onUpdateComplete();
      }
      
    } catch (error) {
      console.error('Name update failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          EUDAMED Name Correction
        </CardTitle>
        <CardDescription>
          Update existing product names to use correct EUDAMED device names instead of trade names
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Device Name Priority Fix
          </Badge>
        </div>

        {/* Progress Bar (when updating) */}
        {isUpdating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progress.operation}</span>
              <span>{progress.processed}%</span>
            </div>
            <Progress value={progress.processed} className="w-full" />
          </div>
        )}

        {/* Update Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center gap-2"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
            {isUpdating ? 'Updating Names...' : 'Update Product Names from EUDAMED'}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground">
          <p>
            This will update existing product names to prioritize EUDAMED device names over trade names. 
            Only products with exact UDI-DI matches will be updated, and only if the name needs correction.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}