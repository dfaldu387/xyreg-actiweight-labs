import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertTriangle } from 'lucide-react';
import { CategoryCodeSelector } from './CategoryCodeSelector';
import { CategoryCompetitorResults } from './CategoryCompetitorResults';
import { useCategoryCompetitiveAnalysis } from '@/hooks/useCategoryCompetitiveAnalysis';

interface CategoryBasedMarketAnalysisProps {
  className?: string;
  defaultCode?: string;
}

export function CategoryBasedMarketAnalysis({ 
  className,
  defaultCode 
}: CategoryBasedMarketAnalysisProps) {
  const [selectedCode, setSelectedCode] = useState(defaultCode || '');
  const [analysisCode, setAnalysisCode] = useState(defaultCode || '');

  const { data: analysis, isLoading, error, refetch } = useCategoryCompetitiveAnalysis(
    analysisCode || undefined
  );

  const handleCodeSelect = (code: string) => {
    setSelectedCode(code);
    setAnalysisCode(code);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category Code Selection */}
      <CategoryCodeSelector
        onCodeSelect={handleCodeSelect}
        selectedCode={selectedCode}
      />

      {/* Analysis Results */}
      {isLoading && analysisCode && (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-2">
              <LoadingSpinner />
              <p className="text-muted-foreground">
                Analyzing competitive landscape for {analysisCode}...
              </p>
              <p className="text-sm text-muted-foreground">
                Gathering data from EU (EUDAMED) and US (FDA) databases
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h3 className="text-lg font-medium mb-2">Analysis Error</h3>
            <p className="text-muted-foreground mb-4">
              Unable to complete category analysis: {error.message}
            </p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      )}

      {analysis && !isLoading && (
        <CategoryCompetitorResults results={analysis} />
      )}

      {!analysisCode && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Category-Based Competitive Analysis</CardTitle>
            <CardDescription>
              Select a product category code to analyze the competitive landscape across EU and US markets.
              Get insights into market concentration, geographic distribution, and global players.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl">🇪🇺</div>
                <h4 className="font-medium">EU Market Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  EUDAMED database search for European competitors
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl">🇺🇸</div>
                <h4 className="font-medium">US Market Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  FDA device database search for US competitors
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl">🌍</div>
                <h4 className="font-medium">Global Intelligence</h4>
                <p className="text-sm text-muted-foreground">
                  Cross-market analysis and geographic insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}