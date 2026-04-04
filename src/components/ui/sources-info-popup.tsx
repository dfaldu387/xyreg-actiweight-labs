import React from "react";
import { Info, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SourceInfo {
  name: string;
  status: 'complete' | 'incomplete' | 'pending';
  description: string;
}

interface SourcesInfoPopupProps {
  sources: SourceInfo[];
  trigger?: React.ReactNode;
}

export function SourcesInfoPopup({ sources, trigger }: SourcesInfoPopupProps) {
  const getStatusIcon = (status: SourceInfo['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'incomplete':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: SourceInfo['status']) => {
    switch (status) {
      case 'complete':
        return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>;
      case 'incomplete':
        return <Badge variant="destructive">Incomplete</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Info className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <h4 className="font-semibold">Source Information Status</h4>
          </div>
          
          <div className="space-y-3">
            {sources.map((source, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="mt-0.5">
                  {getStatusIcon(source.status)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-sm">{source.name}</h5>
                    {getStatusBadge(source.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{source.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {sources.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No source information available
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}