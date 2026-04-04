import React, { useState } from 'react';
import { Search, CheckCircle, AlertCircle, Info, Loader2, Database, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEudamedRegistry, EudamedDevice } from '@/hooks/useEudamedRegistry';
import { toast } from 'sonner';
import { formatDeviceClassLabel } from '@/utils/deviceClassUtils';
import { getEudamedDeviceLabel } from '@/utils/eudamedLabel';

interface SrnLookupWidgetProps {
  srn: string;
  onSrnChange: (srn: string) => void;
  onOrganizationFound?: (orgData: {
    name: string;
    country?: string;
    address?: string;
    email?: string;
    website?: string;
    phone?: string;
    contactPerson?: string;
  }) => void;
  onDevicesFound?: (devices: EudamedDevice[]) => void;
  className?: string;
}

export function SrnLookupWidget({ 
  srn,
  onSrnChange,
  onOrganizationFound, 
  onDevicesFound,
  className 
}: SrnLookupWidgetProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    organization?: EudamedDevice;
    devices: EudamedDevice[];
    totalCount?: number;
  } | null>(null);

  const { searchBySrn } = useEudamedRegistry();

  const handleSearch = async () => {
    if (!srn.trim()) {
      toast.error('Please enter an SRN number');
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchBySrn(srn.trim());
      setSearchResult(result);

      if (result.organization) {
        // Extract PRRC contact person information
        const prrcFirstName = result.organization.prrc_first_name || '';
        const prrcLastName = result.organization.prrc_last_name || '';
        const contactPerson = prrcFirstName && prrcLastName 
          ? `${prrcFirstName} ${prrcLastName}`.trim()
          : prrcFirstName || prrcLastName || '';

        // Notify parent about organization found
        onOrganizationFound?.({
          name: result.organization.organization || '',
          country: result.organization.country,
          address: result.organization.address,
          email: result.organization.email,
          website: result.organization.website,
          phone: result.organization.phone,
          contactPerson: contactPerson
        });

        // Notify parent about devices found
        onDevicesFound?.(result.devices);

        toast.success(`Found organization with ${result.devices.length} registered device(s)`);
      } else {
        toast.warning('No organization found for this SRN in EUDAMED registry');
      }
    } catch {
      toast.error('Error searching EUDAMED registry');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5 text-blue-600" />
          EUDAMED SRN Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Single Registration Number (SRN)"
            value={srn}
            onChange={(e) => onSrnChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button 
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !srn.trim()}
            size="default"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {searchResult && (
          <div className="space-y-3">
            {searchResult.organization ? (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Organization found in EUDAMED registry with {searchResult.devices.length} registered device(s){typeof searchResult.totalCount === 'number' ? ` (showing ${searchResult.devices.length} of ${searchResult.totalCount})` : ''}
                  </AlertDescription>
                </Alert>

                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Organization Details</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>
                      <p className="text-muted-foreground">{searchResult.organization.organization}</p>
                    </div>
                    
                    {(searchResult.organization.prrc_first_name || searchResult.organization.prrc_last_name) && (
                      <div>
                        <span className="font-medium">PRRC Contact:</span>
                        <p className="text-muted-foreground">
                          {`${searchResult.organization.prrc_first_name || ''} ${searchResult.organization.prrc_last_name || ''}`.trim()}
                        </p>
                      </div>
                    )}
                    
                    {searchResult.organization.country && (
                      <div>
                        <span className="font-medium">Country:</span>
                        <p className="text-muted-foreground">{searchResult.organization.country}</p>
                      </div>
                    )}
                    
                    {searchResult.organization.address && (
                      <div className="col-span-full">
                        <span className="font-medium">Address:</span>
                        <p className="text-muted-foreground">{searchResult.organization.address}</p>
                      </div>
                    )}
                    
                    {searchResult.organization.email && (
                      <div>
                        <span className="font-medium">Email:</span>
                        <p className="text-muted-foreground">{searchResult.organization.email}</p>
                      </div>
                    )}
                    
                    {searchResult.organization.website && (
                      <div>
                        <span className="font-medium">Website:</span>
                        <p className="text-muted-foreground">{searchResult.organization.website}</p>
                      </div>
                    )}

                    {searchResult.organization.phone && (
                      <div>
                        <span className="font-medium">Phone:</span>
                        <p className="text-muted-foreground">{searchResult.organization.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {searchResult.devices.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">Registered Devices (showing {searchResult.devices.length}{typeof searchResult.totalCount === 'number' ? ` of ${searchResult.totalCount}` : ''})</span>
                    </div>
                    
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {searchResult.devices.slice(0, 5).map((device, index) => (
                        <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/20 rounded">
                          <span className="font-medium">{getEudamedDeviceLabel(device)}</span>
                          {device.risk_class && (
                            <Badge variant="outline" className="text-xs">
                              {formatDeviceClassLabel(device.risk_class)}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {searchResult.devices.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          ... and {searchResult.devices.length - 5} more device(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No organization found for SRN "{srn}" in EUDAMED registry
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <Info className="h-3 w-3 inline mr-1" />
          This searches the EUDAMED database for organizations and their registered devices
        </div>
      </CardContent>
    </Card>
  );
}