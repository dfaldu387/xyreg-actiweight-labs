
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Download, FileDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MDRGapTemplateView } from "@/components/settings/gap-analysis/MDRGapTemplateView";
import { MDRTemplateCard } from "@/components/settings/gap-analysis/MDRTemplateCard";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

export default function CompanyMDRAnnexIPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const { lang } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [priorityFilter, setPriorityFilter] = useState<string[]>(["high", "medium", "low"]);
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";

  const handlePriorityFilterChange = (priority: string) => {
    if (priorityFilter.includes(priority)) {
      setPriorityFilter(priorityFilter.filter(p => p !== priority));
    } else {
      setPriorityFilter([...priorityFilter, priority]);
    }
  };

  const handleDownloadTemplate = () => {
    // In a production environment, this would generate and download a CSV template
    toast.success(lang('mdrAnnexI.downloadStarted'));

    // Simulate download
    setTimeout(() => {
      toast.info(lang('mdrAnnexI.downloadSuccess'));
    }, 1500);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" asChild className="p-0 h-8">
              <Link to={`/company/${encodeURIComponent(decodedCompanyName)}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {lang('mdrAnnexI.backToCompany')}
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{decodedCompanyName} - {lang('mdrAnnexI.pageTitle')}</h1>
          <p className="text-muted-foreground text-lg">{lang('mdrAnnexI.pageSubtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex gap-2" onClick={handleDownloadTemplate}>
            <FileDown className="size-4" />
            <span>{lang('mdrAnnexI.downloadTemplate')}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="size-4" />
                <span>{lang('mdrAnnexI.filter')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{lang('mdrAnnexI.priority')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes("high")}
                onCheckedChange={() => handlePriorityFilterChange("high")}
              >
                {lang('mdrAnnexI.highPriority')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes("medium")}
                onCheckedChange={() => handlePriorityFilterChange("medium")}
              >
                {lang('mdrAnnexI.mediumPriority')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes("low")}
                onCheckedChange={() => handlePriorityFilterChange("low")}
              >
                {lang('mdrAnnexI.lowPriority')}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="overview" className="px-6">{lang('mdrAnnexI.tabOverview')}</TabsTrigger>
          <TabsTrigger value="checklist" className="px-6">{lang('mdrAnnexI.tabDetailedChecklist')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-8">
            <MDRTemplateCard />

            <div className="md:col-span-2">
              <Card className="h-full">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">{lang('mdrAnnexI.overviewTitle')}</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {lang('mdrAnnexI.overviewDescription')}
                  </p>

                  <div className="space-y-5">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="font-medium text-blue-800 text-lg">{lang('mdrAnnexI.chapterITitle')}</h3>
                      <p className="text-gray-700 mt-1">{lang('mdrAnnexI.chapterIDescription')}</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="font-medium text-blue-800 text-lg">{lang('mdrAnnexI.chapterIITitle')}</h3>
                      <p className="text-gray-700 mt-1">{lang('mdrAnnexI.chapterIIDescription')}</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="font-medium text-blue-800 text-lg">{lang('mdrAnnexI.chapterIIITitle')}</h3>
                      <p className="text-gray-700 mt-1">{lang('mdrAnnexI.chapterIIIDescription')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checklist">
          <Card className="shadow-sm">
            <div className="p-5 border-b">
              <h2 className="text-xl font-medium">{lang('mdrAnnexI.detailedChecklistTitle')}</h2>
              <p className="text-sm text-muted-foreground">
                {lang('mdrAnnexI.detailedChecklistDescription')}
              </p>
            </div>
            <div className="p-4">
              <MDRGapTemplateView />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
