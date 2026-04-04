import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEudamedProductImport } from "@/hooks/useEudamedProductImport";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useEudamedRegistry } from '@/hooks/useEudamedRegistry';
import { getEudamedDeviceLabel } from '@/utils/eudamedLabel';
import { Upload, Search, AlertTriangle, CheckCircle, Info, Building2 } from 'lucide-react';
import { DeviceSelectionDialog } from "@/components/eudamed/DeviceSelectionDialog";
import { ProductUpdateService } from '@/services/productUpdateService';

interface CompanyEudamedImporterProps {
  companyId: string;
  companyName: string;
  onImportComplete?: () => void;
}

export function CompanyEudamedImporter({ companyId, companyName, onImportComplete }: CompanyEudamedImporterProps) {
  const [searchMethod, setSearchMethod] = useState<'name' | 'srn'>('name');
  const [srnInput, setSrnInput] = useState('');
  const [nameInput, setNameInput] = useState(companyName);
  const [isSearching, setIsSearching] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<any | null>(null);
  const [searchResult, setSearchResult] = useState<{
    organization?: any;
    devices: any[];
    totalCount?: number;
  } | null>(null);
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<any[]>([]);

  const { searchBySrn, searchOrganizations } = useEudamedRegistry();
  const { isImporting, progress, importSelectedDevices } = useEudamedProductImport();

  const handleNameSearch = async () => {
    if (!nameInput.trim() || nameInput.trim().length < 3) {
      toast.error('Please enter at least 3 characters for company name');
      return;
    }

    setIsSearching(true);
    setOrganizations([]);
    setSelectedOrganization(null);
    setSearchResult(null);
    setSelectedDevices([]);

    try {
      const results = await searchOrganizations(nameInput.trim());
      setOrganizations(results || []);

      if (results && results.length > 0) {
        toast.success(`Found ${results.length} organizations matching "${nameInput}"`);
      } else {
        toast.error('No organizations found for this name');
      }
    } catch (error) {
      console.error('[CompanyEudamedImporter] Organization search error:', error);
      toast.error('Failed to search organizations');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSrnSearch = async () => {
    if (!srnInput.trim()) {
      toast.error('Please enter an SRN number');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    setSelectedDevices([]);

    try {
      const result = await searchBySrn(srnInput.trim());

      setSearchResult({
        devices: result.devices,
        totalCount: result.totalCount || 0
      });

      if (result.devices && result.devices.length > 0) {
        toast.success(`Found ${result.devices.length} devices for SRN ${srnInput}`);
      } else {
        toast.error('No devices found for this SRN');
      }
    } catch (error) {
      console.error('[CompanyEudamedImporter] Search error:', error);
      toast.error('Failed to search EUDAMED registry');
    } finally {
      setIsSearching(false);
    }
  };

  const handleOrganizationSelect = async (organization: any) => {
    setSelectedOrganization(organization);
    
    if (organization.organization_id_srn) {
      setIsSearching(true);
      try {
        const result = await searchBySrn(organization.organization_id_srn);
        
        setSearchResult({
          organization,
          devices: result.devices,
          totalCount: result.totalCount || 0
        });

        if (result.devices && result.devices.length > 0) {
          toast.success(`Found ${result.devices.length} devices for ${organization.organization}`);
        } else {
          toast.error('No devices found for this organization');
        }
      } catch (error) {
        console.error('[CompanyEudamedImporter] Error fetching devices for organization:', error);
        toast.error('Failed to fetch devices for selected organization');
      } finally {
        setIsSearching(false);
      }
    }
  };

  const getCountryFlag = (countryCode: string): string => {
    const flags: Record<string, string> = {
      'AT': '🇦🇹', 'BE': '🇧🇪', 'BG': '🇧🇬', 'HR': '🇭🇷', 'CY': '🇨🇾', 'CZ': '🇨🇿',
      'DK': '🇩🇰', 'EE': '🇪🇪', 'FI': '🇫🇮', 'FR': '🇫🇷', 'DE': '🇩🇪', 'GR': '🇬🇷',
      'HU': '🇭🇺', 'IE': '🇮🇪', 'IT': '🇮🇹', 'LV': '🇱🇻', 'LT': '🇱🇹', 'LU': '🇱🇺',
      'MT': '🇲🇹', 'NL': '🇳🇱', 'PL': '🇵🇱', 'PT': '🇵🇹', 'RO': '🇷🇴', 'SK': '🇸🇰',
      'SI': '🇸🇮', 'ES': '🇪🇸', 'SE': '🇸🇪', 'GB': '🇬🇧', 'NO': '🇳🇴', 'IS': '🇮🇸',
      'LI': '🇱🇮', 'CH': '🇨🇭'
    };
    return flags[countryCode] || '🌍';
  };

  const handleImportSelected = async () => {
    if (!selectedDevices || selectedDevices.length === 0) {
      toast.error('No devices selected for import');
      return;
    }

    try {
      const result = await importSelectedDevices(companyId, selectedDevices);
      
      if (result.success) {
        toast.success(`Successfully imported ${result.newProductsCreated} products`);
      } else {
        toast.error(`Import completed with ${result.errors.length} errors`);
      }
      
      // Invalidate caches so sidebar and product lists update immediately
      await ProductUpdateService.refreshSidebarProducts();
      
      // Reset state after successful import
      setSelectedDevices([]);
      onImportComplete?.();
      
    } catch (error) {
      console.error('[CompanyEudamedImporter] Import error:', error);
      toast.error('Failed to import selected products');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Company Products from EUDAMED
        </CardTitle>
        <CardDescription>
          Import products for {companyName} from the EUDAMED registry by searching for the company by name or SRN.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How to use:</strong> Search for the company by name or SRN to find devices in EUDAMED, then import them as products. 
            This will add any missing products that weren't imported during company creation.
          </AlertDescription>
        </Alert>

        <Tabs value={searchMethod} onValueChange={(value) => setSearchMethod(value as 'name' | 'srn')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="name">Search by Name</TabsTrigger>
            <TabsTrigger value="srn">Search by SRN</TabsTrigger>
          </TabsList>
          
          <TabsContent value="name" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="name-input" className="text-sm font-medium block mb-1">
                  Company Name
                </label>
                <Input
                  id="name-input"
                  placeholder="Enter company name (e.g., Emblation Ltd)"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNameSearch();
                    }
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleNameSearch}
                  disabled={!nameInput.trim() || nameInput.trim().length < 3 || isSearching}
                  variant="outline"
                >
                  <Search className="h-4 w-4 mr-1" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            {organizations.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Organization:</label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {organizations.map((org, index) => (
                      <Card 
                        key={index} 
                        className={`cursor-pointer transition-colors hover:bg-accent ${
                          selectedOrganization?.organization_id_srn === org.organization_id_srn ? 'bg-accent border-primary' : ''
                        }`}
                        onClick={() => handleOrganizationSelect(org)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span className="font-medium">{org.organization || 'Unknown Organization'}</span>
                                {org.organization_country && (
                                  <span className="text-sm">
                                    {getCountryFlag(org.organization_country.split(' ')[0])} {org.organization_country}
                                  </span>
                                )}
                              </div>
                              {org.organization_id_srn && (
                                <p className="text-xs text-muted-foreground mt-1">SRN: {org.organization_id_srn}</p>
                              )}
                              {!org.organization && !org.organization_id_srn && (
                                <p className="text-xs text-red-500">Missing organization data</p>
                              )}
                            </div>
                            <Badge variant="secondary">
                              {org.device_count || 0} devices
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="srn" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="srn-input" className="text-sm font-medium block mb-1">
                  SRN (Single Registration Number)
                </label>
                <Input
                  id="srn-input"
                  placeholder="Enter company SRN (e.g., GB-MF-000001234)"
                  value={srnInput}
                  onChange={(e) => setSrnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSrnSearch();
                    }
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSrnSearch}
                  disabled={!srnInput.trim() || isSearching}
                  variant="outline"
                >
                  <Search className="h-4 w-4 mr-1" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {searchResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                {searchResult.organization && (
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4" />
                    <strong>{searchResult.organization.organization}</strong>
                    {searchResult.organization.organization_country && (
                      <span className="text-sm">
                        {getCountryFlag(searchResult.organization.organization_country.split(' ')[0])} {searchResult.organization.organization_country}
                      </span>
                    )}
                    {searchResult.organization.organization_id_srn && (
                      <Badge variant="outline" className="text-xs">
                        {searchResult.organization.organization_id_srn}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    Found {searchResult.devices.length} devices
                  </Badge>
                  <span>Total in EUDAMED: {searchResult.totalCount}</span>
                </div>
                
                {searchResult.devices.length > 0 && (
                  <div>
                    <strong>Devices to import:</strong>
                    <ul className="list-disc list-inside mt-1 max-h-32 overflow-y-auto">
                      {searchResult.devices.slice(0, 10).map((device, index) => (
                        <li key={index} className="text-sm">
                          {getEudamedDeviceLabel(device)} 
                          {device.risk_class && ` (Class ${device.risk_class})`}
                        </li>
                      ))}
                      {searchResult.devices.length > 10 && (
                        <li className="text-sm text-muted-foreground">
                          ... and {searchResult.devices.length - 10} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

          {searchResult?.devices && searchResult.devices.length > 0 && (
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setSelectedDevices([]);
                  setShowDeviceSelection(true);
                }}
                disabled={isImporting}
                className="w-full"
                variant="outline"
              >
                <Search className="h-4 w-4 mr-1" />
                Select Devices to Import ({searchResult.devices.length} available)
              </Button>
              
              {selectedDevices.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {selectedDevices.length} device{selectedDevices.length !== 1 ? 's' : ''} selected for import
                  </div>
                  <Button 
                    onClick={handleImportSelected}
                    disabled={isImporting}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {isImporting ? 'Importing...' : `Import ${selectedDevices.length} Selected Device${selectedDevices.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Progress value={progress.processed / Math.max(progress.total, 1) * 100} className="flex-1" />
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress.processed / Math.max(progress.total, 1) * 100)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {progress.operation || 'Importing selected devices...'}
              </p>
            </div>
          )}
      </CardContent>
      
      <DeviceSelectionDialog
        open={showDeviceSelection}
        onOpenChange={setShowDeviceSelection}
        devices={searchResult?.devices || []}
        organizationName={searchResult?.organization?.organization || selectedOrganization?.organization || 'Unknown Organization'}
        onSelectionConfirm={(devices) => {
          setSelectedDevices(devices);
          setShowDeviceSelection(false);
        }}

        onCancel={() => {
          setShowDeviceSelection(false);
        }}
        preSelectedDevices={new Set(selectedDevices.map(d => d.udi_di))}
        companyId={companyId}
        onImportComplete={async () => {
          await ProductUpdateService.refreshSidebarProducts();
          onImportComplete?.();
        }}
      />
    </Card>
  );
}