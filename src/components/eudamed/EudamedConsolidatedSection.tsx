import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Building,
  User,
  Globe,
  Phone,
  Mail,
  FileText,
  Shield,
  Settings,
  Stethoscope,
  Package,
  AlertTriangle,
  Pencil,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react';
import { EudamedEnrichButton } from './EudamedEnrichButton';
import { EudamedSubmissionExport } from './EudamedSubmissionExport';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';

interface EudamedConsolidatedSectionProps {
  productData: any;
  companyId?: string;
  onDataRefresh?: () => void;
  // Live value props for display (read-only, sourced from other SSOT areas)
  registrationNumber?: string;
  registrationStatus?: string;
  registrationDate?: Date | string;
  ceMarkStatus?: string;
  conformityAssessmentRoute?: string;
  marketAuthorizationHolder?: string;
  notifiedBody?: string;
  isLoading?: boolean;
}

export function EudamedConsolidatedSection({
  productData,
  companyId,
  onDataRefresh,
  registrationNumber,
  registrationStatus,
  registrationDate,
  ceMarkStatus,
  conformityAssessmentRoute,
  marketAuthorizationHolder,
  notifiedBody,
  isLoading
}: EudamedConsolidatedSectionProps) {
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  
  // Read accordion section from URL, default to device-identity
  const sectionFromUrl = searchParams.get('eudamedSection');
  const [activeSection, setActiveSection] = useState<string>(sectionFromUrl || "device-identity");
  const [isSyncing, setIsSyncing] = useState(false);

  // Warning dialog state for EUDAMED-synced fields
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ fieldName: string; value: string; onChange: (value: string) => void } | null>(null);
  const [acknowledgedFields, setAcknowledgedFields] = useState<Set<string>>(new Set());

  // Fetch device data from devices table using available EUDAMED identifiers (fallback chain)
  const basicUdiDi = productData?.basic_udi_di || productData?.eudamed_basic_udi_di_code;
  const eudamedDeviceName = productData?.eudamed_device_name;
  const eudamedIdSrn = productData?.eudamed_id_srn;
  const hasAnyEudamedKey = !!basicUdiDi || !!eudamedDeviceName || !!eudamedIdSrn;

  const { data: deviceData } = useQuery({
    queryKey: ['device-by-eudamed-keys', basicUdiDi, eudamedDeviceName, eudamedIdSrn],
    queryFn: async () => {
      const selectFields = 'trade_names, manufacturer_id_srn, device_name, device_model, risk_class, status, implantable, measuring, reusable, active, administering_medicine, single_use, sterilization_need, sterile, contain_latex, reprocessed, direct_marking, max_reuses, placed_on_the_market, applicable_legislation, issuing_agency, quantity_of_device, nomenclature_codes, manufacturer_organization, manufacturer_status, manufacturer_address, manufacturer_postcode, manufacturer_country, manufacturer_phone, manufacturer_email, manufacturer_website, manufacturer_prrc_first_name, manufacturer_prrc_last_name, manufacturer_prrc_email, manufacturer_prrc_phone, manufacturer_prrc_responsible_for, manufacturer_prrc_address, manufacturer_prrc_postcode, manufacturer_prrc_country, manufacturer_ca_name, manufacturer_ca_address, manufacturer_ca_postcode, manufacturer_ca_country, manufacturer_ca_email, manufacturer_ca_phone';

      // Try basic_udi_di_code first
      if (basicUdiDi) {
        const { data } = await supabase
          .from('devices')
          .select(selectFields)
          .eq('basic_udi_di_code', basicUdiDi)
          .limit(1);
        if (data?.[0]) return data[0];
      }

      // Fallback: device_name + manufacturer SRN
      if (eudamedDeviceName && eudamedIdSrn) {
        const { data } = await supabase
          .from('devices')
          .select(selectFields)
          .eq('device_name', eudamedDeviceName)
          .eq('manufacturer_id_srn', eudamedIdSrn)
          .limit(1);
        if (data?.[0]) return data[0];
      }

      // Fallback: device_name only
      if (eudamedDeviceName) {
        const { data } = await supabase
          .from('devices')
          .select(selectFields)
          .eq('device_name', eudamedDeviceName)
          .limit(1);
        if (data?.[0]) return data[0];
      }

      return null;
    },
    enabled: hasAnyEudamedKey,
  });

  // Translation helper with fallback
  const t = (key: string, fallback: string) => {
    const v = lang(key);
    return v === key ? fallback : v;
  };

  // Sync active section when URL changes
  useEffect(() => {
    if (sectionFromUrl && sectionFromUrl !== activeSection) {
      setActiveSection(sectionFromUrl);
    }
  }, [sectionFromUrl]);

  // ── Change diff tracker: compare eudamed_* fields vs local/device values ──
  interface ChangedField { field: string; eudamedValue: string; currentValue: string; status: 'Changed' | 'New' | 'Unchanged' }
  
  const getChangedFields = React.useCallback((): ChangedField[] => {
    const p = productData;
    const d = deviceData;
    if (!p) return [];

    const resolve = (...vals: any[]) => {
      for (const v of vals) { if (v !== null && v !== undefined && String(v).trim()) return String(v).trim(); }
      return '';
    };

    const comparisons: { field: string; eudamedVal: string; currentVal: string }[] = [
      { field: 'Device Name', eudamedVal: resolve(p.eudamed_device_name, d?.device_name), currentVal: resolve(p.name) },
      { field: 'Trade Name', eudamedVal: resolve(p.eudamed_trade_names, d?.trade_names), currentVal: resolve(p.trade_name) },
      { field: 'Device Model', eudamedVal: resolve(p.eudamed_device_model, d?.device_model), currentVal: resolve(p.model_reference) },
      { field: 'Basic UDI-DI', eudamedVal: resolve(p.eudamed_basic_udi_di_code), currentVal: resolve(p.basic_udi_di) },
      { field: 'UDI-DI', eudamedVal: resolve(p.eudamed_basic_udi_di_code ? p.udi_di : ''), currentVal: resolve(p.udi_di) },
      { field: 'Risk Class', eudamedVal: resolve(p.eudamed_risk_class), currentVal: resolve(p.class) },
      { field: 'Issuing Agency', eudamedVal: resolve(p.eudamed_issuing_agency, d?.issuing_agency), currentVal: resolve(p.key_features?.eudamed_data?.issuing_agency) },
      { field: 'Applicable Legislation', eudamedVal: resolve(p.eudamed_applicable_legislation, d?.applicable_legislation), currentVal: '' },
      { field: 'Manufacturer SRN', eudamedVal: resolve(p.eudamed_id_srn, d?.manufacturer_id_srn), currentVal: '' },
    ];

    return comparisons.map(c => {
      if (!c.eudamedVal && !c.currentVal) return null;
      if (!c.eudamedVal && c.currentVal) return { field: c.field, eudamedValue: '', currentValue: c.currentVal, status: 'New' as const };
      if (c.eudamedVal && c.currentVal && c.eudamedVal !== c.currentVal) return { field: c.field, eudamedValue: c.eudamedVal, currentValue: c.currentVal, status: 'Changed' as const };
      return { field: c.field, eudamedValue: c.eudamedVal, currentValue: c.currentVal || c.eudamedVal, status: 'Unchanged' as const };
    }).filter(Boolean) as ChangedField[];
  }, [productData, deviceData]);

  const changedFields = getChangedFields();
  const actualChanges = changedFields.filter(f => f.status === 'Changed' || f.status === 'New');

  // ── Submission Readiness Checklist ──
  const getReadinessChecklist = React.useCallback(() => {
    const p = productData;
    const d = deviceData;
    const resolve = (...vals: any[]) => { for (const v of vals) { if (v !== null && v !== undefined && String(v).trim()) return String(v).trim(); } return ''; };

    const items = [
      { label: 'Basic UDI-DI Code', value: resolve(p?.basic_udi_di, p?.eudamed_basic_udi_di_code), required: true },
      { label: 'UDI-DI Code', value: resolve(p?.udi_di), required: true },
      { label: 'Issuing Agency', value: resolve(p?.eudamed_issuing_agency, d?.issuing_agency), required: true },
      { label: 'Device Name', value: resolve(p?.eudamed_device_name, d?.device_name, p?.name), required: true },
      { label: 'EMDN / Nomenclature Code', value: resolve(p?.emdn_code, p?.eudamed_nomenclature_codes?.length ? p.eudamed_nomenclature_codes[0] : ''), required: true },
      { label: 'Risk Class', value: resolve(p?.eudamed_risk_class, p?.class), required: true },
      { label: 'Applicable Legislation', value: resolve(p?.eudamed_applicable_legislation, d?.applicable_legislation), required: true },
      { label: 'Manufacturer SRN', value: resolve(p?.eudamed_id_srn, d?.manufacturer_id_srn), required: true },
      { label: 'Device Characteristics', value: (p?.eudamed_implantable != null || d?.implantable != null) ? 'yes' : '', required: true },
      { label: 'Quantity per Package', value: resolve(p?.eudamed_quantity_of_device, d?.quantity_of_device), required: false },
    ];

    const filled = items.filter(i => !!i.value).length;
    const total = items.length;
    const percentage = Math.round((filled / total) * 100);

    return { items, filled, total, percentage };
  }, [productData, deviceData]);

  const readiness = getReadinessChecklist();

  // A product is "linked" to EUDAMED if any of its 3 registry identifiers exist
  const hasEudamedData = !!productData?.basic_udi_di || !!productData?.eudamed_device_name || !!productData?.eudamed_id_srn;

  // Handle field change with optional warning for EUDAMED-synced data
  const handleFieldChange = useCallback((
    fieldName: string,
    value: string,
    onChange: (value: string) => void,
    isEudamedSourced: boolean
  ) => {
    // If data is from EUDAMED and user hasn't acknowledged this field yet, show warning
    if (isEudamedSourced && hasEudamedData && !acknowledgedFields.has(fieldName)) {
      setPendingEdit({ fieldName, value, onChange });
      setShowEditWarning(true);
    } else {
      // Proceed with the change
      onChange(value);
    }
  }, [hasEudamedData, acknowledgedFields]);

  // Confirm edit after warning
  const confirmEdit = () => {
    if (pendingEdit) {
      // Mark this field as acknowledged so we don't warn again
      setAcknowledgedFields(prev => new Set(prev).add(pendingEdit.fieldName));
      pendingEdit.onChange(pendingEdit.value);
      setPendingEdit(null);
    }
    setShowEditWarning(false);
  };

  // Cancel edit
  const cancelEdit = () => {
    setPendingEdit(null);
    setShowEditWarning(false);
  };

  const renderField = (
    label: string,
    value: any,
    onChange?: (value: string) => void,
    icon?: React.ReactNode,
    placeholder?: string,
    type: 'display' | 'input' | 'boolean' = 'display',
    isEudamedSourced: boolean = false,
    isOverridden: boolean = false,
    ssotHint?: string
  ) => {
    const showEudamedBadge = isEudamedSourced && hasEudamedData;

    // For editable fields with EUDAMED source, wrap onChange with warning handler
    const wrappedOnChange = onChange && isEudamedSourced && hasEudamedData && !acknowledgedFields.has(label)
      ? (newValue: string) => handleFieldChange(label, newValue, onChange, true)
      : onChange;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          {icon}
          {label}
          {showEudamedBadge && (
            <Badge variant="outline" className="text-xs ml-auto bg-blue-50 text-blue-700 border-blue-200">
              <Globe className="w-3 h-3 mr-1" />
              EUDAMED
            </Badge>
          )}
        </Label>

        {type === 'input' && onChange ? (
          <div className="relative">
            <Input
              value={value || ''}
              onChange={(e) => wrappedOnChange?.(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading}
              className={`text-sm ${showEudamedBadge ? 'pr-8' : ''}`}
            />
            {showEudamedBadge && !acknowledgedFields.has(label) && (
              <AlertTriangle className="w-4 h-4 text-amber-500 absolute right-2 top-1/2 -translate-y-1/2" />
            )}
          </div>
        ) : type === 'boolean' ? (
          <div className="flex items-center gap-1.5">
            <Badge variant={value ? 'default' : 'secondary'}>
              {value ? t('deviceIdentification.eudamed.yes', 'Yes') : t('deviceIdentification.eudamed.no', 'No')}
            </Badge>
          </div>
        ) : onChange ? (
          // Editable display field
          <div className="relative">
            <Input
              value={value || ''}
              onChange={(e) => wrappedOnChange?.(e.target.value)}
              placeholder={placeholder || t('deviceIdentification.eudamed.clickToEdit', 'Click to edit...')}
              disabled={isLoading}
              className={`text-sm ${showEudamedBadge ? 'pr-8' : ''}`}
            />
            {showEudamedBadge && !acknowledgedFields.has(label) && (
              <AlertTriangle className="w-4 h-4 text-amber-500 absolute right-2 top-1/2 -translate-y-1/2" />
            )}
          </div>
        ) : (
          <div className="text-sm text-foreground bg-muted/50 p-2 rounded-md min-h-[36px] flex items-center">
            {value || <span className="text-muted-foreground">{t('deviceIdentification.eudamed.notSpecified', 'Not specified')}</span>}
          </div>
        )}
        {ssotHint && (
          <p className="text-xs text-muted-foreground italic mt-1">Source: {ssotHint}</p>
        )}
      </div>
    );
  };


  return (
    <>
      {/* Warning Dialog for editing EUDAMED-synced data */}
      <AlertDialog open={showEditWarning} onOpenChange={setShowEditWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {t('deviceIdentification.eudamed.editWarningTitle', 'Edit EUDAMED Data?')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('deviceIdentification.eudamed.editWarningDescription', 
                  'This field was synced from EUDAMED. Editing it will overwrite the official EUDAMED data with your custom value.')}
              </p>
              <p className="font-medium text-foreground">
                {t('deviceIdentification.eudamed.editWarningNote',
                  'Your changes will only be stored locally and will not update EUDAMED. Consider re-syncing if you need to restore the original data.')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelEdit}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmEdit} className="bg-amber-600 hover:bg-amber-700">
              <Pencil className="w-4 h-4 mr-2" />
              {t('deviceIdentification.eudamed.proceedWithEdit', 'Proceed with Edit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasEudamedData ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
              {t('deviceIdentification.eudamed.title', 'EUDAMED Compliance')}
            </div>
            {companyId && productData?.id && (
              <EudamedEnrichButton
                productId={productData.id}
                productName={productData.name || 'Unknown Product'}
                companyId={companyId}
                hasEudamedData={hasEudamedData}
                currentUdiDi={productData?.udi_di}
                onEnrichmentComplete={onDataRefresh}
              />
            )}
          </CardTitle>
          <div className="flex items-center gap-2 justify-between">
            <div className='flex items-center gap-2'>
              {hasEudamedData && (
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {t('deviceIdentification.eudamed.registeredDevice', 'Registered Device')}
                </Badge>
              )}
              {productData.eudamed_status && (
                <Badge variant={productData.eudamed_status === 'on-the-market' ? 'default' : 'secondary'}>
                  {productData.eudamed_status.replace(/-/g, ' ').toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <EudamedSubmissionExport productData={productData} deviceData={deviceData} />
              {hasEudamedData && <Button
              size="sm"
              variant="outline"
              title={t('deviceIdentification.eudamed.sync', 'Sync from EUDAMED')}
              onClick={async () => {
                setIsSyncing(true);

                try {
                  // Get company name
                  const { data: company } = await supabase
                    .from('companies')
                    .select('name')
                    .eq('id', companyId)
                    .single();

                  if (!company) {
                    setIsSyncing(false);
                    return;
                  }

                  // Search for matching EUDAMED device
                  const { data: eudamedDevices, error: eudamedError } = await supabase
                    .rpc('get_eudamed_devices_by_company', {
                      company_identifier: company.name,
                      limit_count: 100
                    });

                  if (eudamedError) {
                    setIsSyncing(false);
                    return;
                  }

                  if (!eudamedDevices || eudamedDevices.length === 0) {
                    setIsSyncing(false);
                    return;
                  }

                  // Find matching device by UDI-DI
                  const matchingDevice = eudamedDevices.find((device: any) =>
                    device.udi_di === productData.udi_di ||
                    device.basic_udi_di_code === productData.basic_udi_di
                  );

                  if (!matchingDevice) {
                    setIsSyncing(false);
                    return;
                  }

                  // Helper function to safely convert boolean values
                  const safeBoolean = (value: any) => {
                    if (typeof value === 'boolean') return value;
                    if (typeof value === 'string') {
                      return value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
                    }
                    return null;
                  };

                  const updateData = {
                    eudamed_risk_class: matchingDevice.risk_class,
                    eudamed_status: matchingDevice.status,
                    eudamed_device_name: matchingDevice.device_name,
                    eudamed_trade_names: matchingDevice.trade_names,
                    eudamed_reference_number: matchingDevice.reference_number,
                    eudamed_organization: matchingDevice.organization,
                    eudamed_organization_status: matchingDevice.organization_status,
                    eudamed_address: matchingDevice.address,
                    eudamed_postcode: matchingDevice.postcode,
                    eudamed_country: matchingDevice.country,
                    eudamed_phone: matchingDevice.phone,
                    eudamed_email: matchingDevice.email,
                    eudamed_website: matchingDevice.website,
                    eudamed_id_srn: matchingDevice.id_srn,
                    eudamed_placed_on_the_market: String(matchingDevice.placed_on_the_market),
                    eudamed_basic_udi_di_code: matchingDevice.basic_udi_di_code,
                    eudamed_issuing_agency: matchingDevice.issuing_agency,
                    eudamed_applicable_legislation: matchingDevice.applicable_legislation,
                    eudamed_implantable: safeBoolean(matchingDevice.implantable),
                    eudamed_measuring: safeBoolean(matchingDevice.measuring),
                    eudamed_reusable: safeBoolean(matchingDevice.reusable),
                    eudamed_active: safeBoolean(matchingDevice.active),
                    eudamed_administering_medicine: safeBoolean(matchingDevice.administering_medicine),
                    eudamed_device_model: matchingDevice.device_model,
                    eudamed_nomenclature_codes: matchingDevice.nomenclature_codes,
                    eudamed_direct_marking: safeBoolean(matchingDevice.direct_marking),
                    eudamed_quantity_of_device: matchingDevice.quantity_of_device,
                    eudamed_single_use: safeBoolean(matchingDevice.single_use),
                    eudamed_max_reuses: matchingDevice.max_reuses,
                    eudamed_sterilization_need: safeBoolean(matchingDevice.sterilization_need),
                    eudamed_sterile: safeBoolean(matchingDevice.sterile),
                    eudamed_contain_latex: safeBoolean(matchingDevice.contain_latex),
                    eudamed_reprocessed: safeBoolean(matchingDevice.reprocessed),
                    eudamed_market_distribution: matchingDevice.market_distribution,
                    updated_at: new Date().toISOString()
                  };

                  const { error } = await supabase
                    .from('products')
                    .update(updateData)
                    .eq('id', productData.id);

                  if (error) {
                    setIsSyncing(false);
                  } else {
                    // Clear acknowledged fields since data is fresh from EUDAMED
                    setAcknowledgedFields(new Set());
                    onDataRefresh?.();
                  }
                } catch (error) {
                  setIsSyncing(false);
                }
              }}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {t('deviceIdentification.eudamed.sync', 'Sync')}
            </Button>}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Info banner about editing EUDAMED data */}
          {/* Info banner about consolidated view */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">{t('deviceIdentification.eudamed.consolidatedNotice', 'Consolidated View')}</p>
              <p className="text-blue-700">
                {t('deviceIdentification.eudamed.consolidatedNoticeDescription', 
                  'This view aggregates data from across Xyreg. Fields show their source location where they can be edited. EUDAMED-synced data requires override confirmation to modify at the source.')}
              </p>
            </div>
          </div>

          <Accordion
            type="single"
            value={activeSection}
            onValueChange={setActiveSection}
            className="space-y-2"
          >

            {/* Device Identity Section */}
            <AccordionItem value="device-identity" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{t('deviceIdentification.eudamed.sections.deviceIdentity', 'Device Identity')}</span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    {t('deviceIdentification.eudamed.fieldCount', '{count} fields').replace('{count}', '7')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UDI-DI fields - display only, SSOT is UDI Management */}
                  {renderField(t('deviceIdentification.eudamed.fields.udiDi', 'UDI-DI'), productData?.udi_di, undefined, <FileText className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'UDI Management')}
                  {renderField(t('deviceIdentification.eudamed.fields.basicUdiDi', 'Basic UDI-DI'), productData?.basic_udi_di || productData?.eudamed_basic_udi_di_code, undefined, <FileText className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'UDI Management')}
                  
                  {/* EUDAMED-sourced fields - display only */}
                  {renderField(t('deviceIdentification.eudamed.fields.deviceName', 'Device Name'), productData?.eudamed_device_name || deviceData?.device_name || (productData as any)?.name, undefined, <Package className="w-4 h-4" />, undefined, 'display', true, false, 'General > Definition')}
                  {renderField(t('deviceIdentification.eudamed.fields.deviceModel', 'Device Model'), productData?.eudamed_device_model || deviceData?.device_model || (productData as any)?.model_reference, undefined, <Package className="w-4 h-4" />, undefined, 'display', true, false, 'General > Definition')}
                  {renderField(t('deviceIdentification.eudamed.fields.tradeNames', 'Trade Names'), productData?.eudamed_trade_names || deviceData?.trade_names || (productData as any)?.trade_name, undefined, <Package className="w-4 h-4" />, undefined, 'display', true, false, 'General > Definition')}
                  {renderField(t('deviceIdentification.eudamed.fields.idSrn', 'ID/SRN'), productData?.eudamed_id_srn || deviceData?.manufacturer_id_srn, undefined, <FileText className="w-4 h-4" />, undefined, 'display', true, false, 'Enterprise > Company Settings')}
                  {productData?.eudamed_id_srn && productData?.eudamed_reference_number && renderField(t('deviceIdentification.eudamed.fields.manufacturerDeviceReference', "Manufacturer's Device Reference"), productData?.eudamed_reference_number, undefined, <FileText className="w-4 h-4" />, undefined, 'display', true)}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Registration & Compliance Section */}
            <AccordionItem value="registration-compliance" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>{t('deviceIdentification.eudamed.sections.registrationCompliance', 'Registration & Compliance')}</span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    {t('deviceIdentification.eudamed.fieldCount', '{count} fields').replace('{count}', '8')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField(t('deviceIdentification.eudamed.fields.registrationNumber', 'Registration Number'), registrationNumber ?? productData?.eudamed_registration_number, undefined, <FileText className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'General > Definition')}
                  {renderField(t('deviceIdentification.eudamed.fields.registrationStatus', 'Registration Status'), registrationStatus ?? productData?.eudamed_status ?? deviceData?.status, undefined, <Shield className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Target Market > Regulation')}
                  {renderField(t('deviceIdentification.eudamed.fields.registrationDate', 'Registration Date'), registrationDate ?? productData?.registration_date, undefined, <Calendar className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Target Market > Regulation')}
{(() => {
                    const rawClass = productData?.eudamed_risk_class || (productData as any)?.class;
                    const classMap: Record<string, string> = {
                      'class-i': 'Class I', 'class_i': 'Class I',
                      'class-ii': 'Class II', 'class_ii': 'Class II',
                      'class-iia': 'Class IIa', 'class-2a': 'Class IIa', 'class_iia': 'Class IIa',
                      'class-iib': 'Class IIb', 'class-2b': 'Class IIb', 'class_iib': 'Class IIb',
                      'class-iii': 'Class III', 'class_iii': 'Class III',
                    };
                    const displayClass = rawClass ? (classMap[rawClass] || rawClass) : null;
                    return renderField(t('deviceIdentification.eudamed.fields.riskClass', 'Risk Class'), displayClass, undefined, <Shield className="w-4 h-4" />, undefined, 'display', true, false, 'General > Classification');
                  })()}
                  {renderField(t('deviceIdentification.eudamed.fields.ceMarkStatus', 'CE Mark Status'), ceMarkStatus ?? productData?.ce_mark_status ?? (hasEudamedData ? 'CE Marked' : undefined), undefined, <Shield className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Target Market > Regulation')}
                  {renderField(t('deviceIdentification.eudamed.fields.conformityAssessmentRoute', 'Conformity Assessment Route'), conformityAssessmentRoute ?? productData?.conformity_assessment_route, undefined, <Shield className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Target Market > Regulation')}
                  {renderField(t('deviceIdentification.eudamed.fields.marketAuthorizationHolder', 'Market Authorization Holder'), marketAuthorizationHolder ?? productData?.market_authorization_holder, undefined, <Building className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Target Market > Regulation')}
                  {renderField(t('deviceIdentification.eudamed.fields.notifiedBody', 'Notified Body'), notifiedBody ?? productData?.notified_body, undefined, <Building className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Target Market > Regulation')}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Organization & Contacts Section */}
            <AccordionItem value="organization-contacts" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>{t('deviceIdentification.eudamed.sections.organizationContacts', 'Organization & Contacts')}</span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    {t('deviceIdentification.eudamed.fieldCountPlus', '{count}+ fields').replace('{count}', '15')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6">
                  {/* Organization Information */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm">{t('deviceIdentification.eudamed.organizationInfo', 'Organization Information')}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderField(t('deviceIdentification.eudamed.fields.organization', 'Organization'), productData?.eudamed_organization || deviceData?.manufacturer_organization, undefined, <Building className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.organizationStatus', 'Organization Status'), productData?.eudamed_organization_status || deviceData?.manufacturer_status, undefined, <Shield className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.address', 'Address'), productData?.eudamed_address || deviceData?.manufacturer_address, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.postcode', 'Postcode'), productData?.eudamed_postcode || deviceData?.manufacturer_postcode, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.country', 'Country'), productData?.eudamed_country || deviceData?.manufacturer_country, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.phone', 'Phone'), productData?.eudamed_phone || deviceData?.manufacturer_phone, undefined, <Phone className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.email', 'Email'), productData?.eudamed_email || deviceData?.manufacturer_email, undefined, <Mail className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.website', 'Website'), productData?.eudamed_website || deviceData?.manufacturer_website, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                    </div>
                  </div>

                  {/* PRRC Information */}
                  <Separator />
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm">{t('deviceIdentification.eudamed.prrcTitle', 'Person Responsible for Regulatory Compliance (PRRC)')}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderField(t('deviceIdentification.eudamed.fields.firstName', 'First Name'), productData?.eudamed_prrc_first_name || deviceData?.manufacturer_prrc_first_name, undefined, <User className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.lastName', 'Last Name'), productData?.eudamed_prrc_last_name || deviceData?.manufacturer_prrc_last_name, undefined, <User className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.email', 'Email'), productData?.eudamed_prrc_email || deviceData?.manufacturer_prrc_email, undefined, <Mail className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.phone', 'Phone'), productData?.eudamed_prrc_phone || deviceData?.manufacturer_prrc_phone, undefined, <Phone className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.responsibleFor', 'Responsible For'), productData?.eudamed_prrc_responsible_for || deviceData?.manufacturer_prrc_responsible_for, undefined, <Shield className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.address', 'Address'), productData?.eudamed_prrc_address || deviceData?.manufacturer_prrc_address, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.postcode', 'Postcode'), productData?.eudamed_prrc_postcode || deviceData?.manufacturer_prrc_postcode, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.country', 'Country'), productData?.eudamed_prrc_country || deviceData?.manufacturer_prrc_country, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                    </div>
                  </div>

                  {/* Competent Authority Information */}
                  <Separator />
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm">{t('deviceIdentification.eudamed.caTitle', 'Competent Authority')}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderField(t('deviceIdentification.eudamed.fields.caName', 'CA Name'), productData?.eudamed_ca_name || deviceData?.manufacturer_ca_name, undefined, <Building className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.caAddress', 'CA Address'), productData?.eudamed_ca_address || deviceData?.manufacturer_ca_address, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.caPostcode', 'CA Postcode'), productData?.eudamed_ca_postcode || deviceData?.manufacturer_ca_postcode, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.caCountry', 'CA Country'), productData?.eudamed_ca_country || deviceData?.manufacturer_ca_country, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.caEmail', 'CA Email'), productData?.eudamed_ca_email || deviceData?.manufacturer_ca_email, undefined, <Mail className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                      {renderField(t('deviceIdentification.eudamed.fields.caPhone', 'CA Phone'), productData?.eudamed_ca_phone || deviceData?.manufacturer_ca_phone, undefined, <Phone className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Enterprise > Company Settings')}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Device Characteristics Section */}
            <AccordionItem value="device-characteristics" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>{t('deviceIdentification.eudamed.sections.deviceCharacteristics', 'Device Characteristics')}</span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    {t('deviceIdentification.eudamed.propertiesCount', '{count} properties').replace('{count}', '13')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {renderField(t('deviceIdentification.eudamed.fields.implantable', 'Implantable'), productData?.eudamed_implantable ?? deviceData?.implantable, undefined, <Stethoscope className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.measuring', 'Measuring'), productData?.eudamed_measuring ?? deviceData?.measuring, undefined, <Settings className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.reusable', 'Reusable'), productData?.eudamed_reusable ?? deviceData?.reusable, undefined, <Settings className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.maxReuses', 'Max Reuses'), productData?.eudamed_max_reuses ?? deviceData?.max_reuses, undefined, <Settings className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Definition > Device Nature')}
                  {renderField(t('deviceIdentification.eudamed.fields.active', 'Active'), productData?.eudamed_active ?? deviceData?.active, undefined, <Settings className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.administeringMedicine', 'Administering Medicine'), productData?.eudamed_administering_medicine ?? deviceData?.administering_medicine, undefined, <Stethoscope className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.singleUse', 'Single Use'), productData?.eudamed_single_use ?? deviceData?.single_use, undefined, <Package className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.sterilizationNeed', 'Sterilization Need'), productData?.eudamed_sterilization_need ?? deviceData?.sterilization_need, undefined, <Shield className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.sterile', 'Sterile'), productData?.eudamed_sterile ?? deviceData?.sterile, undefined, <Shield className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.containsLatex', 'Contains Latex'), productData?.eudamed_contain_latex ?? deviceData?.contain_latex, undefined, <AlertCircle className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.reprocessed', 'Reprocessed'), productData?.eudamed_reprocessed ?? deviceData?.reprocessed, undefined, <Settings className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.directMarking', 'Direct Marking'), productData?.eudamed_direct_marking ?? deviceData?.direct_marking, undefined, <FileText className="w-4 h-4" />, undefined, 'boolean', true)}
                  {renderField(t('deviceIdentification.eudamed.fields.quantityOfDevice', 'Quantity of Device'), productData?.eudamed_quantity_of_device ?? deviceData?.quantity_of_device, undefined, <Package className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Definition > Device Nature')}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Market & Regulatory Section */}
            <AccordionItem value="market-regulatory" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>{t('deviceIdentification.eudamed.sections.marketRegulatory', 'Market & Regulatory')}</span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    {t('deviceIdentification.eudamed.fieldCount', '{count} fields').replace('{count}', '7')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField(t('deviceIdentification.eudamed.fields.applicableLegislation', 'Applicable Legislation'), productData?.eudamed_applicable_legislation || deviceData?.applicable_legislation, undefined, <Shield className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Target Market > Regulation')}
                  {renderField(t('deviceIdentification.eudamed.fields.quantityOfDevice', 'Quantity of Device'), productData?.eudamed_quantity_of_device || deviceData?.quantity_of_device, undefined, <Package className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Definition > Device Nature')}
                  {renderField(t('deviceIdentification.eudamed.fields.marketDistribution', 'Market Distribution'), productData?.eudamed_market_distribution, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Target Market > Regulation')}
                  {renderField(t('deviceIdentification.eudamed.fields.issuingAgency', 'Issuing Agency'), productData?.eudamed_issuing_agency || deviceData?.issuing_agency, undefined, <Building className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'UDI Management')}
                  {renderField(t('deviceIdentification.eudamed.fields.placedOnMarket', 'Placed on Market'), productData?.eudamed_placed_on_the_market || deviceData?.placed_on_the_market, undefined, <Globe className="w-4 h-4" />, undefined, 'display', hasEudamedData, false, 'Target Market > Regulation')}
                  {renderField(t('deviceIdentification.eudamed.fields.directMarking', 'Direct Marking'), productData?.eudamed_direct_marking != null ? (productData.eudamed_direct_marking ? 'Yes' : 'No') : (deviceData?.direct_marking != null ? (deviceData.direct_marking ? 'Yes' : 'No') : undefined), undefined, <Shield className="w-4 h-4" />, undefined, 'display', true)}
                  {renderField('Launch Status', 'Launched (CE Marked)', undefined, <Shield className="w-4 h-4" />, undefined, 'display', true)}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* EUDAMED Update Summary */}
            {changedFields.length > 0 && (
              <AccordionItem value="update-summary" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    <span>EUDAMED Update Summary</span>
                    {actualChanges.length > 0 && (
                      <Badge variant="destructive" className="ml-auto mr-2">
                        {actualChanges.length} change{actualChanges.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {actualChanges.length === 0 && (
                      <Badge variant="outline" className="ml-auto mr-2 text-green-700 border-green-300">
                        Up to date
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Comparison of current EUDAMED registry data vs. local product values. Fields marked "Changed" need to be re-submitted.
                    </p>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium">Field</th>
                            <th className="text-left px-3 py-2 font-medium">EUDAMED Value</th>
                            <th className="text-left px-3 py-2 font-medium">Current Value</th>
                            <th className="text-left px-3 py-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {changedFields.map((f, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-3 py-2 font-medium">{f.field}</td>
                              <td className="px-3 py-2">
                                {f.status === 'Changed' ? (
                                  <span className="line-through text-muted-foreground">{f.eudamedValue || '—'}</span>
                                ) : (
                                  <span>{f.eudamedValue || '—'}</span>
                                )}
                              </td>
                              <td className="px-3 py-2">{f.currentValue || '—'}</td>
                              <td className="px-3 py-2">
                                <Badge variant={f.status === 'Changed' ? 'destructive' : f.status === 'New' ? 'default' : 'secondary'} className="text-xs">
                                  {f.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Submission Readiness Checklist */}
            <AccordionItem value="submission-readiness" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Submission Readiness</span>
                  <Badge variant={readiness.percentage === 100 ? 'default' : 'outline'} className={`ml-auto mr-2 ${readiness.percentage === 100 ? 'bg-green-100 text-green-800' : ''}`}>
                    {readiness.percentage}% ({readiness.filled}/{readiness.total})
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Required EUDAMED fields based on EU MDR Annex VI Part A for Basic UDI-DI + UDI-DI submission.
                  </p>
                  <Progress value={readiness.percentage} className="h-2" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {readiness.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm py-1">
                        {item.value ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className={item.value ? '' : 'text-muted-foreground'}>
                          {item.label}
                          {item.required && !item.value && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Technical Codes Section */}
            <AccordionItem value="technical-codes" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{t('deviceIdentification.eudamed.sections.technicalCodes', 'Technical Codes')}</span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    {t('deviceIdentification.eudamed.emdnCodes', 'EMDN Codes')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {(() => {
                  // Build codes array from multiple sources
                  let codes: string[] | null = null;
                  if (productData?.eudamed_nomenclature_codes && Array.isArray(productData.eudamed_nomenclature_codes) && productData.eudamed_nomenclature_codes.length > 0) {
                    codes = productData.eudamed_nomenclature_codes;
                  } else if (deviceData?.nomenclature_codes) {
                    // devices table may store as string or array
                    const nc = deviceData.nomenclature_codes;
                    if (Array.isArray(nc) && nc.length > 0) {
                      codes = nc;
                    } else if (typeof nc === 'string' && nc.trim()) {
                      codes = [nc];
                    }
                  }
                  // Final fallback: product-level emdn_code field
                  if (!codes && productData?.emdn_code && typeof productData.emdn_code === 'string' && productData.emdn_code.trim()) {
                    codes = [productData.emdn_code];
                  }

                  return codes ? (
                    <div className="space-y-4">
                      <h5 className="font-medium text-sm">{t('deviceIdentification.eudamed.nomenclatureCodes', 'Nomenclature Codes')}</h5>
                      <div className="flex flex-wrap gap-2">
                        {codes.map((code: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {typeof code === 'string' ? code : JSON.stringify(code)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t('deviceIdentification.eudamed.noNomenclatureCodes', 'No nomenclature codes available')}</p>
                  );
                })()}
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
