import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Search, ArrowRight } from "lucide-react";
import { useFDAPredicateTrail } from "@/hooks/useFDAPredicateSearch";

interface FDAPredicateTrailCardProps {
  kNumber?: string;
  fdaProductCode?: string;
  className?: string;
}

export function FDAPredicateTrailCard({ kNumber, fdaProductCode, className }: FDAPredicateTrailCardProps) {
  const { data: trailData, isLoading, error } = useFDAPredicateTrail(kNumber);

  if (!kNumber && !fdaProductCode) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            FDA 510(k) Predicate Trail
          </CardTitle>
          <CardDescription>
            Add an FDA product code or K-number to analyze predicate device trails
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            FDA 510(k) Predicate Trail
          </CardTitle>
          <CardDescription>
            Analyzing predicate trail for {kNumber || fdaProductCode}...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            FDA 510(k) Predicate Trail
          </CardTitle>
          <CardDescription>
            Error analyzing predicate trail for {kNumber || fdaProductCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to fetch predicate trail data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!trailData || !trailData.predicateChain?.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            FDA 510(k) Predicate Trail
          </CardTitle>
          <CardDescription>
            No predicate trail found for {kNumber || fdaProductCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This device may not have identifiable predicate devices or the analysis is still in progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          FDA 510(k) Predicate Trail
        </CardTitle>
        <CardDescription>
          Regulatory pathway analysis for {trailData.deviceKNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trail Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Predicate Trail Summary</h4>
            <Badge variant="outline">
              {trailData.predicateChain.length} device{trailData.predicateChain.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Trail depth: {trailData.trailDepth} levels
          </p>
        </div>

        {/* Predicate Chain */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Predicate Device Chain
          </h4>
          
          {trailData.predicateChain.map((device, index) => (
            <div key={device.kNumber || index}>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-sm">
                      {device.kNumber}
                    </h5>
                    {device.decisionDate && (
                      <Badge variant="secondary" className="text-xs">
                        {device.decisionDate}
                      </Badge>
                    )}
                    {device.documentUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(device.documentUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {device.deviceName && (
                    <p className="text-sm font-medium text-foreground mb-1">
                      {device.deviceName}
                    </p>
                  )}
                  
                  {device.applicant && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Applicant: {device.applicant}
                    </p>
                  )}
                  
                  {(device.productCode || device.deviceClass) && (
                    <div className="flex gap-2 flex-wrap">
                      {device.productCode && (
                        <Badge variant="outline" className="text-xs">
                          {device.productCode}
                        </Badge>
                      )}
                      {device.deviceClass && (
                        <Badge variant="outline" className="text-xs">
                          Class {device.deviceClass}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {index < trailData.predicateChain.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Info */}
        {(trailData.hasUpstream || trailData.hasDownstream) && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <h5 className="font-medium">Upstream Analysis</h5>
                <p className="text-muted-foreground">
                  {trailData.hasUpstream ? `${trailData.upstreamPredicates?.length || 0} predecessors` : 'None found'}
                </p>
              </div>
              <div className="space-y-1">
                <h5 className="font-medium">Downstream Analysis</h5>
                <p className="text-muted-foreground">
                  {trailData.hasDownstream ? `${trailData.downstreamReferences?.length || 0} references` : 'None found'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* View Full Analysis Button */}
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.open(`/app/regulatory/fda-search?tab=predicate-trail&k=${trailData.deviceKNumber}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Predicate Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}