
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyTemplateManager } from "@/components/documents/CompanyTemplateManager";
import { DocumentCIOrganizedView } from "./DocumentCIOrganizedView";
import { DocumentReviewKanban } from "@/components/review/DocumentReviewKanban";
import { TemplateManagementTab } from "./templates/TemplateManagementTab";
import { useReviewerGroupMembership } from "@/hooks/useReviewerGroupMembership";
import { FileType, FileText, Building, ClipboardCheck, FolderOpen } from "lucide-react";

interface DocumentControlTabsProps {
  companyId: string;
  companyName?: string;
}

export function DocumentControlTabs({ companyId, companyName }: DocumentControlTabsProps) {
  const { isReviewerGroupMember, isLoading, userGroups } = useReviewerGroupMembership(companyId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Document Control</h1>
        <p className="text-muted-foreground">
          Manage your company's document templates and documents
        </p>
        {companyName && (
          <div className="flex items-center gap-2 mt-2">
            <Building className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Company: {companyName}</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className={`grid w-full ${isReviewerGroupMember ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="phase-templates" className="flex items-center gap-2">
            <FileType className="h-4 w-4" />
            Phase Templates
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document CIs
          </TabsTrigger>
          {isReviewerGroupMember && (
            <TabsTrigger value="review-assigned" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Review Assigned Document CIs
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <TemplateManagementTab companyId={companyId} onOpenAiTemplateDialog={() => {}} />
        </TabsContent>

        <TabsContent value="phase-templates" className="mt-6">
          <CompanyTemplateManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentCIOrganizedView companyId={companyId} onDocumentUpdated={() => {}} />
        </TabsContent>

        {isReviewerGroupMember && (
          <TabsContent value="review-assigned" className="mt-6">
            <DocumentReviewKanban companyId={companyId} userGroups={userGroups} companyName={companyName} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
