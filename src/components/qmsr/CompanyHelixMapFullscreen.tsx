/**
 * CompanyHelixMapFullscreen - Fullscreen modal for company-level QMS map
 * Shows only Rungs 1 & 5 (Foundation & Feedback) with device black box
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, HelpCircle } from 'lucide-react';
import { CompanyHelixMap, HealthIndicatorLight } from './CompanyHelixMap';
import { useHelixPulseStatus } from '@/hooks/useHelixPulseStatus';
import { cn } from '@/lib/utils';

interface CompanyHelixMapFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onInfoClick?: () => void;
  onViewInProduct?: () => void;
}

export function CompanyHelixMapFullscreen({
  isOpen,
  onClose,
  companyId,
  onInfoClick,
  onViewInProduct,
}: CompanyHelixMapFullscreenProps) {
  const { data } = useHelixPulseStatus(companyId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "w-[95vw] h-[90vh] max-w-none p-0",
          "bg-white border-slate-200 overflow-hidden"
        )}
      >
        {/* Header bar - light mode */}
        <div className="absolute top-0 left-0 right-0 h-14 z-10 flex items-center justify-between px-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
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
                className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                onClick={onInfoClick}
                title="What is this?"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            )}
            
            {data && <HealthIndicatorLight health={data.overallHealth} />}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <div className="absolute inset-0 pt-14 pb-0">
          <div className="w-full h-full">
            <CompanyHelixMap
              companyId={companyId}
              showHeader={false}
              onViewInProduct={onViewInProduct}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
