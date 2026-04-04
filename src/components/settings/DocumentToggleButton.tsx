
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, Plus } from "lucide-react";

interface DocumentToggleButtonProps {
  isExcluded: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export function DocumentToggleButton({ 
  isExcluded, 
  isLoading = false, 
  onToggle, 
  disabled = false,
  size = "sm",
  variant = "outline"
}: DocumentToggleButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onToggle}
      disabled={disabled || isLoading}
      className="gap-1"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {isExcluded ? 'Including...' : 'Excluding...'}
        </>
      ) : isExcluded ? (
        <>
          <Plus className="h-4 w-4" />
          Include
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4" />
          Exclude
        </>
      )}
    </Button>
  );
}
