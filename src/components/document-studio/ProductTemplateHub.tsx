import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, ClipboardList, Users, Beaker, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductTemplateHubProps {
  productId: string;
  productName: string;
}

interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  estimatedTime: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  onClick: () => void;
}

export function ProductTemplateHub({ productId, productName }: ProductTemplateHubProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();

  const handleBackToSelection = () => {
    navigate('/app/document-studio/product-selection');
  };

  const handleCreateDocument = (templateId: string) => {
    // Navigate to document composer with template and product context
    navigate(`/app/document-composer?productId=${productId}&templateId=${templateId}`);
  };

  const documentTemplates: DocumentTemplate[] = [
    {
      id: 'design-development-plan',
      title: lang('documentStudio.templates.designDevelopmentPlan.title'),
      description: lang('documentStudio.templates.designDevelopmentPlan.description'),
      category: lang('documentStudio.templates.categories.designControls'),
      icon: Beaker,
      estimatedTime: lang('documentStudio.templates.estimatedTime.2to3hours'),
      complexity: 'Advanced',
      onClick: () => handleCreateDocument('design-development-plan')
    },
    {
      id: 'risk-management-plan',
      title: lang('documentStudio.templates.riskManagementPlan.title'),
      description: lang('documentStudio.templates.riskManagementPlan.description'),
      category: lang('documentStudio.templates.categories.riskManagement'),
      icon: Shield,
      estimatedTime: lang('documentStudio.templates.estimatedTime.3to4hours'),
      complexity: 'Advanced',
      onClick: () => handleCreateDocument('risk-management-plan')
    },
    {
      id: 'design-history-file',
      title: lang('documentStudio.templates.designHistoryFile.title'),
      description: lang('documentStudio.templates.designHistoryFile.description'),
      category: lang('documentStudio.templates.categories.designControls'),
      icon: Database,
      estimatedTime: lang('documentStudio.templates.estimatedTime.1to2hours'),
      complexity: 'Intermediate',
      onClick: () => handleCreateDocument('design-history-file')
    },
    {
      id: 'clinical-evaluation',
      title: lang('documentStudio.templates.clinicalEvaluation.title'),
      description: lang('documentStudio.templates.clinicalEvaluation.description'),
      category: lang('documentStudio.templates.categories.clinical'),
      icon: Users,
      estimatedTime: lang('documentStudio.templates.estimatedTime.4to6hours'),
      complexity: 'Advanced',
      onClick: () => handleCreateDocument('clinical-evaluation')
    },
    {
      id: 'verification-validation',
      title: lang('documentStudio.templates.verificationValidation.title'),
      description: lang('documentStudio.templates.verificationValidation.description'),
      category: lang('documentStudio.templates.categories.testing'),
      icon: ClipboardList,
      estimatedTime: lang('documentStudio.templates.estimatedTime.2to3hours'),
      complexity: 'Intermediate',
      onClick: () => handleCreateDocument('verification-validation')
    },
    {
      id: 'technical-documentation',
      title: lang('documentStudio.templates.technicalDocumentation.title'),
      description: lang('documentStudio.templates.technicalDocumentation.description'),
      category: lang('documentStudio.templates.categories.regulatory'),
      icon: FileText,
      estimatedTime: lang('documentStudio.templates.estimatedTime.1to2hours'),
      complexity: 'Beginner',
      onClick: () => handleCreateDocument('technical-documentation')
    }
  ];

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Design Controls': 'bg-blue-100 text-blue-800',
      'Risk Management': 'bg-purple-100 text-purple-800',
      'Clinical': 'bg-emerald-100 text-emerald-800',
      'Testing': 'bg-orange-100 text-orange-800',
      'Regulatory': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={handleBackToSelection}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {lang('documentStudio.backToProductSelection')}
          </Button>

          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {lang('documentStudio.templatesFor', { productName })}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {lang('documentStudio.chooseTemplateSubtitle')}
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentTemplates.map((template) => {
            const IconComponent = template.icon;

            return (
              <Card
                key={template.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 border-2 hover:border-primary/40"
                onClick={template.onClick}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Icon and Category */}
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                  </div>

                  {/* Title and Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{lang('documentStudio.estimatedTime')}</div>
                      <div className="text-sm font-medium">{template.estimatedTime}</div>
                    </div>

                    <Badge
                      variant="outline"
                      className={getComplexityColor(template.complexity)}
                    >
                      {lang(`documentStudio.complexity.${template.complexity.toLowerCase()}`)}
                    </Badge>
                  </div>

                  {/* Call to Action */}
                  <div className="pt-2">
                    <div className="flex items-center text-sm text-primary font-medium group-hover:translate-x-1 transition-transform duration-200">
                      {lang('documentStudio.createDocument')} →
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Section */}
        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">{lang('documentStudio.help.title')}</h3>
            <p className="text-muted-foreground mb-4">
              {lang('documentStudio.help.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
              <span>• {lang('documentStudio.help.riskManagementTip')}</span>
              <span>• {lang('documentStudio.help.designControlsTip')}</span>
              <span>• {lang('documentStudio.help.clinicalEvaluationTip')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
}