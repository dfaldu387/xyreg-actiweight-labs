import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceOverviewTabSection } from "@/components/product/device/sections/DeviceOverviewTabSection";
import { DeviceImageUpload } from "@/components/product/device/DeviceImageUpload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ImageIcon, Building, Link2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { EnhancedProductMarket } from "@/types/client";

interface EnhancedDeviceInformationProps {
  productName?: string;
  onProductNameChange?: (name: string) => void;
  intendedUse?: string;
  onIntendedUseChange?: (intendedUse: string) => void;
  indications_for_use?: string[];
  onIndicationsForUseChange?: (indications: string[]) => void;
  contraindications?: string[];
  onContraindicationsChange?: (contraindications: string[]) => void;
  markets?: EnhancedProductMarket[];
  onMarketsChange?: (markets: EnhancedProductMarket[]) => void;
  baseProductName?: string;
  productPlatform?: string;

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
  udiPi?: string;
  gtin?: string;
  modelVersion?: string;
  onBasicUdiDiChange?: (basicUdiDi: string) => void;
  onUdiDiChange?: (udiDi: string) => void;
  onUdiPiChange?: (udiPi: string) => void;
  onGtinChange?: (gtin: string) => void;
  onModelVersionChange?: (modelVersion: string) => void;

  // EUDAMED Registration fields
  registrationNumber?: string;
  registrationStatus?: string;
  registrationDate?: Date | undefined;
  marketAuthorizationHolder?: string;
  onRegistrationNumberChange?: (registrationNumber: string) => void;
  onRegistrationStatusChange?: (status: string) => void;
  onRegistrationDateChange?: (date: Date | undefined) => void;
  onMarketAuthorizationHolderChange?: (marketAuthHolder: string) => void;
  onCeMarkStatusChange?: (ceMarkStatus: string) => void;
  onConformityAssessmentRouteChange?: (route: string) => void;

  // Manufacturing information
  manufacturer?: string;
  euRepresentative?: string;
  onManufacturerChange?: (manufacturer: string) => void;
  onEuRepresentativeChange?: (euRepresentative: string) => void;

  // Facility location fields - both approaches
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
  facilityLocations?: string;
  onFacilityLocationsChange?: (facilityLocations: string) => void;

  // Images
  images?: string[];
  onImagesChange?: (images: string[]) => void;

  // Progress
  progress?: number;
}

