
import React from 'react';
import { useDevMode } from '@/context/DevModeContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ResourceLoadingStateProps {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  onRefresh: () => void;
  itemCount: number;
  resourceName: string;
  devModeCheck?: boolean;
  emptyStateMessage?: string;
  configRoute?: string;
}

export function ResourceLoadingState({ 
  isLoading, 
  hasError, 
  errorMessage, 
  onRefresh,
  itemCount,
  resourceName,
  devModeCheck = true,
  emptyStateMessage,
  configRoute
}: ResourceLoadingStateProps) {
  const { isDevMode, selectedCompanies } = useDevMode();
  const navigate = useNavigate();
  
  const hasDevModeNoItems = devModeCheck && isDevMode && 
    (!selectedCompanies || selectedCompanies.length === 0);
  
  // If we're loading, show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[200px] border rounded-lg">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-muted-foreground">Loading {resourceName}...</p>
        <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
      </div>
    );
  }
  
  // If we have a DevMode issue with no companies selected
  if (hasDevModeNoItems) {
    return (
      <div className="border rounded-lg p-6 bg-red-50 border-red-200">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle size={40} className="text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">No Companies Selected in DevMode</h3>
          <p className="text-red-600 mb-4 max-w-md">
            You have DevMode enabled but haven't selected any companies to display. 
            Select at least one company in the DevMode settings to view data.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="destructive" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Settings size={16} />
              Configure DevMode Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCcw size={16} />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If we encountered an error
  if (hasError) {
    return (
      <div className="border rounded-lg p-6 bg-amber-50 border-amber-200">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle size={40} className="text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-amber-700 mb-2">Error Loading {resourceName}</h3>
          <p className="text-amber-600 mb-4">
            {errorMessage || `There was a problem loading the ${resourceName.toLowerCase()}.`}
          </p>
          <Button 
            variant="outline" 
            onClick={onRefresh}
            className="flex items-center gap-2 border-amber-300 bg-amber-100 hover:bg-amber-200"
          >
            <RefreshCcw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // If we have 0 items but there's a specific empty state message
  if (itemCount === 0 && emptyStateMessage) {
    return (
      <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle size={40} className="text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-blue-700 mb-2">No {resourceName} Available</h3>
          <p className="text-blue-600 mb-4">{emptyStateMessage}</p>
          {configRoute && (
            <div className="flex gap-3">
              <Button 
                variant="default" 
                onClick={() => navigate(configRoute)}
                className="flex items-center gap-2"
              >
                <Settings size={16} />
                Configure {resourceName}
              </Button>
              <Button 
                variant="outline" 
                onClick={onRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCcw size={16} />
                Refresh Data
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Return null if none of the above conditions are met (regular content will be shown)
  return null;
}
