import React from 'react';
import { Calendar, User, FileText, Download, ExternalLink, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MarketReport {
  id: string;
  title: string;
  source: string;
  report_date: string | null;
  description: string | null;
  file_name: string | null;
  file_storage_path: string | null;
  upload_timestamp: string;
  status: string;
  uploaded_by_user_id: string;
  file_size?: number;
  file_type?: string;
  executive_summary?: string;
  key_findings?: string[];
  strategic_recommendations?: string[];
  market_size_data?: any;
  processing_error?: string;
}

interface ReportViewDialogProps {
  report: MarketReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportViewDialog({ report, open, onOpenChange }: ReportViewDialogProps) {
  const { toast } = useToast();

  const downloadFile = async () => {
    if (!report.file_storage_path) {
      toast({
        title: "No file available",
        description: "This report doesn't have an associated file.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('market-intelligence-reports')
        .download(report.file_storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file_name || 'report';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "The report file is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Uploaded': 'default',
      'Processing': 'secondary',
      'Processed': 'default',
      'Error': 'destructive',
    } as const;

    const icon = status === 'Processing' ? (
      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
    ) : null;

    return (
      <Badge variant={statusColors[status as keyof typeof statusColors] || 'default'} className="flex items-center">
        {icon}
        {status}
      </Badge>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {report.title}
          </DialogTitle>
          <DialogDescription>
            Market intelligence report details and AI-powered analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Source</label>
                <p className="text-sm">{report.source}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Report Date</label>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm">
                    {report.report_date
                      ? format(new Date(report.report_date), 'MMMM d, yyyy')
                      : 'Not specified'
                    }
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  {getStatusBadge(report.status)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Uploaded</label>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm">
                    {format(new Date(report.upload_timestamp), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {report.file_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File</label>
                  <p className="text-sm">{report.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(report.file_size)}
                  </p>
                </div>
              )}

              {report.file_type && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Type</label>
                  <p className="text-sm">
                    {report.file_type === 'application/pdf' ? 'PDF Document' :
                     report.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'Word Document' :
                     report.file_type}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Processing Error */}
          {report.processing_error && report.status === 'Error' && (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
              <h3 className="text-lg font-semibold text-destructive mb-2">Processing Error</h3>
              <p className="text-sm text-destructive">{report.processing_error}</p>
            </div>
          )}

          {/* Processing Status */}
          {report.status === 'Processing' && (
            <div className="p-4 bg-secondary/50 border rounded-lg text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Processing document...</p>
              <p className="text-xs text-muted-foreground">AI analysis in progress - this may take a few minutes</p>
            </div>
          )}

          {/* AI Analysis Results - only show if processed */}
          {report.status === 'Processed' && (
            <>
              {/* Executive Summary */}
              {report.executive_summary && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Executive Summary
                  </h3>
                  <div className="p-4 bg-background border rounded-lg">
                    <p className="text-sm leading-relaxed">{report.executive_summary}</p>
                  </div>
                </div>
              )}

              {/* Key Findings */}
              {report.key_findings && report.key_findings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Findings</h3>
                  <div className="space-y-2">
                    {report.key_findings.map((finding, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-background border rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-sm">{finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Recommendations */}
              {report.strategic_recommendations && report.strategic_recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Strategic Recommendations</h3>
                  <div className="space-y-2">
                    {report.strategic_recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-background border rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Size Data */}
              {report.market_size_data && Object.keys(report.market_size_data).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Market Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(report.market_size_data).map(([key, value]) => (
                      value && (
                        <div key={key} className="p-3 bg-background border rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm mt-1">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Description */}
          {report.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm mt-1 leading-relaxed">{report.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Report ID: {report.id}
            </div>
            
            <div className="flex gap-2">
              {report.file_storage_path && (
                <Button onClick={downloadFile} size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}