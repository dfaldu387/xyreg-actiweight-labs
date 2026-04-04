
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  fileName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class PdfErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PDF Error Boundary caught an error:', error, errorInfo);
    
    // Check if this is a PDF.js TextLayer error
    const isTextLayerError = error.message.includes('sendWithStream') || 
                            error.message.includes('TextLayer') ||
                            error.stack?.includes('TextLayer2');
    
    if (isTextLayerError) {
      toast.error("PDF text layer failed to load. Using basic viewing mode.");
    } else {
      console.error('PDF Error details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
      toast.error("An error occurred while loading the PDF viewer.");
    }
    
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleRefreshPage = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isTextLayerError = this.state.error?.message.includes('sendWithStream') || 
                              this.state.error?.message.includes('TextLayer');

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              PDF Viewer Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTextLayerError ? (
              <div>
                <p className="text-sm text-red-600 mb-2">
                  PDF text layer failed to initialize. This is a known compatibility issue.
                </p>
                <p className="text-xs text-gray-600">
                  You can still view the PDF and use highlighting features. Text search may be limited.
                </p>
              </div>
            ) : (
              <p className="text-sm text-red-600">
                An error occurred while loading the PDF viewer for {this.props.fileName || 'this document'}.
              </p>
            )}
            
            <div className="flex gap-2 flex-wrap">
              <Button onClick={this.handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleRefreshPage} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs text-red-500">
                <summary className="cursor-pointer hover:text-red-700">Error details (Dev Mode)</summary>
                <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-32 p-2 bg-red-100 rounded">
                  {this.state.error.message}
                  {this.state.errorInfo && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
