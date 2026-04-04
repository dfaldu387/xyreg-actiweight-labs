/**
 * ISO 13485 Clause Popover
 * Shows detailed clause explanations when the user clicks on the help icon in QMS map nodes.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  ChevronRight, 
  X, 
  Shield,
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getClauseContent, type ISO13485ClauseContent } from '@/data/iso13485ClauseContent';

interface ISO13485ClausePopoverProps {
  clauseRef: string; // e.g., "7.3.3", "8.5.2-8.5.3"
  nodeLabel: string;
  children: React.ReactNode;
}

function ClauseCard({ content }: { content: ISO13485ClauseContent }) {
  return (
    <div className="p-4 border rounded-lg bg-white space-y-3">
      {/* Clause Header */}
      <div className="flex items-start gap-3">
        <Badge variant="outline" className="text-xs font-mono bg-purple-50 text-purple-700 border-purple-200 shrink-0">
          {content.clause}
        </Badge>
        <h4 className="font-semibold text-sm text-gray-900 leading-tight">
          {content.title}
        </h4>
      </div>
      
      {/* Summary */}
      <p className="text-xs text-gray-600 leading-relaxed">
        {content.summary}
      </p>
      
      {/* Key Requirements */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Key Requirements</span>
        </div>
        <ul className="space-y-1 pl-5">
          {content.keyRequirements.map((req, idx) => (
            <li key={idx} className="text-[11px] text-gray-600 list-disc">
              {req}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Why It Matters */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Why This Matters</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              {content.whyItMatters}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ISO13485ClausePopover({ clauseRef, nodeLabel, children }: ISO13485ClausePopoverProps) {
  const [open, setOpen] = useState(false);
  const clauseContents = getClauseContent(clauseRef);
  
  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className="cursor-pointer nodrag nopan"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent 
        side="right" 
        align="start"
        sideOffset={12}
        className="w-96 p-0 bg-gray-50 border-gray-300 shadow-xl z-[99999]"
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">ISO 13485:2016</h3>
              <p className="text-[10px] text-gray-500 font-mono">Clause {clauseRef}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Context - What node this applies to */}
        <div className="px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-cyan-600" />
            <span className="text-xs text-cyan-700">
              Applies to: <strong>{nodeLabel}</strong>
            </span>
          </div>
        </div>
        
        {/* Clause Content */}
        <ScrollArea className="h-[350px]">
          <div className="p-4 space-y-4">
            {clauseContents.length > 0 ? (
              clauseContents.map((content) => (
                <ClauseCard key={content.clause} content={content} />
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Detailed content for clause {clauseRef} is not available.</p>
                <p className="text-xs mt-1">Please refer to the official ISO 13485:2016 standard.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
          <p className="text-[10px] text-gray-400 text-center">
            Source: ISO 13485:2016 Medical devices — Quality management systems
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
