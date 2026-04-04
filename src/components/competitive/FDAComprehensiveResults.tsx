import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Building2, FileText, Package } from 'lucide-react';
import { ProductCodeBadges } from './ProductCodeBadges';
import { FDAComprehensiveResults as FDAResults } from '@/types/fdaEnhanced';
import { format } from 'date-fns';

interface FDAComprehensiveResultsProps {
  results: FDAResults;
  isLoading?: boolean;
}

export function FDAComprehensiveResults({ results, isLoading }: FDAComprehensiveResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Searching FDA databases...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { fda510k, udi, registration, aggregatedStats, searchMetadata } = results;

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{aggregatedStats.totalDevices.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Devices Found</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{aggregatedStats.totalManufacturers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Unique Manufacturers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{searchMetadata.queryTime}ms</p>
                <p className="text-xs text-muted-foreground">Search Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Product Codes */}
      {aggregatedStats.topProductCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top FDA Product Codes</CardTitle>
            <CardDescription>Most common product codes found in search results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {aggregatedStats.topProductCodes.map(({ code, count }) => (
                <ProductCodeBadges 
                  key={code} 
                  productCode={code}
                  className="cursor-pointer"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results by Database */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Results by Database</CardTitle>
          <CardDescription>
            Results from FDA 510(k), UDI/GUDID, and Registration databases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fda510k" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fda510k" className="text-xs">
                510(k) Clearances ({fda510k.totalResults.toLocaleString()})
              </TabsTrigger>
              <TabsTrigger value="udi" className="text-xs">
                UDI/GUDID ({udi.totalResults.toLocaleString()})
              </TabsTrigger>
              <TabsTrigger value="registration" className="text-xs">
                Registration ({registration.totalResults.toLocaleString()})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fda510k" className="mt-4">
              <FDADevicesList 
                devices={fda510k.devices.slice(0, 20)} 
                type="fda510k"
                totalResults={fda510k.totalResults}
              />
            </TabsContent>

            <TabsContent value="udi" className="mt-4">
              <FDADevicesList 
                devices={udi.devices.slice(0, 20)} 
                type="udi"
                totalResults={udi.totalResults}
              />
            </TabsContent>

            <TabsContent value="registration" className="mt-4">
              <FDADevicesList 
                devices={registration.devices.slice(0, 20)} 
                type="registration"
                totalResults={registration.totalResults}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Search Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Search Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Search Terms Used</p>
            <div className="flex flex-wrap gap-1">
              {searchMetadata.actualSearchTerms.map(term => (
                <Badge key={term} variant="outline" className="text-xs">
                  {term}
                </Badge>
              ))}
            </div>
          </div>
          
          {searchMetadata.emdnDerivedTerms.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">EMDN-Derived Terms</p>
              <div className="flex flex-wrap gap-1">
                {searchMetadata.emdnDerivedTerms.map(term => (
                  <Badge key={term} variant="secondary" className="text-xs">
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface FDADevicesListProps {
  devices: any[];
  type: 'fda510k' | 'udi' | 'registration';
  totalResults: number;
}

function FDADevicesList({ devices, type, totalResults }: FDADevicesListProps) {
  if (devices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No devices found in {type} database</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Showing {devices.length} of {totalResults.toLocaleString()} results
      </div>
      
      <ScrollArea className="h-96">
        <div className="space-y-3 pr-4">
          {devices.map((device, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-2">
                {/* Device Name/Description */}
                <div className="font-medium text-sm">
                  {type === 'fda510k' && device.device_name}
                  {type === 'udi' && (device.brand_name || device.device_description)}
                  {type === 'registration' && (device.proprietary_name || device.facility_name)}
                </div>

                {/* Key Information */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {type === 'fda510k' && (
                    <>
                      <ProductCodeBadges 
                        productCodes={device.product_codes}
                        productCode={device.product_code}
                        maxDisplay={3}
                      />
                      {device.device_class && (
                        <Badge variant="outline">Class {device.device_class}</Badge>
                      )}
                      {device.k_number && (
                        <Badge variant="secondary" className="font-mono">
                          {device.k_number}
                        </Badge>
                      )}
                    </>
                  )}
                  
                  {type === 'udi' && (
                    <>
                      {device.company_name && (
                        <Badge variant="outline">{device.company_name}</Badge>
                      )}
                      {device.version_model_number && (
                        <Badge variant="secondary">Model: {device.version_model_number}</Badge>
                      )}
                    </>
                  )}
                  
                  {type === 'registration' && (
                    <>
                      {device.facility_city && device.facility_state && (
                        <Badge variant="outline">
                          {device.facility_city}, {device.facility_state}
                        </Badge>
                      )}
                      {device.establishment_type && Array.isArray(device.establishment_type) && (
                        <Badge variant="secondary">
                          {device.establishment_type[0]}
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                {/* Applicant/Company */}
                <div className="text-xs text-muted-foreground">
                  {type === 'fda510k' && device.applicant}
                  {type === 'udi' && device.company_name}
                  {type === 'registration' && device.facility_name}
                </div>

                {/* Dates */}
                {((type === 'fda510k' && device.decision_date) || 
                  (type === 'udi' && device.commercial_distribution_end_date)) && (
                  <div className="text-xs text-muted-foreground">
                    {type === 'fda510k' && device.decision_date && 
                      `Cleared: ${format(new Date(device.decision_date), 'MMM dd, yyyy')}`
                    }
                    {type === 'udi' && device.commercial_distribution_end_date &&
                      `Distribution End: ${format(new Date(device.commercial_distribution_end_date), 'MMM dd, yyyy')}`
                    }
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
      
      {totalResults > devices.length && (
        <div className="text-center pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            {(totalResults - devices.length).toLocaleString()} more results available
          </p>
        </div>
      )}
    </div>
  );
}