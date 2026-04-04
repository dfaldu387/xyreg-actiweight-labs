import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ClientDetails, UserType } from '@/hooks/useRegistrationFlow';
import { useCountries } from '@/hooks/useCountries';
import { useEudamedRegistry, EudamedDevice } from '@/hooks/useEudamedRegistry';
import { OrganizationLookup } from '@/components/device-information/OrganizationLookup';
import { DeviceSelectionDialog } from '@/components/eudamed/DeviceSelectionDialog';
import { Search, User, Package } from 'lucide-react';
import { toast } from 'sonner';

interface ClientDetailsFormProps {
  clientDetails: ClientDetails;
  isLoading: boolean;
  selectedUserType: UserType;
  onDetailsChange: (updates: Partial<ClientDetails>) => void;
  onSubmit: () => Promise<{ status: boolean, message: string }>;
  createCompany: (companyData: { name: string, address: string, country: string, srn: string, email: string, website?: string, telephone?: string, prrc_first_name?: string, prrc_last_name?: string, devices?: EudamedDevice[] }) => Promise<{ status: boolean, message: string }>;
}

export function ClientDetailsForm({ clientDetails, isLoading, selectedUserType, onDetailsChange, onSubmit, createCompany }: ClientDetailsFormProps) {
  const { countries } = useCountries();
  const { searchBySrn } = useEudamedRegistry();
  const [eudamedOpen, setEudamedOpen] = React.useState(false);

  // Device selection states
  const [eudamedDevices, setEudamedDevices] = React.useState<EudamedDevice[]>([]);
  const [selectedDevices, setSelectedDevices] = React.useState<EudamedDevice[]>([]);
  const [showDeviceSelection, setShowDeviceSelection] = React.useState(false);
  const [organizationName, setOrganizationName] = React.useState('');

  const hasPrrc = !!(clientDetails.prrcFirstName || clientDetails.prrcLastName);

  const handleOrganizationSelect = async (orgData: any) => {
    onDetailsChange({
      companyName: orgData.name || orgData.organizationName || '',
      country: orgData.country || '',
      eudamedId: orgData.id_srn || orgData.srn || orgData.srnNumber || '',
      email: orgData.email || '',
      website: orgData.website || '',
      telephone: orgData.phone || orgData.telephone || '',
      address: orgData.address || '',
      prrcFirstName: orgData.prrc_first_name || orgData.prrcFirstName || '',
      prrcLastName: orgData.prrc_last_name || orgData.prrcLastName || '',
    });
    setEudamedOpen(false);

    const srnValue = orgData.id_srn || orgData.srn || orgData.srnNumber || '';
    setOrganizationName(orgData.name || orgData.organizationName || '');

    // Fetch devices by SRN
    if (srnValue) {
      try {
        const { devices } = await searchBySrn(srnValue);
        if (devices && devices.length > 0) {
          setEudamedDevices(devices);
          setShowDeviceSelection(true);
          toast.success(`Found ${devices.length} device(s) for ${orgData.name || 'this company'}`);
        } else {
          setEudamedDevices([]);
          toast.info(`No devices found in EUDAMED for ${orgData.name || 'this company'}`);
        }
      } catch (error) {
        console.error('[ClientDetailsForm] Error fetching devices:', error);
        setEudamedDevices([]);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onDetailsChange({ [name]: value });
  };

  const handleCountryChange = (value: string) => {
    onDetailsChange({ country: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientDetails.companyName.trim()) {
      toast.error("Company name cannot be empty or whitespace.");
      return;
    }

    const result = await createCompany({
      name: clientDetails.companyName,
      address: clientDetails.address,
      country: clientDetails.country,
      srn: clientDetails.eudamedId,
      email: clientDetails.email,
      website: clientDetails.website,
      telephone: clientDetails.telephone,
      prrc_first_name: clientDetails.prrcFirstName,
      prrc_last_name: clientDetails.prrcLastName,
      devices: selectedDevices.length > 0 ? selectedDevices : undefined,
    });
    if ((result as any).success === false && (result as any).error.includes("An account with this email already exists. Please use the 'Sign In' button to access your existing account.")) {
      toast.error('An account with this email already exists. Please use the "Sign In" button to access your existing account.');
    }
    if ((result as any).success === false && (result as any).error.includes("Password must be at least 6 characters long.")) {
      toast.error('Password must be at least 6 characters long.');
    }
    if ((result as any).success === false && (result as any).error.includes("Company already exists")) {
      toast.error('Company already exists. Please use the "Sign In" button to access your existing account.');
    }
  };

  return (
    <div className="space-y-6 py-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Name + EUDAMED lookup */}
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <div className="flex gap-2">
            <Input
              id="companyName"
              name="companyName"
              value={clientDetails.companyName}
              onChange={handleInputChange}
              required
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" className="gap-1 shrink-0" onClick={() => setEudamedOpen(true)}>
              <Search className="h-4 w-4" />
              EUDAMED
            </Button>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={clientDetails.email}
            onChange={handleInputChange}
            placeholder="company@example.com"
          />
        </div>

        {/* Website + Telephone row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Input
              id="website"
              name="website"
              value={clientDetails.website}
              onChange={handleInputChange}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telephone">Telephone <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Input
              id="telephone"
              name="telephone"
              type="tel"
              value={clientDetails.telephone}
              onChange={handleInputChange}
              placeholder="+1 234 567 890"
            />
          </div>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={clientDetails.country} onValueChange={handleCountryChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a country" />
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

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input
            id="address"
            name="address"
            value={clientDetails.address}
            onChange={handleInputChange}
            placeholder="Street, City, ZIP"
          />
        </div>

        {/* PRRC Contact — read-only, shown only when auto-filled from EUDAMED */}
        {hasPrrc && (
          <div className="space-y-2 rounded-md border p-3 bg-muted/50">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              PRRC Contact <span className="text-xs">(from EUDAMED)</span>
            </div>
            <p className="text-sm">
              {clientDetails.prrcFirstName} {clientDetails.prrcLastName}
            </p>
          </div>
        )}

        {/* EUDAMED Devices Section */}
        {eudamedDevices.length > 0 && (
          <div className="space-y-2 rounded-md border p-3 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Package className="h-4 w-4" />
                EUDAMED Devices <span className="text-xs">({eudamedDevices.length} found)</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeviceSelection(true)}
              >
                {selectedDevices.length > 0
                  ? `${selectedDevices.length} selected — Change`
                  : 'Select Devices'}
              </Button>
            </div>
            {selectedDevices.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          Complete
        </Button>
      </form>

      {/* EUDAMED Organization Search Dialog */}
      <Dialog open={eudamedOpen} onOpenChange={setEudamedOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search EUDAMED Registry
            </DialogTitle>
          </DialogHeader>
          <OrganizationLookup onOrganizationSelect={handleOrganizationSelect} />
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
