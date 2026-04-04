
import React from 'react';
import { AlertCircle, RefreshCw, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  details?: string;
  severity?: 'error' | 'warning' | 'info';
  isLoading?: boolean;
  debugInfo?: string;
}

export function LoadingErrorState({ 
  title, 
  message, 
  onRetry,
  details,
  severity = 'error',
  isLoading = false,
  debugInfo
}: LoadingErrorStateProps) {
  const [showDebugInfo, setShowDebugInfo] = React.useState(false);
  
  // Set title based on severity if not provided
  const defaultTitle = 
    severity === 'error' ? 'Error' : 
    severity === 'warning' ? 'Warning' : 
    'Information';
    
  const displayTitle = title || defaultTitle;
  
  const bgColor = 
    severity === 'error' ? 'bg-red-50 border-red-100' : 
    severity === 'warning' ? 'bg-yellow-50 border-yellow-100' : 
    'bg-blue-50 border-blue-100';
    
  const textColor = 
    severity === 'error' ? 'text-red-700' : 
    severity === 'warning' ? 'text-yellow-700' : 
    'text-blue-700';
    
  const iconColor = 
    severity === 'error' ? 'text-red-500' : 
    severity === 'warning' ? 'text-yellow-500' : 
    'text-blue-500';
    
  const Icon = severity === 'info' ? Info : AlertCircle;

  // If in loading state, show a skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col items-center justify-center p-6 rounded-lg border text-center", bgColor)}>
      <Icon className={cn("h-10 w-10 mb-4", iconColor)} />
      <h3 className={cn("text-lg font-semibold mb-2", textColor)}>{displayTitle}</h3>
      <p className={cn("max-w-md mb-4", textColor)}>{message}</p>
      
      {(details || debugInfo) && (
        <Collapsible className="mb-4 w-full max-w-md">
          <CollapsibleTrigger className={cn("text-sm flex items-center justify-center cursor-pointer font-medium", textColor)}>
            {showDebugInfo ? "Hide Details" : "Show Technical Details"} 
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 bg-white/50 rounded text-left overflow-auto text-xs border border-gray-200">
              {details && <p className="mb-2">{details}</p>}
              
              {debugInfo && (
                <div className="mt-2">
                  <h4 className="font-semibold mb-1">Diagnostics:</h4>
                  <pre className="whitespace-pre-wrap overflow-x-auto p-2 bg-gray-100 rounded">
                    {debugInfo}
                  </pre>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {onRetry && (
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
