import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, FileText, List, Table2, Users, AlertTriangle } from 'lucide-react';

interface DigitalTemplatePreviewProps {
  templateData: any;
  templateName: string;
}

export function DigitalTemplatePreview({ templateData, templateName }: DigitalTemplatePreviewProps) {
  if (!templateData) return null;

  const renderSection = (section: any, index: number) => {
    const [isOpen, setIsOpen] = React.useState(index < 2); // Keep first 2 sections open by default

    return (
      <Collapsible key={index} open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 hover:bg-muted/50 rounded">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <div className="flex items-center gap-2 flex-1">
            <h4 className="font-medium text-sm">{section.name}</h4>
            <Badge variant="outline" className="text-xs">
              {section.section_type || 'section'}
            </Badge>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="ml-6 space-y-3">
          {/* Content Preview */}
          {section.content_preview && (
            <div className="bg-muted/30 p-3 rounded text-xs">
              <div className="flex items-center gap-1 mb-1">
                <FileText className="h-3 w-3" />
                <span className="font-medium">Content Preview:</span>
              </div>
              <p className="text-muted-foreground italic">{section.content_preview}</p>
            </div>
          )}

          {/* Subsections */}
          {section.subsections && section.subsections.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <List className="h-3 w-3" />
                <span className="text-xs font-medium">Subsections:</span>
              </div>
              {section.subsections.map((subsection: any, i: number) => (
                <div key={i} className="ml-4 p-2 bg-muted/20 rounded text-xs">
                  <div className="font-medium">{subsection.name}</div>
                  {subsection.content && (
                    <div className="text-muted-foreground">{subsection.content.substring(0, 100)}...</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Fields */}
          {section.fields_identified && section.fields_identified.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium">Fields Identified:</span>
              <div className="grid gap-2">
                {section.fields_identified.map((field: any, i: number) => (
                  <div key={i} className="p-2 bg-background border rounded text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{field.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {field.type}
                      </Badge>
                      {field.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{field.description}</p>
                    {field.example_content && (
                      <div className="mt-1 text-muted-foreground italic">
                        Example: {field.example_content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tables */}
          {section.tables_identified && section.tables_identified.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Table2 className="h-3 w-3" />
                <span className="text-xs font-medium">Tables Found:</span>
              </div>
              {section.tables_identified.map((table: any, i: number) => (
                <div key={i} className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
                  <div className="font-medium">{table.name}</div>
                  <div className="text-muted-foreground">Headers: {table.headers?.join(', ')}</div>
                  {table.sample_data && (
                    <div className="text-muted-foreground italic mt-1">Sample: {table.sample_data}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Lists */}
          {section.lists_identified && section.lists_identified.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <List className="h-3 w-3" />
                <span className="text-xs font-medium">Lists Found:</span>
              </div>
              {section.lists_identified.map((list: any, i: number) => (
                <div key={i} className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-xs">
                  <div className="font-medium">{list.type} list - {list.purpose}</div>
                  <ul className="ml-4 mt-1 space-y-1">
                    {list.items?.slice(0, 3).map((item: string, j: number) => (
                      <li key={j} className="text-muted-foreground">• {item}</li>
                    ))}
                    {list.items?.length > 3 && (
                      <li className="text-muted-foreground">... and {list.items.length - 3} more items</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Template Preview: {templateName}</CardTitle>
        {templateData.structure?.document_overview && (
          <p className="text-xs text-muted-foreground">{templateData.structure.document_overview}</p>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {/* Content Analysis Summary */}
            {templateData.content_analysis && (
              <div className="p-3 bg-muted/30 rounded space-y-2">
                <h5 className="text-xs font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Document Analysis Summary
                </h5>
                
                {templateData.content_analysis.key_concepts?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Key Concepts: </span>
                    {templateData.content_analysis.key_concepts.map((concept: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs mr-1">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                )}

                {templateData.content_analysis.stakeholders_mentioned?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="text-xs font-medium">Stakeholders: </span>
                    <span className="text-xs text-muted-foreground">
                      {templateData.content_analysis.stakeholders_mentioned.join(', ')}
                    </span>
                  </div>
                )}

                {templateData.content_analysis.procedures_identified?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Procedures Found:</span>
                    {templateData.content_analysis.procedures_identified.slice(0, 2).map((proc: string, i: number) => (
                      <div key={i} className="text-xs text-muted-foreground ml-2">• {proc}</div>
                    ))}
                  </div>
                )}

                {templateData.suggestions?.compliance_standards?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Standards Referenced: </span>
                    {templateData.suggestions.compliance_standards.map((std: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs mr-1">
                        {std}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Sections */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold">Template Structure</h5>
              {templateData.structure?.sections?.map(renderSection)}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}