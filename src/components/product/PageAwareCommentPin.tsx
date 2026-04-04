
import React from 'react';
import { MessageCircle, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PageAwareCommentPinProps {
  x: number;
  y: number;
  pageNumber: number;
  commentCount: number;
  commentPreview?: string;
  commentStatus?: 'open' | 'resolved' | 'pending';
  commentPriority?: 'low' | 'normal' | 'high' | 'urgent';
  reviewerGroupName?: string;
  authorName?: string;
  createdAt: string;
  isInternal: boolean;
  hasTextContext?: boolean;
  selectedText?: string;
  onClick: () => void;
}

export function PageAwareCommentPin({
  x,
  y,
  pageNumber,
  commentCount,
  commentPreview,
  commentStatus = 'open',
  commentPriority = 'normal',
  reviewerGroupName,
  authorName,
  createdAt,
  isInternal,
  hasTextContext = false,
  selectedText,
  onClick
}: PageAwareCommentPinProps) {
  const getStatusColor = () => {
    switch (commentStatus) {
      case 'resolved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityBorder = () => {
    switch (commentPriority) {
      case 'urgent': return 'border-red-500 border-2';
      case 'high': return 'border-orange-500 border-2';
      case 'low': return 'border-gray-300';
      default: return 'border-gray-400';
    }
  };

  return (
    <div
      className="absolute z-30 group"
      style={{ 
        left: x - 12, 
        top: y - 12,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Main comment pin */}
      <div
        onClick={onClick}
        className={`
          relative w-8 h-8 rounded-full cursor-pointer transform transition-all duration-200
          hover:scale-110 hover:shadow-lg
          ${getStatusColor()} ${getPriorityBorder()}
          flex items-center justify-center
        `}
      >
        <MessageCircle className="h-4 w-4 text-white" />
        
        {/* Comment count badge */}
        {commentCount > 1 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {commentCount}
          </div>
        )}

        {/* Text context indicator */}
        {hasTextContext && (
          <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full w-3 h-3 flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        )}
      </div>

      {/* Page number indicator */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
        <Badge variant="secondary" className="text-xs px-1 py-0">
          Page {pageNumber}
        </Badge>
      </div>

      {/* Hover tooltip */}
      <div className="absolute left-full ml-2 top-0 min-w-64 max-w-80 bg-white border rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isInternal ? "default" : "secondary"} className="text-xs">
                {isInternal ? "Internal" : "External"}
              </Badge>
              {reviewerGroupName && (
                <Badge variant="outline" className="text-xs">
                  {reviewerGroupName}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Page {pageNumber}
            </span>
          </div>

          {/* Selected text context */}
          {selectedText && (
            <div className="bg-purple-50 border border-purple-200 rounded p-2">
              <div className="text-xs text-purple-600 font-medium mb-1">Selected Text:</div>
              <div className="text-xs text-purple-800 italic">
                "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
              </div>
            </div>
          )}

          {/* Comment preview */}
          {commentPreview && (
            <div className="text-sm text-gray-700">
              {commentPreview.length > 150 ? commentPreview.substring(0, 150) + '...' : commentPreview}
            </div>
          )}

          {/* Meta info */}
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>{authorName}</span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>

          {/* Status and priority indicators */}
          <div className="flex items-center gap-2">
            <Badge 
              variant={commentStatus === 'resolved' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {commentStatus.charAt(0).toUpperCase() + commentStatus.slice(1)}
            </Badge>
            {commentPriority !== 'normal' && (
              <Badge 
                variant={commentPriority === 'urgent' || commentPriority === 'high' ? 'destructive' : 'outline'}
                className="text-xs"
              >
                {commentPriority.charAt(0).toUpperCase() + commentPriority.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
