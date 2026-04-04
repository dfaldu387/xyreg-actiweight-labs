import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2 } from "lucide-react";
import { InvestorShareCard } from './InvestorShareCard';
import { MarketplaceShareCard } from './MarketplaceShareCard';

interface ShareGenesisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  productId?: string;
}

export function ShareGenesisDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  productId
}: ShareGenesisDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Business Case
          </DialogTitle>
          <DialogDescription>
            Choose how you want to connect with investors
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 py-4">
          <InvestorShareCard
            companyId={companyId}
            companyName={companyName}
            productId={productId}
          />
          <MarketplaceShareCard
            companyId={companyId}
            companyName={companyName}
            productId={productId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
