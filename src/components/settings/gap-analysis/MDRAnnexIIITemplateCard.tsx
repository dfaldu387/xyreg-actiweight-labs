
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TrendingUp, FileText, Settings } from "lucide-react";
import { mdrAnnexIIIChecklist } from "@/data/gapAnalysis/mdrAnnexIIIChecklist";

interface MDRAnnexIIITemplateCardProps {
  isCompanySettings?: boolean;
}

export function MDRAnnexIIITemplateCard({ isCompanySettings = false }: MDRAnnexIIITemplateCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const totalRequirements = mdrAnnexIIIChecklist.length;
  const sections = [...new Set(mdrAnnexIIIChecklist.map(item => item.section))].length;
  

  return (
    <>
      <Card className="border-2 border-primary/10 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                MDR Annex III
              </CardTitle>
              <CardDescription className="mt-1">
                Post-Market Surveillance Requirements
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-medium">MDR</Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">Company-Wide</Badge>
              <Badge variant="default">Medium Priority</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="border rounded-md p-2 bg-muted/50">
                <div className="font-semibold">{totalRequirements}</div>
                <div className="text-xs text-muted-foreground">Requirements</div>
              </div>
              <div className="border rounded-md p-2 bg-muted/50">
                <div className="font-semibold">{sections}</div>
                <div className="text-xs text-muted-foreground">Sections</div>
              </div>
              <div className="border rounded-md p-2 bg-muted/50">
                <div className="font-semibold">Available</div>
                <div className="text-xs text-muted-foreground">For Products</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              This template provides a comprehensive checklist for MDR Annex III compliance, 
              covering post-market surveillance and PSUR requirements.
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => setShowDetails(true)}
          >
            {isCompanySettings ? (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Configure Template
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                View Template Details
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              MDR Annex III Template Configuration
            </DialogTitle>
            <DialogDescription>
              Configure this template for your post-market surveillance
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <div className="p-4 text-center text-muted-foreground">
              Template configuration panel would be implemented here
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
