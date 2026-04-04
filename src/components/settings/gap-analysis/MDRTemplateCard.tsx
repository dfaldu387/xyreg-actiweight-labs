
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarChart2, FileText, Settings } from "lucide-react";
import { MDRGapTemplateView } from "./MDRGapTemplateView";
import { comprehensiveMdrAnnexI } from "@/data/comprehensiveMdrAnnexI";
import { useTranslation } from "@/hooks/useTranslation";

interface MDRTemplateCardProps {
  isCompanySettings?: boolean;
}

export function MDRTemplateCard({ isCompanySettings = false }: MDRTemplateCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const { lang } = useTranslation();

  // Calculate total requirements from comprehensive MDR checklist
  const totalRequirements = comprehensiveMdrAnnexI.length;
  const chapters = [...new Set(comprehensiveMdrAnnexI.map(item => item.chapter))].length;

  return (
    <>
      <Card className="border-2 border-primary/10 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                MDR Annex I
              </CardTitle>
              <CardDescription className="mt-1">
                {lang('companySettings.gapAnalysis.mdrAnnexIDesc')}
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-medium">MDR</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">{lang('companySettings.gapAnalysis.companyWide')}</Badge>
              <Badge variant="destructive">{lang('companySettings.gapAnalysis.highPriority')}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="border rounded-md p-2 bg-muted/50">
                <div className="font-semibold">{totalRequirements}</div>
                <div className="text-xs text-muted-foreground">{lang('companySettings.gapAnalysis.requirements')}</div>
              </div>
              <div className="border rounded-md p-2 bg-muted/50">
                <div className="font-semibold">{chapters}</div>
                <div className="text-xs text-muted-foreground">{lang('companySettings.gapAnalysis.chapters')}</div>
              </div>
              <div className="border rounded-md p-2 bg-muted/50">
                <div className="font-semibold">{lang('companySettings.gapAnalysis.available')}</div>
                <div className="text-xs text-muted-foreground">{lang('companySettings.gapAnalysis.forProducts')}</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {lang('companySettings.gapAnalysis.mdrAnnexIDetails')}
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
                {lang('companySettings.gapAnalysis.configureTemplate')}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                {lang('companySettings.gapAnalysis.viewTemplateDetails')}
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
              {lang('companySettings.gapAnalysis.mdrAnnexIConfigTitle')}
            </DialogTitle>
            <DialogDescription>
              {lang('companySettings.gapAnalysis.mdrAnnexIConfigDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <MDRGapTemplateView />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
