
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, BarChart2, FileText, Settings, Shield, Activity, Cpu, Zap, Radio, Monitor, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MDRTemplateCard } from "./MDRTemplateCard";
import { useTranslation } from "@/hooks/useTranslation";

interface GapAnalysisViewProps {
  companyId: string;
  companyName: string;
}

export function GapAnalysisView({ companyId, companyName }: GapAnalysisViewProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();

  const handleViewMdrAnnexI = () => {
    navigate(`/app/company/${encodeURIComponent(companyName)}/mdr-annex-i`);
  };
  
  const handleViewIso13485 = () => {
    navigate(`/app/company/${encodeURIComponent(companyName)}/gap-analysis`);
  };

  const handleViewIso14971 = () => {
    navigate(`/app/company/${encodeURIComponent(companyName)}/gap-analysis`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">{lang('companySettings.gapAnalysis.featuredTemplates')}</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <MDRTemplateCard isCompanySettings={true} />

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    ISO 13485
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {lang('companySettings.gapAnalysis.iso13485Desc')}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-medium">ISO</Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">{lang('companySettings.gapAnalysis.companyWide')}</Badge>
                  <Badge variant="destructive">{lang('companySettings.gapAnalysis.highPriority')}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang('companySettings.gapAnalysis.iso13485Details')}
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                variant="default"
                className="w-full"
                onClick={handleViewIso13485}
              >
                <Settings className="h-4 w-4 mr-2" />
                {lang('companySettings.gapAnalysis.configureTemplate')}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    ISO 14971
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {lang('companySettings.gapAnalysis.iso14971Desc')}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-medium">ISO</Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">{lang('companySettings.gapAnalysis.productSpecific')}</Badge>
                  <Badge variant="outline" className="border-orange-300 text-orange-700">{lang('companySettings.gapAnalysis.mediumPriority')}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang('companySettings.gapAnalysis.iso14971Details')}
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                variant="default"
                className="w-full"
                onClick={handleViewIso14971}
              >
                <Settings className="h-4 w-4 mr-2" />
                {lang('companySettings.gapAnalysis.configureTemplate')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium mb-4">{lang('companySettings.gapAnalysis.allTemplates')}</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                IEC 60601-1:2012
              </CardTitle>
              <CardDescription>General requirements for basic safety and essential performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">IEC</Badge>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" size="sm" onClick={handleViewIso13485}>
                {lang('common.configure')} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                IEC 60601-1-2:2014
              </CardTitle>
              <CardDescription>Electromagnetic compatibility — Requirements and tests</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">IEC</Badge>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" size="sm" onClick={handleViewIso13485}>
                {lang('common.configure')} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                IEC 60601-1-6
              </CardTitle>
              <CardDescription>Usability engineering process for medical electrical equipment</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">IEC</Badge>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" size="sm" onClick={handleViewIso13485}>
                {lang('common.configure')} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                IEC 62304
              </CardTitle>
              <CardDescription>Medical device software — Software life cycle processes</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">IEC</Badge>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" size="sm" onClick={handleViewIso13485}>
                {lang('common.configure')} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                MDR Annex II
              </CardTitle>
              <CardDescription>{lang('companySettings.gapAnalysis.mdrAnnexIIDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">MDR</Badge>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" size="sm">
                {lang('common.configure')} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                IEC 20957
              </CardTitle>
              <CardDescription>Stationary training equipment — Safety requirements and test methods</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">IEC</Badge>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" size="sm" onClick={handleViewIso13485}>
                {lang('common.configure')} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
