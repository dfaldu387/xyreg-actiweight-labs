
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketImporterDetails } from "@/utils/enhancedMarketRiskClassMapping";
import { countries } from "@/data/countries";

interface ImporterInformationFormProps {
  importerDetails: MarketImporterDetails;
  onImporterChange: (details: MarketImporterDetails) => void;
  isLoading?: boolean;
}

export function ImporterInformationForm({
  importerDetails,
  onImporterChange,
  isLoading = false
}: ImporterInformationFormProps) {
  const handleFieldChange = (field: keyof MarketImporterDetails, value: string) => {
    onImporterChange({
      ...importerDetails,
      [field]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Importer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="importer-name" className="text-sm font-medium">
              Importer Name *
            </Label>
            <Input
              id="importer-name"
              type="text"
              placeholder="Enter importer name"
              value={importerDetails.importerName || ''}
              onChange={(e) => handleFieldChange('importerName', e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="importer-contact" className="text-sm font-medium text-muted-foreground">
              Contact Person
            </Label>
            <Input
              id="importer-contact"
              type="text"
              placeholder="Enter contact person"
              value={importerDetails.importerContactPerson || ''}
              onChange={(e) => handleFieldChange('importerContactPerson', e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="importer-address" className="text-sm font-medium">
              Address *
            </Label>
            <Input
              id="importer-address"
              type="text"
              placeholder="Enter address"
              value={importerDetails.importerAddress || ''}
              onChange={(e) => handleFieldChange('importerAddress', e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="importer-city" className="text-sm font-medium">
              City *
            </Label>
            <Input
              id="importer-city"
              type="text"
              placeholder="Enter city"
              value={importerDetails.importerCity || ''}
              onChange={(e) => handleFieldChange('importerCity', e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="importer-postal" className="text-sm font-medium text-muted-foreground">
              Postal Code
            </Label>
            <Input
              id="importer-postal"
              type="text"
              placeholder="Enter postal code"
              value={importerDetails.importerPostalCode || ''}
              onChange={(e) => handleFieldChange('importerPostalCode', e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="importer-country" className="text-sm font-medium text-muted-foreground">
              Country
            </Label>
            <Select
              value={importerDetails.importerCountry || ''}
              onValueChange={(value) => handleFieldChange('importerCountry', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="importer-email" className="text-sm font-medium text-muted-foreground">
              Email
            </Label>
            <Input
              id="importer-email"
              type="email"
              placeholder="Enter email"
              value={importerDetails.importerEmail || ''}
              onChange={(e) => handleFieldChange('importerEmail', e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="importer-phone" className="text-sm font-medium text-muted-foreground">
              Phone
            </Label>
            <Input
              id="importer-phone"
              type="tel"
              placeholder="Enter phone number"
              value={importerDetails.importerPhone || ''}
              onChange={(e) => handleFieldChange('importerPhone', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
