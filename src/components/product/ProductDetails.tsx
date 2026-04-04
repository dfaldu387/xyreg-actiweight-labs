import { Card, CardContent } from "@/components/ui/card";
import { EnhancedDeviceInformation } from "@/components/product/EnhancedDeviceInformation";
import { ProductPhases } from "@/components/product/ProductPhases";
import { ProductOverview } from "@/components/product/ProductOverview";
import { GapAnalysis } from "@/components/product/GapAnalysis";
import { TeamMembers } from "@/components/product/TeamMembers";
import { Product, EnhancedProductMarket } from "@/types/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductDetailsProps {
  product: Product;
  demoPhases: Array<{
    id: string;
    name: string;
    description: string;
    status: "Completed" | "In Progress" | "Not Started";
    deadline?: Date;
    isCurrentPhase?: boolean;
    progress: number;
    position: number;
    company_id: string;
  }>;
  onPhaseDeadlineChange: (phaseId: string, date: Date | undefined) => void;
  onProductNameChange: (name: string) => void;
  onIntendedUseChange?: (intendedUse: string) => void;
  onMarketsChange?: (markets: EnhancedProductMarket[]) => void;
  onProductPhaseChange?: (productId: string, phaseId: string) => Promise<boolean>;
  productName?: string;
  
  // Device information fields
  onDescriptionChange?: (description: string) => void;
  onArticleNumberChange?: (articleNumber: string) => void;
  onDeviceCategoryChange?: (deviceCategory: string) => void;
  
  // Device identifiers
  onBasicUdiDiChange?: (basicUdiDi: string) => void;
  onUdiDiChange?: (udiDi: string) => void;
  onUdiPiChange?: (udiPi: string) => void;
  onGtinChange?: (gtin: string) => void;
  onModelVersionChange?: (modelVersion: string) => void;
  
  // Manufacturing information
  onManufacturerChange?: (manufacturer: string) => void;
  onEuRepresentativeChange?: (euRepresentative: string) => void;
  
  // Facility location fields - Now includes both individual parts and the combined string
  onFacilityStreetAddressChange?: (address: string) => void;
  onFacilityCityChange?: (city: string) => void;
  onFacilityPostalCodeChange?: (postalCode: string) => void;
  onFacilityStateProvinceChange?: (stateProvince: string) => void;
  onFacilityCountryChange?: (country: string) => void;
  onFacilityLocationsChange?: (facilityLocations: string) => void;
  
  // Facility location values - Added these to pass from container to component
  facilityStreetAddress?: string;
  facilityCity?: string;
  facilityPostalCode?: string;
  facilityStateProvince?: string;
  facilityCountry?: string;
  facilityLocations?: string;
  
  // EUDAMED Registration fields
  onRegistrationNumberChange?: (registrationNumber: string) => void;
  onRegistrationStatusChange?: (status: string) => void;
  onNotifiedBodyChange?: (notifiedBody: string) => void;
  onMarketAuthorizationHolderChange?: (marketAuthHolder: string) => void;
  onCeMarkStatusChange?: (ceMarkStatus: string) => void;
  onRegistrationDateChange?: (date: Date | undefined) => void;
  onConformityAssessmentRouteChange?: (route: string) => void;
  
  // Images
  onImagesChange?: (images: string[]) => void;
  
  // Indications for use and contraindications
  onIndicationsForUseChange?: (indications: string[]) => void;
  onContraindicationsChange?: (contraindications: string[]) => void;
}

