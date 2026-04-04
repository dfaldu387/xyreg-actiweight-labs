
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStandardAuditTemplates } from "@/hooks/useAuditTemplates";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";

interface StandardTemplateLibraryProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateAdded: () => void;
}

export function StandardTemplateLibrary({
  companyId,
  open,
  onOpenChange,
  onTemplateAdded
}: StandardTemplateLibraryProps) {
  const { lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [applicabilityFilter, setApplicabilityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [addingTemplates, setAddingTemplates] = useState<Set<string>>(new Set());

  const { templates, isLoading } = useStandardAuditTemplates();

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesApplicability = applicabilityFilter === "all" || template.applicability === applicabilityFilter;
    const matchesCategory = categoryFilter === "all" || template.audit_type_category === categoryFilter;
    
    return matchesSearch && matchesApplicability && matchesCategory;
  });

  const categories = [...new Set(templates.map(t => t.audit_type_category).filter(Boolean))];

  const handleAddTemplate = async (templateId: string) => {
    setAddingTemplates(prev => new Set(prev).add(templateId));
    
    try {
      const { error } = await supabase
        .from('company_audit_templates')
        .insert({
          company_id: companyId,
          audit_template_id: templateId,
          is_enabled: true
        });

      if (error) {
        console.error('Error adding template:', error);
        toast.error(lang('companySettings.auditTemplates.failedToAddTemplate'));
        return;
      }

      toast.success(lang('companySettings.auditTemplates.templateAddedSuccess'));
      onTemplateAdded();
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error(lang('companySettings.auditTemplates.failedToAddTemplate'));
    } finally {
      setAddingTemplates(prev => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>{lang('companySettings.auditTemplates.standardLibraryTitle')}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={lang('companySettings.auditTemplates.searchTemplates')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={applicabilityFilter} onValueChange={setApplicabilityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={lang('companySettings.auditTemplates.filterByApplicability')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang('companySettings.auditTemplates.allTypes')}</SelectItem>
              <SelectItem value="company-wide">{lang('companySettings.auditTemplates.companyWide')}</SelectItem>
              <SelectItem value="product-applicable">{lang('companySettings.auditTemplates.productApplicable')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={lang('companySettings.auditTemplates.filterByCategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang('companySettings.auditTemplates.allCategories')}</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4 pb-4">
            {isLoading ? (
              <div className="text-center py-8">{lang('companySettings.auditTemplates.loadingTemplates')}</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {lang('companySettings.auditTemplates.noTemplatesFound')}
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddTemplate(template.id)}
                        disabled={addingTemplates.has(template.id)}
                        className="ml-4"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {addingTemplates.has(template.id) ? lang('companySettings.auditTemplates.adding') : lang('companySettings.auditTemplates.add')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={template.applicability === 'company-wide' ? 'default' : 'secondary'}>
                        {template.applicability}
                      </Badge>
                      {template.lifecycle_phase && (
                        <Badge variant="outline">{template.lifecycle_phase}</Badge>
                      )}
                      {template.audit_type_category && (
                        <Badge variant="outline">{template.audit_type_category}</Badge>
                      )}
                      {template.suggested_duration && (
                        <Badge variant="outline">{template.suggested_duration}</Badge>
                      )}
                    </div>
                    {template.suggested_documents && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>{lang('companySettings.auditTemplates.suggestedDocuments')}:</strong> {template.suggested_documents}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
