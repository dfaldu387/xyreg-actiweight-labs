
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";

interface DraftRecoveryNotificationProps {
  onRestore: () => void;
  onDismiss: () => void;
  draftAge?: number;
}

export function DraftRecoveryNotification({ 
  onRestore, 
  onDismiss, 
  draftAge 
}: DraftRecoveryNotificationProps) {
  const formatDraftAge = (ageInMs: number): string => {
    const minutes = Math.floor(ageInMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  };

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <FileText className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="font-medium text-orange-800">
            Unsaved changes detected
          </span>
          <p className="text-sm text-orange-700 mt-1">
            We found unsaved NPV analysis data from {draftAge ? formatDraftAge(draftAge) : 'earlier'}. 
            Would you like to restore it?
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button 
            onClick={onRestore} 
            size="sm" 
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            Restore
          </Button>
          <Button 
            onClick={onDismiss} 
            size="sm" 
            variant="ghost"
            className="text-orange-600 hover:bg-orange-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
