
import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CompanyInitializationService, InitializationProgress } from "@/services/companyInitializationService";
import { useCountries } from "@/hooks/useCountries";

import { createLegacyProducts } from "@/services/legacyProductService";
import { EudamedDevice, useEudamedRegistry } from "@/hooks/useEudamedRegistry";
import { useDebounce } from "@/hooks/useDebounce";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Building2, FolderTree, Layers, FileText, Link2, Settings } from "lucide-react";
import { DeviceSelectionDialog } from "@/components/eudamed/DeviceSelectionDialog";
import { EudamedSearch } from "./EudamedSearch";
import { useTranslation } from "@/hooks/useTranslation";

interface AddClientDialogProps {
  onClientAdded?: () => void;
  disabled?: boolean;
}

export function AddClientDialog({ onClientAdded, disabled = false }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { lang } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    prrc_first_name: "",
    prrc_last_name: "",
    email: "",
    website: "",
    telephone: "",
    address: "",
    country: "",
    srn: ""
  });
  const [eudamedDevices, setEudamedDevices] = useState<EudamedDevice[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<EudamedDevice[]>([]);
  const [hasEudamedData, setHasEudamedData] = useState(false);
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [showEudamedSearch, setShowEudamedSearch] = useState(false);
  const [afterCompanyCreated, setAfterCompanyCreated] = useState(false);
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  const [importCompleted, setImportCompleted] = useState(false);
  const { countries, loading: countriesLoading, error: countriesError } = useCountries();
  const { searchBySrn } = useEudamedRegistry();
  const [importProgress, setImportProgress] = useState<{
    processed: number;
    total: number;
    currentDevice: string;
    errors: string[];
  } | null>(null);

  // Company creation progress state
  const [creationProgress, setCreationProgress] = useState<InitializationProgress | null>(null);

  const debouncedName = useDebounce(formData.name, 500);

  useEffect(() => {
    if (debouncedName && debouncedName.trim().length >= 3) {
      prefillFromExistingCompany({ name: debouncedName.trim() });
    }
  }, [debouncedName]);

  useEffect(() => {
    if (open && formData.srn && formData.srn.trim()) {
      prefillFromExistingCompany({ srn: formData.srn.trim() });
    }
  }, [open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setAfterCompanyCreated(false);
      setCreatedCompanyId(null);
      setImportProgress(null);
      setIsSubmitting(false);
      setImportCompleted(false);
      setCreationProgress(null);
    } else if (!showDeviceSelection) {
      // Clean up state when dialog closes to prevent memory leaks and infinite loops
      // Only clean up if DeviceSelectionDialog is NOT open - we need to preserve device data for it
      setFormData({
        name: "",
        prrc_first_name: "",
        prrc_last_name: "",
        email: "",
        website: "",
        telephone: "",
        address: "",
        country: "",
        srn: ""
      });
      setEudamedDevices([]);
      setSelectedDevices([]);
      setHasEudamedData(false);
      setShowEudamedSearch(false);
      setAfterCompanyCreated(false);
      setCreatedCompanyId(null);
      setImportProgress(null);
      setIsSubmitting(false);
      setImportCompleted(false);
      setCreationProgress(null);
    }
  }, [open, showDeviceSelection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setIsSubmitting(true);
    setImportProgress(null);
    setCreationProgress(null);

    try {
      const srnTrim = (formData.srn || '').trim();
      // Step-0 Check  companyname is already in the database
      const { data: existingCompany, error: companyCheckError } = await supabase.from('companies').select('id').eq('name', formData.name.trim());
      if (companyCheckError) throw new Error(`Failed to check if company name already exists: ${companyCheckError.message}`);

      if (existingCompany?.length > 0) {
        toast.warning(`A company with name "${formData.name.trim()}" already exists `)
        return;
      }
      // Step 1: Check if company with SRN already exists (for user information only)
      let existingCompanyInfo = null;
      if (srnTrim) {
        const { data: existingBySrn, error: srnLookupErr } = await supabase
          .from('companies')
          .select('id, name, contact_person, email, website, telephone, address, country')
          .eq('srn', srnTrim)
          .order('inserted_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (srnLookupErr && srnLookupErr.code && srnLookupErr.code !== 'PGRST116') {
          // console.warn('[AddClientDialog] SRN lookup error:', srnLookupErr);
        }

        if (existingBySrn?.id) {
          existingCompanyInfo = existingBySrn;
          // Show warning to user but still create new company
          toast.warning(`A company with SRN "${srnTrim}" already exists (${existingBySrn.name}). Creating a new company anyway.`);
        }
      }

      // Step 2: Always create a new company (don't reuse existing ones)
      const { data: newCompany, error: companyError } = await supabase
        .from("companies")
        .insert([
          {
            name: formData.name.trim(),
            contact_person: `${(formData.prrc_first_name || '').trim()} ${(formData.prrc_last_name || '').trim()}`.trim() || null,
            email: formData.email.trim() || null,
            website: formData.website.trim() || null,
            telephone: formData.telephone.trim() || null,
            address: formData.address.trim() || null,
            country: formData.country.trim() || null,
            srn: srnTrim || null
          }
        ])
        .select()
        .single();

      if (companyError) {
        throw companyError;
      }

      if (!newCompany || !newCompany.id) {
        throw new Error('Failed to create company - no data returned');
      }

      const company = newCompany;
      setCreatedCompanyId(company.id);

      // Step 3: Initialize the company (idempotent, also ensures user access)
      const initResult = await CompanyInitializationService.initializeCompany(
        company.id,
        company.name,
        (progress) => setCreationProgress(progress)
      );

      if (!initResult.success) {
        toast.error(`Company ready but phase initialization failed: ${initResult.message}`);
      }
      // Note: Device import now happens in DeviceSelectionDialog when user clicks Import
      // The dialog handles the import flow with progress tracking

      // Show device selection dialog if EUDAMED devices were found
      if (hasEudamedData && eudamedDevices.length > 0) {
        setOpen(false);
        // Don't close the main dialog yet - let user select devices first
        setShowDeviceSelection(true);
        toast.success(`Company "${company.name}" created. Please select devices to import.`);
      } else {
        // No EUDAMED devices, just close and notify
        toast.success(`Company "${company.name}" is ready${initResult.phasesCreated ? ` with ${initResult.phasesCreated} standard phases` : ''}`);
        onClientAdded?.();
        setOpen(false);
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create company");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleOrganizationFound = (orgData: {
    name: string;
    country?: string;
    address?: string;
    email?: string;
    website?: string;
    phone?: string;
    contactPerson?: string;
  }) => {
    const cp = (orgData.contactPerson || '').trim();
    const [first, ...rest] = cp.split(' ');
    const last = rest.join(' ');
    setFormData(prev => ({
      ...prev,
      name: prev.name,
      country: orgData.country || prev.country,
      address: orgData.address || prev.address,
      email: orgData.email || prev.email,
      website: orgData.website || prev.website,
      telephone: orgData.phone || prev.telephone,
      prrc_first_name: first || prev.prrc_first_name || '',
      prrc_last_name: last || prev.prrc_last_name || ''
    }));

    // Also try to prefill from our database if a company with this name exists
    prefillFromExistingCompany({ name: orgData.name });

    setHasEudamedData(true);
  };

  const handleDevicesFound = (devices: EudamedDevice[], orgName: string) => {
    setEudamedDevices(devices);
    setOrganizationName(orgName);
    setHasEudamedData(true);

    // Auto-open device selection if many devices found
    if (devices.length > 0) {
      setShowDeviceSelection(false);
    } else {
      // For smaller lists, select all devices by default
      setSelectedDevices(devices);
    }
  };

  const handleDeviceSelectionConfirm = async (devices: EudamedDevice[]) => {
    setSelectedDevices(devices);
    setShowDeviceSelection(false);
    // The main dialog will be closed by onImportComplete callback when import finishes
  };

  const handleDeviceSelectionCancel = () => {
    setShowDeviceSelection(false);
  };

  const handleOpenDeviceSelection = () => {
    setShowDeviceSelection(true);
  };

  const handleSrnChange = (srn: string) => {
    setFormData(prev => ({ ...prev, srn }));
    // Reset EUDAMED data when SRN changes
    if (!srn.trim()) {
      setEudamedDevices([]);
      setSelectedDevices([]);
      setHasEudamedData(false);
      setShowDeviceSelection(false);
    } else {
      // Try to prefill from our database if SRN matches an existing company
      prefillFromExistingCompany({ srn });
    }
  };

  async function prefillFromExistingCompany({ srn, name }: { srn?: string; name?: string }) {
    try {
      let query = supabase
        .from('companies')
        .select('contact_person,email,website,telephone,address,country')
        .limit(1);

      if (srn && srn.trim()) {
        query = query.eq('srn', srn.trim()).order('inserted_at', { ascending: true }).limit(1);
      } else if (name && name.trim()) {
        // Use ilike for case-insensitive match; exact match to avoid wrong fills
        query = query.ilike('name', name.trim()).order('inserted_at', { ascending: true }).limit(1);
      } else {
        return;
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        return;
      }
      if (data) {
        const cp = (data.contact_person || '').trim();
        const [first, ...rest] = cp.split(' ');
        const last = rest.join(' ');
        setFormData(prev => ({
          ...prev,
          prrc_first_name: first || prev.prrc_first_name,
          prrc_last_name: last || prev.prrc_last_name,
          email: data.email || prev.email,
          website: (data.website && !/^https?:\/\//i.test(data.website) ? `https://${data.website}` : data.website) || prev.website,
          telephone: data.telephone || prev.telephone,
          address: data.address || prev.address,
          country: data.country || prev.country,
        }));
      }
    } catch {
      // Prefill lookup failed - continue anyway
    }
  }

  const handleSkipForNow = () => {
    // Reset all state to prevent infinite loops
    setFormData({
      name: "",
      prrc_first_name: "",
      prrc_last_name: "",
      email: "",
      website: "",
      telephone: "",
      address: "",
      country: "",
      srn: ""
    });
    setEudamedDevices([]);
    setSelectedDevices([]);
    setHasEudamedData(false);
    setShowDeviceSelection(false);
    setShowEudamedSearch(false);
    setAfterCompanyCreated(false);
    setCreatedCompanyId(null);
    setImportProgress(null);
    setIsSubmitting(false);
    setImportCompleted(false);
    setCreationProgress(null);
    setOpen(false);
  };
  // Ensure device selection can stay open even if Add Client dialog is closed
  return (
    <>
      <Dialog open={open} onOpenChange={(open) => {
        if (disabled) return;
        setOpen(open);
      }}>
        <DialogTrigger asChild disabled={disabled}>
          <Button disabled={disabled} className="w-44">
            <Plus className="mr-2 h-4 w-4" />
            {lang('clients.addClient')}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {afterCompanyCreated ? (
            <div className="mt-6 space-y-6">
              {/* Success Card */}
              <div
                className="rounded-lg p-6 border"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--success) / 0.1) 0%, hsl(var(--success) / 0.05) 100%)',
                  borderColor: 'hsl(var(--success) / 0.3)',
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'hsl(var(--success) / 0.2)' }}
                    >
                      <svg
                        className="w-6 h-6"
                        style={{ color: 'hsl(var(--success))' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: 'hsl(var(--success))' }}
                    >
                      {lang('addClient.companyCreatedSuccess')}
                    </h3>
                    <p
                      className="text-sm mt-1"
                      style={{ color: 'hsl(var(--success) / 0.8)' }}
                    >
                      {lang('addClient.companyReadyToUse', { name: formData.name })}
                    </p>
                  </div>
                </div>
              </div>
              {/* EUDAMED Device Import Section */}
              <div
                className="rounded-lg p-6 border shadow-sm"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {lang('addClient.eudamedDeviceImport')}
                    </h3>
                    <p
                      className="text-sm mt-1"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      {lang('addClient.eudamedImportDescription')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                    >
                      <svg
                        className="w-6 h-6"
                        style={{ color: 'hsl(var(--primary))' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Main Question Card */}
                  <div
                    className="rounded-lg p-6 border-2 border-dashed"
                    style={{
                      backgroundColor: 'hsl(var(--primary) / 0.03)',
                      borderColor: 'hsl(var(--primary) / 0.3)',
                    }}
                  >
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                      >
                        <svg
                          className="w-8 h-8"
                          style={{ color: 'hsl(var(--primary))' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4
                        className="text-xl font-semibold mb-2"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        {lang('addClient.importEudamedQuestion')}
                      </h4>
                      <p
                        className="text-sm mb-6 max-w-md mx-auto"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {lang('addClient.importEudamedQuestionDescription')}
                      </p>

                      {importProgress ? (
                        <div className="space-y-4">
                          <div className="text-center">
                            <h5 className="text-lg font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                              {lang('addClient.importingDevices')}
                            </h5>
                            <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {lang('addClient.processingDevices', { processed: importProgress.processed, total: importProgress.total })}
                            </p>
                            <Progress
                              value={Math.round((importProgress.processed / Math.max(importProgress.total, 1)) * 100)}
                              className="w-full max-w-md mx-auto"
                            />
                            {importProgress.currentDevice && (
                              <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {lang('addClient.currentDevice', { device: importProgress.currentDevice })}
                              </p>
                            )}
                            {importProgress.errors.length > 0 && (
                              <p className="text-xs mt-2 text-destructive">
                                {lang('addClient.errorsCount', { count: importProgress.errors.length })}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            onClick={() => setShowDeviceSelection(true)}
                            className="px-8 py-3"
                            disabled={isSubmitting}
                            style={{
                              backgroundColor: 'hsl(var(--primary))',
                              color: 'hsl(var(--primary-foreground))',
                            }}
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {lang('addClient.yesImportDevices')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleSkipForNow()}
                            className="px-8 py-3"
                            disabled={isSubmitting}
                            style={{
                              borderColor: 'hsl(var(--border))',
                              color: 'hsl(var(--foreground))',
                            }}
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {lang('addClient.skipForNow')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Add Button for close the dialog   */}
                <div className="flex justify-end mt-2">
                  <Button type="button" onClick={() => handleSkipForNow()} >{lang('common.close')}</Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{lang('addClient.dialogTitle')}</DialogTitle>
                <DialogDescription>
                  {lang('addClient.dialogDescription')}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{lang('addClient.companyName')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange("name")}
                    placeholder={lang('addClient.enterCompanyName')}
                    // required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Button type="button" onClick={() => setShowEudamedSearch((prev) => !prev)} >{lang('addClient.searchEudamed')}</Button>
                </div>
                {showEudamedSearch && (
                  <div className="space-y-3 mt-2 max-h-[500px] overflow-y-auto">
                    <EudamedSearch
                      onOrganizationSelect={async (organization) => {
                        // Map EUDAMED country names to standard country names
                        const mapEudamedCountry = (eudamedCountry?: string): string => {
                          if (!eudamedCountry) return '';

                          const countryMappings: Record<string, string> = {
                            'United Kingdom (ex Northern Ireland)': 'United Kingdom',
                            'UK': 'United Kingdom',
                            'USA': 'United States',
                            'US': 'United States',
                          };

                          return countryMappings[eudamedCountry] || eudamedCountry;
                        };

                        const mappedCountry = mapEudamedCountry(organization.country);

                        // First set the company name from the organization
                        setFormData(prev => ({
                          ...prev,
                          name: organization.name || prev.name,
                          country: mappedCountry || prev.country,
                          srn: organization.id_srn || prev.srn,
                        }));

                        handleOrganizationFound({
                          name: organization.name,
                          country: mappedCountry,
                        });

                        // Fetch devices for this organization to import as legacy products
                        if (organization.id_srn) {
                          try {
                            const { devices, totalCount } = await searchBySrn(organization.id_srn);

                            if (devices && devices.length > 0) {
                              handleDevicesFound(devices, organization.name);
                            } else {
                              setEudamedDevices([]);
                              setSelectedDevices([]);
                              setHasEudamedData(false);
                            }
                          } catch {
                            setEudamedDevices([]);
                            setSelectedDevices([]);
                            setHasEudamedData(false);
                          }
                        }

                        // Then fetch detailed contact info if SRN is available
                        if (organization.id_srn) {
                          try {
                            const { data: deviceData } = await supabase
                              .from('eudamed_medical_devices')
                              .select('email, website, phone, prrc_first_name, prrc_last_name, address, prrc_email, prrc_phone')
                              .eq('id_srn', organization.id_srn)
                              .limit(1)
                              .maybeSingle();

                            if (deviceData) {
                              // Update form with detailed contact info
                              setFormData(prev => ({
                                ...prev,
                                prrc_first_name: deviceData.prrc_first_name || prev.prrc_first_name,
                                prrc_last_name: deviceData.prrc_last_name || prev.prrc_last_name,
                                email: deviceData.prrc_email || deviceData.email || prev.email,
                                website: deviceData.website || prev.website,
                                telephone: deviceData.prrc_phone || deviceData.phone || prev.telephone,
                                address: deviceData.address || prev.address,
                                srn: organization.id_srn || prev.srn
                              }));
                            }
                          } catch {
                            // Failed to fetch detailed contact info - continue anyway
                          }
                        }
                      }}
                    />

                    {/* {hasEudamedData && eudamedDevices.length > 0 && (
                    <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg space-y-2">
                      <p className="font-medium text-foreground">EUDAMED Integration Enabled</p>
                      <div className="flex items-center justify-between">
                        <p>Found {eudamedDevices.length} device(s) in registry.</p>
                        {eudamedDevices.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleOpenDeviceSelection}
                            disabled={isSubmitting}
                          >
                            Select Devices ({selectedDevices.length} selected)
                          </Button>
                        )}
                      </div>
                      <p>
                        {selectedDevices.length > 0
                          ? `${selectedDevices.length} device(s) selected for import as Legacy Products.`
                          : 'No devices selected. Use the button above to choose which devices to import.'
                        }
                      </p>
                      {importProgress && (
                        <div className="space-y-2">
                          <p className="text-foreground">Importing legacy products...</p>
                          <Progress value={Math.round((importProgress.processed / Math.max(importProgress.total, 1)) * 100)} />
                          <p className="text-xs text-muted-foreground">
                            Processing {importProgress.processed} / {importProgress.total}
                            {importProgress.currentDevice ? `: ${importProgress.currentDevice}` : ''}
                          </p>
                          {importProgress.errors.length > 0 && (
                            <p className="text-xs text-destructive">Errors: {importProgress.errors.length}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )} */}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>{lang('addClient.prrcContact')}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="prrc_first_name">{lang('addClient.firstName')}</Label>
                      <Input
                        id="prrc_first_name"
                        value={formData.prrc_first_name}
                        onChange={handleChange("prrc_first_name")}
                        placeholder={lang('addClient.enterFirstName')}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="prrc_last_name">{lang('addClient.lastName')}</Label>
                      <Input
                        id="prrc_last_name"
                        value={formData.prrc_last_name}
                        onChange={handleChange("prrc_last_name")}
                        placeholder={lang('addClient.enterLastName')}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">{lang('addClient.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    placeholder={lang('addClient.enterEmail')}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website">{lang('addClient.website')}</Label>
                  <Input
                    id="website"
                    type="text"
                    value={formData.website}
                    onChange={handleChange("website")}
                    placeholder={lang('addClient.enterWebsite')}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="telephone">{lang('addClient.telephone')}</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={handleChange("telephone")}
                    placeholder={lang('addClient.enterTelephone')}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="country">{lang('addClient.country')}</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                    disabled={isSubmitting || countriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        countriesLoading ? lang('addClient.loadingCountries') :
                          countriesError ? lang('addClient.errorLoadingCountries') :
                            lang('addClient.selectCountry')
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">{lang('addClient.address')}</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={handleChange("address")}
                    placeholder={lang('addClient.enterAddress')}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>
              </div>

              {/* Progress Section - Shows during company creation */}
              {isSubmitting && creationProgress && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-4 mt-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${creationProgress.percentage === 100 ? 'bg-green-500/20' : 'bg-primary/10'
                        }`}>
                        {creationProgress.percentage === 100 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">
                        {creationProgress.percentage === 100 ? lang('addClient.companyCreated') : lang('addClient.creatingCompany')}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {creationProgress.percentage === 100
                          ? lang('addClient.companyIsReady', { name: formData.name })
                          : lang('addClient.settingUp', { name: formData.name })
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold transition-colors duration-300 ${creationProgress.percentage === 100 ? 'text-green-500' : 'text-primary'
                        }`}>
                        {creationProgress.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Progress value={creationProgress.percentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        {creationProgress.step === 1 && <Building2 className="h-3 w-3" />}
                        {creationProgress.step === 2 && <FolderTree className="h-3 w-3" />}
                        {creationProgress.step === 3 && <Layers className="h-3 w-3" />}
                        {creationProgress.step === 4 && <Link2 className="h-3 w-3" />}
                        {creationProgress.step === 5 && <FileText className="h-3 w-3" />}
                        {creationProgress.step === 6 && <Layers className="h-3 w-3" />}
                        {creationProgress.step === 7 && <Settings className="h-3 w-3" />}
                        {creationProgress.step === 8 && <CheckCircle2 className="h-3 w-3" />}
                        {creationProgress.stepName}
                      </span>
                      <span>{lang('addClient.stepOf', { step: creationProgress.step, total: creationProgress.totalSteps })}</span>
                    </div>
                  </div>

                  {/* Step indicators */}
                  <div className="grid grid-cols-8 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                      <div
                        key={step}
                        className={`h-1 rounded-full transition-all duration-300 ${step < creationProgress.step
                          ? 'bg-green-500'
                          : step === creationProgress.step
                            ? 'bg-primary'
                            : 'bg-muted'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  {lang('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.name}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {lang('addClient.creating')}
                    </>
                  ) : (
                    lang('addClient.createCompany')
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

        </DialogContent>
      </Dialog>
      {showDeviceSelection && (
        <DeviceSelectionDialog
          open={showDeviceSelection}
          onOpenChange={setShowDeviceSelection}
          devices={eudamedDevices}
          organizationName={organizationName}
          onSelectionConfirm={handleDeviceSelectionConfirm}
          onCancel={handleDeviceSelectionCancel}
          preSelectedDevices={new Set(selectedDevices.map(d => d.udi_di))}
          companyId={createdCompanyId || undefined}
          onImportComplete={() => {
            toast.success('Devices imported successfully');
            onClientAdded?.();
            setOpen(false); // Close the main dialog after import completes
          }}
        />
      )}
    </>
  );
}
