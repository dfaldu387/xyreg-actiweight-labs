import { useState, useEffect } from "react";
import { DeviceInformationForm } from "@/components/product/DeviceInformationForm";
import { ChevronLeft, ChevronRight, PanelLeft, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from "@/components/ui/card";

// Reusing the same props interface from DeviceInformationForm
interface CollapsibleDeviceInfoProps {
  productName: string;
  onProductNameChange?: (name: string) => void;
  deviceClass?: "I" | "IIa" | "IIb" | "III";
  onDeviceClassChange?: (deviceClass: "I" | "IIa" | "IIb" | "III") => void;
  intendedUse?: string;
  markets?: string[] | any;
  onIntendedUseChange?: (intendedUse: string) => void;
  onMarketsChange?: (markets: string[]) => void;
  
  // Add indications_for_use and contraindications props
  indications_for_use?: string[];
  onIndicationsForUseChange?: (indications: string[]) => void;
  contraindications?: string[];
  onContraindicationsChange?: (contraindications: string[]) => void;
  
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
  
  // Images
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  
  // Progress
  progress?: number;
}

// Define sections for the device information form
const deviceInfoSections = [
  { id: "general", title: "General Information", description: "Basic device details and identification" },
  { id: "classification", title: "Classification", description: "Device class and category" },
  { id: "identifiers", title: "Device Identifiers", description: "UDI-DI, GTIN and other identifiers" },
  { id: "manufacturing", title: "Manufacturing", description: "Manufacturer and facility information" },
  { id: "markets", title: "Target Markets", description: "Regions where device will be sold" }
];

export function CollapsibleDeviceInfo(props: CollapsibleDeviceInfoProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    classification: false,
    identifiers: false,
    manufacturing: false,
    markets: false
  });

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  if (sidebarCollapsed) {
    // Collapsed state - show summary card
    return (
      <Card className="relative">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{props.productName || "Device"}</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSidebar} 
              className="flex items-center gap-1"
            >
              <span>Expand</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Class {props.deviceClass || "N/A"} • {props.deviceCategory || "Medical Device"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Manufacturer:</p>
                <p className="font-medium truncate">{props.manufacturer || "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Article #:</p>
                <p className="font-medium truncate">{props.articleNumber || "Not specified"}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSidebar} 
              className="w-full mt-4"
            >
              View All Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expanded state - show collapsible sections
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Device Information</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="flex items-center gap-1"
        >
          <span>Collapse</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {deviceInfoSections.map(section => (
        <Collapsible 
          key={section.id}
          open={openSections[section.id]}
          onOpenChange={() => toggleSection(section.id)}
          className="border rounded-md bg-white"
        >
          <CollapsibleTrigger asChild>
            <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-muted/20">
              <div>
                <h4 className="text-base font-medium">{section.title}</h4>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                {openSections[section.id] ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t">
            <div className="p-4">
              {/* Conditionally render different parts of the form based on section */}
              {section.id === "general" && (
                <div className="grid grid-cols-1 gap-4">
                  {/* General section fields */}
                  <DeviceInfoSection
                    section="general"
                    productName={props.productName}
                    onProductNameChange={props.onProductNameChange}
                    description={props.description}
                    onDescriptionChange={props.onDescriptionChange}
                    articleNumber={props.articleNumber}
                    onArticleNumberChange={props.onArticleNumberChange}
                  />
                </div>
              )}
              
              {section.id === "classification" && (
                <div className="grid grid-cols-1 gap-4">
                  {/* Classification section fields */}
                  <DeviceInfoSection
                    section="classification"
                    deviceClass={props.deviceClass}
                    onDeviceClassChange={props.onDeviceClassChange}
                    deviceCategory={props.deviceCategory}
                    onDeviceCategoryChange={props.onDeviceCategoryChange}
                    intendedUse={props.intendedUse}
                    onIntendedUseChange={props.onIntendedUseChange}
                    indications_for_use={props.indications_for_use}
                    onIndicationsForUseChange={props.onIndicationsForUseChange}
                    contraindications={props.contraindications}
                    onContraindicationsChange={props.onContraindicationsChange}
                  />
                </div>
              )}
              
              {section.id === "identifiers" && (
                <div className="grid grid-cols-1 gap-4">
                  {/* Identifiers section fields */}
                  <DeviceInfoSection
                    section="identifiers"
                    basicUdiDi={props.basicUdiDi}
                    onBasicUdiDiChange={props.onBasicUdiDiChange}
                    udiDi={props.udiDi}
                    onUdiDiChange={props.onUdiDiChange}
                    gtin={props.gtin}
                    onGtinChange={props.onGtinChange}
                    modelVersion={props.modelVersion}
                    onModelVersionChange={props.onModelVersionChange}
                  />
                </div>
              )}
              
              {section.id === "manufacturing" && (
                <div className="grid grid-cols-1 gap-4">
                  {/* Manufacturing section fields */}
                  <DeviceInfoSection
                    section="manufacturing"
                    manufacturer={props.manufacturer}
                    onManufacturerChange={props.onManufacturerChange}
                    euRepresentative={props.euRepresentative}
                    onEuRepresentativeChange={props.onEuRepresentativeChange}
                    facilityStreetAddress={props.facilityStreetAddress}
                    onFacilityStreetAddressChange={props.onFacilityStreetAddressChange}
                    facilityCity={props.facilityCity}
                    onFacilityCityChange={props.onFacilityCityChange}
                    facilityPostalCode={props.facilityPostalCode}
                    onFacilityPostalCodeChange={props.onFacilityPostalCodeChange}
                    facilityStateProvince={props.facilityStateProvince}
                    onFacilityStateProvinceChange={props.onFacilityStateProvinceChange}
                    facilityCountry={props.facilityCountry}
                    onFacilityCountryChange={props.onFacilityCountryChange}
                  />
                </div>
              )}
              
              {section.id === "markets" && (
                <div className="grid grid-cols-1 gap-4">
                  {/* Markets section fields */}
                  <DeviceInfoSection
                    section="markets"
                    markets={props.markets}
                    onMarketsChange={props.onMarketsChange}
                  />
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
      
      <Button 
        variant="outline" 
        onClick={() => {
          // Open all sections
          const allOpen = Object.fromEntries(
            deviceInfoSections.map(s => [s.id, true])
          );
          setOpenSections(allOpen);
        }}
        className="w-full text-sm"
      >
        Expand All Sections
      </Button>
    </div>
  );
}

// Component to render the appropriate fields based on the section
function DeviceInfoSection({ section, ...props }: { section: string } & Partial<CollapsibleDeviceInfoProps>) {
  // Use DeviceInformationForm but only render the relevant part based on section
  switch (section) {
    case "general":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="product-name" className="text-sm font-medium">Product Name</label>
            <input
              id="product-name"
              type="text"
              value={props.productName || ""}
              onChange={(e) => props.onProductNameChange && props.onProductNameChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="article-number" className="text-sm font-medium">Article Number</label>
            <input
              id="article-number"
              type="text"
              value={props.articleNumber || ""}
              onChange={(e) => props.onArticleNumberChange && props.onArticleNumberChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <textarea
              id="description"
              value={props.description || ""}
              onChange={(e) => props.onDescriptionChange && props.onDescriptionChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
            />
          </div>
        </div>
      );
    
    case "classification":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Device Class</label>
            <div className="grid grid-cols-4 gap-2">
              {["I", "IIa", "IIb", "III"].map(c => (
                <label key={c} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={props.deviceClass === c}
                    onChange={() => props.onDeviceClassChange && 
                      props.onDeviceClassChange(c as "I" | "IIa" | "IIb" | "III")}
                    className="h-4 w-4"
                  />
                  <span>Class {c}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="device-category" className="text-sm font-medium">Device Category</label>
            <input
              id="device-category"
              type="text"
              value={props.deviceCategory || ""}
              onChange={(e) => props.onDeviceCategoryChange && props.onDeviceCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="intended-use" className="text-sm font-medium">Intended Use</label>
            <textarea
              id="intended-use"
              value={props.intendedUse || ""}
              onChange={(e) => props.onIntendedUseChange && props.onIntendedUseChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
            />
          </div>
          
          {/* Add indications for use section */}
          <div className="space-y-2">
            <label htmlFor="indications-for-use" className="text-sm font-medium">Indications For Use</label>
            <div className="space-y-2">
              {props.indications_for_use && props.indications_for_use.map((indication, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={indication}
                    onChange={(e) => {
                      if (props.onIndicationsForUseChange && props.indications_for_use) {
                        const newIndications = [...props.indications_for_use];
                        newIndications[index] = e.target.value;
                        props.onIndicationsForUseChange(newIndications);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (props.onIndicationsForUseChange && props.indications_for_use) {
                        const newIndications = props.indications_for_use.filter((_, i) => i !== index);
                        props.onIndicationsForUseChange(newIndications);
                      }
                    }}
                    className="p-1 rounded-md text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (props.onIndicationsForUseChange) {
                    const currentIndications = props.indications_for_use || [];
                    props.onIndicationsForUseChange([...currentIndications, '']);
                  }
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              >
                + Add Indication
              </button>
            </div>
          </div>
          
          {/* Add contraindications section */}
          <div className="space-y-2">
            <label htmlFor="contraindications" className="text-sm font-medium">Contraindications</label>
            <div className="space-y-2">
              {props.contraindications && props.contraindications.map((contraindication, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={contraindication}
                    onChange={(e) => {
                      if (props.onContraindicationsChange && props.contraindications) {
                        const newContraindications = [...props.contraindications];
                        newContraindications[index] = e.target.value;
                        props.onContraindicationsChange(newContraindications);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (props.onContraindicationsChange && props.contraindications) {
                        const newContraindications = props.contraindications.filter((_, i) => i !== index);
                        props.onContraindicationsChange(newContraindications);
                      }
                    }}
                    className="p-1 rounded-md text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (props.onContraindicationsChange) {
                    const currentContraindications = props.contraindications || [];
                    props.onContraindicationsChange([...currentContraindications, '']);
                  }
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              >
                + Add Contraindication
              </button>
            </div>
          </div>
        </div>
      );
    
    case "identifiers":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="basic-udi-di" className="text-sm font-medium">Basic UDI-DI</label>
            <input
              id="basic-udi-di"
              type="text"
              value={props.basicUdiDi || ""}
              onChange={(e) => props.onBasicUdiDiChange && props.onBasicUdiDiChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="udi-di" className="text-sm font-medium">UDI-DI</label>
            <input
              id="udi-di"
              type="text"
              value={props.udiDi || ""}
              onChange={(e) => props.onUdiDiChange && props.onUdiDiChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="gtin" className="text-sm font-medium">GTIN/EAN</label>
            <input
              id="gtin"
              type="text"
              value={props.gtin || ""}
              onChange={(e) => props.onGtinChange && props.onGtinChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="model-version" className="text-sm font-medium">Model/Version</label>
            <input
              id="model-version"
              type="text"
              value={props.modelVersion || ""}
              onChange={(e) => props.onModelVersionChange && props.onModelVersionChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      );
    
    case "manufacturing":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="manufacturer" className="text-sm font-medium">Manufacturer</label>
            <input
              id="manufacturer"
              type="text"
              value={props.manufacturer || ""}
              onChange={(e) => props.onManufacturerChange && props.onManufacturerChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="eu-representative" className="text-sm font-medium">EU Representative</label>
            <input
              id="eu-representative"
              type="text"
              value={props.euRepresentative || ""}
              onChange={(e) => props.onEuRepresentativeChange && props.onEuRepresentativeChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Facility Location</label>
            
            <div className="space-y-2">
              <input
                id="facility-street"
                type="text"
                placeholder="Street Address"
                value={props.facilityStreetAddress || ""}
                onChange={(e) => props.onFacilityStreetAddressChange && props.onFacilityStreetAddressChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <input
                id="facility-city"
                type="text"
                placeholder="City"
                value={props.facilityCity || ""}
                onChange={(e) => props.onFacilityCityChange && props.onFacilityCityChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
              
              <input
                id="facility-postal-code"
                type="text"
                placeholder="Postal Code"
                value={props.facilityPostalCode || ""}
                onChange={(e) => props.onFacilityPostalCodeChange && props.onFacilityPostalCodeChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <input
                id="facility-state"
                type="text"
                placeholder="State/Province"
                value={props.facilityStateProvince || ""}
                onChange={(e) => props.onFacilityStateProvinceChange && props.onFacilityStateProvinceChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
              
              <input
                id="facility-country"
                type="text"
                placeholder="Country"
                value={props.facilityCountry || ""}
                onChange={(e) => props.onFacilityCountryChange && props.onFacilityCountryChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      );
    
    case "markets":
      // Parse markets data
      const parsedMarkets = (() => {
        if (Array.isArray(props.markets)) {
          return props.markets;
        } else if (props.markets && typeof props.markets === 'object') {
          return Object.entries(props.markets)
            .filter(([_, isSelected]) => isSelected)
            .map(([market]) => market);
        } else if (typeof props.markets === 'string') {
          return props.markets.split(',').filter(Boolean).map(m => m.trim());
        }
        return [];
      })();
      
      const commonMarkets = [
        "EU/EEA", "USA", "UK", "Canada", "Australia", 
        "Japan", "China", "Brazil", "South Korea"
      ];
      
      // Handle market selection
      const handleMarketChange = (market: string, checked: boolean) => {
        if (!props.onMarketsChange) return;
        
        const currentMarkets = [...parsedMarkets];
        
        if (checked && !currentMarkets.includes(market)) {
          currentMarkets.push(market);
        } else if (!checked) {
          const index = currentMarkets.indexOf(market);
          if (index !== -1) {
            currentMarkets.splice(index, 1);
          }
        }
        
        props.onMarketsChange(currentMarkets);
      };

      return (
        <div className="space-y-4">
          <label className="text-sm font-medium">Target Markets</label>
          
          <div className="grid grid-cols-2 gap-2">
            {commonMarkets.map(market => (
              <label key={market} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={parsedMarkets.includes(market)}
                  onChange={(e) => handleMarketChange(market, e.target.checked)}
                  className="h-4 w-4"
                />
                <span>{market}</span>
              </label>
            ))}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="other-market" className="text-sm font-medium">Other Markets</label>
            <input
              id="other-market"
              type="text"
              placeholder="Enter other markets, separated by commas"
              className="w-full px-3 py-2 border rounded-md"
              onBlur={(e) => {
                if (!e.target.value.trim() || !props.onMarketsChange) return;
                
                const newMarkets = e.target.value.split(',').map(m => m.trim()).filter(Boolean);
                const updatedMarkets = [...parsedMarkets.filter(m => commonMarkets.includes(m)), ...newMarkets];
                
                props.onMarketsChange(updatedMarkets);
                e.target.value = '';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && props.onMarketsChange) {
                  e.preventDefault();
                  
                  const target = e.target as HTMLInputElement;
                  if (!target.value.trim()) return;
                  
                  const newMarkets = target.value.split(',').map(m => m.trim()).filter(Boolean);
                  const updatedMarkets = [...parsedMarkets.filter(m => commonMarkets.includes(m)), ...newMarkets];
                  
                  props.onMarketsChange(updatedMarkets);
                  target.value = '';
                }
              }}
            />
            <p className="text-xs text-muted-foreground">Press Enter to add</p>
          </div>
          
          {/* Display custom markets */}
          {parsedMarkets.filter(m => !commonMarkets.includes(m)).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {parsedMarkets.filter(m => !commonMarkets.includes(m)).map((market, index) => (
                <div key={index} className="bg-muted px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  <span>{market}</span>
                  <button 
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      if (props.onMarketsChange) {
                        props.onMarketsChange(parsedMarkets.filter(m => m !== market));
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    
    default:
      return null;
  }
}
