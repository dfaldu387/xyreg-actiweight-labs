import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEudamedRegistry, EudamedDevice } from '@/hooks/useEudamedRegistry';
import { toast } from 'sonner';

interface UdiLookupWidgetProps {
  onDeviceFound?: (device: EudamedDevice) => void;
  onOrganizationFound?: (orgData: {
    name: string;
    country?: string;
    address?: string;
    email?: string;
    website?: string;
  }) => void;
  className?: string;
}

export function UdiLookupWidget({ 
  onDeviceFound, 
  onOrganizationFound, 
  className 
}: UdiLookupWidgetProps) {
  const [udiInput, setUdiInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    device?: EudamedDevice;
    isValid: boolean;
    suggestions?: string[];
  } | null>(null);

  const { searchByUdiDi, validateUdiDi } = useEudamedRegistry();

  const handleSearch = async () => {
    if (!udiInput.trim()) return;
    
    setIsSearching(true);
    try {
      const isValid = validateUdiDi(udiInput.trim());
      if (!isValid) {
        setSearchResult({ isValid: false, suggestions: [] });
        toast.warning('UDI-DI format appears invalid');
        return;
      }

      const device = await searchByUdiDi(udiInput.trim());
      const result = {
        isValid: true,
        device: device ?? undefined,
        suggestions: device ? undefined : [],
      } as const;

      setSearchResult(result);
      
      if (device) {
        toast.success('Device found in EUDAMED registry!');
        onDeviceFound?.(device);
        
        // Extract organization data with safe fallbacks
        if (onOrganizationFound && device.organization) {
          onOrganizationFound({
            name: String(device.organization || ''),
            country: (device.organization_country || device.country)
              ? String(device.organization_country || device.country)
              : undefined,
            address: (device.organization_address || device.address)
              ? String(device.organization_address || device.address)
              : undefined,
            email: (device.organization_email || device.email)
              ? String(device.organization_email || device.email)
              : undefined,
            website: (device.organization_website || device.website)
              ? String(device.organization_website || device.website)
              : undefined,
          });
        }
      } else {
        toast.warning('UDI-DI not found in EUDAMED registry');
      }
    } catch (error) {
      console.error('Error searching UDI-DI:', error);
      toast.error('Error searching UDI-DI');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDeviceCharacteristics = (device: EudamedDevice) => {
    const characteristics = [];
    if (device.is_implantable) characteristics.push('Implantable');
    if (device.is_measuring) characteristics.push('Measuring');
    if (device.is_reusable) characteristics.push('Reusable');
    if (device.is_active) characteristics.push('Active');
    if (device.is_single_use) characteristics.push('Single Use');
    if (device.is_sterile) characteristics.push('Sterile');
    return characteristics;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          UDI-DI Registry Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter UDI-DI to search EUDAMED registry..."
            value={udiInput}
            onChange={(e) => setUdiInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch} 
            type="button"
            disabled={isSearching || !udiInput.trim()}
            size="default"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {searchResult && (
          <div className="space-y-4">
            {searchResult.isValid && searchResult.device ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Device Found in EUDAMED Registry</span>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {searchResult.device.device_name}
                    </h4>
                    {(searchResult.device.device_model || searchResult.device.model) && (
                      <p className="text-sm text-muted-foreground">
                        Model: {searchResult.device.device_model || searchResult.device.model}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Organization:</span>
                      <p className="text-muted-foreground">{searchResult.device.organization}</p>
                      {searchResult.device.organization_country && (
                        <p className="text-muted-foreground">
                          {searchResult.device.organization_country}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <span className="font-medium">Risk Class:</span>
                      <p className="text-muted-foreground">
                        {searchResult.device.risk_class || 'Not specified'}
                      </p>
                    </div>

                    {searchResult.device.issuing_agency && (
                      <div>
                        <span className="font-medium">Issuing Agency:</span>
                        <p className="text-muted-foreground">
                          {searchResult.device.issuing_agency}
                        </p>
                      </div>
                    )}

                    {searchResult.device.status && (
                      <div>
                        <span className="font-medium">Status:</span>
                        <p className="text-muted-foreground">{searchResult.device.status}</p>
                      </div>
                    )}
                  </div>

                  {formatDeviceCharacteristics(searchResult.device).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-sm font-medium">Device Characteristics:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formatDeviceCharacteristics(searchResult.device).map((char) => (
                            <Badge key={char} variant="secondary" className="text-xs">
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {searchResult.device.placed_on_market && (
                    <>
                      <Separator />
                      <div className="text-sm">
                        <span className="font-medium">Market Date:</span>
                        <p className="text-muted-foreground">
                          {typeof searchResult.device.placed_on_market === 'string' ? 
                            new Date(searchResult.device.placed_on_market).toLocaleDateString() :
                            String(searchResult.device.placed_on_market)
                          }
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-warning">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">UDI-DI Not Found</span>
                </div>
                
                {searchResult.suggestions && searchResult.suggestions.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4" />
                      <span className="text-sm font-medium">Similar UDI-DIs found:</span>
                    </div>
                    <div className="space-y-1">
                      {searchResult.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setUdiInput(suggestion)}
                          className="block text-sm text-primary hover:underline cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <Info className="w-3 h-3 inline mr-1" />
          Search against 800k+ medical devices in the EUDAMED registry for regulatory compliance and auto-population.
        </div>
      </CardContent>
    </Card>
  );
}