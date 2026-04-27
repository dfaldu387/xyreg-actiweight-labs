import React from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Copy, Pencil, Unlink } from 'lucide-react';
import { toast } from 'sonner';

export interface LinkHoverData {
  href: string;
  coords: { left: number; top: number };
}

interface LinkHoverCardProps {
  data: LinkHoverData | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onEdit?: (href: string) => void;
  onRemove?: (href: string) => void;
}

function prettyHost(href: string) {
  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
}

export function LinkHoverCard({ data, onMouseEnter, onMouseLeave, onEdit, onRemove }: LinkHoverCardProps) {
  if (!data || typeof document === 'undefined') return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const popup = (
    <div
      className="fixed z-[9999] max-w-[380px] rounded-md border border-gray-200 bg-white shadow-lg px-2 py-1.5 flex items-center gap-1"
      style={{ left: data.coords.left, top: data.coords.top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <a
        href={data.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:underline truncate max-w-[220px] px-1"
        onMouseDown={(e) => e.preventDefault()}
        title={data.href}
      >
        {prettyHost(data.href)}
      </a>
      <div className="w-px h-4 bg-gray-200 mx-0.5" />
      <button
        type="button"
        className="p-1 rounded hover:bg-gray-100 text-gray-600"
        title="Open link"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => window.open(data.href, '_blank', 'noopener,noreferrer')}
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className="p-1 rounded hover:bg-gray-100 text-gray-600"
        title="Copy link"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleCopy}
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
      {onEdit && (
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-100 text-gray-600"
          title="Edit link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onEdit(data.href)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return createPortal(popup, document.body);
}
