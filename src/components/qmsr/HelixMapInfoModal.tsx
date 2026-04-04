import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Circle,
  ArrowRight,
  Zap,
  Hexagon
} from 'lucide-react';

interface HelixMapInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelixMapInfoModal({ isOpen, onClose }: HelixMapInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-purple-600" />
            QMS Process Control Map Explained
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Understanding your organization's Quality Management System readiness
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Introduction */}
          <section className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              This visualization tracks your organization's state of control for 
              <span className="text-purple-600 font-semibold"> Quality Management System requirements</span> under ISO 13485:2016 and applicable global regulations. 
              It displays <span className="text-cyan-600 font-semibold">Risk-Based Rationale (RBR)</span> nodes 
              across three parallel tracks representing different functional areas.
            </p>
          </section>

          {/* What Cards Represent */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">
              What the Cards Represent
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Each card is a <span className="font-semibold text-gray-800">"Risk-Based Rationale" (RBR)</span> node — 
              a documented justification for key decisions in your Quality Management System. 
              Click any card to view details and create rationale documents.
            </p>
          </section>

          {/* Status Colors */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">
              Status Colors
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 border border-gray-200">
                <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
                  <Circle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Grey / Dormant</p>
                  <p className="text-xs text-gray-500">Not yet started</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-700">Amber / Active</p>
                  <p className="text-xs text-amber-600">Work in progress</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700">Green / Validated</p>
                  <p className="text-xs text-emerald-600">All approved</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700">Red / Critical</p>
                  <p className="text-xs text-red-600">Requires immediate action</p>
                </div>
              </div>
            </div>
          </section>

          {/* What Lines Mean */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">
              What the Lines Mean
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Lines show dependencies between decisions:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded bg-gray-50">
                <div className="w-12 h-1 bg-amber-500 rounded" />
                <span className="text-xs text-gray-700">Amber = Active workflow in progress</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-gray-50">
                <div className="w-12 h-1 rounded" style={{ background: 'repeating-linear-gradient(90deg, hsl(0,72%,50%) 0px, hsl(0,72%,50%) 4px, transparent 4px, transparent 8px)' }} />
                <span className="text-xs text-gray-700">Red dashed = Blocked path (upstream issue)</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-gray-50">
                <div className="w-12 h-1 rounded" style={{ background: 'repeating-linear-gradient(90deg, hsl(280,60%,50%) 0px, hsl(280,60%,50%) 2px, transparent 2px, transparent 4px)' }} />
                <span className="text-xs text-gray-700">Purple dotted = Cross-track sync point</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-gray-50">
                <div className="w-12 h-1 bg-gray-400 rounded" />
                <span className="text-xs text-gray-700">Grey = Dormant connection (not yet active)</span>
              </div>
            </div>
          </section>

          {/* Three Tracks */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">
              The Three Tracks
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                <span className="text-xs font-bold text-cyan-700 border border-cyan-400 px-2 py-0.5 rounded">ENG</span>
                <div>
                  <p className="text-sm font-medium text-cyan-800">Engineering Track</p>
                  <p className="text-xs text-cyan-600">Design, validation, and technical decisions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <span className="text-xs font-bold text-purple-700 border border-purple-400 px-2 py-0.5 rounded">REG</span>
                <div>
                  <p className="text-sm font-medium text-purple-800">Regulatory Track</p>
                  <p className="text-xs text-purple-600">Pathway, clinical evidence, and compliance decisions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <span className="text-xs font-bold text-orange-700 border border-orange-400 px-2 py-0.5 rounded">BUS</span>
                <div>
                  <p className="text-sm font-medium text-orange-800">Business Track</p>
                  <p className="text-xs text-orange-600">Training, suppliers, and CAPA decisions</p>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="p-4 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Click any card to see details and create rationale documents.</span>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
