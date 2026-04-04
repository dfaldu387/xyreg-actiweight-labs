import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Tag, Building2 } from 'lucide-react';
import { CPTCategoryBrowser } from './CPTCategoryBrowser';
import { HCPCSCodeTypeGuide } from './HCPCSCodeTypeGuide';
import { MedicareCoverageGuide } from './MedicareCoverageGuide';

export function USReimbursementModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img 
            src="https://flagcdn.com/w40/us.png" 
            alt="US Flag" 
            className="h-5 w-7 object-cover rounded"
          />
          United States Reimbursement Deep Dive
        </CardTitle>
        <CardDescription>
          Comprehensive guide to CPT codes, HCPCS Level II, and Medicare coverage pathways
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cpt" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cpt" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CPT Browser
            </TabsTrigger>
            <TabsTrigger value="hcpcs" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              HCPCS Guide
            </TabsTrigger>
            <TabsTrigger value="medicare" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Medicare Coverage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cpt" className="mt-6">
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-sm mb-2">CPT Code Categories by Specialty/Body Area</h3>
                <p className="text-xs text-muted-foreground">
                  Browse CPT (Current Procedural Terminology) codes organized by medical specialty and body system. 
                  Identify which code ranges are most relevant for your medical device.
                </p>
              </div>
              <CPTCategoryBrowser />
            </div>
          </TabsContent>

          <TabsContent value="hcpcs" className="mt-6">
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-sm mb-2">HCPCS Level II Code Type Guide</h3>
                <p className="text-xs text-muted-foreground">
                  Understand the different HCPCS Level II code categories (A-Q codes) and identify which are 
                  most relevant for medical devices. Focus on E-codes (DME), K-codes, L-codes (orthotics/prosthetics), 
                  and C-codes (temporary hospital codes for new technology).
                </p>
              </div>
              <HCPCSCodeTypeGuide />
            </div>
          </TabsContent>

          <TabsContent value="medicare" className="mt-6">
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-sm mb-2">Medicare Coverage Determination Lookup Guidance</h3>
                <p className="text-xs text-muted-foreground">
                  Learn how Medicare decides whether to cover medical devices and procedures through National Coverage 
                  Determinations (NCDs), Local Coverage Determinations (LCDs), and Medicare Administrative Contractors (MACs).
                </p>
              </div>
              <MedicareCoverageGuide />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
