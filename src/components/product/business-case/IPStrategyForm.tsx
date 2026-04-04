import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Shield, AlertTriangle, Code, Loader2, Plus, FileText } from 'lucide-react';
import { useIPStrategy, useAutoSaveIPStrategy, useUpdateIPStrategy, IPStrategyData } from '@/hooks/useIPStrategy';
import { useProductIPAssets } from '@/hooks/useProductIPAssets';
import { ProductIPAssetsList } from './ProductIPAssetsList';
import { AddProductIPAssetDialog } from './AddProductIPAssetDialog';
import { useCompany } from '@/hooks/useCompany';
import { cn } from '@/lib/utils';
import { GenesisStepNotice } from './GenesisStepNotice';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';

const PROTECTION_TYPES = [
  { value: 'patent', label: 'Patents', description: 'Exclusive rights for novel inventions (20-year term)' },
  { value: 'trade_secret', label: 'Trade Secrets', description: 'Valuable confidential information with no expiration' },
  { value: 'copyright', label: 'Copyrights', description: 'Protection for original creative works' },
  { value: 'design_right', label: 'Design Rights', description: 'Protection for product appearance and ornamental features' },
  { value: 'trademark', label: 'Trademarks', description: 'Protection for brand names, logos, and identifiers' },
];

const OWNERSHIP_STATUS_OPTIONS = [
  { value: 'company_owned', label: 'Company Owned', description: 'All IP fully assigned to company' },
  { value: 'founder_owned', label: 'Founder Owned', description: 'IP owned by founders (assignment pending)' },
  { value: 'university_licensed', label: 'University Licensed', description: 'Licensed from academic institution' },
  { value: 'pending_assignment', label: 'Pending Assignment', description: 'Assignment in progress' },
  { value: 'mixed', label: 'Mixed Ownership', description: 'Multiple ownership arrangements' },
];

const FTO_CERTAINTY_OPTIONS = [
  { value: 'uncertain', label: 'Uncertain', description: 'No formal FTO analysis conducted', color: 'bg-red-500' },
  { value: 'preliminary', label: 'Preliminary', description: 'Initial desktop search completed', color: 'bg-amber-500' },
  { value: 'confident', label: 'Confident', description: 'Professional search completed', color: 'bg-blue-500' },
  { value: 'certain', label: 'Certain', description: 'Legal opinion obtained', color: 'bg-green-500' },
];

const FTO_STATUS_OPTIONS = [
  { value: 'full_fto', label: 'Full FTO', description: 'No blocking patents identified', color: 'bg-green-500' },
  { value: 'partial_fto', label: 'Partial FTO', description: 'Some design workarounds needed', color: 'bg-blue-500' },
  { value: 'limited_fto', label: 'Limited FTO', description: 'Significant blocks exist', color: 'bg-amber-500' },
  { value: 'no_fto', label: 'No FTO', description: 'Critical blocking patents', color: 'bg-red-500' },
];

interface IPStrategyFormProps {
  disabled?: boolean;
}

