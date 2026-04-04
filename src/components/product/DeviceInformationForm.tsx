import { useState, useEffect } from "react";
import { HelpAnchor } from "@/components/help/HelpAnchor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

// Common market options for medical devices
const COMMON_MARKETS = [
  "EU/EEA",
  "USA",
  "UK",
  "Canada",
  "Australia",
  "Japan",
  "China",
  "Brazil",
  "Russia",
  "India",
  "South Korea",
  "Switzerland",
  "Other"
];

interface DeviceInformationFormProps {
  productName: string;
  onProductNameChange: (name: string) => void;
  deviceClass?: "I" | "IIa" | "IIb" | "III";
  onDeviceClassChange?: (deviceClass: "I" | "IIa" | "IIb" | "III") => void;
  intendedUse?: string;
  markets?: string[] | any;
  onIntendedUseChange?: (intendedUse: string) => void;
  onMarketsChange?: (markets: string[]) => void;
  // Device information fields
  description?: string;
  articleNumber?: string; 
  deviceCategory?: string;
  onDescriptionChange?: (description: string) => void;
  onArticleNumberChange?: (articleNumber: string) => void;
  onDeviceCategoryChange?: (deviceCategory: string) => void;
  
  // Device identifiers
  basicUdiDi?: string;
  udiDi?: string;
  gtin?: string;
  modelVersion?: string;
  onBasicUdiDiChange?: (basicUdiDi: string) => void;
  onUdiDiChange?: (udiDi: string) => void;
  onGtinChange?: (gtin: string) => void;
  onModelVersionChange?: (modelVersion: string) => void;
  
  // Manufacturing information
  manufacturer?: string;
  euRepresentative?: string;
  onManufacturerChange?: (manufacturer: string) => void;
  onEuRepresentativeChange?: (euRepresentative: string) => void;
  
  // Facility location fields - structured approach
  facilityStreetAddress?: string;
  facilityCity?: string;
  facilityPostalCode?: string;
  facilityStateProvince?: string;
  facilityCountry?: string;
  onFacilityStreetAddressChange?: (address: string) => void;
  onFacilityCityChange?: (city: string) => void;
  onFacilityPostalCodeChange?: (postalCode: string) => void;
  onFacilityStateProvinceChange?: (stateProvince: string) => void;
  onFacilityCountryChange?: (country: string) => void;
  
  // For backward compatibility
  facilityLocations?: string;
  onFacilityLocationsChange?: (facilityLocations: string) => void;
}

