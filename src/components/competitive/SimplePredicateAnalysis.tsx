import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Brain, ExternalLink, AlertCircle } from 'lucide-react';
import { useMultiAIPredicateTrail } from '@/hooks/useMultiAIPredicateTrail';

interface SimplePredicateAnalysisProps {
  companyId?: string;
  initialKNumber?: string;
}

export function SimplePredicateAnalysis({ companyId, initialKNumber }: SimplePredicateAnalysisProps) {
  const [kNumber, setKNumber] = useState(initialKNumber || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { 
    data: multiAIData, 
    isLoading, 
    error,
    refetch 
  } = useMultiAIPredicateTrail(
    kNumber.trim() ? kNumber.trim() : undefined, 
    companyId || 'demo-company-id',
    { enabled: false }
  );

  const handleAnalyze = async () => {
    if (!kNumber.trim()) return;
    setIsAnalyzing(true);
    try {
      await refetch();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderTextWithFDALinks = (text: string) => {
    const kNumberPattern = /(K\d{6})/g;
    const parts = text.split(kNumberPattern);
    
    return parts.map((part, index) => {
      if (part.match(kNumberPattern)) {
        return (
          <a
            key={index}
            href={`https://www.fda.gov/medical-devices/510k-clearances/search-510k-database?search=${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1"
          >
            {part}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      }
      return part;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Predicate Trail Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-2">
          <Label htmlFor="k-number">K-Number</Label>
          <div className="flex gap-2">
            <Input
              id="k-number"
              placeholder="Enter K-number (e.g., K123456)"
              value={kNumber}
              onChange={(e) => setKNumber(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleAnalyze}
              disabled={!kNumber.trim() || isLoading || isAnalyzing}
            >
              {isLoading || isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {(isLoading || isAnalyzing) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analyzing predicate trail with AI...</span>
              <span>Processing</span>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-destructive">Analysis Error</p>
              <p className="text-sm text-destructive/80 mt-1">
                {error.message || 'Failed to analyze predicate trail. Please check your API configuration.'}
              </p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {multiAIData?.success && multiAIData.data?.trails?.length > 0 && (
          <div className="space-y-4">
            {multiAIData.data.trails.map((trail, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {trail.provider.charAt(0).toUpperCase() + trail.provider.slice(1)} Analysis
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {new Date(trail.analysisDate).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Target Device Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">K-Number</div>
                      <div className="font-mono text-lg">{trail.targetDevice.kNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Device Name</div>
                      <div className="text-sm">{trail.targetDevice.deviceName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Manufacturer</div>
                      <div className="text-sm">{trail.targetDevice.manufacturer}</div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div>
                    <h4 className="font-medium mb-2">Predicate Trail Analysis</h4>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {renderTextWithFDALinks(trail.summary)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {multiAIData?.success && (!multiAIData.data?.trails || multiAIData.data.trails.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No predicate trail analysis available.</p>
            {multiAIData.message ? (
              <p className="text-sm">{multiAIData.message}</p>
            ) : (
              <p className="text-sm">Check your AI API configuration or try a different K-number.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}