import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, FileText, X, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { ReportChatSidebar } from './ReportChatSidebar';
import { ReportSummaryPanel } from './ReportSummaryPanel';
import { SectionExtractionDialog } from './SectionExtractionDialog';

interface MarketReport {
  id: string;
  title: string;
  source: string;
  report_date: string | null;
  description: string | null;
  file_name: string | null;
  file_storage_path: string | null;
  status: string;
  executive_summary?: string;
  key_findings?: string[];
  strategic_recommendations?: string[];
  market_size_data?: any;
}

interface MarketReportViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: MarketReport | null;
  companyId: string;
}

export function MarketReportViewer({ 
  open, 
  onOpenChange, 
  report, 
  companyId 
}: MarketReportViewerProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showSectionExtraction, setShowSectionExtraction] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!open || !report?.file_storage_path) return;

    const loadPdf = async () => {
      setIsLoadingPdf(true);
      setPdfError(null);
      try {
        const { data, error } = await supabase.storage
          .from('market-intelligence-reports')
          .createSignedUrl(report.file_storage_path, 3600);

        if (error || !data?.signedUrl) {
          throw new Error(error?.message || 'Unable to load document');
        }
        setPdfUrl(data.signedUrl);
      } catch (error) {
        setPdfError(error instanceof Error ? error.message : 'Failed to load document');
        toast.error('Failed to load document');
      } finally {
        setIsLoadingPdf(false);
      }
    };

    loadPdf();
  }, [open, report?.file_storage_path]);

  const handleJumpToPage = (pageNumber: number) => {
    // Jump to page functionality
  };

  const handleHighlightText = (pageNumber: number, searchText: string) => {
    // Highlight text functionality
  };

  if (!report) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${
          isFullScreen 
            ? 'w-[100vw] h-screen max-w-none overflow-y-auto m-0 rounded-none' 
            : 'w-[95vw] h-screen overflow-y-auto max-w-none'
        } p-0 gap-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="flex flex-row items-center justify-between p-4 border-b shrink-0">
            <DialogTitle className="text-lg font-semibold truncate mr-4">
              {report.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {report.source}
              </Badge>
              {report.report_date && (
                <Badge variant="outline" className="text-xs">
                  {new Date(report.report_date).getFullYear()}
                </Badge>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowSectionExtraction(true)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Extract Section
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullScreen(!isFullScreen)}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button> */}
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex flex-1 min-h-0">
            {/* PDF Viewer */}
            <div className="flex-1 min-w-0">
              <div className="relative w-full h-full">
                {isLoadingPdf && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Loading document...</p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Large documents may take a moment to load. Thank you for your patience.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {pdfError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background">
                    <div className="text-center p-6 max-w-md">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Failed to Load Document</h3>
                      <p className="text-sm text-muted-foreground mb-4">{pdfError}</p>
                      <Button onClick={() => setPdfUrl(null)} variant="outline">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                {!isLoadingPdf && !pdfError && pdfUrl && (
                  <iframe
                    src={pdfUrl}
                    title={report.title}
                    className="w-full h-full border-0"
                  />
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-96 border-l h-screen flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-3 m-2">
                  <TabsTrigger value="chat" className="text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Ask Document
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Summary
                  </TabsTrigger>
                  {/* Removed annotations tab */}
                </TabsList>

                <div className="flex-1 min-h-0">
                  <TabsContent value="chat" className="h-full m-0 p-0">
                    <ReportChatSidebar
                      report={report}
                      companyId={companyId}
                      onJumpToPage={handleJumpToPage}
                      onHighlightText={handleHighlightText}
                    />
                  </TabsContent>

                  <TabsContent value="summary" className="h-full m-0 p-0">
                    <ReportSummaryPanel
                      report={report}
                      onJumpToPage={handleJumpToPage}
                    />
                  </TabsContent>

                  {/* Removed annotations content */}
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Section Extraction Dialog */}
      <SectionExtractionDialog
        open={showSectionExtraction}
        onOpenChange={setShowSectionExtraction}
        reportId={report.id}
        reportTitle={report.title}
        companyId={companyId}
        onSectionExtracted={() => {
          toast.success('Section extracted successfully');
        }}
      />
    </Dialog>
  );
}