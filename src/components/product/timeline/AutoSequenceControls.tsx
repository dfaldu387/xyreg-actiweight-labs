
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Calendar, Clock, Play, Eye } from "lucide-react";
import { format } from "date-fns";
import { useAutoSequencing, PhaseForAutoSequencing, AutoSequenceUpdate } from "@/hooks/useAutoSequencing";

interface AutoSequenceControlsProps {
  phases: PhaseForAutoSequencing[];
  sequencePhases: boolean;
  onBatchUpdate: (updates: AutoSequenceUpdate[]) => Promise<boolean>;
  disabled?: boolean;
}

export function AutoSequenceControls({
  phases,
  sequencePhases,
  onBatchUpdate,
  disabled = false
}: AutoSequenceControlsProps) {
  const {
    isApplying,
    previewData,
    applyAutoSequence,
    showPreview,
    clearPreview
  } = useAutoSequencing();

  const handleApplyNow = async () => {
    await applyAutoSequence(phases, onBatchUpdate);
  };

  const handleShowPreview = () => {
    showPreview(phases);
  };

  const handleApplyFromPreview = async () => {
    await applyAutoSequence(phases, onBatchUpdate);
  };

  const phasesWithDates = phases.filter(p => p.startDate && p.endDate);
  const hasOverlapsOrGaps = phasesWithDates.some((phase, index) => {
    if (index === 0) return false;
    const prevPhase = phasesWithDates[index - 1];
    if (!prevPhase.endDate || !phase.startDate) return false;
    
    const dayAfterPrev = new Date(prevPhase.endDate);
    dayAfterPrev.setDate(dayAfterPrev.getDate() + 1);
    
    return phase.startDate.getTime() !== dayAfterPrev.getTime();
  });

  if (!sequencePhases) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Status and Controls */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Auto-Sequence Mode Active</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-blue-700">
                    Phases will be automatically sequenced during drag operations
                  </p>
                  {hasOverlapsOrGaps && (
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Gaps/Overlaps Detected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleShowPreview}
                variant="outline"
                size="sm"
                disabled={disabled || phases.length === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleApplyNow}
                disabled={disabled || isApplying || phases.length === 0}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isApplying ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Apply Auto-Sequence Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewData && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-orange-900">Auto-Sequence Preview</h4>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleApplyFromPreview}
                  disabled={isApplying}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isApplying ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Apply Changes
                </Button>
                <Button
                  onClick={clearPreview}
                  variant="outline"
                  size="sm"
                  disabled={isApplying}
                >
                  Cancel
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {previewData.map((preview, index) => (
                <div key={preview.original.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                    <span className="font-medium text-sm">Phase {index + 1}</span>
                    <Badge variant="secondary" className="text-xs">
                      {preview.durationDays} days
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">
                      {preview.original.startDate ? format(preview.original.startDate, 'MMM dd, yyyy') : 'No date'} 
                      {preview.original.endDate ? ` - ${format(preview.original.endDate, 'MMM dd, yyyy')}` : ''}
                    </span>
                    <ArrowRight className="h-3 w-3 text-blue-500" />
                    <span className="text-blue-700 font-medium">
                      {format(preview.updated.startDate, 'MMM dd, yyyy')} - {format(preview.updated.endDate, 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 text-xs text-orange-700 bg-orange-100 p-2 rounded">
              <strong>Changes:</strong> All phases will be sequenced with no gaps or overlaps, 
              preserving individual phase durations where possible (minimum 1 day).
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