export function DeviceInformationForm({ 
  productName, 
  onProductNameChange,
  deviceClass = "IIa", 
  onDeviceClassChange,
  intendedUse,
  markets,
  onIntendedUseChange,
  onMarketsChange,
  // Device information fields
  description,
  articleNumber,
  deviceCategory,
  onDescriptionChange,
  onArticleNumberChange,
  onDeviceCategoryChange,
  // Device identifiers
  basicUdiDi,
  udiDi,
  gtin,
  modelVersion,
  onBasicUdiDiChange,
  onUdiDiChange,
  onGtinChange,
  onModelVersionChange,
  // Manufacturing information
  manufacturer,
  euRepresentative,
  onManufacturerChange,
  onEuRepresentativeChange,
  // Facility location fields - structured approach
  facilityStreetAddress,
  facilityCity,
  facilityPostalCode,
  facilityStateProvince,
  facilityCountry,
  onFacilityStreetAddressChange,
  onFacilityCityChange,
  onFacilityPostalCodeChange,
  onFacilityStateProvinceChange,
  onFacilityCountryChange,
  // For backward compatibility
  facilityLocations,
  onFacilityLocationsChange
}: DeviceInformationFormProps) {
  const [localProductName, setLocalProductName] = useState(productName);
  const [selectedClass, setSelectedClass] = useState<"I" | "IIa" | "IIb" | "III">(deviceClass);
  const [localIntendedUse, setLocalIntendedUse] = useState(intendedUse || "");
  
  // Local state for device information fields
  const [localDescription, setLocalDescription] = useState(description || "");
  const [localArticleNumber, setLocalArticleNumber] = useState(articleNumber || "");
  const [localDeviceCategory, setLocalDeviceCategory] = useState(deviceCategory || "");
  
  // Local state for device identifiers
  const [localBasicUdiDi, setLocalBasicUdiDi] = useState(basicUdiDi || "");
  const [localUdiDi, setLocalUdiDi] = useState(udiDi || "");
  const [localGtin, setLocalGtin] = useState(gtin || "");
  const [localModelVersion, setLocalModelVersion] = useState(modelVersion || "");
  
  // Local state for manufacturing information
  const [localManufacturer, setLocalManufacturer] = useState(manufacturer || "");
  const [localEuRepresentative, setLocalEuRepresentative] = useState(euRepresentative || "");
  
  // Local state for facility location fields - structured approach
  const [localFacilityStreetAddress, setLocalFacilityStreetAddress] = useState(facilityStreetAddress || "");
  const [localFacilityCity, setLocalFacilityCity] = useState(facilityCity || "");
  const [localFacilityPostalCode, setLocalFacilityPostalCode] = useState(facilityPostalCode || "");
  const [localFacilityStateProvince, setLocalFacilityStateProvince] = useState(facilityStateProvince || "");
  const [localFacilityCountry, setLocalFacilityCountry] = useState(facilityCountry || "");
  
  // Handle markets which could be an array, object, or string
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [otherMarket, setOtherMarket] = useState("");
  
  // Update local state when props change
  useEffect(() => {
    setLocalProductName(productName);
    setSelectedClass(deviceClass);
    setLocalIntendedUse(intendedUse || "");
    setLocalDescription(description || "");
    setLocalArticleNumber(articleNumber || "");
    setLocalDeviceCategory(deviceCategory || "");
    setLocalBasicUdiDi(basicUdiDi || "");
    setLocalUdiDi(udiDi || "");
    setLocalGtin(gtin || "");
    setLocalModelVersion(modelVersion || "");
    setLocalManufacturer(manufacturer || "");
    setLocalEuRepresentative(euRepresentative || "");
    setLocalFacilityStreetAddress(facilityStreetAddress || "");
    setLocalFacilityCity(facilityCity || "");
    setLocalFacilityPostalCode(facilityPostalCode || "");
    setLocalFacilityStateProvince(facilityStateProvince || "");
    setLocalFacilityCountry(facilityCountry || "");
  }, [
    productName, 
    deviceClass, 
    intendedUse,
    description,
    articleNumber,
    deviceCategory,
    basicUdiDi,
    udiDi,
    gtin,
    modelVersion,
    manufacturer,
    euRepresentative,
    facilityStreetAddress,
    facilityCity,
    facilityPostalCode,
    facilityStateProvince,
    facilityCountry
  ]);
  
  // Process markets on initial load
  useEffect(() => {
    if (markets) {
      // Handle array of strings
      if (Array.isArray(markets)) {
        setSelectedMarkets(markets);
      } 
      // Handle JSONB object from database
      else if (typeof markets === 'object') {
        setSelectedMarkets(Object.keys(markets));
      } 
      // Handle comma-separated string
      else if (typeof markets === 'string') {
        setSelectedMarkets(markets.split(',').map(m => m.trim()).filter(Boolean));
      }
    }
  }, [markets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onProductNameChange && localProductName !== productName) {
      onProductNameChange(localProductName);
    }
    
    if (onDeviceClassChange && selectedClass !== deviceClass) {
      onDeviceClassChange(selectedClass);
    }
    
    if (onIntendedUseChange && localIntendedUse !== intendedUse) {
      onIntendedUseChange(localIntendedUse);
    }
    
    if (onMarketsChange) {
      // Combine selected checkboxes with the "Other" field if filled
      let finalMarkets = [...selectedMarkets];
      
      // Add the custom "Other" market if it's not empty and not already in the list
      if (otherMarket && !finalMarkets.includes(otherMarket)) {
        finalMarkets.push(otherMarket);
      }
      
      onMarketsChange(finalMarkets);
    }
    
    // Handle device information fields submissions
    if (onDescriptionChange && localDescription !== description) {
      onDescriptionChange(localDescription);
    }
    
    if (onArticleNumberChange && localArticleNumber !== articleNumber) {
      onArticleNumberChange(localArticleNumber);
    }
    
    if (onDeviceCategoryChange && localDeviceCategory !== deviceCategory) {
      onDeviceCategoryChange(localDeviceCategory);
    }
    
    // Handle device identifier fields submissions
    if (onBasicUdiDiChange && localBasicUdiDi !== basicUdiDi) {
      onBasicUdiDiChange(localBasicUdiDi);
    }
    
    if (onUdiDiChange && localUdiDi !== udiDi) {
      onUdiDiChange(localUdiDi);
    }
    
    if (onGtinChange && localGtin !== gtin) {
      onGtinChange(localGtin);
    }
    
    if (onModelVersionChange && localModelVersion !== modelVersion) {
      onModelVersionChange(localModelVersion);
    }
    
    // Handle manufacturing information submissions
    if (onManufacturerChange && localManufacturer !== manufacturer) {
      onManufacturerChange(localManufacturer);
    }
    
    if (onEuRepresentativeChange && localEuRepresentative !== euRepresentative) {
      onEuRepresentativeChange(localEuRepresentative);
    }
    
    // Handle facility location fields submissions - structured approach
    if (onFacilityStreetAddressChange && localFacilityStreetAddress !== facilityStreetAddress) {
      onFacilityStreetAddressChange(localFacilityStreetAddress);
    }
    
    if (onFacilityCityChange && localFacilityCity !== facilityCity) {
      onFacilityCityChange(localFacilityCity);
    }
    
    if (onFacilityPostalCodeChange && localFacilityPostalCode !== facilityPostalCode) {
      onFacilityPostalCodeChange(localFacilityPostalCode);
    }
    
    if (onFacilityStateProvinceChange && localFacilityStateProvince !== facilityStateProvince) {
      onFacilityStateProvinceChange(localFacilityStateProvince);
    }
    
    if (onFacilityCountryChange && localFacilityCountry !== facilityCountry) {
      onFacilityCountryChange(localFacilityCountry);
    }
    
    // For backward compatibility
    if (onFacilityLocationsChange) {
      const formattedAddress = [
        localFacilityStreetAddress,
        localFacilityCity,
        localFacilityPostalCode,
        localFacilityStateProvince,
        localFacilityCountry
      ].filter(Boolean).join(', ');
      
      if (formattedAddress !== facilityLocations) {
        onFacilityLocationsChange(formattedAddress);
      }
    }
    
    console.log("Form submitted with values:", { 
      productName: localProductName,
      deviceClass: selectedClass,
      intendedUse: localIntendedUse,
      markets: selectedMarkets.concat(otherMarket ? [otherMarket] : []),
      description: localDescription,
      articleNumber: localArticleNumber,
      deviceCategory: localDeviceCategory,
      basicUdiDi: localBasicUdiDi,
      udiDi: localUdiDi,
      gtin: localGtin,
      modelVersion: localModelVersion,
      manufacturer: localManufacturer,
      euRepresentative: localEuRepresentative,
      facilityAddress: {
        street: localFacilityStreetAddress,
        city: localFacilityCity,
        postalCode: localFacilityPostalCode,
        stateProvince: localFacilityStateProvince,
        country: localFacilityCountry
      }
    });
  };

  const handleClassChange = (value: "I" | "IIa" | "IIb" | "III") => {
    setSelectedClass(value);
  };
  
  const handleMarketChange = (market: string, checked: boolean) => {
    if (checked) {
      setSelectedMarkets(prev => [...prev, market]);
    } else {
      setSelectedMarkets(prev => prev.filter(m => m !== market));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">General Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="device-name">Device Name *</Label>
              <Input
                id="device-name"
                placeholder="Enter device name"
                value={localProductName}
                onChange={(e) => setLocalProductName(e.target.value)}
                className="w-full"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
                required
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="article-number">Article Number</Label>
              <Input
                id="article-number"
                placeholder="Enter article number"
                value={localArticleNumber}
                onChange={(e) => setLocalArticleNumber(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter device description"
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Classification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Classification & Intended Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <HelpAnchor helpKey="device-classification">
            <div className="space-y-4">
              <Label>Device Class</Label>
              <RadioGroup
                value={selectedClass}
                onValueChange={handleClassChange as (value: string) => void}
                className="grid grid-cols-4 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="I" id="class-i" />
                  <Label htmlFor="class-i" className="font-normal">Class I</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="IIa" id="class-iia" />
                  <Label htmlFor="class-iia" className="font-normal">Class IIa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="IIb" id="class-iib" />
                  <Label htmlFor="class-iib" className="font-normal">Class IIb</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="III" id="class-iii" />
                  <Label htmlFor="class-iii" className="font-normal">Class III</Label>
                </div>
              </RadioGroup>
            </div>
            </HelpAnchor>
            
            <div className="space-y-3">
              <Label htmlFor="device-category">Device Category</Label>
              <Input
                id="device-category"
                placeholder="Enter device category"
                value={localDeviceCategory}
                onChange={(e) => setLocalDeviceCategory(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <HelpAnchor helpKey="intended-use">
          <div className="space-y-3">
            <Label htmlFor="intended-use">Intended Use</Label>
            <Textarea
              id="intended-use"
              placeholder="Describe the intended use of this device"
              value={localIntendedUse}
              onChange={(e) => setLocalIntendedUse(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          </HelpAnchor>
        </CardContent>
      </Card>
      
      {/* Device Identifiers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Device Identifiers</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <HelpAnchor helpKey="udi-di">
          <div className="space-y-3">
            <Label htmlFor="basic-udi-di">Basic UDI-DI</Label>
            <Input
              id="basic-udi-di"
              placeholder="Enter Basic UDI-DI"
              value={localBasicUdiDi}
              onChange={(e) => setLocalBasicUdiDi(e.target.value)}
              className="w-full"
            />
          </div>
          </HelpAnchor>
          
          <div className="space-y-3">
            <Label htmlFor="udi-di">UDI-DI</Label>
            <Input
              id="udi-di"
              placeholder="Enter UDI-DI"
              value={localUdiDi}
              onChange={(e) => setLocalUdiDi(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="gtin">GTIN/EAN</Label>
            <Input
              id="gtin"
              placeholder="Enter GTIN/EAN"
              value={localGtin}
              onChange={(e) => setLocalGtin(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="model-version">Model/Version</Label>
            <Input
              id="model-version"
              placeholder="Enter model or version"
              value={localModelVersion}
              onChange={(e) => setLocalModelVersion(e.target.value)}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Manufacturing Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manufacturing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                placeholder="Enter manufacturer name"
                value={localManufacturer}
                onChange={(e) => setLocalManufacturer(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Pre-filled with company name but can be modified</p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="eu-rep">Importer/EU Representative</Label>
              <Input
                id="eu-rep"
                placeholder="Enter EU representative"
                value={localEuRepresentative}
                onChange={(e) => setLocalEuRepresentative(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Facility Location - Structured Fields */}
          <div className="space-y-4">
            <Label>Facility Location</Label>
            
            <div className="space-y-3">
              <Label htmlFor="facility-street">Street Address</Label>
              <Input
                id="facility-street"
                placeholder="Street address"
                value={localFacilityStreetAddress}
                onChange={(e) => setLocalFacilityStreetAddress(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="facility-city">City</Label>
                <Input
                  id="facility-city"
                  placeholder="City"
                  value={localFacilityCity}
                  onChange={(e) => setLocalFacilityCity(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="facility-postal">Postal Code</Label>
                <Input
                  id="facility-postal"
                  placeholder="Postal code"
                  value={localFacilityPostalCode}
                  onChange={(e) => setLocalFacilityPostalCode(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="facility-state">State/Province</Label>
                <Input
                  id="facility-state"
                  placeholder="State or province"
                  value={localFacilityStateProvince}
                  onChange={(e) => setLocalFacilityStateProvince(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="facility-country">Country</Label>
                <Input
                  id="facility-country"
                  placeholder="Country"
                  value={localFacilityCountry}
                  onChange={(e) => setLocalFacilityCountry(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Target Markets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Target Markets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {COMMON_MARKETS.slice(0, -1).map(market => (
                <div key={market} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`market-${market}`} 
                    checked={selectedMarkets.includes(market)}
                    onCheckedChange={(checked) => handleMarketChange(market, checked as boolean)}
                  />
                  <Label 
                    htmlFor={`market-${market}`} 
                    className="font-normal text-sm"
                  >
                    {market}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="pt-2">
              <Label htmlFor="other-market" className="text-sm">Other market(s)</Label>
              <Input
                id="other-market"
                placeholder="Add other markets (comma-separated)"
                value={otherMarket}
                onChange={(e) => setOtherMarket(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button type="submit">Save Device Information</Button>
      </div>
    </form>
  );
}
