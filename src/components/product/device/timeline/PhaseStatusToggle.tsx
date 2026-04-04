
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, XCircle, Loader2 } from "lucide-react";
import { usePhaseClosureValidation } from "@/hooks/usePhaseClosureValidation";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

type PhaseStatus = "Open" | "Closed" | "N/A";

interface PhaseStatusToggleProps {
  status: PhaseStatus;
  onStatusChange?: (status: PhaseStatus) => void;
  disabled?: boolean;
  phaseId?: string;
  productId?: string;
}

export function PhaseStatusToggle({ status, onStatusChange, disabled, phaseId, productId }: PhaseStatusToggleProps) {
  const [isChanging, setIsChanging] = useState(false);
  const { validatePhaseForClosure, isValidating } = usePhaseClosureValidation();
  const { hasAdminAccess } = usePermissions();
  
  const canUpdateStatus = hasAdminAccess;
  const getStatusIcon = (status: PhaseStatus) => {
    switch (status) {
      case "Closed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Open":
        return <Circle className="h-4 w-4 text-blue-600" />;
      case "N/A":
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: PhaseStatus) => {
    switch (status) {
      case "Closed":
        return "text-green-600 border-green-200 bg-green-50";
      case "Open":
        return "text-blue-600 border-blue-200 bg-blue-50";
      case "N/A":
        return "text-gray-600 border-gray-200 bg-gray-50";
      default:
        return "text-gray-600 border-gray-200 bg-gray-50";
    }
  };

  const handleStatusChange = async (newStatus: PhaseStatus) => {
    if (newStatus === 'Closed' && phaseId && productId) {
      setIsChanging(true);
      try {
        const validation = await validatePhaseForClosure(phaseId, productId);
        if (!validation.canClose) {
          toast.error(validation.message);
          return;
        }
      } catch (error) {
        console.error('Error validating phase closure:', error);
        toast.error('Error validating phase closure requirements');
        return;
      } finally {
        setIsChanging(false);
      }
    }
    onStatusChange?.(newStatus);
  };

  // If disabled or user is not admin, render as a simple text display
  if (disabled || !canUpdateStatus) {
    return (
      <div className={`w-28 h-8 text-xs flex items-center justify-center gap-1 ${getStatusColor(status).replace('border-', '').replace('bg-', 'bg-transparent ')}`}>
        {getStatusIcon(status)}
        <span>{status}</span>
      </div>
    );
  }

  return (
    <Select value={status} onValueChange={handleStatusChange} disabled={disabled || isChanging || isValidating || !canUpdateStatus}>
      <SelectTrigger className={`w-28 h-8 text-xs ${getStatusColor(status)} relative`}>
        {(isChanging || isValidating) && (
          <Loader2 className="h-3 w-3 animate-spin absolute left-1" />
        )}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Open">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-blue-600" />
            <span>Open</span>
          </div>
        </SelectItem>
        <SelectItem value="Closed">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Closed</span>
          </div>
        </SelectItem>
        <SelectItem value="N/A">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-gray-400" />
            <span>N/A</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
