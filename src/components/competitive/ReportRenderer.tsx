import React from 'react';
import { Download, Save, Share, Printer, FileText, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReportRendererProps {
  content: string;
  title: string;
  metadata?: any;
  onSave?: () => void;
  onExport?: (format: 'pdf' | 'docx' | 'html') => void;
  className?: string;
}

export function ReportRenderer({ 
  content, 
  title, 
  metadata, 
  onSave, 
  onExport, 
  className 
}: ReportRendererProps) {
  const parseContent = (text: string) => {
    const sections: JSX.Element[] = [];
    let sectionIndex = 0;

    // Clean up the content - remove markdown artifacts
    const cleanedContent = text
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove italic markdown
      .replace(/#{1,6}\s*/g, '') // Remove header markdown
      .trim();

    // Split by sections (numbered or named sections)
    const sectionParts = cleanedContent.split(/\n(?=\d+\.\s+[A-Z][^:]+:|[A-Z][^:\n]+:\s*\n)/);

    sectionParts.forEach((section, index) => {
      if (!section.trim()) return;

      const lines = section.trim().split('\n');
      const titleLine = lines[0];
      const content = lines.slice(1).join('\n');

      // Extract section title
      let sectionTitle = titleLine.replace(/^\d+\.\s*/, '').replace(/:$/, '').trim();
      
      // Handle SWOT Analysis specially
      if (sectionTitle.toLowerCase().includes('swot') || content.includes('STRENGTHS:')) {
        sections.push(renderSWOTSection(content, sectionIndex++));
        return;
      }

      // Regular section
      sections.push(
        <div key={sectionIndex++} className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 border-b pb-2">
            {sectionTitle}
          </h3>
          <div className="space-y-3">
            {renderSectionContent(content)}
          </div>
        </div>
      );
    });

    return sections;
  };

  const renderSWOTSection = (content: string, key: number) => {
    // Parse SWOT content
    const swotData = {
      strengths: [] as string[],
      weaknesses: [] as string[],
      opportunities: [] as string[],
      threats: [] as string[]
    };

    // Try to parse structured SWOT format
    if (content.includes('STRENGTHS:')) {
      const parts = content.split(/(?=STRENGTHS:|WEAKNESSES:|OPPORTUNITIES:|THREATS:)/);
      
      parts.forEach(part => {
        if (part.startsWith('STRENGTHS:')) {
          swotData.strengths = extractSWOTItems(part.replace('STRENGTHS:', ''));
        } else if (part.startsWith('WEAKNESSES:')) {
          swotData.weaknesses = extractSWOTItems(part.replace('WEAKNESSES:', ''));
        } else if (part.startsWith('OPPORTUNITIES:')) {
          swotData.opportunities = extractSWOTItems(part.replace('OPPORTUNITIES:', ''));
        } else if (part.startsWith('THREATS:')) {
          swotData.threats = extractSWOTItems(part.replace('THREATS:', ''));
        }
      });
    } else {
      // Fallback: try to extract from bullet points
      const lines = content.split('\n').filter(line => line.trim());
      let currentCategory = '';
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().includes('strength')) currentCategory = 'strengths';
        else if (trimmed.toLowerCase().includes('weakness')) currentCategory = 'weaknesses';
        else if (trimmed.toLowerCase().includes('opportunit')) currentCategory = 'opportunities';
        else if (trimmed.toLowerCase().includes('threat')) currentCategory = 'threats';
        else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const item = trimmed.replace(/^[-•]\s*/, '');
          if (currentCategory && item) {
            swotData[currentCategory as keyof typeof swotData].push(item);
          }
        }
      });
    }

    return (
      <div key={key} className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 border-b pb-2">
          SWOT Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">Strengths</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {swotData.strengths.map((item, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-700">Weaknesses</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {swotData.weaknesses.map((item, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700">Opportunities</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {swotData.opportunities.map((item, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700">Threats</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {swotData.threats.map((item, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const extractSWOTItems = (text: string): string[] => {
    return text
      .split(/[|\n]/)
      .map(item => item.trim())
      .filter(item => item && !item.match(/^(STRENGTHS|WEAKNESSES|OPPORTUNITIES|THREATS):?$/i));
  };

  const renderSectionContent = (content: string) => {
    const lines = content.trim().split('\n');
    const elements: JSX.Element[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const text = trimmed.replace(/^[-•]\s*/, '');
        elements.push(
          <div key={index} className="flex items-start gap-3 text-sm">
            <span className="text-primary mt-1 font-bold">•</span>
            <span className="text-foreground leading-relaxed">{text}</span>
          </div>
        );
      } else {
        // Regular paragraph
        elements.push(
          <p key={index} className="text-sm text-muted-foreground leading-relaxed">
            {trimmed}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <div className={className}>
      {/* Report Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {metadata && (
            <p className="text-sm text-muted-foreground mt-1">
              Generated {new Date(metadata.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onSave && (
            <Button variant="outline" size="sm" onClick={onSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Report
            </Button>
          )}
          
          {onExport && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onExport('pdf')}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export PDF
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onExport('docx')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Export Word
              </Button>
            </>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {parseContent(content)}
      </div>
    </div>
  );
}