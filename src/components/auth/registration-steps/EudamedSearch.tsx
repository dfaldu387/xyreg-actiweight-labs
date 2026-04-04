import React, { useState } from 'react';
import { OrganizationLookup } from "@/components/device-information/OrganizationLookup";
import { SrnLookupWidget } from '@/components/company/SrnLookupWidget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCountries } from "@/hooks/useCountries";
import { supabase } from "@/integrations/supabase/client";
import { useEudamedRegistry, EudamedDevice } from "@/hooks/useEudamedRegistry";
import { DeviceSelectionDialog } from "@/components/eudamed/DeviceSelectionDialog";
import { createLegacyProducts } from "@/services/legacyProductService";
import { CompanyInitializationService } from "@/services/companyInitializationService";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';

interface EudamedSearchProps {
  onOrganizationSelect: (organization: {
    name: string;
    country?: string;
    id_srn?: string;
    device_count: number;
  }) => void;
  preventNavigation?: boolean;
  createCompany?: (companyData: {
    name: string;
    prrc_first_name?: string;
    prrc_last_name?: string;
    email?: string;
    website?: string;
    telephone?: string;
    address?: string;
    country?: string;
    srn?: string;
    devices?: EudamedDevice[];
  }) => Promise<{ success: boolean; company?: any; error?: any }>;
}

