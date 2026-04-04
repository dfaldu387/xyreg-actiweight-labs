
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ActivityTemplate, ACTIVITY_TYPES } from '@/types/activities';
import { useProductPhases } from '@/hooks/useProductPhases';
import { DigitalTemplateSelector } from '@/components/digital-templates/DigitalTemplateSelector';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';

interface ActivityInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (activityData: any) => void;
  selectedTemplate: ActivityTemplate | null;
  companyId: string;
  productId?: string | null;
  isManualActivity?: boolean;
  isDesignReview?: boolean;
}

export function ActivityInstanceDialog({
  open,
  onOpenChange,
  onSubmit,
  selectedTemplate,
  companyId,
  productId,
  isManualActivity = false,
  isDesignReview = false
}: ActivityInstanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>([]);
  const [scheduleAtPhaseEnd, setScheduleAtPhaseEnd] = useState(false);
  const [manuallySetDates, setManuallySetDates] = useState(false);
  const [showDateConflictWarning, setShowDateConflictWarning] = useState(false);
  const [useDigitalTemplate, setUseDigitalTemplate] = useState(false);
  const [digitalTemplateData, setDigitalTemplateData] = useState<any>(null);
  
  const { phases } = useProductPhases(productId, companyId);
  
  const [formData, setFormData] = useState({
    name: isDesignReview ? 'Design Review' : (selectedTemplate?.name || ''),
    type: isDesignReview ? 'reviews_meetings' : (isManualActivity ? 'other' : (selectedTemplate?.type || 'other')),
    description: isDesignReview ? 'Phase-adaptive design review with digital template' : (selectedTemplate?.description || ''),
    start_date: '',
    end_date: '',
    assignee_ids: [] as string[]
  });

  // Auto-populate phase selection and dates when dialog opens with phases available
  useEffect(() => {
    if (open && phases.length > 0 && selectedPhaseIds.length === 0) {
      // Auto-select the first phase if none are selected
      const firstPhase = phases[0];
      if (firstPhase) {
        setSelectedPhaseIds([firstPhase.id]);
        
        // Auto-fill dates from the first phase
        if (firstPhase.start_date && firstPhase.end_date) {
          setFormData(prev => ({
            ...prev,
            start_date: firstPhase.start_date,
            end_date: firstPhase.end_date
          }));
        }
      }
    }
  }, [open, phases, selectedPhaseIds.length]);

  // Auto-enable digital template for design reviews
  useEffect(() => {
    if (isDesignReview) {
      setUseDigitalTemplate(true);
      setDigitalTemplateData({
        type: 'design_review',
        phase: getCurrentPhase()
      });
    }
  }, [isDesignReview, selectedPhaseIds]);
  // Helper function to format phase display name with timeline
  const formatPhaseDisplayName = (phase: any, index: number) => {
    let displayName = phase.name;
    
    // Remove "(Continuous)" or "(continuous)" from phase name
    displayName = displayName.replace(/\s*\(continuous\)/gi, '');
    
    if (phase.start_date && phase.end_date) {
      try {
        const startDate = format(new Date(phase.start_date), 'MMM dd');
        const endDate = format(new Date(phase.end_date), 'MMM dd');
        displayName += ` (${startDate} - ${endDate})`;
      } catch {
        // Error formatting phase dates
      }
    } else {
      displayName += ' (No timeline set)';
    }
    
    return displayName;
  };

  // Handle phase selection and auto-fill dates immediately
  const handlePhaseSelection = (phaseId: string, checked: boolean) => {
    let newSelectedPhaseIds;
    if (checked) {
      newSelectedPhaseIds = [...selectedPhaseIds, phaseId];
    } else {
      newSelectedPhaseIds = selectedPhaseIds.filter(id => id !== phaseId);
    }
    setSelectedPhaseIds(newSelectedPhaseIds);

    // Check for date conflicts when a phase is selected and dates were manually set
    if (checked && manuallySetDates && formData.start_date && formData.end_date) {
      const selectedPhase = phases.find(p => p.id === phaseId);
      if (selectedPhase && selectedPhase.start_date && selectedPhase.end_date) {
        const manualStart = formData.start_date;
        const manualEnd = formData.end_date;
        const phaseStart = selectedPhase.start_date;
        const phaseEnd = selectedPhase.end_date;
        
        // Show warning if manual dates don't match phase dates
        if (manualStart !== phaseStart || manualEnd !== phaseEnd) {
          setShowDateConflictWarning(true);
          return; // Don't auto-update dates, let user decide
        }
      }
    }

    // Auto-populate dates immediately when phases are selected (if not manually set)
    if (newSelectedPhaseIds.length > 0 && !manuallySetDates) {
      const selectedPhases = phases.filter(p => newSelectedPhaseIds.includes(p.id));
      const phasesWithDates = selectedPhases.filter(p => p.start_date && p.end_date);
      
      if (phasesWithDates.length > 0) {
        // For single phase: use phase start → phase end dates
        // For multiple phases: use earliest start → latest end across all selected phases
        const startDates = phasesWithDates.map(p => new Date(p.start_date!));
        const endDates = phasesWithDates.map(p => new Date(p.end_date!));
        
        const earliestStartDate = startDates.sort((a, b) => a.getTime() - b.getTime())[0];
        const latestEndDate = endDates.sort((a, b) => b.getTime() - a.getTime())[0];
        
        const startDateString = earliestStartDate.toISOString().split('T')[0];
        const endDateString = latestEndDate.toISOString().split('T')[0];
        
        setFormData(prev => ({
          ...prev,
          start_date: startDateString,
          end_date: endDateString
        }));
      }
    } else if (newSelectedPhaseIds.length === 0) {
      // Clear dates when no phases are selected
      setFormData(prev => ({
        ...prev,
        start_date: '',
        end_date: ''
      }));
      setManuallySetDates(false);
    }
  };

  // Handle "schedule at phase end" toggle
  const handleScheduleAtPhaseEndChange = (checked: boolean) => {
    setScheduleAtPhaseEnd(checked);
    
    if (checked && selectedPhaseIds.length > 0) {
      // Apply end-of-phase scheduling logic
      const selectedPhases = phases.filter(p => selectedPhaseIds.includes(p.id));
      const phasesWithDates = selectedPhases.filter(p => p.end_date);
      
      if (phasesWithDates.length > 0) {
        const latestEndDate = phasesWithDates
          .map(p => new Date(p.end_date!))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        
        const endDateString = latestEndDate.toISOString().split('T')[0];
        const startDate = new Date(latestEndDate);
        startDate.setDate(startDate.getDate() - 3);
        const startDateString = startDate.toISOString().split('T')[0];
        
        setFormData(prev => ({
          ...prev,
          start_date: startDateString,
          end_date: endDateString
        }));
      }
    }
  };

  const calculatePhaseSpecificDates = (phase: any) => {
    if (scheduleAtPhaseEnd && phase && phase.end_date) {
      const phaseEndDate = new Date(phase.end_date);
      const endDateString = phaseEndDate.toISOString().split('T')[0];
      
      const startDate = new Date(phaseEndDate);
      startDate.setDate(startDate.getDate() - 3); // 3 days before phase end
      
      // Don't go before phase start if it exists
      if (phase.start_date) {
        const phaseStartDate = new Date(phase.start_date);
        if (startDate < phaseStartDate) {
          startDate.setTime(phaseStartDate.getTime());
        }
      }
      
      const startDateString = startDate.toISOString().split('T')[0];
      
      return {
        start_date: startDateString,
        end_date: endDateString
      };
    }
    
    // Use phase dates directly if available, otherwise use manual dates
    if (phase && phase.start_date && phase.end_date) {
      return {
        start_date: phase.start_date,
        end_date: phase.end_date
      };
    }
    
    return {
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
    };
  };

  // Handle manual date changes
  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setManuallySetDates(true);
    setShowDateConflictWarning(false); // Clear warning when user manually adjusts dates
  };

  // Handle resolving date conflicts
  const handleUsePhaseDates = () => {
    if (selectedPhaseIds.length === 1) {
      const selectedPhase = phases.find(p => p.id === selectedPhaseIds[0]);
      if (selectedPhase && selectedPhase.start_date && selectedPhase.end_date) {
        setFormData(prev => ({
          ...prev,
          start_date: selectedPhase.start_date!,
          end_date: selectedPhase.end_date!
        }));
        setManuallySetDates(false);
      }
    }
    setShowDateConflictWarning(false);
  };

  const handleKeepManualDates = () => {
    setShowDateConflictWarning(false);
    // Keep current manual dates
  };

  // Helper function to determine if activity should show digital template selector
  const shouldShowDigitalTemplateSelector = () => {
    if (isDesignReview) return true;
    if (isManualActivity) {
      return formData.type === 'reviews_meetings';
    }
    return selectedTemplate?.type === 'reviews_meetings';
  };

  // Get the current phase for template adaptation
  const getCurrentPhase = () => {
    if (selectedPhaseIds.length === 1) {
      const phase = phases.find(p => p.id === selectedPhaseIds[0]);
      return phase?.name?.toLowerCase() || 'concept';
    }
    return 'concept'; // Default phase
  };

  // Handle digital template selection
  const handleDigitalTemplateSelect = (useTemplate: boolean, templateData?: any) => {
    setUseDigitalTemplate(useTemplate);
    setDigitalTemplateData(templateData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedPhaseIds.length > 1) {
        // Create multiple activities - one for each selected phase
        const selectedPhases = phases.filter(p => selectedPhaseIds.includes(p.id));
        let createdCount = 0;
        
        for (const phase of selectedPhases) {
          const phaseSpecificDates = calculatePhaseSpecificDates(phase);
          
          await onSubmit({
            company_id: companyId,
            product_id: productId || null,
            name: formData.name.trim(),
            type: formData.type,
            status: 'planned',
            assignee_ids: formData.assignee_ids,
            start_date: phaseSpecificDates.start_date,
            end_date: phaseSpecificDates.end_date,
            template_id: selectedTemplate?.id || null,
            phase_id: phase.id,
          });
          createdCount++;
        }
      } else {
        // Create single activity
        const phaseSpecificDates = selectedPhaseIds.length === 1 
          ? calculatePhaseSpecificDates(phases.find(p => p.id === selectedPhaseIds[0]))
          : { start_date: formData.start_date || null, end_date: formData.end_date || null };

        await onSubmit({
          company_id: companyId,
          product_id: productId || null,
          name: formData.name.trim(),
          type: formData.type,
          status: 'planned',
          assignee_ids: formData.assignee_ids,
          start_date: phaseSpecificDates.start_date,
          end_date: phaseSpecificDates.end_date,
          template_id: selectedTemplate?.id || null,
          phase_id: selectedPhaseIds.length > 0 ? selectedPhaseIds[0] : null,
          
        });
      }
      
      // Reset the form and close dialog
      setSelectedPhaseIds([]);
      setScheduleAtPhaseEnd(false);
      setUseDigitalTemplate(false);
      setDigitalTemplateData(null);
      setFormData({
        name: isDesignReview ? 'Design Review' : (selectedTemplate?.name || ''),
        type: isDesignReview ? 'reviews_meetings' : (isManualActivity ? 'other' : (selectedTemplate?.type || 'other')),
        description: isDesignReview ? 'Phase-adaptive design review with digital template' : (selectedTemplate?.description || ''),
        start_date: '',
        end_date: '',
        assignee_ids: []
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isManualActivity ? 'Schedule Manual Activity' : 'Schedule Activity from Template'}
          </DialogTitle>
          {selectedTemplate && !isManualActivity && (
            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
              <div className="font-medium text-blue-900 mb-1">Using Template: {selectedTemplate.name}</div>
              <div className="text-blue-800">Activity type is locked to: {ACTIVITY_TYPES[selectedTemplate.type as keyof typeof ACTIVITY_TYPES]}</div>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Activity Name *
              {selectedTemplate && !isManualActivity && (
                <span className="text-xs text-muted-foreground ml-2">(from template)</span>
              )}
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={isManualActivity ? "Enter activity name" : "Activity name from template"}
              required
              className={selectedTemplate && !isManualActivity ? "bg-blue-50/50 border-blue-200" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Activity Type
              {selectedTemplate && !isManualActivity && (
                <span className="text-xs text-muted-foreground ml-2">(locked from template)</span>
              )}
            </Label>
            {selectedTemplate && !isManualActivity ? (
              <div className="relative">
                <Input
                  id="type"
                  value={ACTIVITY_TYPES[formData.type as keyof typeof ACTIVITY_TYPES] || formData.type}
                  disabled
                  className="bg-blue-50/50 border-blue-200 text-blue-900"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600">
                  🔒
                </div>
              </div>
            ) : (
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ActivityTemplate['type'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Digital Template Selector */}
          {shouldShowDigitalTemplateSelector() && (
            <DigitalTemplateSelector
              companyId={companyId}
              activityType={formData.type}
              currentPhase={getCurrentPhase()}
              onTemplateSelect={handleDigitalTemplateSelect}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="start_date">
              Begin Date
              {selectedPhaseIds.length > 0 && formData.start_date && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Auto-filled from selected phases)
                </span>
              )}
            </Label>
            <DatePicker
              date={formData.start_date ? new Date(formData.start_date) : undefined}
              setDate={(date) => handleDateChange('start_date', date ? date.toISOString().split('T')[0] : '')}
              placeholder="Select start date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">
              End Date
              {selectedPhaseIds.length > 0 && formData.end_date && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Auto-filled from selected phases)
                </span>
              )}
            </Label>
            <DatePicker
              date={formData.end_date ? new Date(formData.end_date) : undefined}
              setDate={(date) => handleDateChange('end_date', date ? date.toISOString().split('T')[0] : '')}
              placeholder="Select end date"
              fromDate={formData.start_date ? new Date(formData.start_date) : undefined}
            />
          </div>

          {/* Date Conflict Warning */}
          {showDateConflictWarning && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600">⚠️</div>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 mb-1">Date Conflict Detected</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Your manually set dates don't match the selected phase's time period. 
                    Would you like to use the phase dates or keep your manual dates?
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={handleUsePhaseDates}
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      Use Phase Dates
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={handleKeepManualDates}
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      Keep Manual Dates
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Linked Phases (Optional)</Label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-3 space-y-2">
              {phases.length > 0 ? (
                phases.map((phase, index) => (
                  <div key={phase.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`phase-${phase.id}`}
                      checked={selectedPhaseIds.includes(phase.id)}
                      onCheckedChange={(checked) => handlePhaseSelection(phase.id, checked as boolean)}
                    />
                    <Label htmlFor={`phase-${phase.id}`} className="text-sm cursor-pointer">
                      {formatPhaseDisplayName(phase, index)}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No phases available</p>
              )}
            </div>
            
            {selectedPhaseIds.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="schedule-at-phase-end"
                    checked={scheduleAtPhaseEnd}
                    onCheckedChange={handleScheduleAtPhaseEndChange}
                  />
                  <Label htmlFor="schedule-at-phase-end" className="text-sm cursor-pointer">
                    Schedule as last item in selected phase(s)
                  </Label>
                </div>
                
                {scheduleAtPhaseEnd && (
                  <p className="text-xs text-muted-foreground">
                    Activity will be scheduled to end when the selected phase(s) complete
                  </p>
                )}
              </div>
            )}
            
            {selectedPhaseIds.length > 1 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  This will create {selectedPhaseIds.length} activities (one per selected phase)
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
              {selectedTemplate && !isManualActivity && formData.description && (
                <span className="text-xs text-muted-foreground ml-2">(from template)</span>
              )}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={isManualActivity ? "Enter description (optional)" : "Description from template (optional)"}
              rows={3}
              className={selectedTemplate && !isManualActivity && formData.description ? "bg-blue-50/50 border-blue-200" : ""}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting 
                ? (selectedPhaseIds.length > 1 ? 'Creating Activities...' : 'Creating...')
                : (selectedPhaseIds.length > 1 ? `Schedule ${selectedPhaseIds.length} Activities` : 'Schedule Activity')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
