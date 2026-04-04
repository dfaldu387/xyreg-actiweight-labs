
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileType, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AITemplateImporterDialog } from "@/components/settings/document-control/AITemplateImporterDialog";

interface CompanyTemplate {
  id: string;
  name: string;
  document_type: string;
  status: string;
  tech_applicability: string;
  phase_id: string;
  phase_name: string;
  created_at: string;
  updated_at: string;
}

interface CompanyTemplateManagerProps {
  companyId: string;
  disabled?: boolean;
}

export function CompanyTemplateManager({ companyId, disabled = false }: CompanyTemplateManagerProps) {
  const [templates, setTemplates] = useState<CompanyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [phases, setPhases] = useState<Array<{id: string, name: string}>>([]);
  const [showAIImporter, setShowAIImporter] = useState(false);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_documents_by_scope', {
          p_scope: 'company_template',
          p_company_id: companyId
        });

      if (error) throw error;
      setTemplates(data || []);
    } catch {
      toast.error('Failed to load company templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId)
        .order('position');

      if (error) throw error;
      setPhases(data || []);
    } catch {
      // Error fetching phases
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchPhases();
  }, [companyId]);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = phaseFilter === 'all' || template.phase_id === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  // Group templates by phase
  const templatesByPhase = phases.reduce((acc, phase) => {
    acc[phase.id] = filteredTemplates.filter(t => t.phase_id === phase.id);
    return acc;
  }, {} as Record<string, CompanyTemplate[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading company templates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileType className="h-5 w-5" />
            Phase Document Templates
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage document templates that are automatically assigned to products when they enter specific phases.
          </p>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                {phases.map(phase => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => !disabled && setShowAIImporter(true)} disabled={disabled}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>

          {/* Templates by Phase */}
          <div className="space-y-6">
            {phases.map(phase => {
              const phaseTemplates = templatesByPhase[phase.id] || [];
              
              return (
                <div key={phase.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{phase.name}</h3>
                    <Badge variant="outline">
                      {phaseTemplates.length} template{phaseTemplates.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {phaseTemplates.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No templates for this phase</p>
                  ) : (
                    <div className="grid gap-3">
                      {phaseTemplates.map(template => (
                        <div key={template.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                          <div className="flex-1">
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Type: {template.document_type} • Tech: {template.tech_applicability}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={template.status === 'Active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {template.status}
                            </Badge>
                            <Button variant="outline" size="sm" disabled={disabled}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" disabled={disabled}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* AI Template Importer Dialog */}
      <AITemplateImporterDialog
        open={showAIImporter}
        onOpenChange={setShowAIImporter}
        companyId={companyId}
        onTemplateCreated={() => {
          fetchTemplates();
          setShowAIImporter(false);
        }}
      />
    </div>
  );
}
