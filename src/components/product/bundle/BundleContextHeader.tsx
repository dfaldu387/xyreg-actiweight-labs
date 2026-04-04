import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Package, Plus, TrendingUp } from 'lucide-react';

interface BundleContextHeaderProps {
  bundleName: string;
  description?: string;
  memberCount: number;
  isFeasibilityStudy?: boolean;
  companyName?: string;
  bundleId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddProducts?: () => void;
  disabled?: boolean;
}

export function BundleContextHeader({
  bundleName,
  description,
  memberCount,
  isFeasibilityStudy = false,
  companyName,
  bundleId,
  onEdit,
  onDelete,
  onAddProducts,
  disabled = false
}: BundleContextHeaderProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-semibold">{bundleName}</h2>
                <Badge variant="secondary">
                  {memberCount} device{memberCount !== 1 ? 's' : ''}
                </Badge>
                {isFeasibilityStudy && (
                  <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
                    Feasibility Study
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-muted-foreground mt-2">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isFeasibilityStudy && companyName && bundleId && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => window.location.href = `/app/company/${encodeURIComponent(companyName)}/commercial?tab=feasibility-studies&bundle=${bundleId}`}
                disabled={disabled}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Feasibility Study
              </Button>
            )}
            {onAddProducts && (
              <Button variant="outline" size="sm" onClick={onAddProducts} disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                Add Devices
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} disabled={disabled}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={onDelete} disabled={disabled}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
