
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Library } from "lucide-react";
import { StandardTemplateLibrary } from "./StandardTemplateLibrary";
import { CustomTemplateForm } from "./CustomTemplateForm";
import { TemplateManagementTable } from "./TemplateManagementTable";
import { TemplateSettingsForm } from "./TemplateSettingsForm";
import { useAuditTemplates } from "@/hooks/useAuditTemplates";
import { useTranslation } from "@/hooks/useTranslation";

interface AuditTemplateConfigurationProps {
  companyId: string;
}

export function AuditTemplateConfiguration({ companyId }: AuditTemplateConfigurationProps) {
  const { lang } = useTranslation();
  const [activeTab, setActiveTab] = useState("configured");
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const {
    configuredTemplates,
    isLoading,
    refetch
  } = useAuditTemplates(companyId);

  const handleTemplateAdded = () => {
    refetch();
    setShowLibrary(false);
    setShowCustomForm(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{lang('companySettings.audits.title')}</h2>
          <p className="text-muted-foreground">
            {lang('companySettings.audits.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowLibrary(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Library className="h-4 w-4" />
            {lang('companySettings.audits.browseTemplates')}
          </Button>
          <Button
            onClick={() => setShowCustomForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {lang('companySettings.audits.createCustom')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configured">{lang('companySettings.audits.configuredTemplates')}</TabsTrigger>
          <TabsTrigger value="settings">{lang('companySettings.audits.templateSettings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="configured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{lang('companySettings.audits.activeAuditTemplates')}</CardTitle>
              <CardDescription>
                {lang('companySettings.audits.activeAuditTemplatesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateManagementTable
                companyId={companyId}
                templates={configuredTemplates}
                isLoading={isLoading}
                onEdit={setEditingTemplate}
                onRefresh={refetch}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <TemplateSettingsForm companyId={companyId} />
        </TabsContent>
      </Tabs>

      {showLibrary && (
        <StandardTemplateLibrary
          companyId={companyId}
          open={showLibrary}
          onOpenChange={setShowLibrary}
          onTemplateAdded={handleTemplateAdded}
        />
      )}

      {(showCustomForm || editingTemplate) && (
        <CustomTemplateForm
          companyId={companyId}
          open={showCustomForm || !!editingTemplate}
          onOpenChange={(open) => {
            setShowCustomForm(open);
            if (!open) setEditingTemplate(null);
          }}
          initialData={editingTemplate}
          onTemplateAdded={handleTemplateAdded}
        />
      )}
    </div>
  );
}
