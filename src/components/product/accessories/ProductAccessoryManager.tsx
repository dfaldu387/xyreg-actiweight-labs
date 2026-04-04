import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProductAccessoryRelationships, ProductAccessoryRelationship } from "@/hooks/useProductRelationships";
import { AccessoryRelationshipDialog } from "./AccessoryRelationshipDialog";
import { AccessoryRelationshipCard } from "./AccessoryRelationshipCard";

interface ProductAccessoryManagerProps {
  companyId: string;
  productId?: string;
}

export function ProductAccessoryManager({ companyId, productId }: ProductAccessoryManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: relationships, isLoading } = useProductAccessoryRelationships(companyId, productId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Accessories & Recurring Items</CardTitle>
              <CardDescription>
                Define accessories that are purchased with this product, including one-time and recurring items
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Accessory
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading relationships...</p>
          ) : relationships && relationships.length > 0 ? (
            <div className="space-y-4">
              {relationships.map((relationship) => (
                <AccessoryRelationshipCard
                  key={relationship.id}
                  relationship={relationship as ProductAccessoryRelationship}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No accessory relationships defined yet. Add one to track one-time or recurring purchases.
            </p>
          )}
        </CardContent>
      </Card>

      <AccessoryRelationshipDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        companyId={companyId}
        mainProductId={productId}
      />
    </div>
  );
}
