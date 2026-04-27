import React from 'react';
import { createPortal } from 'react-dom';
import { Mail, Briefcase } from 'lucide-react';

export interface PersonMentionHoverData {
  userId: string | null;
  name: string;
  email?: string;
  role?: string;
  department?: string | null;
  avatarUrl?: string;
  coords: { left: number; top: number };
}

interface PersonMentionHoverCardProps {
  data: PersonMentionHoverData | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function PersonMentionHoverCard({ data, onMouseEnter, onMouseLeave }: PersonMentionHoverCardProps) {
  if (!data || typeof document === 'undefined') return null;

  const initials = data.name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const popup = (
    <div
      className="fixed z-[9999] w-[300px] rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
      style={{ left: data.coords.left, top: data.coords.top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700 shrink-0 overflow-hidden">
          {data.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            initials || '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{data.name}</div>
          {(data.role || data.department) && (
            <div className="text-xs text-gray-500 truncate">
              {data.department || data.role}
            </div>
          )}
        </div>
      </div>
      {data.email && (
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-600">
          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <a
            href={`mailto:${data.email}`}
            className="truncate hover:underline"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          >
            {data.email}
          </a>
        </div>
      )}
      {data.role && data.department && data.role !== data.department && (
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-600">
          <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{data.role}</span>
        </div>
      )}
    </div>
  );

  return createPortal(popup, document.body);
}
