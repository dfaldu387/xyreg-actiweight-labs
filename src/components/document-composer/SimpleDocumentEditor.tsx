import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Copy, Save } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentControlTable } from './DocumentControlTable';

interface DocumentSection {
  id: string;
  title: string;
  level: number;
  content: string;
  isEdited: boolean;
}

interface SimpleDocumentEditorProps {
  template?: any;
  onContentUpdate?: (sectionId: string, content: string) => void;
  onExport?: (format: 'docx' | 'pdf') => void;
  onDocumentControlChange?: (controlData: any) => void;
}

export function SimpleDocumentEditor({ 
  template, 
  onContentUpdate, 
  onExport,
  onDocumentControlChange
}: SimpleDocumentEditorProps) {
  const [sections, setSections] = useState<DocumentSection[]>(() => {
    if (!template?.sections) return [];
    
    const extractedSections: DocumentSection[] = [];
    
    template.sections.forEach((section: any, sectionIndex: number) => {
      // Add main section title
      extractedSections.push({
        id: `section-${sectionIndex}`,
        title: section.title || `Section ${sectionIndex + 1}`,
        level: 1,
        content: '',
        isEdited: false
      });
      
      // Add content items as subsections
      if (section.content) {
        section.content.forEach((content: any, contentIndex: number) => {
          if (content.type === 'heading' || content.type === 'text') {
            extractedSections.push({
              id: `section-${sectionIndex}-content-${contentIndex}`,
              title: content.content || content.text || `Subsection ${contentIndex + 1}`,
              level: content.type === 'heading' ? 2 : 3,
              content: '',
              isEdited: false
            });
          }
        });
      }
    });
    
    return extractedSections;
  });

  const handleContentChange = (sectionId: string, newContent: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, content: newContent, isEdited: true }
          : section
      )
    );
    onContentUpdate?.(sectionId, newContent);
  };

  const handleCopyAll = () => {
    const allContent = sections
      .filter(section => section.content.trim())
      .map(section => {
        const indent = '  '.repeat(section.level - 1);
        const title = `${indent}${section.title}`;
        const content = section.content.split('\n').map(line => `${indent}${line}`).join('\n');
        return `${title}\n${content}`;
      })
      .join('\n\n');
    
    navigator.clipboard.writeText(allContent);
    toast.success('All content copied to clipboard');
  };

  const handleExportWord = () => {
    onExport?.('docx');
    toast.success('Exporting to Word format...');
  };

  const getTotalWords = () => {
    return sections.reduce((total, section) => {
      return total + section.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
  };

  const getEditedSectionsCount = () => {
    return sections.filter(section => section.isEdited).length;
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      {/* <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Simple Document Editor
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{getEditedSectionsCount()}/{sections.length} sections</Badge>
              <Badge variant="outline">{getTotalWords()} words</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button onClick={handleCopyAll} variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-1" />
              Copy All
            </Button>
            <Button onClick={handleExportWord} size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export to Word
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Document Control Section */}
      <DocumentControlTable
        documentId={template?.id}
        onControlDataChange={onDocumentControlChange}
        className="mb-6"
      />

      {/* Editor Sections */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-6">
            {sections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <div className="text-lg font-medium mb-2">No Template Loaded</div>
                <div className="text-sm">Generate a document to start editing content</div>
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`font-semibold ${ 
                        section.level === 1 ? 'text-xl' : 
                        section.level === 2 ? 'text-lg' : 'text-base'
                      }`}
                      style={{ marginLeft: `${(section.level - 1) * 16}px` }}
                    >
                      {section.title}
                    </div>
                    {section.isEdited && (
                      <Badge variant="secondary" className="text-xs">
                        Edited
                      </Badge>
                    )}
                  </div>
                  
                  <div style={{ marginLeft: `${(section.level - 1) * 16}px` }}>
                    <Textarea
                      value={section.content}
                      onChange={(e) => handleContentChange(section.id, e.target.value)}
                      placeholder={`Add content for ${section.title}...`}
                      className="min-h-[100px] text-sm"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}