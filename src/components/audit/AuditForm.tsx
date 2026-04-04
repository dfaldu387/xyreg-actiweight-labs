import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUDIT_TYPES, LIFECYCLE_PHASES, AuditStatus, AuditMetadata } from "@/types/audit";
import { AuditMetadataTooltip } from "./AuditMetadataTooltip";
import { ResponsiblePersonSelector } from "./ResponsiblePersonSelector";
import { cn } from "@/lib/utils";
import { fetchAuditMetadata } from "@/services/auditService";
import { FilteredAuditTypeSelect } from "./FilteredAuditTypeSelect";
import { ScopeFilter } from "./ScopeFilter";
import { LifecyclePhaseFilter } from "./LifecyclePhaseFilter";
import { AuditorTypeFilter } from "./AuditorTypeFilter";
import { AuditCategoryType, AuditorType, setAuditMetadataCache } from "@/utils/auditTypeUtils";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface AuditFormProps {
  formType: "company" | "product";
  onSubmit: (data: AuditFormData) => void;
  initialData?: AuditFormData;
  isSubmitting: boolean;
  companyId?: string;
}

export interface AuditFormData {
  auditName: string;
  auditType: string;
  lifecyclePhase?: string;
  deadlineDate?: Date;
  status: AuditStatus;
  responsiblePersonId?: string;
  notes?: string;
  // Completion fields
  completionDate?: Date;
  leadAuditorName?: string;
  actualAuditDuration?: string;
  executiveSummary?: string;
  overallAssessment?: string;
  closeOutActionsSummary?: string;
}

