import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Building2 } from 'lucide-react';
import { NUBApplicationGuide } from './NUBApplicationGuide';
import { GBAAssessmentGuide } from './GBAAssessmentGuide';

export function GermanyReimbursementModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img 
            src="https://flagcdn.com/w40/de.png" 
            alt="Germany Flag" 
            className="h-5 w-7 object-cover rounded"
          />
          Germany Reimbursement Deep Dive
        </CardTitle>
        <CardDescription>
          Comprehensive guide to NUB application process and G-BA benefit assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nub" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nub" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              NUB Application
            </TabsTrigger>
            <TabsTrigger value="gba" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              G-BA Assessment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nub" className="mt-6">
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-sm mb-2">NUB Application Guidance</h3>
                <p className="text-xs text-muted-foreground">
                  Learn about the NUB (Neue Untersuchungs- und Behandlungsmethoden) process for securing temporary 
                  additional funding for innovative medical technologies in the German hospital setting. Understand the 
                  annual application cycle, status outcomes, and negotiation process with health insurers.
                </p>
              </div>
              <NUBApplicationGuide />
            </div>
          </TabsContent>

          <TabsContent value="gba" className="mt-6">
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-sm mb-2">G-BA Assessment Process Overview</h3>
                <p className="text-xs text-muted-foreground">
                  Understand the G-BA (Gemeinsamer Bundesausschuss) benefit assessment process, Germany's highest 
                  decision-making body for statutory health insurance coverage. Critical for high-risk medical devices 
                  (Class IIb/III) under §137h SGB V mandatory assessment.
                </p>
              </div>
              <GBAAssessmentGuide />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
