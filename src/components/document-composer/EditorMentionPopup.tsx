import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FileText, User, Calendar, ChevronDown, Square, Blocks, FileStack, ClipboardList, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MentionItemType = 'document' | 'person' | 'smart-chip' | 'building-block';

export interface MentionItem {
  /** Unique key across all sections */
  key: string;
  type: MentionItemType;
  label: string;
  /** Secondary text shown on the right */
  hint?: string;
  /** Small icon name resolved in the component. Optional — defaults per type. */
  icon?: 'file' | 'user' | 'date' | 'dropdown' | 'placeholder' | 'blocks' | 'meeting' | 'email' | 'decision';
  /** When true, the row is rendered greyed-out and is not selectable. */
  disabled?: boolean;
  /** Arbitrary payload passed back to onSelect. */
  payload?: any;
  /** For persons: show avatar instead of icon. */
  avatarUrl?: string;
  avatarInitials?: string;
}

export interface MentionSection {
  id: 'documents' | 'people' | 'smart-chips' | 'building-blocks';
  title: string;
  items: MentionItem[];
}

interface EditorMentionPopupProps {
  sections: MentionSection[];
  /** Flat list of selectable items (disabled ones excluded), in display order. */
  selectableItems: MentionItem[];
  query: string;
  /** Index into `selectableItems`. */
  highlight: number;
  coords: { left: number; top: number } | null;
  onHover: (idx: number) => void;
  onSelect: (item: MentionItem) => void;
}

const ICONS = {
  file: FileText,
  user: User,
  date: Calendar,
  dropdown: ChevronDown,
  placeholder: Square,
  blocks: Blocks,
  meeting: FileStack,
  email: Mail,
  decision: ClipboardList,
} as const;

function defaultIconFor(item: MentionItem): keyof typeof ICONS {
  if (item.icon) return item.icon;
  if (item.type === 'document') return 'file';
  if (item.type === 'person') return 'user';
  if (item.type === 'building-block') return 'blocks';
  return 'placeholder';
}

/**
 * Google-docs-style floating picker shown next to the caret when the user types
 * `@` in the document body. Renders categorized sections (Documents, People,
 * Smart Chips, Building Blocks) with cross-section keyboard navigation.
 */
export function EditorMentionPopup({
  sections,
  selectableItems,
  query,
  highlight,
  coords,
  onHover,
  onSelect,
}: EditorMentionPopupProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-mention-idx="${highlight}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  if (!coords || typeof document === 'undefined') return null;
  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
  if (totalItems === 0) return null;

  const highlightedKey = selectableItems[highlight]?.key;

  const popup = (
    <div
      className="fixed z-[9999] w-[340px] rounded-lg border bg-background shadow-lg overflow-hidden"
      style={{ left: coords.left, top: coords.top }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div ref={containerRef} className="max-h-[340px] overflow-y-auto py-1">
        {sections.map((section) => (
          <div key={section.id} className="pb-1">
            <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = ICONS[defaultIconFor(item)];
              const isHighlighted = !item.disabled && item.key === highlightedKey;
              const selectableIdx = selectableItems.findIndex((s) => s.key === item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  data-mention-idx={selectableIdx >= 0 ? selectableIdx : undefined}
                  disabled={item.disabled}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    if (!item.disabled) onSelect(item);
                  }}
                  onMouseEnter={() => {
                    if (!item.disabled && selectableIdx >= 0) onHover(selectableIdx);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors',
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : isHighlighted
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted/60',
                  )}
                >
                  {item.type === 'person' && (item.avatarUrl || item.avatarInitials) ? (
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-foreground/80 shrink-0 overflow-hidden">
                      {item.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        item.avatarInitials
                      )}
                    </span>
                  ) : (
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="flex-1 min-w-0 leading-tight">
                    <span className="block text-xs truncate">{item.label}</span>
                    {item.hint && (
                      <span className="block text-[10px] text-muted-foreground truncate">
                        {item.hint}
                      </span>
                    )}
                  </span>
                  {item.disabled && (
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground shrink-0">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}
