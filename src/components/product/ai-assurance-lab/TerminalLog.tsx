import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TerminalLogProps {
  logs: string[];
  isProcessing: boolean;
  onComplete: () => void;
}

export function TerminalLog({ logs, isProcessing, onComplete }: TerminalLogProps) {
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isProcessing && currentIndex < logs.length) {
      const timer = setTimeout(() => {
        setVisibleLogs(prev => [...prev, logs[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    } else if (isProcessing && currentIndex >= logs.length) {
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(completeTimer);
    }
  }, [isProcessing, currentIndex, logs, onComplete]);

  useEffect(() => {
    if (!isProcessing) {
      setVisibleLogs([]);
      setCurrentIndex(0);
    }
  }, [isProcessing]);

  if (!isProcessing && visibleLogs.length === 0) return null;

  return (
    <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm overflow-hidden">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-slate-400 ml-2 text-xs">AI Verification Terminal</span>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {visibleLogs.map((log, index) => (
          <div 
            key={index} 
            className={cn(
              "flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-200",
              log.includes('[ERROR]') && 'text-red-400',
              log.includes('[SUCCESS]') && 'text-green-400',
              log.includes('[WARN]') && 'text-yellow-400',
              !log.includes('[ERROR]') && !log.includes('[SUCCESS]') && !log.includes('[WARN]') && 'text-slate-300'
            )}
          >
            <span className="text-indigo-400 select-none">$</span>
            <span>{log}</span>
          </div>
        ))}
        {isProcessing && currentIndex < logs.length && (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-indigo-400">$</span>
            <span className="animate-pulse">▊</span>
          </div>
        )}
      </div>
    </div>
  );
}