export function EnhancedDeviceInformation({
  productName,
  onProductNameChange,
  intendedUse,
  onIntendedUseChange,
  indications_for_use,
  onIndicationsForUseChange,
  contraindications,
  onContraindicationsChange,
  markets,
  onMarketsChange,
  baseProductName,
  productPlatform,
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
  udiPi,
  gtin,
  modelVersion,
  onBasicUdiDiChange,
  onUdiDiChange,
  onUdiPiChange,
  onGtinChange,
  onModelVersionChange,
  // EUDAMED Registration fields
  registrationNumber,
  registrationStatus,
  registrationDate,
  marketAuthorizationHolder,
  onRegistrationNumberChange,
  onRegistrationStatusChange,
  onRegistrationDateChange,
  onMarketAuthorizationHolderChange,
  onCeMarkStatusChange,
  onConformityAssessmentRouteChange,
  // Manufacturing information
  manufacturer,
  euRepresentative,
  onManufacturerChange,
  onEuRepresentativeChange,
  // Facility location fields - both approaches
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
  facilityLocations,
  onFacilityLocationsChange,
  // Images
  images,
  onImagesChange,
  // Progress
  progress
}: EnhancedDeviceInformationProps) {
  const [activeTab, setActiveTab] = React.useState("basics");

  return (
    <div className="max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basics">1. Basics</TabsTrigger>
          <TabsTrigger value="overview">2. Overview</TabsTrigger>
          <TabsTrigger value="images">3. Images & Media</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-6 mt-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="Enter product name"
                    value={productName || ""}
                    onChange={(e) => onProductNameChange?.(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    data-form-type="other"
                  />
                </div>


                <div className="space-y-2 col-span-2">
                  <Label htmlFor="intendedUse">Intended Use</Label>
                  <Textarea
                    id="intendedUse"
                    placeholder="Enter intended use"
                    value={intendedUse || ""}
                    onChange={(e) => onIntendedUseChange?.(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Base Product and Product Platform Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Product Lineage & Platform
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseProductName" className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-blue-600" />
                    Base Product Name
                  </Label>
                  <Input
                    id="baseProductName"
                    placeholder="Enter base product name"
                    value={baseProductName || ""}
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    This field is read-only and set during product creation.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productPlatform" className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    Product Platform
                  </Label>
                  <Input
                    id="productPlatform"
                    placeholder="Enter product platform"
                    value={productPlatform || ""}
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    This field is read-only and set during product creation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter description"
                    value={description || ""}
                    onChange={(e) => onDescriptionChange?.(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="articleNumber">Article Number</Label>
                  <Input
                    id="articleNumber"
                    placeholder="Enter article number"
                    value={articleNumber || ""}
                    onChange={(e) => onArticleNumberChange?.(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceCategory">Device Category</Label>
                  <Input
                    id="deviceCategory"
                    placeholder="Enter device category"
                    value={deviceCategory || ""}
                    onChange={(e) => onDeviceCategoryChange?.(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Identifiers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Device Identifiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basicUdiDi">Basic UDI-DI</Label>
                  <Input
                    id="basicUdiDi"
                    placeholder="Enter basic UDI-DI"
                    value={basicUdiDi || ""}
                    onChange={(e) => onBasicUdiDiChange?.(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="udiDi">UDI-DI</Label>
                  <Input
                    id="udiDi"
                    placeholder="Enter UDI-DI"
                    value={udiDi || ""}
                    onChange={(e) => onUdiDiChange?.(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="udiPi">UDI-PI</Label>
                  <Input
                    id="udiPi"
                    placeholder="Enter UDI-PI"
                    value={udiPi || ""}
                    onChange={(e) => onUdiPiChange?.(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gtin">GTIN</Label>
                  <Input
                    id="gtin"
                    placeholder="Enter GTIN"
                    value={gtin || ""}
                    onChange={(e) => onGtinChange?.(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelVersion">Model Version</Label>
                  <Input
                    id="modelVersion"
                    placeholder="Enter model version"
                    value={modelVersion || ""}
                    onChange={(e) => onModelVersionChange?.(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* EUDAMED Registration Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                EUDAMED Registration & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">EUDAMED Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    placeholder="Enter EUDAMED registration number"
                    value={registrationNumber || ""}
                    onChange={(e) => onRegistrationNumberChange?.(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationStatus">Registration Status</Label>
                  <Select
                    value={registrationStatus || ""}
                    onValueChange={(value) => onRegistrationStatusChange?.(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select registration status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Registered">Registered</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Not Required">Not Required</SelectItem>
                      <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketAuthorizationHolder">Market Authorization Holder</Label>
                  <Input
                    id="marketAuthorizationHolder"
                    placeholder="Enter market authorization holder"
                    value={marketAuthorizationHolder || ""}
                    onChange={(e) => onMarketAuthorizationHolderChange?.(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDate">Registration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !registrationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {registrationDate ? format(registrationDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={registrationDate}
                        onSelect={onRegistrationDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ceMarkStatus">CE Mark Status</Label>
                  <Input
                    id="ceMarkStatus"
                    placeholder="Enter CE mark status"
                    value=""
                    onChange={(e) => onCeMarkStatusChange?.(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conformityAssessmentRoute">Conformity Assessment Route</Label>
                  <Input
                    id="conformityAssessmentRoute"
                    placeholder="Enter conformity assessment route"
                    value=""
                    onChange={(e) => onConformityAssessmentRouteChange?.(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manufacturing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Manufacturing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    placeholder="Enter manufacturer"
                    value={manufacturer || ""}
                    onChange={(e) => onManufacturerChange?.(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="euRepresentative">EU Representative</Label>
                  <Input
                    id="euRepresentative"
                    placeholder="Enter EU representative"
                    value={euRepresentative || ""}
                    onChange={(e) => onEuRepresentativeChange?.(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <DeviceOverviewTabSection
            productName={productName}
            basicUdiDi={basicUdiDi}
            udiDi={udiDi}
            intendedUse={intendedUse}
            deviceCategory={deviceCategory}
            images={images}
            markets={markets}
            baseProductName={baseProductName}
            productPlatform={productPlatform}
          />
        </TabsContent>

        <TabsContent value="images" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Product Images & Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceImageUpload
                images={images}
                onImagesChange={onImagesChange || (() => {})}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
