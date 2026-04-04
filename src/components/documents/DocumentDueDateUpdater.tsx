import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { ProductDocumentDueDateService } from '@/services/productDocumentDueDateService';
import { useEffectiveUserRole } from '@/hooks/useEffectiveUserRole';

interface DocumentDueDateUpdaterProps {
  productId: string;
  companyId: string;
}

export function DocumentDueDateUpdater({ productId, companyId }: DocumentDueDateUpdaterProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { effectiveRole, isAdmin } = useEffectiveUserRole();

  const handleUpdateSingleProduct = async () => {
    setIsUpdating(true);
    try {
      const success = await ProductDocumentDueDateService.updateExistingProductDueDates(productId);
      if (success) {
        setLastUpdate(new Date());
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAllProducts = async () => {
    if (!isAdmin && effectiveRole !== 'editor') {
      return;
    }

    setIsUpdating(true);
    try {
      const result = await ProductDocumentDueDateService.assignDueDatesForAllProducts(companyId);
      if (result.updated > 0) {
        setLastUpdate(new Date());
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const canUpdateAll = isAdmin || effectiveRole === 'editor';

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Document Due Date Updates
        </CardTitle>
        <CardDescription>
          Apply due dates to existing documents based on phase end dates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleUpdateSingleProduct}
            disabled={isUpdating}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Update This Product
          </Button>
          
          {canUpdateAll && (
            <Button
              onClick={handleUpdateAllProducts}
              disabled={isUpdating}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Clock className="h-4 w-4 mr-2" />
              Update All Devices
            </Button>
          )}
        </div>

        {lastUpdate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          This will set due dates for documents that don't have them, based on their phase milestone end dates.
        </p>
      </CardContent>
    </Card>
  );
}