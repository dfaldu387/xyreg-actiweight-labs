
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarChart2, FileText, Settings } from "lucide-react";
import { iso13485Checklist } from "@/data/gapAnalysis/iso13485Checklist";

interface ISO13485TemplateCardProps {
  isCompanySettings?: boolean;
}

export function ISO13485TemplateCard({ isCompanySettings = false }: ISO13485TemplateCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const totalRequirements = iso13485Checklist.length;
  const chapters = [...new Set(iso13485Checklist.map(item => item.chapter))].length;
  

  return (
    <>
      <Card className="border-2 border-primary/10 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                ISO 13485:2016
              </CardTitle>
              <CardDescription className="mt-1">
                Quality Management System for Medical Devices
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-medium">QMS</Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">Company-Wide</Badge>
              <Badge variant="destructive">High Priority</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="border rounded-md p-2 bg-muted/50">
                <div className="font-semibold">{totalRequirements}</div>
                <div className="text-xs text-muted-foreground">Requirements</div>
              </div>
              <div className="border rounded-md p-2 bg-muted/50">
                <div className="font-semibold">{chapters}</div>
                <div className="text-xs text-muted-foreground">Chapters</div>
              </div>
              <div className="border rounded-md p-2 bg-muted/50">
                <div className="font-semibold">Available</div>
                <div className="text-xs text-muted-foreground">For Products</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              This template provides a comprehensive checklist for ISO 13485:2016 compliance, 
              covering Quality Management System requirements for medical device organizations.
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
              <BarChart2 className="h-5 w-5" />
              ISO 13485:2016 Template Configuration
            </DialogTitle>
            <DialogDescription>
              Configure this template for your company's quality management system
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
