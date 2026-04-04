import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Building2 } from 'lucide-react';
import { LPPApplicationGuide } from './LPPApplicationGuide';
import { HASEvaluationGuide } from './HASEvaluationGuide';

export function FranceReimbursementModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img 
            src="https://flagcdn.com/w40/fr.png" 
            alt="France Flag" 
            className="h-5 w-7 object-cover rounded"
          />
          France Reimbursement Deep Dive
        </CardTitle>
        <CardDescription>
          Comprehensive guide to LPP inscription process and HAS health technology assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="lpp" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lpp" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              LPP Application
            </TabsTrigger>
            <TabsTrigger value="has" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              HAS Evaluation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lpp" className="mt-6">
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-sm mb-2">LPP Application Guidance</h3>
                <p className="text-xs text-muted-foreground">
                  Learn about the LPP (Liste des Produits et Prestations) inscription process for achieving 
                  reimbursement in France. Understand the categories, clinical evidence requirements, and 
                  pricing negotiation process with CEPS.
                </p>
              </div>
              <LPPApplicationGuide />
            </div>
          </TabsContent>

          <TabsContent value="has" className="mt-6">
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-sm mb-2">HAS Evaluation Process Overview</h3>
                <p className="text-xs text-muted-foreground">
                  Understand the HAS (Haute Autorité de Santé) health technology assessment process, France's 
                  independent authority that evaluates clinical benefit (Service Attendu) and improvement over 
                  alternatives (Amélioration du Service Attendu) - critical determinants of reimbursement eligibility 
                  and pricing.
                </p>
              </div>
              <HASEvaluationGuide />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
