import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    // Split content into lines for better processing
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) {
        elements.push(<div key={currentIndex++} className="h-2" />);
        continue;
      }

      // Headers (##, ###, etc.)
      if (line.match(/^#{1,6}\s+(.+)/)) {
        const level = line.match(/^(#{1,6})/)?.[1].length || 1;
        const title = line.replace(/^#{1,6}\s+/, '');
        const headerLevel = Math.min(level + 2, 6);
        
        // Create the appropriate header element
        const HeaderComponent = ({ children }: { children: React.ReactNode }) => {
          const className = `font-heading font-semibold text-slate-800 mb-3 mt-4 ${
            level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base'
          }`;
          
          switch (headerLevel) {
            case 3: return <h3 className={className}>{children}</h3>;
            case 4: return <h4 className={className}>{children}</h4>;
            case 5: return <h5 className={className}>{children}</h5>;
            case 6: return <h6 className={className}>{children}</h6>;
            default: return <h3 className={className}>{children}</h3>;
          }
        };
        
        elements.push(
          <HeaderComponent key={currentIndex++}>
            {title}
          </HeaderComponent>
        );
        continue;
      }

      // Bullet points (- or *)
      if (line.match(/^[-*]\s+(.+)/)) {
        const content = line.replace(/^[-*]\s+/, '');
        elements.push(
          <div key={currentIndex++} className="flex items-start gap-2 mb-2 ml-4">
            <span className="text-help-primary font-bold text-sm mt-1">•</span>
            <span className="text-slate-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
        continue;
      }

      // Numbered lists (1. 2. etc.)
      if (line.match(/^\d+\.\s+(.+)/)) {
        const match = line.match(/^(\d+)\.\s+(.+)/);
        const number = match?.[1];
        const content = match?.[2];
        elements.push(
          <div key={currentIndex++} className="flex items-start gap-3 mb-2 ml-4">
            <span className="text-help-primary font-semibold text-sm mt-1 min-w-[20px]">{number}.</span>
            <span className="text-slate-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: content || '' }} />
          </div>
        );
        continue;
      }

      // Code blocks (`code`)
      let processedLine = line.replace(/`(.+?)`/g, '<code class="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-help-primary">$1</code>');

      // Regular paragraphs
      elements.push(
        <p 
          key={currentIndex++} 
          className="text-slate-700 text-sm leading-relaxed mb-3"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    }

    return elements;
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
}