export function EudamedSearch({ onOrganizationSelect, preventNavigation = false, createCompany }: EudamedSearchProps) {
  const [srn, setSrn] = useState('');
  const [formData, setFormData] = useState({
    name: "",
    prrc_first_name: "",
    prrc_last_name: "",
    email: "",
    website: "",
    telephone: "",
    address: "",
    country: "",
    srn: "",
  });

  // EUDAMED device states
  const [eudamedDevices, setEudamedDevices] = useState<EudamedDevice[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<EudamedDevice[]>([]);
  const [hasEudamedData, setHasEudamedData] = useState(false);
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    processed: number;
    total: number;
    currentDevice: string;
    errors: string[];
  } | null>(null);

  const { countries, loading: countriesLoading, error: countriesError } = useCountries();
  const { searchBySrn } = useEudamedRegistry();
  const navigate = useNavigate();
  const fetchDetailedOrganizationInfo = async (organization: {
    name: string;
    country?: string;
    id_srn?: string;
    device_count: number;
  }) => {
    try {
      let detailedInfo = {
        email: "",
        website: "",
        phone: "",
        address: "",
        prrc_first_name: "",
        prrc_last_name: "",
        prrc_email: "",
        prrc_phone: "",
        country: ""
      };

      // Try to fetch detailed info from our EUDAMED database
      if (organization.id_srn) {
        const { data: deviceData } = await supabase
          .from('eudamed_medical_devices')
          .select('email, website, phone, prrc_first_name, prrc_last_name, address, prrc_email, prrc_phone')
          .eq('id_srn', organization.id_srn)
          .limit(1)
          .maybeSingle();

        if (deviceData) {
          detailedInfo = {
            email: deviceData.email || "",
            website: deviceData.website || "",
            phone: deviceData.phone || "",
            address: deviceData.address || "",
            prrc_first_name: deviceData.prrc_first_name || "",
            prrc_last_name: deviceData.prrc_last_name || "",
            prrc_email: deviceData.prrc_email || "",
            prrc_phone: deviceData.prrc_phone || "",
            country: ""
          };
        }
      }

      // Also try to fetch from EUDAMED registry API
      if (organization.id_srn) {
        try {
          const { devices } = await searchBySrn(organization.id_srn);
          if (devices && devices.length > 0) {
            const firstDevice = devices[0];
            // Use EUDAMED API data to supplement our database data
            detailedInfo = {
              ...detailedInfo,
              email: detailedInfo.email || firstDevice.email || "",
              website: detailedInfo.website || firstDevice.website || "",
              phone: detailedInfo.phone || firstDevice.phone || "",
              address: detailedInfo.address || firstDevice.address || "",
              prrc_first_name: detailedInfo.prrc_first_name || firstDevice.prrc_first_name || "",
              prrc_last_name: detailedInfo.prrc_last_name || firstDevice.prrc_last_name || "",
              country: firstDevice.country || detailedInfo.country || "",
            };
          }
        } catch (error) {
          console.warn('Error fetching from EUDAMED API:', error);
        }
      }

      return detailedInfo;
    } catch (error) {
      console.error('Error fetching detailed organization info:', error);
      return {
        email: "",
        website: "",
        phone: "",
        address: "",
        prrc_first_name: "",
        prrc_last_name: "",
        prrc_email: "",
        prrc_phone: "",
        country: ""
      };
    }
  };

  const onSrnChange = async (srn: string) => {
    setSrn(srn);
    setFormData(prev => ({ ...prev, srn }));

    // If SRN is valid, try to fetch detailed information
    if (srn && srn.trim().length > 0) {
      try {
        // Create a mock organization object for SRN lookup
        const mockOrg = {
          name: "",
          country: "",
          id_srn: srn.trim(),
          device_count: 0
        };

        const detailedInfo = await fetchDetailedOrganizationInfo(mockOrg);

        // Update form data with fetched information
        setFormData(prev => ({
          ...prev,
          email: detailedInfo.prrc_email || detailedInfo.email || prev.email,
          website: detailedInfo.website || prev.website,
          telephone: detailedInfo.prrc_phone || detailedInfo.phone || prev.telephone,
          address: detailedInfo.address || prev.address,
          prrc_first_name: detailedInfo.prrc_first_name || prev.prrc_first_name,
          prrc_last_name: detailedInfo.prrc_last_name || prev.prrc_last_name,
          country: detailedInfo.country || prev.country
        }));
      } catch (error) {
        console.error('[EudamedSearch] Error fetching SRN detailed info:', error);
      }
    }
  };

  const handleOrganizationSelect = async (organization: {
    name: string;
    country?: string;
    id_srn?: string;
    device_count: number;
    email?: string;
    website?: string;
    phone?: string;
    prrc_first_name?: string;
    prrc_last_name?: string;
    address?: string;
    prrc_email?: string;
    prrc_phone?: string;
  }) => {
    setOrganizationName(organization.name);

    // Fetch devices and org details in one searchBySrn call
    let fetchedDevices: EudamedDevice[] = [];
    let detailedInfo = {
      email: "", website: "", phone: "", address: "",
      prrc_first_name: "", prrc_last_name: "", country: "",
    };

    if (organization.id_srn) {
      try {
        // Single searchBySrn call — get both org details and devices
        const { devices, organization: orgDevice } = await searchBySrn(organization.id_srn);
        fetchedDevices = devices || [];

        if (orgDevice) {
          detailedInfo = {
            email: orgDevice.email || "",
            website: orgDevice.website || "",
            phone: orgDevice.phone || "",
            address: orgDevice.address || "",
            prrc_first_name: orgDevice.prrc_first_name || "",
            prrc_last_name: orgDevice.prrc_last_name || "",
            country: orgDevice.country || "",
          };
        }
      } catch (error) {
        console.error('[EudamedSearch] Error fetching from EUDAMED:', error);
      }

      // Also try local eudamed_medical_devices table for supplementary info
      try {
        const { data: deviceData } = await supabase
          .from('eudamed_medical_devices')
          .select('email, website, phone, prrc_first_name, prrc_last_name, address, prrc_email, prrc_phone')
          .eq('id_srn', organization.id_srn)
          .limit(1)
          .maybeSingle();

        if (deviceData) {
          detailedInfo = {
            email: detailedInfo.email || deviceData.email || "",
            website: detailedInfo.website || deviceData.website || "",
            phone: detailedInfo.phone || deviceData.phone || "",
            address: detailedInfo.address || deviceData.address || "",
            prrc_first_name: detailedInfo.prrc_first_name || deviceData.prrc_first_name || "",
            prrc_last_name: detailedInfo.prrc_last_name || deviceData.prrc_last_name || "",
            country: detailedInfo.country,
          };
        }
      } catch (error) {
        console.warn('[EudamedSearch] Error fetching from local DB:', error);
      }
    }

    // Update form data with all available information
    setFormData(prev => ({
      ...prev,
      name: organization.name || prev.name,
      country: organization.country || detailedInfo.country || prev.country,
      srn: organization.id_srn || prev.srn,
      email: organization.email || detailedInfo.email || prev.email,
      website: organization.website || detailedInfo.website || prev.website,
      telephone: organization.phone || detailedInfo.phone || prev.telephone,
      address: organization.address || detailedInfo.address || prev.address,
      prrc_first_name: organization.prrc_first_name || detailedInfo.prrc_first_name || prev.prrc_first_name,
      prrc_last_name: organization.prrc_last_name || detailedInfo.prrc_last_name || prev.prrc_last_name,
    }));

    // Set devices and open selection dialog
    if (fetchedDevices.length > 0) {
      setEudamedDevices(fetchedDevices);
      setHasEudamedData(true);
      setShowDeviceSelection(true);
      toast.success(`Found ${fetchedDevices.length} devices for ${organization.name}`);
    } else {
      setEudamedDevices([]);
      setHasEudamedData(false);
      toast.info(`No devices found in EUDAMED for ${organization.name}`);
    }

    // Only call the parent callback if navigation is not prevented
    if (!preventNavigation) {
      onOrganizationSelect(organization);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (!createCompany) {
      toast.error("Company creation function not available");
      return;
    }

    // Validate that personal details are available for user registration
    if (!formData.email?.trim()) {
      toast.error("Email is required for account creation");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCompany({
        name: formData.name,
        prrc_first_name: formData.prrc_first_name,
        prrc_last_name: formData.prrc_last_name,
        email: formData.email,
        website: formData.website,
        telephone: formData.telephone,
        address: formData.address,
        country: formData.country,
        srn: formData.srn,
        devices: selectedDevices.length > 0 ? selectedDevices : undefined,
      });
      if ((result as any).success === false && (result as any).error.includes("An account with this email already exists. Please use the \'Sign In\' button to access your existing account.")) {
        toast.error('An account with this email already exists. Please use the "Sign In" button to access your existing account.');
      }
      if ((result as any).success === false && (result as any).error.includes("Company already exists")) {
        toast.error('Company already exists. Please use the "Sign In" button to access your existing account.');
      }
      if ((result as any).success === false && (result as any).error.includes("Password must be at least 6 characters long.")) {
        toast.error('Password must be at least 6 characters long.');
      }
      if (result.success) {
        // Devices are imported inside createCompany (useRegistrationFlow) after company creation
        // Reset form and states
        setFormData({
          name: "",
          prrc_first_name: "",
          prrc_last_name: "",
          email: "",
          website: "",
          telephone: "",
          address: "",
          country: "",
          srn: "",
        });
        setEudamedDevices([]);
        setSelectedDevices([]);
        setHasEudamedData(false);
        setShowDeviceSelection(false);
        setImportProgress(null);
      }

    } catch (error) {
      console.error("[EudamedSearch] Error creating company with user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create company and user account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add New Client</CardTitle>
        <CardDescription>
          Create a new client company. Search EUDAMED database to auto-populate company information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="Enter company name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">EUDAMED Search</h4>
              <Tabs defaultValue="name" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="name">Search by Name</TabsTrigger>
                  <TabsTrigger value="srn">Search by SRN</TabsTrigger>
                </TabsList>

                <TabsContent value="name" className="mt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Search for organizations by company name in the EUDAMED registry
                    </p>
                    <OrganizationLookup onOrganizationSelect={handleOrganizationSelect} />
                  </div>
                </TabsContent>

                <TabsContent value="srn" className="mt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Enter the Single Registration Number (SRN) if you know it
                    </p>
                    <SrnLookupWidget srn={srn} onSrnChange={onSrnChange} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>PRRC Contact</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="prrc_first_name">First name</Label>
                <Input
                  id="prrc_first_name"
                  value={formData.prrc_first_name}
                  onChange={handleChange("prrc_first_name")}
                  placeholder="Enter PRRC first name"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prrc_last_name">Last name</Label>
                <Input
                  id="prrc_last_name"
                  value={formData.prrc_last_name}
                  onChange={handleChange("prrc_last_name")}
                  placeholder="Enter PRRC last name"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="text"
              value={formData.website}
              onChange={handleChange("website")}
              placeholder="www.example.com or https://example.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telephone">Telephone</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={handleChange("telephone")}
              placeholder="Enter telephone number"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              disabled={countriesLoading || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  countriesLoading ? "Loading countries..." :
                    countriesError ? "Error loading countries" :
                      "Select country"
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
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={handleChange("address")}
              placeholder="Enter full address"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* EUDAMED Devices Section */}
          {hasEudamedData && eudamedDevices.length > 0 && (
            <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">EUDAMED Devices</h4>
                  <p className="text-xs text-muted-foreground">
                    {eudamedDevices.length} device(s) found for {organizationName}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeviceSelection(true)}
                >
                  {selectedDevices.length > 0
                    ? `${selectedDevices.length} selected — Change`
                    : 'Select Devices to Import'}
                </Button>
              </div>
              {selectedDevices.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedDevices.slice(0, 5).map((d, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {d.device_name || d.udi_di}
                    </Badge>
                  ))}
                  {selectedDevices.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedDevices.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Import Progress */}
          {importProgress && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Importing devices...</span>
                <span>{importProgress.processed}/{importProgress.total}</span>
              </div>
              <Progress value={(importProgress.processed / importProgress.total) * 100} />
              {importProgress.currentDevice && (
                <p className="text-xs text-muted-foreground">{importProgress.currentDevice}</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account & Company..." : "Create Account & Company"}
            </Button>
          </div>
        </form>

        {/* Device Selection Dialog */}
        {showDeviceSelection && eudamedDevices.length > 0 && (
          <DeviceSelectionDialog
            open={showDeviceSelection}
            onOpenChange={setShowDeviceSelection}
            devices={eudamedDevices}
            organizationName={organizationName}
            onSelectionConfirm={(selected) => {
              setSelectedDevices(selected);
              setShowDeviceSelection(false);
              toast.success(`${selected.length} device(s) selected for import`);
            }}
            onCancel={() => setShowDeviceSelection(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}