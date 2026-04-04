import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, List, Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DocumentContext, KeyPointsResult, KeyPoint } from '@/hooks/useDocumentAI';

interface KeyPointsTabProps {
  documentId: string;
  documentText: string;
  context?: DocumentContext;
  documentAI: {
    isLoading: boolean;
    error: string | null;
    keyPoints: KeyPointsResult | null;
    extractKeyPoints: (documentId: string, text: string, context?: DocumentContext) => Promise<KeyPointsResult | null>;
    loadCachedKeyPoints: (documentId: string) => Promise<KeyPointsResult | null>;
  };
}

export function KeyPointsTab({
  documentId,
  documentText,
  context,
  documentAI
}: KeyPointsTabProps) {
  const [hasCheckedCache, setHasCheckedCache] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['high']));

  // Check for cached key points on mount
  useEffect(() => {
    if (documentId && !hasCheckedCache) {
      documentAI.loadCachedKeyPoints(documentId);
      setHasCheckedCache(true);
    }
  }, [documentId, hasCheckedCache]);

  // Reset cache check when document changes
  useEffect(() => {
    setHasCheckedCache(false);
  }, [documentId]);

  const handleExtractKeyPoints = async () => {
    if (!documentText) return;
    await documentAI.extractKeyPoints(documentId, documentText, context);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const { isLoading, error, keyPoints } = documentAI;

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'requirement': return '📋';
      case 'procedure': return '⚙️';
      case 'finding': return '🔍';
      case 'recommendation': return '💡';
      case 'definition': return '📖';
      default: return '📌';
    }
  };

  // Group key points by importance
  const groupedByImportance = keyPoints?.keyPoints.reduce((acc, point) => {
    const importance = point.importance || 'medium';
    if (!acc[importance]) acc[importance] = [];
    acc[importance].push(point);
    return acc;
  }, {} as Record<string, KeyPoint[]>) || {};

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm text-red-600 text-center mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={handleExtractKeyPoints}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : keyPoints ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {keyPoints.totalPoints} key points
              </Badge>
              {keyPoints.categories && Object.entries(keyPoints.categories).map(([cat, count]) => (
                count > 0 && (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {getCategoryIcon(cat)} {count} {cat}s
                  </Badge>
                )
              ))}
            </div>

            {/* Top Themes */}
            {keyPoints.topThemes && keyPoints.topThemes.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <h4 className="text-xs font-medium text-primary mb-2">Top Themes</h4>
                  <div className="flex flex-wrap gap-1">
                    {keyPoints.topThemes.map((theme, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Key Points by Importance */}
            {['high', 'medium', 'low'].map(importance => {
              const points = groupedByImportance[importance] || [];
              if (points.length === 0) return null;

              return (
                <Collapsible
                  key={importance}
                  open={expandedCategories.has(importance)}
                  onOpenChange={() => toggleCategory(importance)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getImportanceColor(importance)}`}>
                        {importance}
                      </Badge>
                      <span className="text-sm font-medium capitalize">{importance} Priority</span>
                      <span className="text-xs text-muted-foreground">({points.length})</span>
                    </div>
                    {expandedCategories.has(importance) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {points.map((point, index) => (
                      <Card key={index} className="bg-background">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <span className="text-sm">{getCategoryIcon(point.category)}</span>
                            <div className="flex-1">
                              <p className="text-sm">{point.point}</p>
                              {point.section && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Section: {point.section}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {/* Regenerate Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExtractKeyPoints}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Extract Again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <List className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-2">Extract Key Points</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-[250px]">
              Extract and organize the main points from this document, categorized by importance and type.
            </p>
            <Button onClick={handleExtractKeyPoints} disabled={!documentText}>
              <Sparkles className="h-4 w-4 mr-2" />
              Extract Key Points
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
