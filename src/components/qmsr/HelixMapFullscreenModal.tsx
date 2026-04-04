import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, HelpCircle } from 'lucide-react';
import { HelixProcessControlMap, HealthIndicator } from './HelixProcessControlMap';
import { useHelixPulseStatus } from '@/hooks/useHelixPulseStatus';
import { cn } from '@/lib/utils';

interface HelixMapFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onInfoClick?: () => void;
}

export function HelixMapFullscreenModal({
  isOpen,
  onClose,
  companyId,
  onInfoClick,
}: HelixMapFullscreenModalProps) {
  const { data } = useHelixPulseStatus(companyId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "w-[95vw] h-[95vh] max-w-none p-0",
          "bg-slate-950 border-slate-800 overflow-hidden"
        )}
      >
        {/* Header bar */}
        <div className="absolute top-0 left-0 right-0 h-14 z-10 flex items-center justify-between px-6 bg-slate-900/95 backdrop-blur border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                QMS Process Control Map
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                Helix OS • Triple-Helix Architecture
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {onInfoClick && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                onClick={onInfoClick}
                title="What is this?"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            )}
            
            
            {data && <HealthIndicator health={data.overallHealth} />}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Map Container - uses absolute positioning for explicit height */}
        <div className="absolute inset-0 pt-14">
          <div className="w-full h-full">
            <HelixProcessControlMap
              companyId={companyId}
              compact={false}
              showHeader={false}
              isFullscreen={true}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
