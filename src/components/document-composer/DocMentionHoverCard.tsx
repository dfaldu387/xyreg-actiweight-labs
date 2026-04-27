import React from 'react';
import { createPortal } from 'react-dom';
import { FileText, User, History, ExternalLink } from 'lucide-react';

export interface DocMentionHoverData {
  docId: string | null;
  docName: string;
  ownerName?: string;
  coords: { left: number; top: number };
}

interface DocMentionHoverCardProps {
  data: DocMentionHoverData | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onOpen?: (docName: string) => void;
}

/**
 * Google-Docs-style hover preview for a document mention chip.
 * Shows the doc icon + name, owner line, and a "no changes" stamp.
 * The card renders via portal so it escapes the editor's overflow hidden.
 */
export function DocMentionHoverCard({ data, onMouseEnter, onMouseLeave, onOpen }: DocMentionHoverCardProps) {
  if (!data || typeof document === 'undefined') return null;

  const handleOpen = () => onOpen?.(data.docName);

  const popup = (
    <div
      className="fixed z-[9999] w-[340px] rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
      style={{ left: data.coords.left, top: data.coords.top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header — doc icon + name + open-in-new icon. Clicking the name or
          the arrow icon navigates to the document. */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleOpen}
          className="text-sm font-semibold text-blue-700 truncate flex-1 min-w-0 text-left hover:underline"
        >
          {data.docName}
        </button>
        <button
          type="button"
          className="text-gray-400 hover:text-blue-600 transition-colors"
          title="Open document"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleOpen}
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Body — metadata rows */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">
            <span className="text-gray-900">{data.ownerName || 'Unknown'}</span> is the owner
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <History className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">No changes since you last viewed this file</span>
        </div>
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}
