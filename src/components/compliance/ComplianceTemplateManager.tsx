
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Download, Upload, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { ComplianceTemplateService } from "@/services/complianceTemplateService";
import { ReferenceDataService } from "@/services/referenceDataService";
import type { EnhancedGapAnalysisTemplate, ComplianceFramework } from "@/types/referenceData";
import { toast } from "sonner";

interface ComplianceTemplateManagerProps {
  companyId?: string;
}

export function ComplianceTemplateManager({ companyId }: ComplianceTemplateManagerProps) {
  const [templates, setTemplates] = useState<EnhancedGapAnalysisTemplate[]>([]);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [companyId, selectedFramework]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, frameworksData] = await Promise.all([
        selectedFramework 
          ? ComplianceTemplateService.getTemplatesByFramework(selectedFramework, companyId)
          : ComplianceTemplateService.getTemplates(companyId),
        ReferenceDataService.getComplianceFrameworks()
      ]);
      
      setTemplates(templatesData);
      setFrameworks(frameworksData);
    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast.error('Failed to load compliance templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMDRTemplate = async () => {
    setCreating(true);
    try {
      const templateId = await ComplianceTemplateService.populateCompleteMDRTemplate(companyId);
      if (templateId) {
        toast.success('Complete MDR template created successfully');
        loadData();
      }
    } catch (error) {
      console.error('Error creating MDR template:', error);
      toast.error('Failed to create MDR template');
    } finally {
      setCreating(false);
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFrameworkBadge = (framework: string) => {
    const frameworkInfo = frameworks.find(f => f.framework_code === framework);
    return frameworkInfo ? frameworkInfo.framework_name : framework;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Templates</h2>
          <p className="text-muted-foreground">Manage regulatory compliance checklists and templates</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateMDRTemplate} disabled={creating}>
            {creating ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Create Complete MDR Template
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1 max-w-xs">
          <Label htmlFor="framework-filter">Filter by Framework</Label>
          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger>
              <SelectValue placeholder="All frameworks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All frameworks</SelectItem>
              {frameworks.map((framework) => (
                <SelectItem key={framework.id} value={framework.framework_code}>
                  {framework.framework_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={loadData}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
                    <Badge className={getImportanceColor(template.importance)}>
                      {template.importance}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{getFrameworkBadge(template.framework)}</Badge>
                    <Badge variant="secondary">{template.scope}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version {template.version}</span>
                    <div className="flex items-center gap-1">
                      {template.is_custom ? (
                        <Badge variant="outline" className="text-xs">Custom</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Standard</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    <Button size="sm" className="flex-1">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No templates found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedFramework 
                    ? `No templates available for ${getFrameworkBadge(selectedFramework)}`
                    : 'No compliance templates available yet'
                  }
                </p>
                <Button onClick={handleCreateMDRTemplate} disabled={creating}>
                  Create Your First Template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="frameworks">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frameworks.map((framework) => (
              <Card key={framework.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{framework.framework_name}</CardTitle>
                    <Badge variant={framework.is_active ? "default" : "secondary"}>
                      {framework.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {framework.jurisdiction} • Version {framework.version}
                  </div>
                </CardHeader>
                <CardContent>
                  {framework.description && (
                    <p className="text-sm text-muted-foreground">{framework.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Custom template creation interface will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
