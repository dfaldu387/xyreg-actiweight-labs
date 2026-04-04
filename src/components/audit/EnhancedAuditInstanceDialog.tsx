import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Clock, User, FileText } from "lucide-react";
import { DatePicker } from '@/components/ui/date-picker';
import { format } from "date-fns";
import { ResponsiblePersonSelector } from "./ResponsiblePersonSelector";
import { useProductPhases } from "@/hooks/useProductPhases";
import { cleanPhaseName } from "@/utils/phaseNumbering";
import { useTranslation } from "@/hooks/useTranslation";

interface EnhancedAuditInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  selectedTemplate: any;
  type: "company" | "product";
  companyId?: string;
  productId?: string;
}

export function EnhancedAuditInstanceDialog({
  open,
  onOpenChange,
  onSubmit,
  selectedTemplate,
  type,
  companyId,
  productId
}: EnhancedAuditInstanceDialogProps) {
  const { lang } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditName, setAuditName] = useState("");
  const [notes, setNotes] = useState("");
  const [responsiblePersonId, setResponsiblePersonId] = useState<string | undefined>();
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>([]);
  const [scheduleAtPhaseEnd, setScheduleAtPhaseEnd] = useState(false);
  const [manuallySetDates, setManuallySetDates] = useState(false);
  const [showDateConflictWarning, setShowDateConflictWarning] = useState(false);

  const { phases: allPhases } = useProductPhases(type === "product" ? productId : undefined, companyId);

  // Filter out "No Phase" / uncategorized phases from the selection list
  const phases = allPhases.filter(p =>
    p.name?.toLowerCase() !== 'no phase' &&
    p.name?.toLowerCase() !== 'uncategorized'
  );

  const [formData, setFormData] = useState({
    start_date: '',
    end_date: ''
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setAuditName("");
      setNotes("");
      setResponsiblePersonId(undefined);
      setSelectedPhaseIds([]);
      setScheduleAtPhaseEnd(false);
      setManuallySetDates(false);
      setShowDateConflictWarning(false);
      setFormData({
        start_date: '',
        end_date: ''
      });
    }
  }, [open]);

  // Auto-generate audit name when template is selected
  useEffect(() => {
    if (selectedTemplate && !auditName) {
      const today = new Date();
      const dateStr = format(today, "yyyy-MM");
      setAuditName(`${selectedTemplate.audit_templates?.template_name} - ${dateStr}`);
    }
  }, [selectedTemplate, auditName]);

  // Helper function to format phase display name with timeline
  const formatPhaseDisplayName = (phase: any, index: number) => {
    // Just use the cleaned phase name without position numbers
    let displayName = cleanPhaseName(phase.name);
    
    if (phase.start_date && phase.end_date) {
      try {
        const startDate = format(new Date(phase.start_date), 'MMM dd');
        const endDate = format(new Date(phase.end_date), 'MMM dd');
        displayName += ` (${startDate} - ${endDate})`;
      } catch (error) {
        // console.error('Error formatting phase dates:', error);
      }
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
        startDate.setDate(startDate.getDate() - 3); // 3 days before phase end
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
    // Always use the phase's actual dates when creating phase-specific audits
    if (phase && phase.start_date && phase.end_date) {
      return {
        start_date: phase.start_date,
        end_date: phase.end_date
      };
    }
    
    // Fallback to schedule at phase end logic if phase dates exist
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
    
    // Use manual dates as final fallback
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate || !auditName.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedPhaseIds.length > 1) {
        // Create multiple audits - one for each selected phase
        const selectedPhases = phases.filter(p => selectedPhaseIds.includes(p.id));
        let createdCount = 0;
        
        for (const phase of selectedPhases) {
          const phaseSpecificDates = calculatePhaseSpecificDates(phase);
          
          const auditData = {
            audit_name: auditName.trim(),
            audit_type: selectedTemplate.audit_templates.template_name,
            status: "Planned",
            start_date: phaseSpecificDates.start_date,
            end_date: phaseSpecificDates.end_date,
            deadline_date: phaseSpecificDates.end_date, // For backward compatibility
            notes,
            responsible_person_id: responsiblePersonId,
            phase_id: phase.id || null, // Use lifecycle phase ID
            ...(type === "product" && { 
              product_id: productId,
              lifecycle_phase: cleanPhaseName(phase.name) // Use the actual phase name, not template's
            }),
            ...(type === "company" && { 
              company_id: companyId 
            })
          };

          await onSubmit(auditData);
          createdCount++;
        }
        
      } else {
        // Create single audit
        const selectedPhase = selectedPhaseIds.length === 1 
          ? phases.find(p => p.id === selectedPhaseIds[0])
          : null;
        const phaseSpecificDates = selectedPhase
          ? calculatePhaseSpecificDates(selectedPhase)
          : { start_date: formData.start_date || null, end_date: formData.end_date || null };

        const auditData = {
          audit_name: auditName.trim(),
          audit_type: selectedTemplate.audit_templates.template_name,
          status: "Planned",
          start_date: phaseSpecificDates.start_date,
          end_date: phaseSpecificDates.end_date,
          deadline_date: phaseSpecificDates.end_date, // For backward compatibility
          notes,
          responsible_person_id: responsiblePersonId,
          phase_id: selectedPhase?.id || null, // Use lifecycle phase ID
          ...(type === "product" && { 
            product_id: productId,
            lifecycle_phase: selectedTemplate.audit_templates.lifecycle_phase 
          }),
          ...(type === "company" && { 
            company_id: companyId 
          })
        };

        await onSubmit(auditData);
      }

      // Reset the form and close dialog
      setSelectedPhaseIds([]);
      setScheduleAtPhaseEnd(false);
      setFormData({
        start_date: '',
        end_date: ''
      });
      setAuditName("");
      setNotes("");
      setResponsiblePersonId(undefined);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate submit button text
  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return lang('deviceAudits.form.creating');
    }
    if (selectedPhaseIds.length > 1) {
      return lang('deviceAudits.form.scheduleMultipleAudits').replace('{{count}}', String(selectedPhaseIds.length));
    }
    return lang('deviceAudits.form.scheduleAuditButton');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang('deviceAudits.form.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {type === 'product'
              ? lang('deviceAudits.form.dialogDescriptionProduct')
              : lang('deviceAudits.form.dialogDescriptionCompany')}
            {selectedPhaseIds.length > 1 && (
              <span className="block mt-1 text-blue-600 font-medium">
                {lang('deviceAudits.form.creatingMultipleAudits').replace('{{count}}', String(selectedPhaseIds.length))}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Info */}
          {selectedTemplate && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">{selectedTemplate.audit_templates?.template_name}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedTemplate.audit_templates?.description}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {selectedTemplate.audit_templates?.lifecycle_phase && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedTemplate.audit_templates.lifecycle_phase}
                    </Badge>
                  )}
                  {selectedTemplate.audit_templates?.suggested_duration && (
                    <Badge variant="outline" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      {selectedTemplate.audit_templates.suggested_duration}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auditName">{lang('deviceAudits.form.auditName')} *</Label>
                <Input
                  id="auditName"
                  value={auditName}
                  onChange={(e) => setAuditName(e.target.value)}
                  placeholder={lang('deviceAudits.form.enterAuditName')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">
                  {lang('deviceAudits.form.startDate')}
                  {selectedPhaseIds.length > 0 && formData.start_date && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({lang('deviceAudits.form.autoFilledFromPhases')})
                    </span>
                  )}
                </Label>
                <DatePicker
                  date={formData.start_date ? new Date(formData.start_date) : undefined}
                  setDate={(date) => handleDateChange('start_date', date ? date.toISOString().split('T')[0] : '')}
                  placeholder={lang('deviceAudits.form.selectStartDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">
                  {lang('deviceAudits.form.endDate')}
                  {selectedPhaseIds.length > 0 && formData.end_date && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({lang('deviceAudits.form.autoFilledFromPhases')})
                    </span>
                  )}
                </Label>
                <DatePicker
                  date={formData.end_date ? new Date(formData.end_date) : undefined}
                  setDate={(date) => handleDateChange('end_date', date ? date.toISOString().split('T')[0] : '')}
                  placeholder={lang('deviceAudits.form.selectEndDate')}
                  fromDate={formData.start_date ? new Date(formData.start_date) : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsiblePerson">{lang('deviceAudits.form.responsiblePerson')}</Label>
                <ResponsiblePersonSelector
                  value={responsiblePersonId}
                  onChange={setResponsiblePersonId}
                  companyId={companyId}
                />
              </div>
            </div>

            {/* Right Column - Phase Selection */}
            <div className="space-y-4">
              {type === "product" && (
                <div className="space-y-2">
                  <Label>{lang('deviceAudits.form.linkedPhases')}</Label>
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
                      <p className="text-sm text-muted-foreground">{lang('deviceAudits.form.noPhasesAvailable')}</p>
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
                        <Label htmlFor="schedule-at-phase-end" className="text-sm">
                          {lang('deviceAudits.form.scheduleAtPhaseEnd')}
                        </Label>
                      </div>
                      {selectedPhaseIds.length > 1 && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          <strong>{lang('deviceAudits.form.multiInstanceCreation')}:</strong> {lang('deviceAudits.form.multiInstanceCreationDesc').replace('{{count}}', String(selectedPhaseIds.length))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Date Conflict Warning */}
              {showDateConflictWarning && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-3">
                    <div className="text-yellow-600">⚠️</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800 mb-1">{lang('deviceAudits.form.dateConflictTitle')}</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        {lang('deviceAudits.form.dateConflictDescription')}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleUsePhaseDates}
                          className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                        >
                          {lang('deviceAudits.form.usePhaseDates')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleKeepManualDates}
                          className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                        >
                          {lang('deviceAudits.form.keepManualDates')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{lang('deviceAudits.form.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang('deviceAudits.form.enterNotes')}
              rows={3}
            />
          </div>

          {/* Template Guidance */}
          {selectedTemplate?.audit_templates?.suggested_documents && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {lang('deviceAudits.form.templateGuidance')}
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>{lang('deviceAudits.form.suggestedDocuments')}:</strong></p>
                  <p className="text-xs bg-muted p-2 rounded">
                    {selectedTemplate.audit_templates.suggested_documents}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multi-instance Preview */}
          {selectedPhaseIds.length > 1 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2 text-blue-900">{lang('deviceAudits.form.auditCreationPreview')}</h4>
                <div className="text-sm text-blue-800">
                  <p className="mb-2">{lang('deviceAudits.form.willCreateAudits').replace('{{count}}', String(selectedPhaseIds.length))}:</p>
                  <div className="space-y-1">
                    {selectedPhaseIds.map(phaseId => {
                      const phase = phases.find(p => p.id === phaseId);
                      return phase ? (
                        <div key={phaseId} className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {cleanPhaseName(phase.name)}
                          </Badge>
                          <span className="text-xs">→ {auditName || lang('deviceAudits.form.audit')}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {lang('deviceAudits.form.cancel')}
            </Button>
            <Button type="submit" disabled={!auditName.trim() || isSubmitting}>
              {getSubmitButtonText()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
