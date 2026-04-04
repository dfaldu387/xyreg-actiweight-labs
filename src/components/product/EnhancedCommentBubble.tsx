import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  MoreHorizontal,
  Reply,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnhancedCommentBubbleProps {
  x: number;
  y: number;
  commentCount: number;
  commentPreview?: string;
  commentStatus: 'open' | 'resolved' | 'pending';
  commentPriority: 'low' | 'normal' | 'high' | 'urgent';
  reviewerGroupName?: string;
  reviewerGroupColor?: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt: string;
  isInternal?: boolean;
  onClick?: () => void;
  onResolve?: () => void;
  onReply?: () => void;
  className?: string;
}

const statusConfig = {
  open: {
    icon: MessageCircle,
    color: 'border-blue-500 bg-blue-50',
    badgeColor: 'bg-blue-500'
  },
  resolved: {
    icon: CheckCircle,
    color: 'border-green-500 bg-green-50',
    badgeColor: 'bg-green-500'
  },
  pending: {
    icon: Clock,
    color: 'border-orange-500 bg-orange-50',
    badgeColor: 'bg-orange-500'
  }
};

const priorityConfig = {
  low: { color: 'text-gray-500', indicator: '' },
  normal: { color: 'text-blue-500', indicator: '' },
  high: { color: 'text-orange-500', indicator: '!' },
  urgent: { color: 'text-red-500', indicator: '!!' }
};

export function EnhancedCommentBubble({
  x,
  y,
  commentCount,
  commentPreview,
  commentStatus,
  commentPriority,
  reviewerGroupName,
  reviewerGroupColor,
  authorName,
  authorAvatar,
  createdAt,
  isInternal = false,
  onClick,
  onResolve,
  onReply,
  className = ''
}: EnhancedCommentBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const statusStyle = statusConfig[commentStatus];
  const priorityStyle = priorityConfig[commentPriority];
  const StatusIcon = statusStyle.icon;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div 
      className={`absolute z-20 ${className}`}
      style={{ left: x, top: y }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Comment Bubble */}
      <div 
        className={`
          relative cursor-pointer transition-all duration-200 transform
          ${statusStyle.color} border-2 rounded-lg shadow-lg
          ${isHovered ? 'scale-110 shadow-xl' : 'scale-100'}
          ${commentStatus === 'resolved' ? 'opacity-75' : 'opacity-100'}
        `}
        onClick={onClick}
      >
        {/* Comment Count Badge */}
        <div className={`
          absolute -top-2 -right-2 w-6 h-6 ${statusStyle.badgeColor} 
          text-white text-xs font-bold rounded-full flex items-center justify-center
        `}>
          {commentCount}
        </div>

        {/* Priority Indicator */}
        {commentPriority !== 'normal' && (
          <div className={`
            absolute -top-1 -left-1 w-4 h-4 ${priorityStyle.color} 
            font-bold text-xs flex items-center justify-center
          `}>
            {priorityStyle.indicator}
          </div>
        )}

        {/* Main Bubble Content */}
        <div className="p-3 min-w-[200px] max-w-[300px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <span className="text-xs font-medium capitalize">{commentStatus}</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onReply && (
                  <DropdownMenuItem onClick={onReply}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                {onResolve && commentStatus === 'open' && (
                  <DropdownMenuItem onClick={onResolve}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark Resolved
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback className="text-xs">
                {authorName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{authorName}</p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(createdAt)}</p>
            </div>
          </div>

          {/* Comment Preview */}
          {commentPreview && (
            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
              {commentPreview}
            </p>
          )}

          {/* Reviewer Group Badge */}
          {reviewerGroupName && (
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ 
                backgroundColor: reviewerGroupColor + '20', 
                color: reviewerGroupColor 
              }}
            >
              {reviewerGroupName}
            </Badge>
          )}

          {/* Internal Badge */}
          {isInternal && (
            <Badge variant="outline" className="text-xs ml-1">
              Internal
            </Badge>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute top-full left-0 mt-2 flex gap-1">
          {onReply && (
            <Button size="sm" variant="outline" onClick={onReply}>
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
          {onResolve && commentStatus === 'open' && (
            <Button size="sm" variant="outline" onClick={onResolve}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolve
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
