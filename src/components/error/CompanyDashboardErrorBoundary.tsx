
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompanyDashboardErrorFallbackProps {
  error: Error;
  resetError: () => void;
  companyName?: string;
}

function CompanyDashboardErrorFallback({ 
  error, 
  resetError, 
  companyName 
}: CompanyDashboardErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-red-700">Company Dashboard Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            There was an error loading the dashboard for {companyName ? `"${companyName}"` : 'this company'}.
          </p>
          <p className="text-sm text-gray-500">
            This might be due to phase synchronization issues or data inconsistencies.
          </p>
          <div className="space-y-2">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left text-xs bg-gray-100 p-2 rounded">
              <summary className="cursor-pointer font-medium">Error Details (Dev Mode)</summary>
              <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CompanyDashboardErrorBoundaryProps {
  children: React.ReactNode;
  companyName?: string;
}

export function CompanyDashboardErrorBoundary({ 
  children, 
  companyName 
}: CompanyDashboardErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="page"
      fallback={
        <CompanyDashboardErrorFallback 
          error={new Error('Dashboard failed to load')}
          resetError={() => window.location.reload()}
          companyName={companyName}
        />
      }
      onError={(error, errorInfo) => {
        // Error handling without console log
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
