import React from 'react';
// @ts-ignore - reactflow type mismatch
import { Handle, Position } from 'reactflow';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArchitectureNodeProps {
  data: {
    title: string;
    subtitle?: string;
    info?: string;
    nodeType?: 'group' | 'product';
    onDelete?: () => void;
  };
}

export function ArchitectureNodeComponent({ data }: ArchitectureNodeProps) {
  // Handles use CSS-only visibility control to avoid re-renders
  const handleStyle = {
    width: 8,
    height: 8,
    background: 'hsl(var(--primary))',
    border: '2px solid white',
  };

  return (
    <div className="relative group/node bg-background border-2 border-border rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* TOP HANDLES */}
      <Handle 
        type="target"
        position={Position.Top} 
        id="top-target" 
        style={handleStyle}
        className="opacity-0 group-hover/node:opacity-100 pointer-events-none group-hover/node:pointer-events-auto"
        isConnectable={true}
      />
      <Handle 
        type="source"
        position={Position.Top} 
        id="top-source" 
        style={handleStyle}
        className="opacity-0 group-hover/node:opacity-100 pointer-events-none group-hover/node:pointer-events-auto"
        isConnectable={true}
      />
      
      {/* LEFT HANDLES */}
      <Handle 
        type="target"
        position={Position.Left} 
        id="left-target" 
        style={handleStyle}
        className="opacity-0 group-hover/node:opacity-100 pointer-events-none group-hover/node:pointer-events-auto"
        isConnectable={true}
      />
      <Handle 
        type="source"
        position={Position.Left} 
        id="left-source" 
        style={handleStyle}
        className="opacity-0 group-hover/node:opacity-100 pointer-events-none group-hover/node:pointer-events-auto"
        isConnectable={true}
      />
      
      {/* Delete button */}
      {data.onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.();
          }}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover/node:opacity-100 transition-opacity hover:bg-destructive/90 z-10"
          title="Remove from canvas"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <div className="px-4 py-3">
        <div className="font-semibold text-sm">{data.title}</div>
        {data.subtitle && (
          <div className="text-xs text-muted-foreground mt-1">
            {data.subtitle}
          </div>
        )}
        {data.info && (
          <div className={`text-xs mt-1 ${
            data.nodeType === 'product' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-muted-foreground'
          }`}>
            {data.info}
          </div>
        )}
      </div>
      
      {/* RIGHT HANDLES */}
      <Handle 
        type="target"
        position={Position.Right} 
        id="right-target" 
        style={handleStyle}
        className="opacity-0 group-hover/node:opacity-100 pointer-events-none group-hover/node:pointer-events-auto"
        isConnectable={true}
      />
      <Handle 
        type="source"
        position={Position.Right} 
        id="right-source" 
        style={handleStyle}
        className="opacity-0 group-hover/node:opacity-100 pointer-events-none group-hover/node:pointer-events-auto"
        isConnectable={true}
      />
      
      {/* BOTTOM HANDLES */}
      <Handle 
        type="target"
        position={Position.Bottom} 
        id="bottom-target" 
        style={handleStyle}
        className="opacity-0 group-hover/node:opacity-100 pointer-events-none group-hover/node:pointer-events-auto"
        isConnectable={true}
      />
      <Handle 
        type="source"
        position={Position.Bottom} 
        id="bottom-source" 
        style={handleStyle}
        className="opacity-0 group-hover/node:opacity-100 pointer-events-none group-hover/node:pointer-events-auto"
        isConnectable={true}
      />
    </div>
  );
}
