
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DocumentProtectionBadgeProps {
  documentType: string;
  isProtected: boolean;
  inclusionStatus?: string;
}

export function DocumentProtectionBadge({ 
  documentType, 
  isProtected, 
  inclusionStatus 
}: DocumentProtectionBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        {documentType}
      </Badge>
      
      {isProtected && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                <Shield className="h-3 w-3 mr-1" />
                Protected
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>This document cannot be deleted as it's required for regulatory compliance</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {inclusionStatus && inclusionStatus !== 'always_include' && (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
          {inclusionStatus}
        </Badge>
      )}
    </div>
  );
}
