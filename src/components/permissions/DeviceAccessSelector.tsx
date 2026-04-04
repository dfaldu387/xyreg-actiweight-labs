import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  basic_udi_di: string | null;
  parent_product_id: string | null;
}

interface DeviceAccessSelectorProps {
  companyId: string;
  selectedProductIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  inline?: boolean;
}

export function DeviceAccessSelector({
  companyId,
  selectedProductIds,
  onChange,
  label = "Device Access",
  inline = false,
}: DeviceAccessSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDeviceRestriction, setHasDeviceRestriction] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [udiAliases, setUdiAliases] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!companyId) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const [{ data, error }, { data: aliasData }] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, basic_udi_di, parent_product_id")
            .eq("company_id", companyId)
            .eq("is_archived", false)
            .order("name"),
          supabase
            .from("basic_udi_aliases")
            .select("basic_udi_di, alias")
            .eq("company_id", companyId)
        ]);

        if (error) throw error;
        setProducts(data || []);
        const aliasMap = new Map<string, string>();
        (aliasData || []).forEach((a: any) => aliasMap.set(a.basic_udi_di, a.alias));
        setUdiAliases(aliasMap);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [companyId]);

  // Default select all devices once products are loaded
  useEffect(() => {
    if (products.length > 0 && selectedProductIds.length === 0) {
      onChange(products.map((p) => p.id));
    }
  }, [products]);

  // Check if a product is a family member (child of another product in the list)
  const isFamilyMember = (product: Product) =>
    Boolean(product.parent_product_id && products.some((p) => p.id === product.parent_product_id));

  // Check if a product is a root master (no parent, has children)
  const isMasterDevice = (product: Product) =>
    !product.parent_product_id && products.some((p) => p.parent_product_id === product.id);

  // Count all descendants recursively
  const getAllDescendantIds = (id: string): string[] => {
    const children = products.filter(p => p.parent_product_id === id);
    return children.flatMap(c => [c.id, ...getAllDescendantIds(c.id)]);
  };

  const countDescendants = (id: string): number => getAllDescendantIds(id).length;

  const handleToggle = (product: Product) => {
    const isSelected = tempSelectedIds.includes(product.id);
    const descendantIds = getAllDescendantIds(product.id);

    if (isSelected) {
      const toRemove = new Set([product.id, ...descendantIds]);
      setTempSelectedIds((prev) => prev.filter((id) => !toRemove.has(id)));
    } else {
      setTempSelectedIds((prev) => {
        const newSet = new Set([...prev, product.id, ...descendantIds]);
        return Array.from(newSet);
      });
    }
  };

  const allSelected =
    products.length > 0 &&
    products.every((p) => tempSelectedIds.includes(p.id));

  const allDevicesSelected =
    products.length > 0 &&
    products.every((p) => selectedProductIds.includes(p.id));

  const switchEl = (
    <Switch
      checked={hasDeviceRestriction}
      onCheckedChange={(checked) => {
        setHasDeviceRestriction(checked);
        if (checked) {
          setTempSelectedIds([...selectedProductIds]);
          setIsDialogOpen(true);
        } else {
          onChange(products.map((p) => p.id));
        }
      }}
    />
  );

  const statusText = (
    <span className="text-sm text-muted-foreground">
      {!hasDeviceRestriction || allDevicesSelected
        ? "All Device"
        : `${selectedProductIds.length} selected`}
    </span>
  );

  return (
    <>
      {inline ? (
        <>
          <Label>{label}</Label>
          {switchEl}
          {statusText}
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{label}</Label>
            <div className="flex items-center space-x-2">
              {switchEl}
              {statusText}
              {hasDeviceRestriction && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTempSelectedIds([...selectedProductIds]);
                    setIsDialogOpen(true);
                  }}
                >
                  Select Devices
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Device Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Device</DialogTitle>
            <DialogDescription>
              Choose which Device this user can access. When no Device are selected, user will have no device access.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {tempSelectedIds.length} of {products.length} Device selected
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (allSelected) {
                      setTempSelectedIds([]);
                    } else {
                      setTempSelectedIds(products.map((p) => p.id));
                    }
                  }}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <Separator />

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {products.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No Device found for this company
                    </p>
                  ) : (
                    (() => {
                      const getAllMembers = (rootId: string): Product[] => {
                        const result: Product[] = [];
                        const addChildren = (parentId: string) => {
                          products
                            .filter(p => p.parent_product_id === parentId)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .forEach(child => { result.push(child); addChildren(child.id); });
                        };
                        addChildren(rootId);
                        return result;
                      };
                      const roots = products
                        .filter(p => !p.parent_product_id)
                        .sort((a, b) => a.name.localeCompare(b.name));
                      const grouped = roots.map(root => ({
                        root,
                        members: [root, ...getAllMembers(root.id)],
                        hasChildren: products.some(p => p.parent_product_id === root.id),
                      }));
                      const allGroupedIds = new Set(grouped.flatMap(g => g.members.map(m => m.id)));
                      products.forEach(p => {
                        if (!allGroupedIds.has(p.id)) {
                          grouped.push({ root: p, members: [p], hasChildren: false });
                        }
                      });
                      return grouped;
                    })().map(({ root, members, hasChildren }) => {
                      const memberIds = members.map(m => m.id);
                      const allSelected = memberIds.every(id => tempSelectedIds.includes(id));
                      const someSelected = memberIds.some(id => tempSelectedIds.includes(id));
                      const toggleAll = () => {
                        if (allSelected) {
                          setTempSelectedIds(prev => prev.filter(id => !memberIds.includes(id)));
                        } else {
                          setTempSelectedIds(prev => Array.from(new Set([...prev, ...memberIds])));
                        }
                      };

                      if (!hasChildren) {
                        return (
                          <div key={root.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                            <Checkbox
                              id={`dialog-device-${root.id}`}
                              checked={tempSelectedIds.includes(root.id)}
                              onCheckedChange={() => handleToggle(root)}
                            />
                            <label htmlFor={`dialog-device-${root.id}`} className="text-sm font-medium cursor-pointer">
                              {root.name}
                            </label>
                          </div>
                        );
                      }

                      const groupDisplayName = (root.basic_udi_di && udiAliases.get(root.basic_udi_di)) || udiAliases.get(root.id) || root.name;
                      return (
                        <div key={root.id}>
                          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                            <Checkbox
                              id={`dialog-group-${root.id}`}
                              checked={someSelected}
                              onCheckedChange={toggleAll}
                            />
                            <div className="flex items-center gap-2">
                              <label htmlFor={`dialog-group-${root.id}`} className="text-sm font-semibold cursor-pointer">
                                {groupDisplayName}
                              </label>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                {members.length} devices
                              </Badge>
                            </div>
                          </div>
                          {members.map(member => (
                            <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 ml-6">
                              <Checkbox
                                id={`dialog-device-${member.id}`}
                                checked={tempSelectedIds.includes(member.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    // Select this member only
                                    setTempSelectedIds(prev => Array.from(new Set([...prev, member.id])));
                                  } else {
                                    setTempSelectedIds(prev => prev.filter(id => id !== member.id));
                                  }
                                }}
                              />
                              <label htmlFor={`dialog-device-${member.id}`} className="text-sm cursor-pointer">
                                {member.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTempSelectedIds([...selectedProductIds]);
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    onChange([...tempSelectedIds]);
                    if (
                      products.length > 0 &&
                      products.every((p) => tempSelectedIds.includes(p.id))
                    ) {
                      setHasDeviceRestriction(false);
                    }
                    setIsDialogOpen(false);
                  }}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
