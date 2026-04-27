import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, GripVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface OutlineHeading {
  id: string;
  text: string;
  level: number;
}

interface DocumentOutlinePanelProps {
  editorContainerRef: React.RefObject<HTMLDivElement | null>;
  refreshTrigger?: number;
  className?: string;
}

export function DocumentOutlinePanel({
  editorContainerRef,
  refreshTrigger = 0,
  className,
}: DocumentOutlinePanelProps) {
  const [headings, setHeadings] = useState<OutlineHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [width, setWidth] = useState(300);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResizingRef = useRef(false);

  // --- Resize logic ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(160, Math.min(400, startWidth + (ev.clientX - startX)));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width]);

  // --- Heading parsing ---
  const parseHeadings = useCallback(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const parsed: OutlineHeading[] = [];

    elements.forEach((el, index) => {
      const text = el.textContent?.trim();
      if (!text) return;
      el.id = `outline-heading-${index}`;
      const level = parseInt(el.tagName.charAt(1), 10);
      parsed.push({ id: el.id, text, level });
    });

    setHeadings(prev => {
      const prevKey = prev.map(h => `${h.id}:${h.text}:${h.level}`).join('|');
      const newKey = parsed.map(h => `${h.id}:${h.text}:${h.level}`).join('|');
      return prevKey === newKey ? prev : parsed;
    });
  }, [editorContainerRef]);

  const debouncedParse = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(parseHeadings, 300);
  }, [parseHeadings]);

  useEffect(() => {
    const timer = setTimeout(parseHeadings, 300);
    return () => clearTimeout(timer);
  }, [parseHeadings, refreshTrigger]);

  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;
    const observer = new MutationObserver(debouncedParse);
    observer.observe(container, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editorContainerRef, debouncedParse]);

  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container || headings.length === 0) return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
          break;
        }
      }
    };

    const scrollParent = document.getElementById('draft-editor-scroll-container');
    const observer = new IntersectionObserver(observerCallback, {
      root: scrollParent || null,
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0,
    });

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings, editorContainerRef]);

  const handleClick = (id: string) => {
    let el = document.getElementById(id);
    if (!el) {
      const container = editorContainerRef.current;
      if (!container) return;
      const allHeadings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      allHeadings.forEach((h, i) => {
        if (!h.id) h.id = `outline-heading-${i}`;
        if (h.id === id) el = h as HTMLElement;
      });
    }
    if (!el) return;

    const scrollParent = document.getElementById('draft-editor-scroll-container');
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - parentRect.top + scrollParent.scrollTop - 20;
      scrollParent.scrollTo({ top: offset, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveId(id);
  };

  // Safe fallback — parent is responsible for not opening the panel when empty.
  if (headings.length === 0) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <div
      className={cn('bg-background flex border-r flex-col shrink-0 relative', className)}
      style={{ width: `${width}px`, transition: 'width 200ms ease' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>Document Outline</span>
        </div>
      </div>

      {/* Outline items */}
      <ScrollArea className="flex-1">
        <nav className="py-1 px-1">
          {headings.map((heading) => {
            const depth = heading.level - minLevel;
            const isActive = heading.id === activeId;
            const paddingLeft = 10 + depth * 16;

            return (
              <button
                key={heading.id}
                onClick={() => handleClick(heading.id)}
                className={cn(
                  'w-full text-left py-1 rounded-sm text-[13px] leading-5 truncate transition-colors block',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                )}
                style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '8px' }}
                title={heading.text}
              >
                {heading.text}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Resize handle on right edge with grip icon */}
      <div
        className="absolute top-0 -right-[8px] w-4 h-full cursor-col-resize z-10 group flex items-center justify-center"
        onMouseDown={handleMouseDown}
      >
        <div className="flex h-6 w-4 items-center justify-center rounded-sm border bg-border shadow-sm">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
