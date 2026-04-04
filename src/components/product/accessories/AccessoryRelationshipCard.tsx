import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Package, RefreshCw, Calendar } from "lucide-react";
import { ProductAccessoryRelationship } from "@/hooks/useProductRelationships";
import { useDeleteProductAccessoryRelationship } from "@/hooks/useProductRelationships";
import { toast } from "sonner";
import { useConfirm } from '@/components/ui/confirm-dialog';

interface AccessoryRelationshipCardProps {
  relationship: ProductAccessoryRelationship;
}

export function AccessoryRelationshipCard({ relationship }: AccessoryRelationshipCardProps) {
  const deleteMutation = useDeleteProductAccessoryRelationship();
  const confirmAction = useConfirm();

  const handleDelete = async () => {
    if (!await confirmAction({ title: 'Delete relationship', description: 'Are you sure you want to delete this relationship?', confirmLabel: 'Delete', variant: 'destructive' })) return;

    try {
      await deleteMutation.mutateAsync(relationship.id);
      toast.success("Relationship deleted");
    } catch (error) {
      console.error("Error deleting relationship:", error);
    }
  };

  const isRecurring = relationship.recurring_multiplier > 0;

  const formatPeriod = (period: string) => {
    const periodMap: Record<string, string> = {
      daily: "day",
      weekly: "week",
      monthly: "month",
      quarterly: "quarter",
      yearly: "year",
    };
    return periodMap[period] || period;
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {relationship.main_product?.name || "Unknown Product"}
              </p>
              <p className="text-xs text-muted-foreground">Main Product</p>
            </div>
            <span className="text-muted-foreground">→</span>
            <div>
              <p className="text-sm font-medium">
                {relationship.accessory_product?.name || "Unknown Accessory"}
              </p>
              <p className="text-xs text-muted-foreground">Accessory</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Package className="h-3 w-3" />
              Initial: {relationship.initial_multiplier}x
            </Badge>

            {isRecurring ? (
              <>
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Recurring: {relationship.recurring_multiplier}x per {formatPeriod(relationship.recurring_period)}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {relationship.lifecycle_duration_months} months lifecycle
                </Badge>
              </>
            ) : (
              <Badge variant="outline">One-time purchase</Badge>
            )}

            {relationship.revenue_attribution_percentage !== 100 && (
              <Badge variant="outline">
                {relationship.revenue_attribution_percentage}% revenue attribution
              </Badge>
            )}
          </div>

          {isRecurring && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <strong>Example:</strong> If 100 main products are sold, you'll need:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>{100 * relationship.initial_multiplier} accessories initially</li>
                <li>
                  {100 * relationship.recurring_multiplier} accessories per{" "}
                  {formatPeriod(relationship.recurring_period)} for{" "}
                  {relationship.lifecycle_duration_months} months
                </li>
                <li>
                  <strong>Total over lifecycle:</strong>{" "}
                  {100 * relationship.initial_multiplier +
                    100 *
                      relationship.recurring_multiplier *
                      getPeriodsInLifecycle(
                        relationship.recurring_period,
                        relationship.lifecycle_duration_months
                      )}{" "}
                  accessories
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function getPeriodsInLifecycle(period: string, lifecycleMonths: number): number {
  const periodsPerMonth: Record<string, number> = {
    daily: 30,
    weekly: 4,
    monthly: 1,
    quarterly: 1 / 3,
    yearly: 1 / 12,
  };
  return Math.round((periodsPerMonth[period] || 1) * lifecycleMonths);
}
