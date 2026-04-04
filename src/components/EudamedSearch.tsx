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
import { useCountries } from "@/hooks/useCountries";
import { supabase } from "@/integrations/supabase/client";
import { useEudamedRegistry, EudamedDevice } from "@/hooks/useEudamedRegistry";
import { DeviceSelectionDialog } from "@/components/eudamed/DeviceSelectionDialog";
import { createLegacyProducts } from "@/services/legacyProductService";
import { CompanyInitializationService } from "@/services/companyInitializationService";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

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
  const { lang } = useTranslation();
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
          // console.warn('Error fetching from EUDAMED API:', error);
        }
      }

      return detailedInfo;
    } catch (error) {
      // console.error('Error fetching detailed organization info:', error);
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
    // Fetch detailed information
    const detailedInfo = await fetchDetailedOrganizationInfo(organization);
  
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
      prrc_last_name: organization.prrc_last_name || detailedInfo.prrc_last_name || prev.prrc_last_name
    }));

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
      toast.error(lang('eudamedSearch.companyNameRequired'));
      return;
    }

    if (!createCompany) {
      toast.error(lang('eudamedSearch.companyCreationNotAvailable'));
      return;
    }

    // Validate that personal details are available for user registration
    if (!formData.email?.trim()) {
      toast.error(lang('eudamedSearch.emailRequired'));
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
        srn: formData.srn
      });
      if ((result as any).success === false && (result as any).error.includes("An account with this email already exists. Please use the \'Sign In\' button to access your existing account.")) {
        toast.error(lang('eudamedSearch.accountAlreadyExists'));
      }
      if ((result as any).success === false && (result as any).error.includes("Company already exists")) {
        toast.error(lang('eudamedSearch.companyAlreadyExists'));
      }
      if ((result as any).success === false && (result as any).error.includes("Password must be at least 6 characters long.")) {
        toast.error(lang('eudamedSearch.passwordTooShort'));
      }
      if (result.success) {
      
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
      } else {
        // console.error('[EudamedSearch] Company/user creation failed:', result.error);
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : lang('eudamedSearch.failedToCreate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      {/* <CardHeader>
        <CardTitle>Add New Client</CardTitle>
        <CardDescription>
          Create a new client company. Search EUDAMED database to auto-populate company information.
        </CardDescription>
      </CardHeader> */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* <div className="grid gap-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              onChange={handleChange("name")}
              placeholder="Enter company name"
              required
              disabled={isSubmitting}
            />
          </div> */}

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">{lang('eudamedSearch.title')}</h4>
              <Tabs defaultValue="name" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="name">{lang('eudamedSearch.searchByName')}</TabsTrigger>
                  <TabsTrigger value="srn">{lang('eudamedSearch.searchBySrn')}</TabsTrigger>
                </TabsList>

                <TabsContent value="name" className="mt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {lang('eudamedSearch.searchByNameDescription')}
                    </p>
                    <OrganizationLookup onOrganizationSelect={handleOrganizationSelect} />
                  </div>
                </TabsContent>

                <TabsContent value="srn" className="mt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {lang('eudamedSearch.searchBySrnDescription')}
                    </p>
                    <SrnLookupWidget srn={srn} onSrnChange={onSrnChange} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* <div className="grid gap-2">
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

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account & Company..." : "Create Account & Company"}
            </Button>
          </div> */}
        </form>
      </CardContent>
    </Card>
  );
}