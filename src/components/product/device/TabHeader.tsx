import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CircularProgress } from '@/components/common/CircularProgress';

interface TabHeaderProps {
  title: string;
  subtitle?: string;
  completionPercentage?: number;
  isLoading?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved';
  className?: string;
  isEudamedTab?: boolean;
  isProgress?: boolean;
}

export function TabHeader({
  title,
  subtitle,
  completionPercentage,
  isLoading = false,
  saveStatus = 'idle',
  className = "",
  isEudamedTab = false,
  isProgress = true
}: TabHeaderProps) {
  const renderSaveStatus = () => {
    if (saveStatus === 'saving') {
      return <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />;
    }
    if (saveStatus === 'saved') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {completionPercentage !== undefined && (
            <CircularProgress percentage={completionPercentage} size={50}/>
          )}
          {renderSaveStatus()}
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>
      {completionPercentage !== undefined && isProgress && (
        <Progress
          value={completionPercentage}
          className="mt-2 h-2"
        />
      )}
    </div>
  );
}