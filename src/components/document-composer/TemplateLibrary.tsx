import React, { useState, useMemo } from 'react';
import { stripDocPrefix } from '@/utils/templateNameUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, CheckCircle, Clock, BookOpen, Folder } from 'lucide-react';
import { ProfessionalTemplateLibraryService, ProfessionalTemplate, TemplateCategory } from '@/services/professionalTemplateLibraryService';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';

interface TemplateLibraryProps {
  onSelectTemplate: (template: ProfessionalTemplate) => void;
  onClose: () => void;
}

export function TemplateLibrary({ onSelectTemplate, onClose }: TemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [usedTemplates, setUsedTemplates] = useState<Set<string>>(new Set());
  const { activeCompanyRole } = useCompanyRole();
  const effectiveCompanyId = useCompanyId();

  const categories = ProfessionalTemplateLibraryService.getTemplatesByCategory();
  
  const filteredTemplates = useMemo(() => {
    let templates: ProfessionalTemplate[] = [];
    
    if (selectedCategory === 'all') {
      templates = categories.flatMap(cat => cat.templates);
    } else {
      const category = categories.find(cat => cat.id === selectedCategory);
      templates = category ? category.templates : [];
    }
    
    if (searchTerm) {
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return templates;
  }, [categories, selectedCategory, searchTerm]);

  const handleTemplateSelect = async (template: ProfessionalTemplate) => {
    if (!effectiveCompanyId) {
      toast.error('No company selected');
      return;
    }

    try {
      // Mark template as used
      setUsedTemplates(prev => new Set([...prev, template.id]));
      
      // Generate template with company-specific numbering
      const generatedTemplate = await ProfessionalTemplateLibraryService.generateTemplate(
        template.id,
        effectiveCompanyId
      );
      
      if (generatedTemplate) {
        onSelectTemplate(template);
        toast.success(`Template "${template.name}" loaded successfully`);
      } else {
        toast.error('Failed to generate template');
      }
    } catch (error) {
      console.error('Error selecting template:', error);
      toast.error('Failed to load template');
    }
  };

  const getTemplateStatusIcon = (templateId: string) => {
    if (usedTemplates.has(templateId)) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getDocumentTypeBadgeColor = (docType: string) => {
    switch (docType) {
      case 'SOP': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'FORM': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'LIST': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'TEMP': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Professional Template Library</h2>
            <p className="text-muted-foreground">47+ professionally crafted medical device QMS templates</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              All Templates ({categories.flatMap(cat => cat.templates).length})
            </TabsTrigger>
            <TabsTrigger value="quality-system-procedures" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              SOPs ({categories.find(cat => cat.id === 'quality-system-procedures')?.templates.length || 0})
            </TabsTrigger>
            <TabsTrigger value="forms-logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Forms & Lists ({categories.find(cat => cat.id === 'forms-logs')?.templates.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <TemplateGrid 
              templates={filteredTemplates}
              onSelectTemplate={handleTemplateSelect}
              getTemplateStatusIcon={getTemplateStatusIcon}
              getDocumentTypeBadgeColor={getDocumentTypeBadgeColor}
            />
          </TabsContent>

          <TabsContent value="quality-system-procedures" className="mt-6">
            <TemplateGrid 
              templates={filteredTemplates}
              onSelectTemplate={handleTemplateSelect}
              getTemplateStatusIcon={getTemplateStatusIcon}
              getDocumentTypeBadgeColor={getDocumentTypeBadgeColor}
            />
          </TabsContent>

          <TabsContent value="forms-logs" className="mt-6">
            <TemplateGrid 
              templates={filteredTemplates}
              onSelectTemplate={handleTemplateSelect}
              getTemplateStatusIcon={getTemplateStatusIcon}
              getDocumentTypeBadgeColor={getDocumentTypeBadgeColor}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface TemplateGridProps {
  templates: ProfessionalTemplate[];
  onSelectTemplate: (template: ProfessionalTemplate) => void;
  getTemplateStatusIcon: (templateId: string) => React.ReactNode;
  getDocumentTypeBadgeColor: (docType: string) => string;
}

function TemplateGrid({ 
  templates, 
  onSelectTemplate, 
  getTemplateStatusIcon, 
  getDocumentTypeBadgeColor 
}: TemplateGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-300px)]">
      {templates.map((template) => (
        <Card key={template.id} className="group hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getDocumentTypeBadgeColor(template.documentType)}>
                    {template.documentType}-{template.documentNumber?.toString().padStart(3, '0')}
                  </Badge>
                  {getTemplateStatusIcon(template.id)}
                </div>
                <CardTitle className="text-lg leading-snug">{stripDocPrefix(template.name)}</CardTitle>
              </div>
            </div>
            <CardDescription className="text-sm line-clamp-3">
              {template.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {template.type === 'company-wide' ? 'Company-Wide' : 'Product-Specific'}
                </Badge>
              </div>
              <Button 
                size="sm" 
                onClick={() => onSelectTemplate(template)}
                className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              >
                Use Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {templates.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms or category filter.</p>
        </div>
      )}
    </div>
  );
}