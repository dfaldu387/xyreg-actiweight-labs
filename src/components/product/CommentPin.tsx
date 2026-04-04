
import React from 'react';
import { MessageCircle, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommentPinProps {
  x: number;
  y: number;
  isTemporary?: boolean;
  isInternal?: boolean;
  showRemoveButton?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
  commentCount?: number;
}

export function CommentPin({
  x,
  y,
  isTemporary = false,
  isInternal = false,
  showRemoveButton = false,
  onClick,
  onRemove,
  onMouseEnter,
  onMouseLeave,
  className = '',
  commentCount = 1
}: CommentPinProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <div
      className={`absolute z-10 ${className}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative">
        <Button
          size="sm"
          variant={isTemporary ? "secondary" : "default"}
          className={`
            w-8 h-8 rounded-full p-0 shadow-lg border-2 transition-all duration-200
            hover:scale-110 active:scale-95
            ${isTemporary 
              ? 'bg-blue-100 border-blue-300 hover:bg-blue-200' 
              : isInternal 
                ? 'bg-orange-500 border-orange-600 hover:bg-orange-600' 
                : 'bg-blue-500 border-blue-600 hover:bg-blue-600'
            }
            ${className.includes('ring') ? '' : 'hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50'}
          `}
          onClick={handleClick}
        >
          {isInternal && <Lock className="h-3 w-3 text-white" />}
          {!isInternal && <MessageCircle className="h-3 w-3 text-white" />}
        </Button>
        
        {/* Comment count badge */}
        {!isTemporary && commentCount > 1 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {commentCount > 9 ? '9+' : commentCount}
          </div>
        )}
        
        {/* Remove button for temporary pins */}
        {showRemoveButton && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full p-0"
            onClick={handleRemove}
          >
            <X className="h-2 w-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
