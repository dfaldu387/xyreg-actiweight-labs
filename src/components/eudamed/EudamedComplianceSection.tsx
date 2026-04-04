import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertCircle, Calendar, Building, User, Globe, Phone, Mail } from 'lucide-react';
import { EudamedEnrichButton } from './EudamedEnrichButton';

interface EudamedComplianceSectionProps {
  productData: any;
  companyId?: string;
  onDataRefresh?: () => void;
}

export function EudamedComplianceSection({ productData, companyId, onDataRefresh }: EudamedComplianceSectionProps) {
  const hasEudamedData = productData?.eudamed_organization || productData?.eudamed_id_srn;

  if (!hasEudamedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              EUDAMED Registration
            </div>
            {companyId && productData?.id && (
              <EudamedEnrichButton
                productId={productData.id}
                productName={productData.name || 'Unknown Product'}
                companyId={companyId}
                hasEudamedData={hasEudamedData}
                currentUdiDi={productData?.udi_di}
                onEnrichmentComplete={onDataRefresh}
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">No EUDAMED registration data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              This product may not be registered in the EUDAMED database or data has not been imported.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderField = (label: string, value: any, icon?: React.ReactNode) => {
    if (!value) return null;
    
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {label}
        </label>
        <div className="text-sm">
          {typeof value === 'boolean' ? (
            <Badge variant={value ? 'default' : 'secondary'}>
              {value ? 'Yes' : 'No'}
            </Badge>
          ) : (
            <span className="text-foreground">{value}</span>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        {title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          EUDAMED Registration Information
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Registered Device
          </Badge>
          {productData.eudamed_status && (
            <Badge variant={productData.eudamed_status === 'on-the-market' ? 'default' : 'secondary'}>
              {productData.eudamed_status.replace(/-/g, ' ').toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Device Information */}
        {renderSection("Device Information", <>
          {renderField("UDI-DI", productData.udi_di)}
          {renderField("ID/SRN", productData.eudamed_id_srn)}
          {renderField("Trade Names", productData.eudamed_trade_names)}
          {renderField("Device Name", productData.eudamed_device_name)}
          {renderField("Device Model", productData.eudamed_device_model)}
          {renderField("Reference Number", productData.eudamed_reference_number)}
          {renderField("Basic UDI-DI Code", productData.eudamed_basic_udi_di_code)}
          {renderField("Risk Class", productData.eudamed_risk_class)}
          {renderField("Issuing Agency", productData.eudamed_issuing_agency)}
        </>)}

        <Separator />

        {/* Organization Information */}
        {renderSection("Organization Information", <>
          {renderField("Organization", productData.eudamed_organization, <Building className="w-4 h-4" />)}
          {renderField("Organization Status", productData.eudamed_organization_status)}
          {renderField("Address", productData.eudamed_address)}
          {renderField("Postcode", productData.eudamed_postcode)}
          {renderField("Country", productData.eudamed_country, <Globe className="w-4 h-4" />)}
          {renderField("Phone", productData.eudamed_phone, <Phone className="w-4 h-4" />)}
          {renderField("Email", productData.eudamed_email, <Mail className="w-4 h-4" />)}
          {renderField("Website", productData.eudamed_website, <Globe className="w-4 h-4" />)}
        </>)}

        <Separator />

        {/* PRRC Information */}
        {(productData.eudamed_prrc_first_name || productData.eudamed_prrc_last_name) && (
          <>
            {renderSection("Person Responsible for Regulatory Compliance (PRRC)", <>
              {renderField("First Name", productData.eudamed_prrc_first_name, <User className="w-4 h-4" />)}
              {renderField("Last Name", productData.eudamed_prrc_last_name, <User className="w-4 h-4" />)}
              {renderField("Email", productData.eudamed_prrc_email, <Mail className="w-4 h-4" />)}
              {renderField("Phone", productData.eudamed_prrc_phone, <Phone className="w-4 h-4" />)}
              {renderField("Responsible For", productData.eudamed_prrc_responsible_for)}
              {renderField("Address", productData.eudamed_prrc_address)}
              {renderField("Postcode", productData.eudamed_prrc_postcode)}
              {renderField("Country", productData.eudamed_prrc_country, <Globe className="w-4 h-4" />)}
            </>)}
            <Separator />
          </>
        )}

        {/* Competent Authority Information */}
        {productData.eudamed_ca_name && (
          <>
            {renderSection("Competent Authority (CA)", <>
              {renderField("CA Name", productData.eudamed_ca_name, <Building className="w-4 h-4" />)}
              {renderField("CA Address", productData.eudamed_ca_address)}
              {renderField("CA Postcode", productData.eudamed_ca_postcode)}
              {renderField("CA Country", productData.eudamed_ca_country, <Globe className="w-4 h-4" />)}
              {renderField("CA Email", productData.eudamed_ca_email, <Mail className="w-4 h-4" />)}
              {renderField("CA Phone", productData.eudamed_ca_phone, <Phone className="w-4 h-4" />)}
            </>)}
            <Separator />
          </>
        )}

        {/* Device Characteristics */}
        {renderSection("Device Characteristics", <>
          {renderField("Implantable", productData.eudamed_implantable)}
          {renderField("Measuring", productData.eudamed_measuring)}
          {renderField("Reusable", productData.eudamed_reusable)}
          {renderField("Active", productData.eudamed_active)}
          {renderField("Administering Medicine", productData.eudamed_administering_medicine)}
          {renderField("Single Use", productData.eudamed_single_use)}
          {renderField("Max Reuses", productData.eudamed_max_reuses)}
          {renderField("Sterilization Need", productData.eudamed_sterilization_need)}
          {renderField("Sterile", productData.eudamed_sterile)}
          {renderField("Contains Latex", productData.eudamed_contain_latex)}
          {renderField("Reprocessed", productData.eudamed_reprocessed)}
          {renderField("Direct Marking", productData.eudamed_direct_marking)}
        </>)}

        <Separator />

        {/* Regulatory & Market Information */}
        {renderSection("Regulatory & Market Information", <>
          {renderField("Applicable Legislation", productData.eudamed_applicable_legislation)}
          {renderField("Quantity of Device", productData.eudamed_quantity_of_device)}
          {renderField("Market Distribution", productData.eudamed_market_distribution)}
          {renderField("Placed on Market", productData.eudamed_placed_on_the_market ? 
            new Date(productData.eudamed_placed_on_the_market).toLocaleDateString() : null, 
            <Calendar className="w-4 h-4" />
          )}
        </>)}

        {/* Nomenclature Codes */}
        {productData.eudamed_nomenclature_codes && Array.isArray(productData.eudamed_nomenclature_codes) && 
         productData.eudamed_nomenclature_codes.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Nomenclature Codes (EMDN)
              </h4>
              <div className="space-y-2">
                {productData.eudamed_nomenclature_codes.map((code: any, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {typeof code === 'string' ? code : JSON.stringify(code)}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}