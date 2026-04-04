
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Highlighter, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HighlightingToolbarProps {
  isHighlighting: boolean;
  onToggleHighlighting: () => void;
  onApprove?: () => void;
  onRequestChanges?: () => void;
  onReject?: () => void;
  showHideResolved: boolean;
  onToggleResolved: () => void;
  commentCount?: number;
  resolvedCount?: number;
  canReview?: boolean;
}

export function HighlightingToolbar({
  isHighlighting,
  onToggleHighlighting,
  onApprove,
  onRequestChanges,
  onReject,
  showHideResolved,
  onToggleResolved,
  commentCount = 0,
  resolvedCount = 0,
  canReview = false
}: HighlightingToolbarProps) {
  return (
    <TooltipProvider>
      <div className="border-b bg-background/95 backdrop-blur">
        {/* Highlighting Status */}
        {isHighlighting && (
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <Highlighter className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">
                Highlighting Mode Active - Select text to highlight
              </span>
            </div>
          </div>
        )}

        {/* Main Toolbar */}
        <div className="flex items-center justify-between p-3">
          {/* Left side - Highlighting and Comment tools */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isHighlighting ? "default" : "outline"}
                  size="sm"
                  onClick={onToggleHighlighting}
                  className="flex items-center gap-2"
                >
                  <Highlighter className="h-4 w-4" />
                  {isHighlighting ? 'Exit Highlight Mode' : 'Highlight Text'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isHighlighting 
                  ? 'Click to stop highlighting mode' 
                  : 'Click to start highlighting text'
                }
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2 ml-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
              </div>
              
              {resolvedCount > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>{resolvedCount} resolved</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Review actions and visibility controls */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleResolved}
                  className="flex items-center gap-1"
                >
                  {showHideResolved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="hidden sm:inline">
                    {showHideResolved ? 'Hide' : 'Show'} Resolved
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showHideResolved ? 'Hide resolved comments' : 'Show resolved comments'}
              </TooltipContent>
            </Tooltip>

            {canReview && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onApprove}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Approve</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Approve this document</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onRequestChanges}
                      size="sm"
                      variant="outline"
                      className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Changes</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Request changes to this document</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onReject}
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Reject</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reject this document</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
