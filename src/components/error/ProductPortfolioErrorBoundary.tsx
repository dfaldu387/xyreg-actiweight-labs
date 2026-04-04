import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Plus, Package2 } from "lucide-react";

interface ProductPortfolioErrorBoundaryProps {
  children: ReactNode;
  onAddProduct?: () => void;
}

interface ProductPortfolioErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class ProductPortfolioErrorBoundary extends Component<
  ProductPortfolioErrorBoundaryProps, 
  ProductPortfolioErrorBoundaryState
> {
  constructor(props: ProductPortfolioErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ProductPortfolioErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ProductPortfolioErrorBoundary] Error caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a "no products" error
      const isNoProductsError = this.state.error?.message?.includes('No Device found');
      
      if (isNoProductsError) {
        return (
          <div className="text-center py-12 space-y-4">
            <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
              <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Device Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Add your first Device to start building your portfolio dashboard.
              </p>
              {this.props.onAddProduct && (
                <Button 
                  className="gap-2" 
                  onClick={this.props.onAddProduct}
                >
                  <Plus className="h-4 w-4" />
                  Add First Device
                </Button>
              )}
            </div>
          </div>
        );
      }

      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Portfolio Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              There was an error loading the portfolio data. This might be due to a temporary issue.
            </p>
            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-xs text-red-800 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              {this.props.onAddProduct && (
                <Button variant="outline" onClick={this.props.onAddProduct} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Device
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}