export function AuditForm({
  formType,
  onSubmit,
  initialData,
  isSubmitting,
  companyId,
}: AuditFormProps) {
  const { lang } = useTranslation();
  const [formData, setFormData] = useState<AuditFormData>({
    auditName: "",
    auditType: "",
    lifecyclePhase: formType === "product" ? "" : undefined,
    deadlineDate: undefined,
    status: "Planned",
    responsiblePersonId: undefined,
    notes: "",
    ...initialData,
  });

  const [auditMetadata, setAuditMetadata] = useState<AuditMetadata | null>(null);
  const [allAuditMetadata, setAllAuditMetadata] = useState<AuditMetadata[]>([]);
  
  // Filtering state
  const [scopeFilter, setScopeFilter] = useState<AuditCategoryType>("all");
  const [lifecyclePhaseFilter, setLifecyclePhaseFilter] = useState<string>("all");
  const [auditorTypeFilter, setAuditorTypeFilter] = useState<AuditorType>("all");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Load all metadata on component mount
  useEffect(() => {
    const loadAllMetadata = async () => {
      const allMetadata = await fetchAuditMetadata();
      setAllAuditMetadata(allMetadata);
      setAuditMetadataCache(allMetadata);
    };
    
    loadAllMetadata();
  }, []);
  
  useEffect(() => {
    if (formData.auditType) {
      loadMetadata(formData.auditType);
    }
  }, [formData.auditType]);

  const loadMetadata = async (auditType: string) => {
    // First check in our local state
    let matchingMetadata = allAuditMetadata.find(m => m.audit_type === auditType);
    
    // If not found, try to fetch it
    if (!matchingMetadata) {
      const metadata = await fetchAuditMetadata(auditType);
      matchingMetadata = metadata.find(m => m.audit_type === auditType) || null;
    }
    
    setAuditMetadata(matchingMetadata);
    
    // If this is a product audit and we have lifecycle phase data, auto-populate it
    if (formType === "product" && matchingMetadata?.lifecycle_phase) {
      setFormData(prev => ({
        ...prev,
        lifecyclePhase: matchingMetadata.lifecycle_phase || ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.auditName || !formData.auditName.trim()) {
      errors.auditName = lang('deviceAudits.form.validation.auditNameRequired');
    }

    if (!formData.auditType || !formData.auditType.trim()) {
      errors.auditType = lang('deviceAudits.form.validation.auditTypeRequired');
    }

    if (formType === "product" && !formData.lifecyclePhase) {
      errors.lifecyclePhase = lang('deviceAudits.form.validation.lifecyclePhaseRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: keyof AuditFormData, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
       
    if (!validateForm()) {
      toast.error(lang('deviceAudits.form.validation.fixErrors'));
      return;
    }

    onSubmit(formData);
  };

  // Determine if lifecycle phase should be disabled
  const isLifecyclePhaseDisabled = formType !== "product" || scopeFilter === "qms";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="h-[70vh] overflow-y-auto p-1">
      {/* Filtering options */}
      <div className="mb-6 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">{lang('deviceAudits.form.filterAuditTypes')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScopeFilter 
            value={scopeFilter} 
            onChange={setScopeFilter}
          />
          
          <LifecyclePhaseFilter 
            value={lifecyclePhaseFilter}
            onChange={setLifecyclePhaseFilter}
            disabled={scopeFilter !== "product"}
          />
          
          <AuditorTypeFilter
            value={auditorTypeFilter}
            onChange={setAuditorTypeFilter}
          />
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="auditName">{lang('deviceAudits.form.auditName')} *</Label>
          <Input
            id="auditName"
            value={formData.auditName}
            onChange={(e) => handleChange("auditName", e.target.value)}
            className={formErrors.auditName ? "border-destructive" : ""}
          />
          {formErrors.auditName && (
            <p className="text-sm text-destructive">{formErrors.auditName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="auditType">{lang('deviceAudits.form.auditType')} *</Label>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <FilteredAuditTypeSelect
                value={formData.auditType}
                onChange={(value) => handleChange("auditType", value)}
                scopeFilter={scopeFilter}
                lifecyclePhaseFilter={lifecyclePhaseFilter}
                auditorTypeFilter={auditorTypeFilter}
                className={formErrors.auditType ? "border-destructive" : ""}
              />
            </div>
            {formData.auditType && <AuditMetadataTooltip auditType={formData.auditType} />}
          </div>
          {formErrors.auditType && (
            <p className="text-sm text-destructive">{formErrors.auditType}</p>
          )}
        </div>

        {formType === "product" && (
          <div className="space-y-2">
            <Label htmlFor="lifecyclePhase">{lang('deviceAudits.form.lifecyclePhase')} *</Label>
            <Select
              value={formData.lifecyclePhase || ""}
              onValueChange={(value) => handleChange("lifecyclePhase", value)}
              disabled={isLifecyclePhaseDisabled}
            >
              <SelectTrigger
                id="lifecyclePhase"
                className={cn("w-full", formErrors.lifecyclePhase ? "border-destructive" : "")}
              >
                <SelectValue placeholder={lang('deviceAudits.form.selectLifecyclePhase')} />
              </SelectTrigger>
              <SelectContent className="z-50">
                {LIFECYCLE_PHASES.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {phase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.lifecyclePhase && (
              <p className="text-sm text-destructive">{formErrors.lifecyclePhase}</p>
            )}
            {isLifecyclePhaseDisabled && scopeFilter === "qms" && (
              <p className="text-xs text-muted-foreground">
                {lang('deviceAudits.form.lifecyclePhaseOnlyForProduct')}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="deadlineDate">{lang('deviceAudits.form.deadlineDate')}</Label>
          <input
            id="deadlineDate"
            type="date"
            value={formData.deadlineDate ? formData.deadlineDate.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const dateValue = e.target.value ? new Date(e.target.value) : undefined;
              handleChange("deadlineDate", dateValue);
            }}
            className="w-full border border-foreground/15 rounded-md p-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{lang('deviceAudits.form.status')}</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleChange("status", value as AuditStatus)}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="Planned">{lang('deviceAudits.form.statusPlanned')}</SelectItem>
              <SelectItem value="In Progress">{lang('deviceAudits.form.statusInProgress')}</SelectItem>
              <SelectItem value="Completed">{lang('deviceAudits.form.statusCompleted')}</SelectItem>
              <SelectItem value="Overdue">{lang('deviceAudits.form.statusOverdue')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsiblePerson">{lang('deviceAudits.form.responsiblePerson')}</Label>
          <ResponsiblePersonSelector
            value={formData.responsiblePersonId}
            onChange={(value) => handleChange("responsiblePersonId", value)}
            companyId={companyId}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">{lang('deviceAudits.form.notes')}</Label>
          <Textarea
            id="notes"
            value={formData.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
          />
        </div>
      </div>
      </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? lang('deviceAudits.form.saving') : lang('deviceAudits.form.saveAudit')}
        </Button>
    </form>
  );
}
