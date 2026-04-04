

import React from 'react';
import { useDevMode } from '@/context/DevModeContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ClientLoadingStateProps {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  onRefresh: () => void;
  clientCount: number;
}

export function ClientLoadingState({ 
  isLoading, 
  hasError, 
  errorMessage, 
  onRefresh,
  clientCount 
}: ClientLoadingStateProps) {
  const { isDevMode, selectedCompanies } = useDevMode();
  const navigate = useNavigate();
  
  const hasDevModeNoCompanies = isDevMode && (!selectedCompanies || selectedCompanies.length === 0);
  
  // If we're loading, show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[200px] border rounded-lg">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-muted-foreground">Loading clients...</p>
        <p className="text-xs text-muted-foreground mt-1">
          {isDevMode ? "Fetching data for selected companies" : "This may take a moment"}
        </p>
      </div>
    );
  }
  
  // If we have a DevMode issue with no companies selected
  if (hasDevModeNoCompanies) {
    return (
      <div className="border rounded-lg p-6 bg-yellow-50 border-yellow-200">
        <div className="flex flex-col items-center text-center">
          <Settings size={40} className="text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-700 mb-2">No Companies Selected in DevMode</h3>
          <p className="text-yellow-600 mb-4 max-w-md">
            You have DevMode enabled but haven't selected any companies to display. 
            Select at least one company in the DevMode settings to view data.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="default" 
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
      <div className="border rounded-lg p-6 bg-red-50 border-red-200">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle size={40} className="text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Clients</h3>
          <p className="text-red-600 mb-4">
            {errorMessage || "There was a problem loading the client data."}
          </p>
          <Button 
            variant="outline" 
            onClick={onRefresh}
            className="flex items-center gap-2 border-red-300 bg-red-100 hover:bg-red-200"
          >
            <RefreshCcw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // If we have 0 clients but DevMode is active and companies are selected
  if (clientCount === 0 && isDevMode && selectedCompanies && selectedCompanies.length > 0) {
    return (
      <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle size={40} className="text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-blue-700 mb-2">No Data Found for Selected Companies</h3>
          <p className="text-blue-600 mb-4">
            Your DevMode selection includes {selectedCompanies.length} {selectedCompanies.length === 1 ? 'company' : 'companies'}, 
            but no client data was found. This could mean the companies exist but have no products or the data hasn't been loaded yet.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="default" 
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCcw size={16} />
              Refresh Data
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Settings size={16} />
              Modify DevMode Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Return null if none of the above conditions are met (regular content will be shown)
  return null;
}
