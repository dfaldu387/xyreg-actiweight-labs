import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FileText } from 'lucide-react';

interface DocumentRichContentViewProps {
  documentName?: string;
  documentReference?: string;
}

interface TemplateSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export function DocumentRichContentView({ documentName, documentReference }: DocumentRichContentViewProps) {
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let templateData: any = null;

        // Try by template_id from DS- reference
        if (documentReference?.startsWith('DS-')) {
          const templateId = documentReference.replace('DS-', '');
          const { data } = await supabase
            .from('document_studio_templates')
            .select('sections, name')
            .eq('template_id', templateId)
            .maybeSingle();
          templateData = data;
        }

        // Fallback: query by name
        if (!templateData && documentName) {
          const { data } = await supabase
            .from('document_studio_templates')
            .select('sections, name')
            .eq('name', documentName)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          templateData = data;
        }

        if (!templateData?.sections) {
          setError('No formatted content available for this document.');
          return;
        }

        // Parse sections
        const rawSections = typeof templateData.sections === 'string'
          ? JSON.parse(templateData.sections)
          : templateData.sections;

        if (Array.isArray(rawSections)) {
          const parsed: TemplateSection[] = rawSections.map((s: any, i: number) => ({
            id: s.id || `section-${i}`,
            title: s.title || `Section ${i + 1}`,
            content: s.content || '',
            order: s.order ?? i,
          }));
          parsed.sort((a, b) => a.order - b.order);
          setSections(parsed);
        } else {
          setError('No formatted content available for this document.');
        }
      } catch (err) {
        console.error('Failed to load template sections:', err);
        setError('Failed to load document content.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [documentName, documentReference]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-40" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {sections.map((section) => (
          <div key={section.id} className="mb-8">
            <h3 className="text-xl font-bold border-b border-border pb-2 mb-4 text-foreground">
              {section.title}
            </h3>
            <div
              className="prose prose-sm max-w-none text-foreground
                [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-border
                [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:text-left [&_th]:font-semibold
                [&_td]:border [&_td]:border-border [&_td]:p-2
                [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
                [&_p]:mb-3 [&_p]:leading-relaxed
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3
                [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2
                [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2
                [&_h4]:text-base [&_h4]:font-medium [&_h4]:mb-2
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                [&_.wi-note]:my-2 [&_.wi-note]:rounded-md [&_.wi-note]:border [&_.wi-note]:border-blue-200 [&_.wi-note]:bg-blue-50 [&_.wi-note]:p-2 [&_.wi-note]:text-sm [&_.wi-note]:text-blue-900
                [&_.wi-caution]:my-2 [&_.wi-caution]:rounded-md [&_.wi-caution]:border [&_.wi-caution]:border-amber-300 [&_.wi-caution]:bg-amber-50 [&_.wi-caution]:p-2 [&_.wi-caution]:text-sm [&_.wi-caution]:text-amber-900
                [&_.wi-note_ul]:list-disc [&_.wi-note_ul]:pl-5 [&_.wi-note_ul]:my-1
                [&_.wi-caution_ul]:list-disc [&_.wi-caution_ul]:pl-5 [&_.wi-caution_ul]:my-1"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
