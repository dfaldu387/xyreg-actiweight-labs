
import React from 'react';
import { MessageCircle } from 'lucide-react';

interface CommentBubbleProps {
  number: number;
  x: number;
  y: number;
  hasComments: boolean;
  onClick: () => void;
}

export function CommentBubble({ number, x, y, hasComments, onClick }: CommentBubbleProps) {
  return (
    <div
      className={`absolute z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-110 ${
        hasComments 
          ? 'bg-blue-500 text-white border-2 border-white' 
          : 'bg-gray-400 text-white border-2 border-white'
      }`}
      style={{
        left: x - 12,
        top: y - 12,
      }}
      onClick={onClick}
    >
      {hasComments ? (
        <MessageCircle className="h-3 w-3" />
      ) : (
        <span>{number}</span>
      )}
    </div>
  );
}
