import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TemplateBrowserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDocument: (document: DocumentEntry) => void;
  availableTemplateNames?: string[]; // Names of templates that are actually available
}

interface DocumentEntry {
  id: string;
  name: string;
  document_type: string;
  description: string;
  tech_applicability: string;
  markets: any;
  classes_by_market: any;
  created_at: string;
  updated_at: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  public_url: string;
  uploaded_at: string;
  uploaded_by: string;
  scope: string;
  template_category: string | null;
}

// Database documents will be fetched and stored in state

export function TemplateBrowserModal({ open, onOpenChange, onSelectDocument, availableTemplateNames = [] }: TemplateBrowserModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allDocuments, setAllDocuments] = useState<DocumentEntry[]>([]);
  const fetchAllDocuments = async () => {
    try {
      const { data, error } = await supabase.from('default_document_templates').select('*')
      if (error) {
        console.error('Error fetching documents:', error);
      }
      setAllDocuments((data || []) as DocumentEntry[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }
  useEffect(() => {
    fetchAllDocuments();
  }, []);
  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return allDocuments;

    const searchLower = searchTerm.toLowerCase();
    return allDocuments.filter(doc =>
      doc.name.toLowerCase().includes(searchLower) ||
      doc.description.toLowerCase().includes(searchLower) ||
      doc.document_type.toLowerCase().includes(searchLower)
    );
  }, [searchTerm, allDocuments]);

  // Group documents by row (using SOP number as grouping key)
  const documentRows = useMemo(() => {
    const rows: { [key: string]: { sop?: DocumentEntry; templates: DocumentEntry[]; lists: DocumentEntry[]; forms: DocumentEntry[] } } = {};

    filteredDocuments.forEach(doc => {
      // Extract row identifier from document name
      let rowKey = '';
      if (doc.document_type === 'SOP') {
        const match = doc.name.match(/SOP-(\d+)/);
        rowKey = match ? match[1] : 'misc';
      } else {
        // For other types, extract from the document number in name
        const match = doc.name.match(/(?:TEMP|LIST|FORM)-(\d+)/);
        rowKey = match ? match[1] : 'misc';
      }

      if (!rows[rowKey]) {
        rows[rowKey] = { templates: [], lists: [], forms: [] };
      }

      if (doc.document_type === 'SOP') {
        rows[rowKey].sop = doc;
      } else if (doc.document_type === 'TEMPLATE') {
        rows[rowKey].templates.push(doc);
      } else if (doc.document_type === 'LIST') {
        rows[rowKey].lists.push(doc);
      } else if (doc.document_type === 'FORM') {
        rows[rowKey].forms.push(doc);
      }
    });

    return Object.entries(rows).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredDocuments]);

  const isDocumentAvailable = (document: DocumentEntry) => {
    // If no availableTemplateNames are provided, make all documents available
    if (!availableTemplateNames || availableTemplateNames.length === 0) {
      return true;
    }
    
    // More precise matching for available templates
    return availableTemplateNames.some(name => {
      const nameWords = name.toLowerCase().split(/\s+/);
      const titleWords = document.name.toLowerCase().split(/\s+/);

      // Check for exact word matches or partial matches
      return nameWords.some(nameWord =>
        titleWords.some(titleWord =>
          titleWord.includes(nameWord) || nameWord.includes(titleWord)
        )
      );
    });
  };

  const handleDocumentClick = (document: DocumentEntry) => {
    // Only allow clicking if document is available
    if (!isDocumentAvailable(document)) {
      return;
    }
    onSelectDocument(document);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pr-12">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Browse Standard Operating Procedures and associated Templates
          </DialogTitle>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by SOP, form, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
        </DialogHeader>

        {/* Table */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 bg-muted/50 p-4 border-b font-semibold text-sm text-muted-foreground uppercase tracking-wide flex-shrink-0">
              <div>SOP</div>
              <div>Template</div>
              <div>List</div>
              <div>Form</div>
            </div>

            {/* Table Body - Scrollable */}
            <div
              className="flex-1 overflow-y-scroll"
              style={{
                maxHeight: 'calc(90vh - 220px)',
                scrollbarWidth: 'auto'
              }}
            >
              <div className="space-y-0">
                {documentRows.map(([rowKey, row], index) => (
                  <div
                    key={rowKey}
                    className={`grid grid-cols-4 gap-4 p-4 border-b min-h-[80px] ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    }`}
                  >
                    {/* SOP Column */}
                    <div className="space-y-2">
                      {row.sop && (
                        <div
                          onClick={() => handleDocumentClick(row.sop!)}
                          className={`p-2 rounded border transition-all ${
                            isDocumentAvailable(row.sop)
                              ? 'bg-muted/60 border-muted-foreground/20 hover:bg-muted/80 hover:border-primary/20 cursor-pointer'
                              : 'border-transparent opacity-50 cursor-not-allowed'
                          }`}
                        >
                        <div className="font-semibold text-foreground text-sm">
                          {row.sop.name}
                        </div>
                        <div className="text-xs text-muted-foreground italic leading-relaxed">
                          {row.sop.description}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* Template Column */}
                    <div className="space-y-2">
                      {row.templates.map((template) => (
                        <div
                          key={template.id}
                          onClick={() => handleDocumentClick(template)}
                          className={`p-2 rounded border transition-all ${
                            isDocumentAvailable(template)
                              ? 'bg-muted/60 border-muted-foreground/20 hover:bg-muted/80 hover:border-accent/20 cursor-pointer'
                              : 'border-transparent opacity-50 cursor-not-allowed'
                          }`}
                        >
                        <div className="font-semibold text-foreground text-sm">
                          {template.name}
                        </div>
                        <div className="text-xs text-muted-foreground italic leading-relaxed">
                          {template.description}
                        </div>
                      </div>
                    ))}
                  </div>

                    {/* List Column */}
                    <div className="space-y-2">
                      {row.lists.map((list) => (
                        <div
                          key={list.id}
                          onClick={() => handleDocumentClick(list)}
                          className={`p-2 rounded border transition-all ${
                            isDocumentAvailable(list)
                              ? 'bg-muted/60 border-muted-foreground/20 hover:bg-muted/80 hover:border-secondary/20 cursor-pointer'
                              : 'border-transparent opacity-50 cursor-not-allowed'
                          }`}
                        >
                        <div className="font-semibold text-foreground text-sm">
                          {list.name}
                        </div>
                        <div className="text-xs text-muted-foreground italic leading-relaxed">
                          {list.description}
                        </div>
                      </div>
                    ))}
                  </div>

                    {/* Form Column */}
                    <div className="space-y-2">
                      {row.forms.map((form) => (
                        <div
                          key={form.id}
                          onClick={() => handleDocumentClick(form)}
                          className={`p-2 rounded border transition-all ${
                            isDocumentAvailable(form)
                              ? 'bg-muted/60 border-muted-foreground/20 hover:bg-muted/80 hover:border-emerald-500/20 cursor-pointer'
                              : 'border-transparent opacity-50 cursor-not-allowed'
                          }`}
                        >
                        <div className="font-semibold text-foreground text-sm">
                          {form.name}
                        </div>
                        <div className="text-xs text-muted-foreground italic leading-relaxed">
                          {form.description}
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                ))}
              </div>

              {documentRows.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-lg font-medium mb-2">No documents found</div>
                  <div className="text-sm">Try adjusting your search terms</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}