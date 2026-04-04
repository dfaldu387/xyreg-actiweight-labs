
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Plus, Download, Upload, RefreshCw, Trash2, Building2 } from "lucide-react";
import { PhaseTemplate, PhaseTemplateAnalysis } from "@/services/phaseTemplateService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PhaseTemplateManagerProps {
  companyId: string;
  companyName?: string;
  templates: PhaseTemplate[];
  analysis: PhaseTemplateAnalysis | null;
  isLoading: boolean;
  assignedTemplates: PhaseTemplate[];
  unassignedTemplates: PhaseTemplate[];
  onAddTemplate: (templateData: {
    name: string;
    document_type: string;
    tech_applicability?: string;
    phase_id?: string;
  }) => Promise<void>; // Change return type to match actual implementation
  onUpdateAssignment: (templateId: string, newPhaseId: string | null) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onCsvExport: () => void;
  onCsvImport: () => void;
}

export function PhaseTemplateManager({
  companyId,
  companyName,
  templates,
  analysis,
  isLoading,
  assignedTemplates,
  unassignedTemplates,
  onAddTemplate,
  onUpdateAssignment,
  onDeleteTemplate,
  onRefresh,
  onCsvExport,
  onCsvImport
}: PhaseTemplateManagerProps) {
  const [activeTab, setActiveTab] = useState("assigned");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    document_type: "Standard",
    tech_applicability: "All device types",
    phase_id: ""
  });

  const handleAddTemplate = async () => {
    try {
      await onAddTemplate({
        name: newTemplate.name,
        document_type: newTemplate.document_type,
        tech_applicability: newTemplate.tech_applicability,
        phase_id: newTemplate.phase_id || undefined
      });
      
      setNewTemplate({
        name: "",
        document_type: "Standard", 
        tech_applicability: "All device types",
        phase_id: ""
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding template:', error);
    }
  };

  const filteredTemplates = (templateList: PhaseTemplate[]) => {
    return templateList.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.phase_name && template.phase_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in progress': return 'bg-blue-500';
      case 'not required': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const documentTypes = ['Standard', 'Regulatory', 'Technical', 'Clinical', 'Quality', 'Design', 'SOP'];

  if (isLoading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="mr-2" />
        Loading phase templates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Context Alert */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          Managing phase document templates for <strong>{companyName || 'selected company'}</strong>. 
          All templates are isolated to this company and cannot be seen by other companies.
        </AlertDescription>
      </Alert>

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          {analysis && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{analysis.totalTemplates} total</span>
              <span>•</span>
              <span>{analysis.assignedTemplates} assigned</span>
              <span>•</span>
              <span>{analysis.unassignedTemplates} unassigned</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCsvExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCsvImport}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Smart Template
          </Button>
        </div>
      </div>

      {/* Smart Template Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Phase Template for {companyName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Document Type</label>
                <Select
                  value={newTemplate.document_type}
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, document_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddTemplate} disabled={!newTemplate.name}>
                Smart Template
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assigned">
            Assigned Templates ({assignedTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="unassigned">
            Unassigned Templates ({unassignedTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="mt-6">
          <div className="space-y-3">
            {filteredTemplates(assignedTemplates).map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {template.document_type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {template.phase_name}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(template.status)}`}>
                          {template.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateAssignment(template.id, null)}
                      >
                        Unassign
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredTemplates(assignedTemplates).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No assigned templates match your search.' : 'No templates assigned to phases yet.'}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="unassigned" className="mt-6">
          <div className="space-y-3">
            {filteredTemplates(unassignedTemplates).map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {template.document_type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Unassigned
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(template.status)}`}>
                          {template.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        Assign to Phase
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredTemplates(unassignedTemplates).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No unassigned templates match your search.' : 'All templates are assigned to phases.'}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-3">
            {filteredTemplates(templates).map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {template.document_type}
                        </Badge>
                        <Badge variant={template.is_assigned ? "default" : "secondary"} className="text-xs">
                          {template.is_assigned ? template.phase_name : 'Unassigned'}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(template.status)}`}>
                          {template.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredTemplates(templates).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No templates match your search.' : 'No phase templates found. Add some templates to get started.'}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
