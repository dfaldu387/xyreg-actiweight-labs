import React, { useState, useEffect } from 'react';
import { Search, Building, MapPin, Mail, Globe, Users, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEudamedRegistry } from '@/hooks/useEudamedRegistry';
import { toast } from 'sonner';

interface OrganizationLookupProps {
  onOrganizationSelect?: (organization: {
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
    postcode?: string;
    prrc_email?: string;
    prrc_phone?: string;
  }) => void;
  className?: string;
}

export function OrganizationLookup({ onOrganizationSelect, className }: OrganizationLookupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState<Array<{
    organization: string;
    organization_country?: string;
    organization_id_srn?: string;
    device_count: number;
    email?: string;
    website?: string;
    phone?: string;
    prrc_first_name?: string;
    prrc_last_name?: string;
    address?: string;
    postcode?: string;
    prrc_email?: string;
    prrc_phone?: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const { searchOrganizations } = useEudamedRegistry();

  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setIsSearching(true);
        try {
          const results = await searchOrganizations(searchTerm);
          setOrganizations(results);
        } catch (error) {
          // console.error('[OrganizationLookup] Error searching organizations:', error);
          toast.error('Error searching organizations');
        } finally {
          setIsSearching(false);
        }
      } else {
        setOrganizations([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleOrganizationSelect = (org: {
    organization: string;
    organization_country?: string;
    organization_id_srn?: string;
    device_count: number;
    email?: string;
    website?: string;
    phone?: string;
    prrc_first_name?: string;
    prrc_last_name?: string;
    address?: string;
    postcode?: string;
    prrc_email?: string;
    prrc_phone?: string;
  }) => {
    setSelectedOrg(org.organization);
    onOrganizationSelect?.({
      name: org.organization,
      country: org.organization_country,
      id_srn: org.organization_id_srn,
      device_count: org.device_count,
      email: org.email,
      website: org.website,
      phone: org.phone,
      prrc_first_name: org.prrc_first_name,
      prrc_last_name: org.prrc_last_name,
      address: org.address,
      postcode: org.postcode,
      prrc_email: org.prrc_email,
      prrc_phone: org.prrc_phone,
    });
    toast.success(`Selected: ${org.organization}`);
  };

  const getCountryFlag = (country?: string) => {
    const countryFlags: Record<string, string> = {
      'DE': '🇩🇪', 'US': '🇺🇸', 'FR': '🇫🇷', 'IT': '🇮🇹', 'UK': '🇬🇧',
      'NL': '🇳🇱', 'CH': '🇨🇭', 'SE': '🇸🇪', 'DK': '🇩🇰', 'AT': '🇦🇹',
      'JP': '🇯🇵', 'CA': '🇨🇦', 'AU': '🇦🇺', 'IE': '🇮🇪', 'ES': '🇪🇸',
    };

    return country ? countryFlags[country] || '🌍' : '🌍';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Organization Registry Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search organization name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {organizations.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              Found {organizations.length} organizations
            </p>

            {organizations.map((org, index) => (
              <div
                key={`${org.organization}-${org.organization_country}-${index}`}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${selectedOrg === org.organization
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-border'
                  }`}
                onClick={() => handleOrganizationSelect(org)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground truncate">
                        {org.organization}
                      </h4>
                      {org.organization_country && (
                        <span className="text-lg">
                          {getCountryFlag(org.organization_country)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {org.organization_country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{org.organization_country}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{org.device_count} devices</span>
                      </div>
                    </div>

                    {org.organization_id_srn && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          ID/SRN: {org.organization_id_srn}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchTerm.length > 0 && searchTerm.length < 3 && (
          <p className="text-sm text-muted-foreground">
            Type at least 3 characters to search organizations...
          </p>
        )}

        {searchTerm.length >= 3 && organizations.length === 0 && !isSearching && (
          <p className="text-sm text-muted-foreground">
            No organizations found matching "{searchTerm}"
          </p>
        )}

        <div className="text-xs text-muted-foreground">
          <Building className="w-3 h-3 inline mr-1" />
          Browse organizations from the EUDAMED database to auto-populate manufacturer details.
        </div>
      </CardContent>
    </Card>
  );
}