import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { documentSectionService, TOCItem } from '@/services/documentSectionService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SectionExtractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportTitle: string;
  companyId: string;
  onSectionExtracted?: () => void;
}

export function SectionExtractionDialog({
  open,
  onOpenChange,
  reportId,
  reportTitle,
  companyId,
  onSectionExtracted
}: SectionExtractionDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<TOCItem[]>([]);
  const [selectedSection, setSelectedSection] = useState<TOCItem | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (open) {
      analyzeDocument();
      loadProducts();
    }
  }, [open, reportId]);

  const loadProducts = async () => {
    // TODO: Load products for the company
    // For now, we'll use a placeholder
    setProducts([
      { id: '1', name: 'Product 1' },
      { id: '2', name: 'Product 2' }
    ]);
  };

  const analyzeDocument = async () => {
    setIsAnalyzing(true);
    try {
      const toc = await documentSectionService.analyzeDocumentStructure(reportId);
      setTableOfContents(toc);
      
      if (toc.length === 0) {
        toast.info('No table of contents detected in this document');
      } else {
        toast.success(`Found ${toc.length} sections in document`);
      }
    } catch (error) {
      toast.error('Failed to analyze document structure');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExtractSection = async () => {
    if (!selectedSection || !selectedProductId) {
      toast.error('Please select a section and product');
      return;
    }

    setIsExtracting(true);
    try {
      // Create section record
      const section = await documentSectionService.createSection(
        reportId,
        selectedSection.title,
        selectedSection.pageStart,
        selectedSection.pageEnd
      );

      // Trigger extraction
      await documentSectionService.extractSection(section.id);

      toast.success('Section extraction started');
      onSectionExtracted?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to extract section');
    } finally {
      setIsExtracting(false);
    }
  };

  const getIndentClass = (level: number) => {
    switch (level) {
      case 1: return 'ml-0';
      case 2: return 'ml-4';
      case 3: return 'ml-8';
      default: return 'ml-12';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Extract Section for Product Analysis
          </DialogTitle>
          <DialogDescription>
            AI has analyzed "{reportTitle}" and detected the following sections. 
            Select a section to extract and link to a product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label>Select Product</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a product to link this section to" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table of Contents */}
          <div className="space-y-2">
            <Label>Document Sections</Label>
            <ScrollArea className="h-[400px] border rounded-md">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing document structure with AI...
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This may take a minute for large documents
                  </p>
                </div>
              ) : tableOfContents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No sections detected in this document
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={analyzeDocument}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-1">
                  {tableOfContents.map((section, index) => (
                    <div
                      key={index}
                      className={`
                        ${getIndentClass(section.level)}
                        p-3 rounded-lg cursor-pointer transition-colors
                        ${selectedSection === section 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'hover:bg-accent border-2 border-transparent'
                        }
                      `}
                      onClick={() => setSelectedSection(section)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {section.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Pages {section.pageStart}-{section.pageEnd}
                            {' • '}
                            {section.pageEnd - section.pageStart + 1} pages
                          </div>
                        </div>
                        {selectedSection === section && (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Selected Section Preview */}
          {selectedSection && (
            <div className="p-4 border rounded-lg bg-accent/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Selected Section</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSection.title}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Pages {selectedSection.pageStart}-{selectedSection.pageEnd}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedSection.pageEnd - selectedSection.pageStart + 1} pages
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExtracting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtractSection}
              disabled={!selectedSection || !selectedProductId || isExtracting}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract Section
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
