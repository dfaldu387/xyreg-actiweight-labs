
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createDefaultGapAnalysisItems } from "@/utils/gapAnalysisUtils";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";

interface PopulateGapsButtonProps {
  onComplete?: () => void;
  productId?: string;
}

export function PopulateGapsButton({ onComplete, productId }: PopulateGapsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePopulate = async () => {
    if (!productId) {
      toast.error("No product ID provided");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("PopulateGapsButton: Creating gap analysis items for product:", productId);
      const success = await createDefaultGapAnalysisItems(productId);
      
      if (success) {
        toast.success("Gap analysis items created successfully");
        if (onComplete) {
          onComplete();
        }
      } else {
        toast.error("Failed to create gap analysis items");
      }
    } catch (error) {
      console.error("Error creating gap analysis items:", error);
      toast.error("Failed to create gap analysis items");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePopulate}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? "Creating..." : "Populate Gap Analysis Items"}
    </Button>
  );
}