export function IPStrategyForm({ disabled = false }: IPStrategyFormProps) {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const { companyId } = useCompany();

  const { data, isLoading, error } = useIPStrategy(productId);
  const { save, isSaving } = useAutoSaveIPStrategy(productId);
  const updateMutation = useUpdateIPStrategy(productId);
  const { data: linkedAssets, isLoading: assetsLoading } = useProductIPAssets(productId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [ftoNotesLocal, setFtoNotesLocal] = useState('');
  const [ftoMitigationLocal, setFtoMitigationLocal] = useState('');
  const [ipStrategySummaryLocal, setIpStrategySummaryLocal] = useState('');
  const [ipOwnershipNotesLocal, setIpOwnershipNotesLocal] = useState('');
  const [samdLicenseNotesLocal, setSamdLicenseNotesLocal] = useState('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Debounced auto-save for all text fields
  const debouncedSaveTextField = (field: string, value: string) => {
    if (isInitialLoadRef.current || disabled) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const valueToSave = value.trim() === '' ? null : value;
      console.log(`[IPStrategy] Auto-saving ${field}:`, valueToSave);
      updateMutation.mutate({ [field]: valueToSave });
    }, 800);
  };

  // Auto-save FTO Notes with debounce
  useEffect(() => {
    debouncedSaveTextField('fto_notes', ftoNotesLocal);
  }, [ftoNotesLocal]);

  // Auto-save IP Strategy Summary with debounce
  useEffect(() => {
    debouncedSaveTextField('ip_strategy_summary', ipStrategySummaryLocal);
  }, [ipStrategySummaryLocal]);

  // Auto-save IP Ownership Notes with debounce
  useEffect(() => {
    debouncedSaveTextField('ip_ownership_notes', ipOwnershipNotesLocal);
  }, [ipOwnershipNotesLocal]);

  // Auto-save SaMD License Notes with debounce
  useEffect(() => {
    debouncedSaveTextField('samd_license_notes', samdLicenseNotesLocal);
  }, [samdLicenseNotesLocal]);

  // Auto-save FTO Mitigation with debounce
  useEffect(() => {
    debouncedSaveTextField('fto_mitigation_strategy', ftoMitigationLocal);
  }, [ftoMitigationLocal]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Check if in Genesis flow
  const isInGenesisFlow = searchParams.get('returnTo') === 'genesis';

  // Sync local state with server data
  useEffect(() => {
    if (data) {
      setFtoNotesLocal(data.fto_notes || '');
      setFtoMitigationLocal(data.fto_mitigation_strategy || '');
      setIpStrategySummaryLocal(data.ip_strategy_summary || '');
      setIpOwnershipNotesLocal(data.ip_ownership_notes || '');
      setSamdLicenseNotesLocal(data.samd_license_notes || '');
      // Mark initial load complete after data loads
      isInitialLoadRef.current = false;
    }
  }, [data]);

  const handleFieldChange = (field: keyof IPStrategyData, value: unknown) => {
    if (disabled) return;
    
    // Check completion status based on core fields being filled
    // Complete if: (has IP assets OR FTO assessment) OR no_ip_applicable
    const updatedData = { ...data, [field]: value };
    const hasFTOAssessment = Boolean(updatedData.fto_certainty && updatedData.fto_status);
    const hasIPAssets = (linkedAssets?.length ?? 0) > 0;
    const noIPApplicable = updatedData.no_ip_applicable === true;
    const isComplete = noIPApplicable || hasIPAssets || hasFTOAssessment;

    save({ 
      [field]: value,
      ip_strategy_completed: isComplete 
    });
  };

  const handleProtectionTypeToggle = (type: string, checked: boolean) => {
    if (disabled) return;
    const currentTypes = data?.ip_protection_types || [];
    const newTypes = checked 
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    handleFieldChange('ip_protection_types', newTypes);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading IP Strategy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Error loading IP strategy data
      </div>
    );
  }

  const protectionTypes = data?.ip_protection_types || [];
  const isSoftwareProject = data?.is_software_project || false;
  const noIPApplicable = data?.no_ip_applicable || false;
  const showOwnershipAlert = data?.ip_ownership_status &&
    ['founder_owned', 'university_licensed', 'pending_assignment'].includes(data.ip_ownership_status);

  // Genesis flow border logic: complete if (no_ip_applicable OR IP assets) AND FTO assessment
  const hasIPAssets = (linkedAssets?.length ?? 0) > 0;
  const hasFTOAssessment = Boolean(data?.fto_certainty && data?.fto_status);
  const ipAssessmentDone = noIPApplicable || hasIPAssets;
  const isStepComplete = ipAssessmentDone && hasFTOAssessment;

  // Show mitigation field when FTO is limited or no_fto
  const needsMitigationStrategy = data?.fto_status === 'limited_fto' || data?.fto_status === 'no_fto';

  const getNoIPBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (noIPApplicable) return 'border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20';
    return '';
  };

  const getIPAssetsBorderClass = () => {
    if (!isInGenesisFlow || noIPApplicable) return '';
    if (hasIPAssets) return 'border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20';
    return 'border-2 border-amber-400 bg-amber-50/30 dark:bg-amber-950/20';
  };

  const getFTOBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (hasFTOAssessment) return 'border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20';
    return 'border-2 border-amber-400 bg-amber-50/30 dark:bg-amber-950/20';
  };

  return (
    <div className="space-y-6">
      <GenesisStepNotice stepNumber={22} stepName="IP Strategy" />
      {/* Header with save indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            IP Strategy & Freedom to Operate
          </h2>
          <p className="text-muted-foreground mt-1">
            Map your defensive moat and assess FTO risk for investor due diligence
          </p>
        </div>
        {isSaving && (
          <Badge variant="outline" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </Badge>
        )}
      </div>

      {/* No IP Applicable Option */}
      <Card id="genesis-ip-assessment" className={cn('transition-colors', getNoIPBorderClass())}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="no-ip-toggle" className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                No Proprietary IP
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable if there is no proprietary intellectual property to protect for this product
              </p>
            </div>
            <Switch
              id="no-ip-toggle"
              checked={noIPApplicable}
              onCheckedChange={(checked) => handleFieldChange('no_ip_applicable', checked)}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ownership Alert Banner */}
      {showOwnershipAlert && !noIPApplicable && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">
              IP Ownership Alert
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-200">
              Your IP is not yet fully assigned to the company. Investors will scrutinize ownership status during due diligence. 
              Consider completing IP assignment before investor conversations.
            </p>
          </div>
        </div>
      )}

      {/* Strategy Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            IP Strategy Summary
          </CardTitle>
          <CardDescription>
            Describe your overall intellectual property protection strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe your core innovation and how you plan to protect it. What makes your IP defensible? Include key patents, trade secrets, or other protections..."
            value={ipStrategySummaryLocal}
            onChange={(e) => setIpStrategySummaryLocal(e.target.value)}
            disabled={disabled}
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Protection Types - Planning Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Protection Types
            <HelpTooltip content="Select planned IP types to filter options when adding assets. This helps focus your IP strategy on relevant protection mechanisms." />
          </CardTitle>
          <CardDescription>
            Select which IP protection types apply to this product (filters asset creation options)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {PROTECTION_TYPES.map((type) => (
              <label
                key={type.value}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors relative",
                  protectionTypes.includes(type.value) 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Checkbox
                  checked={protectionTypes.includes(type.value)}
                  onCheckedChange={(checked) => handleProtectionTypeToggle(type.value, !!checked)}
                  disabled={disabled}
                />
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="font-medium text-sm">{type.label}</span>
                  <HelpTooltip content={type.description} className="h-3.5 w-3.5 shrink-0" />
                </div>
              </label>
            ))}
          </div>
          {protectionTypes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              {protectionTypes.length} type(s) selected — only these will appear when adding IP assets
            </p>
          )}
        </CardContent>
      </Card>

      {/* IP Assets for This Product */}
      <Card id="genesis-ip-assets" className={cn('transition-colors', getIPAssetsBorderClass())}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                IP Assets for This Product
              </CardTitle>
              <CardDescription>
                Register patents, trademarks, trade secrets, and other IP linked to this product
              </CardDescription>
            </div>
            {!disabled && companyId && (
              <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Asset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {assetsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ProductIPAssetsList
              assets={linkedAssets || []}
              productId={productId || ''}
              disabled={disabled}
            />
          )}
        </CardContent>
      </Card>

      {/* Add IP Asset Dialog */}
      {companyId && productId && (
        <AddProductIPAssetDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          companyId={companyId}
          productId={productId}
          linkedAssetIds={(linkedAssets || []).map(a => a.id)}
          protectionTypesFilter={protectionTypes}
        />
      )}

      {/* IP Ownership */}
      <Card>
        <CardHeader>
          <CardTitle>IP Ownership Status</CardTitle>
          <CardDescription>
            Who currently owns the core IP? This is critical for investor due diligence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={data?.ip_ownership_status || ''}
            onValueChange={(value) => handleFieldChange('ip_ownership_status', value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ownership status" />
            </SelectTrigger>
            <SelectContent>
              {OWNERSHIP_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <span className="font-medium">{option.label}</span>
                    <span className="text-muted-foreground ml-2">— {option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <Label htmlFor="ownership-notes">Ownership Notes</Label>
            <Textarea
              id="ownership-notes"
              placeholder="Add details about IP assignments, licenses, or pending transfers..."
              value={ipOwnershipNotesLocal}
              onChange={(e) => setIpOwnershipNotesLocal(e.target.value)}
              disabled={disabled}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* FTO Assessment - Two Dimensional */}
      <Card id="genesis-fto-assessment" className={cn('transition-colors', getFTOBorderClass())}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Freedom to Operate (FTO) Assessment</CardTitle>
              <CardDescription>
                Assess your ability to commercialize without infringing on existing patents
              </CardDescription>
            </div>
            {updateMutation.isPending && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* FTO Certainty */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Analysis Certainty Level</Label>
            <p className="text-xs text-muted-foreground">How confident are you in your FTO assessment?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FTO_CERTAINTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange('fto_certainty', option.value)}
                  disabled={disabled}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all",
                    data?.fto_certainty === option.value 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full mb-2", option.color)} />
                  <span className="text-sm font-medium block">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FTO Status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">FTO Status</Label>
            <p className="text-xs text-muted-foreground">What is your current freedom to operate?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FTO_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange('fto_status', option.value)}
                  disabled={disabled}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all",
                    data?.fto_status === option.value 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full mb-2", option.color)} />
                  <span className="text-sm font-medium block">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mitigation Strategy - shown when FTO is limited */}
          {needsMitigationStrategy && (
            <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <Label htmlFor="fto-mitigation" className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    FTO Mitigation Strategy Required
                  </Label>
                  <p className="text-xs text-amber-700 dark:text-amber-200 mt-1">
                    Limited or No FTO requires a documented strategy to overcome blocking patents (e.g., license acquisition, design-around, challenge validity)
                  </p>
                </div>
              </div>
              <Textarea
                id="fto-mitigation"
                placeholder="Describe your strategy to overcome FTO limitations...

Examples:
• License acquisition from patent holder
• Design-around to avoid infringement  
• Patent validity challenge
• Wait for patent expiration (date: ...)
• Geographic restrictions to avoid jurisdictions"
                value={ftoMitigationLocal}
                onChange={(e) => setFtoMitigationLocal(e.target.value)}
                disabled={disabled}
                className="min-h-[120px]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fto-date">FTO Analysis Date</Label>
              <Input
                id="fto-date"
                type="date"
                value={data?.fto_analysis_date || ''}
                onChange={(e) => handleFieldChange('fto_analysis_date', e.target.value)}
                disabled={disabled}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="fto-notes">Additional FTO Notes</Label>
            <Textarea
              id="fto-notes"
              placeholder="Document your FTO analysis, key patents reviewed, and any additional considerations..."
              value={ftoNotesLocal}
              onChange={(e) => setFtoNotesLocal(e.target.value)}
              disabled={disabled}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* SaMD License Audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Software / SaMD License Audit
          </CardTitle>
          <CardDescription>
            For software-based medical devices, open source license compliance is critical
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-1">
              <Label htmlFor="software-toggle" className="font-medium">
                Is this a software project?
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable if this includes SaMD or significant software components
              </p>
            </div>
            <Switch
              id="software-toggle"
              checked={isSoftwareProject}
              onCheckedChange={(checked) => handleFieldChange('is_software_project', checked)}
              disabled={disabled}
            />
          </div>

          {isSoftwareProject && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label className="font-medium">
                    Open Source License Audit Completed?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Have you reviewed all third-party dependencies for license compliance?
                  </p>
                </div>
                <Switch
                  checked={data?.samd_license_audit_completed || false}
                  onCheckedChange={(checked) => handleFieldChange('samd_license_audit_completed', checked)}
                  disabled={disabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="space-y-1">
                  <Label className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    GPL / Copyleft Code Present?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    "Viral" licenses like GPL may require you to open-source your code
                  </p>
                </div>
                <Switch
                  checked={data?.samd_gpl_code_present || false}
                  onCheckedChange={(checked) => handleFieldChange('samd_gpl_code_present', checked)}
                  disabled={disabled}
                />
              </div>

              {data?.samd_gpl_code_present && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-200">
                    <strong>Warning:</strong> GPL-licensed code in proprietary medical device software can create 
                    significant IP complications. Consult legal counsel before proceeding.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="samd-notes">License Notes</Label>
                <Textarea
                  id="samd-notes"
                  placeholder="Document third-party libraries, their licenses, and any compliance concerns..."
                  value={samdLicenseNotesLocal}
                  onChange={(e) => setSamdLicenseNotesLocal(e.target.value)}
                  disabled={disabled}
                  className="mt-2"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
