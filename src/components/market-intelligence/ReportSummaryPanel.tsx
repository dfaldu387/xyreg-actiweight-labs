import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, Target, BarChart3, Calendar, Building } from 'lucide-react';

interface MarketReport {
  id: string;
  title: string;
  source: string;
  report_date: string | null;
  description: string | null;
  executive_summary?: string;
  key_findings?: string[];
  strategic_recommendations?: string[];
  market_size_data?: any;
}

interface ReportSummaryPanelProps {
  report: MarketReport;
  onJumpToPage: (pageNumber: number) => void;
}

export function ReportSummaryPanel({ report, onJumpToPage }: ReportSummaryPanelProps) {
  const handleJumpToSection = (sectionName: string) => {
    // For now, we'll just jump to the first page
    // In a real implementation, we would parse the document structure
    // and maintain a mapping of sections to page numbers
    onJumpToPage(1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm mb-2">AI Summary</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building className="w-3 h-3" />
          {report.source}
          {report.report_date && (
            <>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              {new Date(report.report_date).getFullYear()}
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 h-screen">
          {/* Executive Summary */}
          {report.executive_summary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {report.executive_summary}
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs mt-2"
                  onClick={() => handleJumpToSection('executive_summary')}
                >
                  View in document →
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Key Findings */}
          {report.key_findings && report.key_findings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Key Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.key_findings.map((finding, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                      {finding}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs mt-2"
                  onClick={() => handleJumpToSection('key_findings')}
                >
                  View in document →
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Strategic Recommendations */}
          {report.strategic_recommendations && report.strategic_recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.strategic_recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-secondary rounded-full mt-2" />
                      {recommendation}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs mt-2"
                  onClick={() => handleJumpToSection('recommendations')}
                >
                  View in document →
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Market Size Data */}
          {report.market_size_data && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Market Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(report.market_size_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs mt-2"
                  onClick={() => handleJumpToSection('market_data')}
                >
                  View in document →
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Document Description */}
          {report.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {report.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Placeholder for when no AI summary is available */}
          {!report.executive_summary && 
           !report.key_findings?.length && 
           !report.strategic_recommendations?.length && 
           !report.market_size_data && (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <h4 className="text-sm font-medium mb-2">AI Summary Not Available</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  This document hasn't been processed for AI summary yet. 
                  Use the "Ask This Document" feature to get specific insights.
                </p>
                <Badge variant="outline" className="text-xs">
                  {report.title}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}