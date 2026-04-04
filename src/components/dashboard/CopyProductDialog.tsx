import React, { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Loader2, Copy } from "lucide-react";

interface CopyProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  currentCompanyId: string;
  onConfirm: (targetCompanyId: string, attachToFamily: boolean, customName?: string) => Promise<void>;
}

export function CopyProductDialog({
  open,
  onOpenChange,
  product,
  currentCompanyId,
  onConfirm,
}: CopyProductDialogProps) {
  const [attachToFamily, setAttachToFamily] = useState(false);
  const [copyName, setCopyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const hasFamily = !!(product?.parent_product_id || product?.is_master_device);
  const defaultName = `${product?.name || ''} copy`;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const name = copyName.trim() || undefined;
      await onConfirm(currentCompanyId, attachToFamily, name);
      onOpenChange(false);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      setAttachToFamily(false);
      setCopyName("");
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
        ) : (
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

              {hasFamily && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label>Attach to family?</Label>
                    <p className="text-xs text-muted-foreground">
                      Keep this copy in the same device family
                    </p>
                  </div>
                  <Switch
                    checked={attachToFamily}
                    onCheckedChange={setAttachToFamily}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
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
