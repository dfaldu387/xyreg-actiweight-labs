import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { UDIConfigurationSetup } from "@/components/product/device/UDIConfigurationSetup";
import { UDIGenerationWizard } from "@/components/product/device/UDIGenerationWizard";
import { useUDIDIVariants } from "@/hooks/useUDIDIVariants";
import { useUDIConfiguration } from "@/hooks/useUDIConfiguration";

interface IdentificationTraceabilityTabProps {
  productId: string;
  companyId: string;
  productData?: any; // Product data for auto-populating from EUDAMED
}

export function IdentificationTraceabilityTab({ productId, companyId, productData }: IdentificationTraceabilityTabProps) {
  const [showUDIWizard, setShowUDIWizard] = useState(false);
  const { variants, isLoading: isLoadingVariants } = useUDIDIVariants(productId);
  const { configuration, isLoading: isLoadingConfig, refetch } = useUDIConfiguration(companyId);

  const handleConfigurationComplete = async () => {
    console.log('Configuration complete, refetching...');
    await refetch();
  };

  if (isLoadingConfig) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading UDI configuration...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="udi" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="udi">UDI Management</TabsTrigger>
          <TabsTrigger value="eudamed">EUDAMED & Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="udi" className="space-y-6">
          {!configuration.isConfigured ? (
            <UDIConfigurationSetup 
              companyId={companyId}
              productData={productData}
              onConfigurationComplete={handleConfigurationComplete}
            />
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>UDI-DI Variants</CardTitle>
                      <CardDescription>
                        Manage unique device identifier variants for different packaging and configurations
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowUDIWizard(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Generate UDI-DI
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingVariants ? (
                    <div className="text-muted-foreground">Loading UDI variants...</div>
                  ) : variants && variants.length > 0 ? (
                    <div className="space-y-4">
                      {variants.map((variant) => (
                        <div key={variant.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">UDI-DI Variant</h4>
                            <Badge variant="outline">
                              Level {variant.package_level_indicator}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">UDI-DI:</span> {variant.generated_udi_di}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Item Reference:</span> {variant.item_reference}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Packaging Level:</span> {variant.packaging_level}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No UDI variants configured yet</p>
                      <Button 
                        onClick={() => setShowUDIWizard(true)}
                        variant="outline"
                      >
                        Create First UDI-DI
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>UDI Configuration</CardTitle>
                  <CardDescription>
                    Current UDI settings and issuing agency configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Issuing Agency</label>
                        <p className="text-sm text-muted-foreground">{configuration.issuingAgency}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Company Prefix</label>
                        <p className="text-sm text-muted-foreground">{configuration.companyPrefix}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="eudamed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>EUDAMED Registration</CardTitle>
              <CardDescription>
                European Database on Medical Devices registration and compliance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">EUDAMED Registration Status</label>
                    <Badge variant="outline" className="mt-1">Pending Setup</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Basic UDI-DI</label>
                    <p className="text-sm text-muted-foreground">Not configured</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  EUDAMED registration features will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showUDIWizard && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <UDIGenerationWizard
              productId={productId}
              companyId={companyId}
              onClose={() => setShowUDIWizard(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}