export function ProductDetails({
  product,
  demoPhases,
  onPhaseDeadlineChange,
  onProductNameChange,
  onIntendedUseChange,
  onMarketsChange,
  onProductPhaseChange,
  productName,
  // Device information fields
  onDescriptionChange,
  onArticleNumberChange,
  onDeviceCategoryChange,
  // Device identifiers
  onBasicUdiDiChange,
  onUdiDiChange,
  onUdiPiChange,
  onGtinChange,
  onModelVersionChange,
  // Manufacturing information
  onManufacturerChange,
  onEuRepresentativeChange,
  // Facility location fields
  onFacilityStreetAddressChange,
  onFacilityCityChange,
  onFacilityPostalCodeChange,
  onFacilityStateProvinceChange,
  onFacilityCountryChange,
  onFacilityLocationsChange,
  // Facility location values
  facilityStreetAddress,
  facilityCity,
  facilityPostalCode,
  facilityStateProvince,
  facilityCountry,
  facilityLocations,
  // EUDAMED Registration fields
  onRegistrationNumberChange,
  onRegistrationStatusChange,
  onNotifiedBodyChange,
  onMarketAuthorizationHolderChange,
  onCeMarkStatusChange,
  onRegistrationDateChange,
  onConformityAssessmentRouteChange,
  // Images
  onImagesChange,
  // Indications for use and contraindications
  onIndicationsForUseChange,
  onContraindicationsChange
}: ProductDetailsProps) {
  // Parse images from the product - ensure it's always a string array
  const images = (() => {
    if (!product.image) return [];
    if (typeof product.image === 'string') {
      return product.image.split(',').filter(Boolean);
    }
    if (Array.isArray(product.image)) {
      return product.image;
    }
    return [];
  })();

  // Convert registration_date to Date if it's a string
  const registrationDate = product.registration_date ? 
    (typeof product.registration_date === 'string' ? 
      new Date(product.registration_date) : 
      product.registration_date
    ) : undefined;

  // Transform demo phases to match ProductPhase interface
  const transformedPhases = demoPhases.map(phase => ({
    ...phase,
    product_id: product.id,
    phase_id: phase.id,
    is_current_phase: phase.isCurrentPhase || false
  }));
  
  return (
    <div className="space-y-8 pb-8">
      {/* Product Name Heading - Hidden but kept in the DOM */}
      <h1 className="text-3xl font-bold tracking-tight text-primary mb-6 hidden">
        {productName || product.name || "Product Details"}
      </h1>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Device Information</h2>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <EnhancedDeviceInformation
              productName={productName || product.name || ""}
              onProductNameChange={onProductNameChange}
              intendedUse={product.intended_use}
              onIntendedUseChange={onIntendedUseChange}
              indications_for_use={product.indications_for_use}
              onIndicationsForUseChange={onIndicationsForUseChange}
              contraindications={product.contraindications}
              onContraindicationsChange={onContraindicationsChange}
              markets={product.markets as EnhancedProductMarket[]}
              onMarketsChange={onMarketsChange}
              // Base Product and Product Platform
              baseProductName={product.base_product_name}
              productPlatform={product.product_platform}
              // Device information fields
              description={product.description}
              articleNumber={product.article_number}
              deviceCategory={product.device_category}
              onDescriptionChange={onDescriptionChange}
              onArticleNumberChange={onArticleNumberChange}
              onDeviceCategoryChange={onDeviceCategoryChange}
              // Device identifiers
              basicUdiDi={product.basic_udi_di}
              udiDi={product.udi_di}
              udiPi={product.udi_pi}
              gtin={product.gtin}
              modelVersion={product.model_version}
              onBasicUdiDiChange={onBasicUdiDiChange}
              onUdiDiChange={onUdiDiChange}
              onUdiPiChange={onUdiPiChange}
              onGtinChange={onGtinChange}
              onModelVersionChange={onModelVersionChange}
              // EUDAMED Registration fields
              registrationNumber={product.eudamed_registration_number}
              registrationStatus={product.registration_status}
              registrationDate={registrationDate}
              marketAuthorizationHolder={product.market_authorization_holder}
              onRegistrationNumberChange={onRegistrationNumberChange}
              onRegistrationStatusChange={onRegistrationStatusChange}
              onRegistrationDateChange={onRegistrationDateChange}
              onMarketAuthorizationHolderChange={onMarketAuthorizationHolderChange}
              onCeMarkStatusChange={onCeMarkStatusChange}
              onConformityAssessmentRouteChange={onConformityAssessmentRouteChange}
              // Manufacturing information
              manufacturer={product.manufacturer}
              euRepresentative={product.eu_representative}
              onManufacturerChange={onManufacturerChange}
              onEuRepresentativeChange={onEuRepresentativeChange}
              // Facility location fields - both approaches
              facilityStreetAddress={facilityStreetAddress}
              facilityCity={facilityCity}
              facilityPostalCode={facilityPostalCode}
              facilityStateProvince={facilityStateProvince}
              facilityCountry={facilityCountry}
              onFacilityStreetAddressChange={onFacilityStreetAddressChange}
              onFacilityCityChange={onFacilityCityChange}
              onFacilityPostalCodeChange={onFacilityPostalCodeChange}
              onFacilityStateProvinceChange={onFacilityStateProvinceChange}
              onFacilityCountryChange={onFacilityCountryChange}
              // Also pass the combined location string
              facilityLocations={facilityLocations}
              onFacilityLocationsChange={onFacilityLocationsChange}
              // Images
              images={images}
              onImagesChange={onImagesChange}
              // Progress
              progress={product.progress || 25}
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Product Development Status</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductOverview progress={product.progress} deviceClass={product.class} />
          
          {product.gapAnalysis && product.gapAnalysis.length > 0 && <GapAnalysis items={product.gapAnalysis} showDetailedView={false} />}
        </div>
      </section>

      {/* Team Members as a separate section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Team</h2>
        <TeamMembers members={product.teamMembers} />
      </section>
    </div>
  );
}
