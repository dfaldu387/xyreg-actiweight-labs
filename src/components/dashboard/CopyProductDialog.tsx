import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy, ChevronLeft, Info } from "lucide-react";

interface CopyProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  currentCompanyId: string;
  onConfirm: (targetCompanyId: string, attachToFamily: boolean, customName?: string, selectedFamilyId?: string) => Promise<void>;
}

export function CopyProductDialog({
  open,
  onOpenChange,
  product,
  currentCompanyId,
  onConfirm,
}: CopyProductDialogProps) {
  const [step, setStep] = useState<"name" | "family">("name");
  const [copyName, setCopyName] = useState("");
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("none");
  const [isLoading, setIsLoading] = useState(false);

  const defaultName = `${product?.name || ''} copy`;

  // Fetch all families (master devices) for the company
  const { data: families = [], isLoading: familiesLoading } = useQuery({
    queryKey: ['device-families-list', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      // Get all master devices (family heads)
      const { data: masters, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', currentCompanyId)
        .eq('is_master_device', true)
        .is('archived_at', null)
        .order('name');

      if (error) {
        console.error('Error fetching device families:', error);
        return [];
      }

      // For each master, get the count of variants
      const familiesWithCount = await Promise.all(
        (masters || []).map(async (master) => {
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('parent_product_id', master.id)
            .eq('parent_relationship_type', 'variant')
            .is('archived_at', null);

          return {
            id: master.id,
            name: master.name,
            variantCount: (count || 0) + 1, // +1 for the master itself
          };
        })
      );

      return familiesWithCount;
    },
    enabled: open && !!currentCompanyId,
  });

  const handleNext = () => {
    setStep("family");
  };

  const handleBack = () => {
    setStep("name");
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const name = copyName.trim() || undefined;
      const attachToFamily = selectedFamilyId !== "none";
      await onConfirm(currentCompanyId, attachToFamily, name, selectedFamilyId !== "none" ? selectedFamilyId : undefined);
      onOpenChange(false);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      setStep("name");
      setCopyName("");
      setSelectedFamilyId("none");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isLoading) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copy Device
          </DialogTitle>
          <DialogDescription>
            Create a copy of <strong>{product?.name}</strong> with all its data.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Copying device data...</p>
            <p className="text-xs text-muted-foreground">
              Duplicating all fields, components, and configurations
            </p>
          </div>
        ) : step === "name" ? (
          <>
            <div className="space-y-4 py-4">
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>All device data, metadata, and configurations will be duplicated.</li>
                <li>The copy will start with a fresh status and can be edited independently.</li>
                <li>Regulatory and compliance fields are copied but may need re-validation.</li>
              </ul>

              <div className="space-y-2">
                <Label htmlFor="copy-name">Device Name</Label>
                <Input
                  id="copy-name"
                  placeholder={defaultName}
                  value={copyName}
                  onChange={(e) => setCopyName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use default: <strong>{defaultName}</strong>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleNext}>
                Next
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Add to Device Family <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                {familiesLoading ? (
                  <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading families...
                  </div>
                ) : families.length === 0 ? (
                  <div className="flex items-start gap-2 rounded-lg border p-3 bg-muted/50">
                    <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      No device families exist yet. The copied device will be created as a standalone device.
                      You can create a family later from the dashboard.
                    </p>
                  </div>
                ) : (
                  <>
                    <Select value={selectedFamilyId} onValueChange={setSelectedFamilyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a family..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No family (standalone device)</SelectItem>
                        {families.map((family) => (
                          <SelectItem key={family.id} value={family.id}>
                            {family.name} ({family.variantCount})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select a family to add the copied device as a member, or leave as standalone.
                    </p>
                  </>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleConfirm}>
                Create Copy
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
