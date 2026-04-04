import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Save, Loader2, Plus, X, Stethoscope, Calculator, BookX } from "lucide-react";
import { useClinicalEvidence } from "@/hooks/useClinicalEvidence";
import { toast } from "sonner";
import { SampleSizeCalculator } from "@/components/clinical/SampleSizeCalculator";
import { EvidenceGuidanceBanner } from "@/components/clinical/EvidenceGuidanceBanner";
import { useTranslation } from "@/hooks/useTranslation";

interface ClinicalEvidenceFormProps {
  productId: string;
  companyId: string;
  isInGenesisFlow?: boolean;
}

interface KOL {
  name: string;
  institution: string;
  role: 'PI' | 'Advisor' | 'Consultant';
  engaged: boolean;
}

type LiteratureRelevance = 'direct' | 'analogous' | 'supportive';

interface LiteratureRef {
  citation: string;
  relevance: LiteratureRelevance;
  url?: string;
}

export function ClinicalEvidenceForm({ productId, companyId, isInGenesisFlow = false }: ClinicalEvidenceFormProps) {
  const { lang } = useTranslation();
  const { data, isLoading, save, isSaving } = useClinicalEvidence(productId, companyId);

  const [formData, setFormData] = useState({
    regulator_requirements: "",
    payer_requirements: "",
    physician_requirements: "",
    study_type: "" as 'RCT' | 'Single-arm' | 'Observational' | 'Registry' | 'Other' | '',
    study_endpoints: [] as string[],
    study_sample_size: "",
    study_duration_months: "",
    study_control: "",
    study_start_date: "",
    study_end_date: "",
    study_budget: "",
    study_budget_currency: "USD",
    kol_strategy: "",
    kols: [] as KOL[],
    pmcf_required: false,
    pmcf_plan: "",
    supporting_literature: [] as LiteratureRef[],
    no_literature_found: false,
  });

  const [newEndpoint, setNewEndpoint] = useState("");
  const [newKOL, setNewKOL] = useState<KOL>({ name: "", institution: "", role: "Advisor", engaged: false });
  const [newLit, setNewLit] = useState<LiteratureRef>({ citation: "", relevance: "supportive", url: "" });
  const [showCalculator, setShowCalculator] = useState(false);

  // Track whether initial data has been loaded from DB
  const hasLoadedInitialData = useRef(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUserEditedRef = useRef(false);

  // Only populate formData from DB on initial load, not on refetches after auto-save
  useEffect(() => {
    if (data && !hasLoadedInitialData.current) {
      hasLoadedInitialData.current = true;
      const studyDesign = data.study_design as any || {};
      setFormData({
        regulator_requirements: data.regulator_requirements || "",
        payer_requirements: data.payer_requirements || "",
        physician_requirements: data.physician_requirements || "",
        study_type: studyDesign.type || "",
        study_endpoints: studyDesign.endpoints || [],
        study_sample_size: studyDesign.sample_size?.toString() || "",
        study_duration_months: studyDesign.duration_months?.toString() || "",
        study_control: studyDesign.control || "",
        study_start_date: data.study_start_date || "",
        study_end_date: data.study_end_date || "",
        study_budget: data.study_budget?.toString() || "",
        study_budget_currency: data.study_budget_currency || "USD",
        kol_strategy: data.kol_strategy || "",
        kols: (data.kols as KOL[]) || [],
        pmcf_required: data.pmcf_required || false,
        pmcf_plan: data.pmcf_plan || "",
        supporting_literature: (data.supporting_literature as LiteratureRef[]) || [],
        no_literature_found: (data as any).no_literature_found || false,
      });
    }
  }, [data]);

  // Wrapper for user-driven form updates (marks as edited for auto-save)
  const updateFormData = useCallback((updater: React.SetStateAction<typeof formData>) => {
    hasUserEditedRef.current = true;
    setFormData(updater);
  }, []);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    // Only save if user has made edits
    if (!hasUserEditedRef.current) return;

    try {
      await save({
        regulator_requirements: formData.regulator_requirements || null,
        payer_requirements: formData.payer_requirements || null,
        physician_requirements: formData.physician_requirements || null,
        study_design: {
          type: formData.study_type || null,
          endpoints: formData.study_endpoints,
          sample_size: formData.study_sample_size ? parseInt(formData.study_sample_size) : null,
          duration_months: formData.study_duration_months ? parseInt(formData.study_duration_months) : null,
          control: formData.study_control || null,
        },
        study_start_date: formData.study_start_date || null,
        study_end_date: formData.study_end_date || null,
        study_budget: formData.study_budget ? parseFloat(formData.study_budget) : null,
        study_budget_currency: formData.study_budget_currency,
        kol_strategy: formData.kol_strategy || null,
        kols: formData.kols,
        pmcf_required: formData.pmcf_required,
        pmcf_plan: formData.pmcf_plan || null,
        supporting_literature: formData.supporting_literature,
        no_literature_found: formData.no_literature_found,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [formData, save]);

  // Auto-save effect with debounce - only runs after user edits
  useEffect(() => {
    // Skip auto-save until user has made edits
    if (!hasUserEditedRef.current) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1000ms debounce)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, performAutoSave]);

  const addEndpoint = () => {
    if (!newEndpoint.trim()) return;
    updateFormData({ ...formData, study_endpoints: [...formData.study_endpoints, newEndpoint] });
    setNewEndpoint("");
  };

  const removeEndpoint = (index: number) => {
    updateFormData({ ...formData, study_endpoints: formData.study_endpoints.filter((_, i) => i !== index) });
  };

  const addKOL = () => {
    if (!newKOL.name.trim()) return;
    updateFormData({ ...formData, kols: [...formData.kols, newKOL] });
    setNewKOL({ name: "", institution: "", role: "Advisor", engaged: false });
  };

  const removeKOL = (index: number) => {
    updateFormData({ ...formData, kols: formData.kols.filter((_, i) => i !== index) });
  };

  const addLiterature = () => {
    if (!newLit.citation.trim()) return;
    updateFormData({ ...formData, supporting_literature: [...formData.supporting_literature, newLit] });
    setNewLit({ citation: "", relevance: "supportive", url: "" });
  };

  const removeLiterature = (index: number) => {
    updateFormData({ ...formData, supporting_literature: formData.supporting_literature.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    try {
      await save({
        regulator_requirements: formData.regulator_requirements || null,
        payer_requirements: formData.payer_requirements || null,
        physician_requirements: formData.physician_requirements || null,
        study_design: {
          type: formData.study_type || null,
          endpoints: formData.study_endpoints,
          sample_size: formData.study_sample_size ? parseInt(formData.study_sample_size) : null,
          duration_months: formData.study_duration_months ? parseInt(formData.study_duration_months) : null,
          control: formData.study_control || null,
        },
        study_start_date: formData.study_start_date || null,
        study_end_date: formData.study_end_date || null,
        study_budget: formData.study_budget ? parseFloat(formData.study_budget) : null,
        study_budget_currency: formData.study_budget_currency,
        kol_strategy: formData.kol_strategy || null,
        kols: formData.kols,
        pmcf_required: formData.pmcf_required,
        pmcf_plan: formData.pmcf_plan || null,
        supporting_literature: formData.supporting_literature,
        no_literature_found: formData.no_literature_found,
      });
      toast.success(lang('clinicalTrials.evidencePlan.toasts.saveSuccess'));
    } catch (error) {
      toast.error(lang('clinicalTrials.evidencePlan.toasts.saveError'));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const studyTypes = ["RCT", "Single-arm", "Observational", "Registry", "Other"];
  const currencySymbol = formData.study_budget_currency === "EUR" ? "€" : formData.study_budget_currency === "GBP" ? "£" : "$";

  // Completion checks for genesis flow borders
  // Evidence Requirements complete when ALL THREE fields are filled
  const hasAllEvidenceRequirements = Boolean(
    formData.regulator_requirements?.trim() &&
    formData.payer_requirements?.trim() &&
    formData.physician_requirements?.trim()
  );

  // Check if any evidence field has partial data (for yellow border)
  const hasPartialEvidenceRequirements = Boolean(
    formData.regulator_requirements?.trim() ||
    formData.payer_requirements?.trim() ||
    formData.physician_requirements?.trim()
  );

  // Study Design complete when ALL fields are filled (including dates and budget)
  const hasAllStudyDesign = Boolean(
    formData.study_type &&
    formData.study_sample_size?.trim() &&
    formData.study_duration_months?.trim() &&
    formData.study_control?.trim() &&
    formData.study_endpoints.length > 0 &&
    formData.study_start_date?.trim() &&
    formData.study_end_date?.trim() &&
    formData.study_budget?.trim()
  );

  // Check if any study design field has partial data (for yellow border)
  const hasPartialStudyDesign = Boolean(
    formData.study_type ||
    formData.study_sample_size?.trim() ||
    formData.study_duration_months?.trim() ||
    formData.study_control?.trim() ||
    formData.study_endpoints.length > 0 ||
    formData.study_start_date?.trim() ||
    formData.study_end_date?.trim() ||
    formData.study_budget?.trim()
  );

  // Border logic:
  // - Green: ALL fields in section filled
  // - Yellow: Partial data (some but not all fields) OR both sections empty
  // - No border: Other section is complete
  const getEvidenceBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (hasAllEvidenceRequirements) return 'border-2 border-emerald-500 bg-emerald-50/30';
    return 'border-2 border-amber-400 bg-amber-50/30'; // Not yet complete
  };

  const getStudyDesignBorderClass = () => {
    return ''; // Study Design is not required for Genesis completion
  };

  // Supporting Literature border logic:
  // - Green: Has citations OR "no literature found" is checked
  // - Yellow: Empty and not checked
  const hasLiteratureComplete = formData.supporting_literature.length > 0 || formData.no_literature_found;
  
  const getLiteratureBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (hasLiteratureComplete) return 'border-2 border-emerald-500 bg-emerald-50/30';
    return 'border-2 border-amber-400 bg-amber-50/30';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {lang('clinicalTrials.evidencePlan.title')}
        </CardTitle>
        <CardDescription>
          {lang('clinicalTrials.evidencePlan.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Class Guidance Banner */}
        <EvidenceGuidanceBanner productId={productId} />

        {/* Evidence Requirements by Stakeholder */}
        <div id="genesis-evidence-requirements" className={`space-y-4 p-4 rounded-lg transition-colors ${getEvidenceBorderClass() || 'bg-secondary/30'}`}>
          <h3 className="font-semibold">{lang('clinicalTrials.evidencePlan.stakeholderRequirements.title')}</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{lang('clinicalTrials.evidencePlan.stakeholderRequirements.regulator')}</Label>
              <Textarea
                value={formData.regulator_requirements}
                onChange={(e) => updateFormData({ ...formData, regulator_requirements: e.target.value })}
                placeholder={lang('clinicalTrials.evidencePlan.stakeholderRequirements.regulatorPlaceholder')}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang('clinicalTrials.evidencePlan.stakeholderRequirements.payer')}</Label>
              <Textarea
                value={formData.payer_requirements}
                onChange={(e) => updateFormData({ ...formData, payer_requirements: e.target.value })}
                placeholder={lang('clinicalTrials.evidencePlan.stakeholderRequirements.payerPlaceholder')}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang('clinicalTrials.evidencePlan.stakeholderRequirements.physician')}</Label>
              <Textarea
                value={formData.physician_requirements}
                onChange={(e) => updateFormData({ ...formData, physician_requirements: e.target.value })}
                placeholder={lang('clinicalTrials.evidencePlan.stakeholderRequirements.physicianPlaceholder')}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Study Design */}
        <div className={`space-y-4 p-4 rounded-lg transition-colors ${getStudyDesignBorderClass() || 'bg-secondary/30'}`}>
          <h3 className="font-semibold">{lang('clinicalTrials.evidencePlan.studyDesign.title')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang('clinicalTrials.evidencePlan.studyDesign.studyType')}</Label>
              <Select
                value={formData.study_type}
                onValueChange={(v: any) => updateFormData({ ...formData, study_type: v === '__clear__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('clinicalTrials.evidencePlan.studyDesign.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__clear__" className="text-muted-foreground italic">
                    — Clear selection —
                  </SelectItem>
                  {studyTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {lang('clinicalTrials.evidencePlan.studyDesign.sampleSize')}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-primary hover:text-primary"
                  onClick={() => setShowCalculator(true)}
                >
                  <Calculator className="h-3.5 w-3.5 mr-1" />
                  {lang('clinicalTrials.evidencePlan.studyDesign.calculate')}
                </Button>
              </Label>
              <Input
                type="number"
                value={formData.study_sample_size}
                onChange={(e) => updateFormData({ ...formData, study_sample_size: e.target.value })}
                placeholder={lang('clinicalTrials.evidencePlan.studyDesign.sampleSizePlaceholder')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang('clinicalTrials.evidencePlan.studyDesign.duration')}</Label>
              <Input
                type="number"
                value={formData.study_duration_months}
                onChange={(e) => updateFormData({ ...formData, study_duration_months: e.target.value })}
                placeholder={lang('clinicalTrials.evidencePlan.studyDesign.durationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang('clinicalTrials.evidencePlan.studyDesign.control')}</Label>
              <Input
                value={formData.study_control}
                onChange={(e) => updateFormData({ ...formData, study_control: e.target.value })}
                placeholder={lang('clinicalTrials.evidencePlan.studyDesign.controlPlaceholder')}
              />
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-2">
            <Label>{lang('clinicalTrials.evidencePlan.studyDesign.endpoints')}</Label>
            <div className="flex gap-2">
              <Input
                value={newEndpoint}
                onChange={(e) => setNewEndpoint(e.target.value)}
                placeholder={lang('clinicalTrials.evidencePlan.studyDesign.endpointsPlaceholder')}
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={addEndpoint}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.study_endpoints.map((ep, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {ep}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeEndpoint(index)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{lang('clinicalTrials.evidencePlan.studyDesign.startDate')}</Label>
              <Input
                type="date"
                value={formData.study_start_date}
                onChange={(e) => updateFormData({ ...formData, study_start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang('clinicalTrials.evidencePlan.studyDesign.endDate')}</Label>
              <Input
                type="date"
                value={formData.study_end_date}
                onChange={(e) => updateFormData({ ...formData, study_end_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang('clinicalTrials.evidencePlan.studyDesign.budget', { currency: currencySymbol })}</Label>
              <Input
                type="number"
                value={formData.study_budget}
                onChange={(e) => updateFormData({ ...formData, study_budget: e.target.value })}
                placeholder="500000"
              />
            </div>
          </div>
        </div>

        {/* KOL Network */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            {lang('clinicalTrials.evidencePlan.kolNetwork.title')}
          </h3>

          <div className="space-y-2">
            <Label>{lang('clinicalTrials.evidencePlan.kolNetwork.strategy')}</Label>
            <Textarea
              value={formData.kol_strategy}
              onChange={(e) => updateFormData({ ...formData, kol_strategy: e.target.value })}
              placeholder={lang('clinicalTrials.evidencePlan.kolNetwork.strategyPlaceholder')}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 items-end">
            <Input
              value={newKOL.name}
              onChange={(e) => setNewKOL({ ...newKOL, name: e.target.value })}
              placeholder={lang('clinicalTrials.evidencePlan.kolNetwork.name')}
            />
            <Input
              value={newKOL.institution}
              onChange={(e) => setNewKOL({ ...newKOL, institution: e.target.value })}
              placeholder={lang('clinicalTrials.evidencePlan.kolNetwork.institution')}
            />
            <Select value={newKOL.role} onValueChange={(v: any) => setNewKOL({ ...newKOL, role: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PI">{lang('clinicalTrials.evidencePlan.kolNetwork.roles.pi')}</SelectItem>
                <SelectItem value="Advisor">{lang('clinicalTrials.evidencePlan.kolNetwork.roles.advisor')}</SelectItem>
                <SelectItem value="Consultant">{lang('clinicalTrials.evidencePlan.kolNetwork.roles.consultant')}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={addKOL}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {formData.kols.map((kol, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{kol.role}</Badge>
                  <span className="font-medium">{kol.name}</span>
                  {kol.institution && <span className="text-muted-foreground text-sm">({kol.institution})</span>}
                  {kol.engaged && <Badge variant="secondary" className="text-xs">{lang('clinicalTrials.evidencePlan.kolNetwork.engaged')}</Badge>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeKOL(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* PMCF */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{lang('clinicalTrials.evidencePlan.pmcf.title')}</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="pmcf-toggle">{lang('clinicalTrials.evidencePlan.pmcf.required')}</Label>
              <Switch
                id="pmcf-toggle"
                checked={formData.pmcf_required}
                onCheckedChange={(v) => updateFormData({ ...formData, pmcf_required: v })}
              />
            </div>
          </div>
          {formData.pmcf_required && (
            <div className="space-y-2">
              <Label>{lang('clinicalTrials.evidencePlan.pmcf.plan')}</Label>
              <Textarea
                value={formData.pmcf_plan}
                onChange={(e) => updateFormData({ ...formData, pmcf_plan: e.target.value })}
                placeholder={lang('clinicalTrials.evidencePlan.pmcf.planPlaceholder')}
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Supporting Literature */}
        <div id="genesis-supporting-literature" className={`space-y-4 p-4 rounded-lg transition-colors ${getLiteratureBorderClass() || 'bg-secondary/30'}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{lang('clinicalTrials.evidencePlan.literature.title')}</h3>
            <div className="flex items-center gap-2">
              <Checkbox
                id="no-literature"
                checked={formData.no_literature_found}
                onCheckedChange={(checked) => updateFormData({ ...formData, no_literature_found: checked === true })}
                disabled={formData.supporting_literature.length > 0}
              />
              <Label 
                htmlFor="no-literature" 
                className={`text-sm cursor-pointer flex items-center gap-1.5 ${formData.supporting_literature.length > 0 ? 'text-muted-foreground' : ''}`}
              >
                <BookX className="h-4 w-4" />
                No relevant literature found
              </Label>
            </div>
          </div>

          {!formData.no_literature_found && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input
                  value={newLit.citation}
                  onChange={(e) => setNewLit({ ...newLit, citation: e.target.value })}
                  placeholder={lang('clinicalTrials.evidencePlan.literature.citation')}
                  className="md:col-span-2"
                />
                <Select
                  value={newLit.relevance}
                  onValueChange={(v: LiteratureRelevance) => setNewLit({ ...newLit, relevance: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relevance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">
                      <div className="flex flex-col">
                        <span className="font-medium">Direct</span>
                        <span className="text-xs text-muted-foreground">Same device type, same indication</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="analogous">
                      <div className="flex flex-col">
                        <span className="font-medium">Analogous</span>
                        <span className="text-xs text-muted-foreground">Similar mechanism or population</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="supportive">
                      <div className="flex flex-col">
                        <span className="font-medium">Supportive</span>
                        <span className="text-xs text-muted-foreground">General clinical background</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    value={newLit.url || ""}
                    onChange={(e) => setNewLit({ ...newLit, url: e.target.value })}
                    placeholder={lang('clinicalTrials.evidencePlan.literature.url')}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addLiterature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {formData.supporting_literature.map((lit, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={lit.relevance === 'direct' ? 'default' : lit.relevance === 'analogous' ? 'secondary' : 'outline'}
                        className={
                          lit.relevance === 'direct' ? 'bg-emerald-600 text-white' :
                          lit.relevance === 'analogous' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-gray-100 text-gray-600'
                        }
                      >
                        {lit.relevance === 'direct' ? 'Direct (+3)' : 
                         lit.relevance === 'analogous' ? 'Analogous (+2)' : 
                         'Supportive (+1)'}
                      </Badge>
                      <span className="font-medium">{lit.citation}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeLiterature(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {formData.no_literature_found && (
            <div className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-md flex items-center gap-2">
              <BookX className="h-4 w-4" />
              No relevant supporting literature has been identified for this device.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {lang('clinicalTrials.evidencePlan.saveButton')}
          </Button>
        </div>

        <SampleSizeCalculator
          open={showCalculator}
          onOpenChange={setShowCalculator}
          onApply={(sampleSize) => updateFormData({ ...formData, study_sample_size: sampleSize.toString() })}
        />
      </CardContent>
    </Card>
  );
}
