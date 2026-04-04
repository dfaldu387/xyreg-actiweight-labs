import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, AlertCircle, Settings, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MissingDataPromptDialog } from './MissingDataPromptDialog';
import { AIMissingDataAnalysis } from '@/services/aiMissingDataAnalysis';
import { CompanyDataSourceIndicator } from './CompanyDataSourceIndicator';

interface MissingDataIndicator {
  field: string;
  description: string;
  suggestion?: string;
  priority: 'critical' | 'important' | 'optional';
  regulatoryContext?: string;
}

interface MissingDataPanelProps {
  missingData: MissingDataIndicator[];
  populatedFields: string[];
  completionPercentage: number;
  suggestions: string[];
  companyId: string;
  templateContent: string;
  onDataUpdated?: () => void;
}

export function MissingDataPanel({ 
  missingData, 
  populatedFields, 
  completionPercentage, 
  suggestions,
  companyId,
  templateContent,
  onDataUpdated 
}: MissingDataPanelProps) {
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState<string>('');
  const [aiMissingData, setAiMissingData] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze template content with AI when it changes and filter out data that exists in company settings
  useEffect(() => {
    if (templateContent && companyId) {
      setIsAnalyzing(true);
      
      // First, check what data already exists in company settings
      Promise.all([
        AIMissingDataAnalysis.analyzeTemplateForMissingData(templateContent, companyId),
        import('@/services/companyDataUpdateService').then(({ CompanyDataUpdateService }) => 
          CompanyDataUpdateService.getMissingDataItems(companyId)
        )
      ])
        .then(([aiResponse, actualMissingItems]) => {
          // Filter AI detected missing data to only include items that are actually missing from company settings
          const filteredMissingData = aiResponse.missingData.filter(item => {
            const dataType = getMissingDataType(item.field);
            return actualMissingItems.includes(dataType);
          });
          
          setAiMissingData(filteredMissingData);
        })
        .catch(error => {
          console.error('AI analysis failed:', error);
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    }
  }, [templateContent, companyId]);

  // Combine static missing data with AI-detected missing data
  const allMissingData = [...missingData, ...aiMissingData.map(item => ({
    field: item.field,
    description: item.description,
    priority: item.category,
    suggestion: item.prompt,
    regulatoryContext: item.category === 'critical' ? 'Required for regulatory compliance' : undefined
  }))];

  const criticalItems = allMissingData.filter(item => item.priority === 'critical');
  const importantItems = allMissingData.filter(item => item.priority === 'important');
  const optionalItems = allMissingData.filter(item => item.priority === 'optional');

  const getMissingDataType = (field: string): string => {
    if (field.toLowerCase().includes('head of quality') || field.toLowerCase().includes('qa')) {
      return 'head_of_qa';
    }
    if (field.toLowerCase().includes('department')) {
      return 'department_structure';
    }
    if (field.toLowerCase().includes('numbering') || field.toLowerCase().includes('sop-xxx')) {
      return 'document_numbering';
    }
    if (field.toLowerCase().includes('retention')) {
      return 'retention_periods';
    }
    if (field.toLowerCase().includes('electronic') || field.toLowerCase().includes('edm')) {
      return 'edm_system';
    }
    if (field.toLowerCase().includes('signature') || field.toLowerCase().includes('approval')) {
      return 'approval_workflow';
    }
    return field.toLowerCase().replace(/\s+/g, '_');
  };

  const handleFillData = (field: string) => {
    const dataType = getMissingDataType(field);
    
    // Check if this data should be configured in Company Settings instead
    const companySettingsTypes = [
      'retention_periods', 'edm_system', 'document_numbering', 
      'document_retention', 'retention_period', 'record_retention',
      'document_management', 'document_control_system', 'edm', 'dms',
      'numbering_system', 'document_numbering_system', 'document_format'
    ];
    
    const isCompanySettingsData = companySettingsTypes.some(type => 
      dataType.includes(type) || 
      field.toLowerCase().includes(type) ||
      type.includes(dataType.split('_')[0])
    );
    
    if (isCompanySettingsData) {
      // Open company settings instead of the dialog
      const currentUrl = new URL(window.location.href);
      const companyName = currentUrl.pathname.split('/')[3]; // Extract company name from URL
      window.open(`/app/company/${companyName}/settings?tab=general`, '_blank');
      return;
    }
    
    // For department structure, use enhanced role management
    if (dataType === 'department_structure') {
      setSelectedDataType(dataType);
      setIsPromptDialogOpen(true);
      return;
    }
    
    setSelectedDataType(dataType);
    setIsPromptDialogOpen(true);
  };

  const handleDataSaved = async (data: any) => {
    try {
      onDataUpdated?.();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const renderMissingDataItem = (item: MissingDataIndicator, index: number, type: 'critical' | 'important' | 'optional') => {
    const iconMap = {
      critical: <AlertTriangle className="w-4 h-4 text-destructive" />,
      important: <AlertCircle className="w-4 h-4 text-warning" />,
      optional: <Info className="w-4 h-4 text-muted-foreground" />
    };

    const badgeVariantMap = {
      critical: 'destructive' as const,
      important: 'secondary' as const,
      optional: 'outline' as const
    };

    const containerClassMap = {
      critical: 'border-destructive/20 bg-destructive/5',
      important: 'border-warning/20 bg-warning/5',
      optional: 'border-border bg-muted/30'
    };

    return (
      <div key={`${type}-${index}`} className={`p-2 border rounded-md ${containerClassMap[type]} w-full max-w-full overflow-hidden`}>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              {iconMap[type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground break-words leading-tight">
                {item.description}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <CompanyDataSourceIndicator 
                  dataType={getMissingDataType(item.field)} 
                  className="text-xs"
                />
              </div>
            </div>
            <Badge variant={badgeVariantMap[type]} className="text-xs flex-shrink-0">
              {item.priority}
            </Badge>
          </div>
          
          {(item.suggestion || item.regulatoryContext) && (
            <div className="space-y-1 pl-6">
              {item.suggestion && (
                <div className="text-xs text-muted-foreground break-words leading-tight">
                  💡 {item.suggestion}
                </div>
              )}
              {item.regulatoryContext && (
                <div className="text-xs text-orange-600 break-words leading-tight">
                  📋 {item.regulatoryContext}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end pl-6">
            {(() => {
              const dataType = getMissingDataType(item.field);
              const companySettingsTypes = [
                'retention_periods', 'edm_system', 'document_numbering', 
                'document_retention', 'retention_period', 'record_retention',
                'document_management', 'document_control_system', 'edm', 'dms',
                'numbering_system', 'document_numbering_system', 'document_format'
              ];
              
              const isCompanySettingsData = companySettingsTypes.some(type => 
                dataType.includes(type) || 
                item.field.toLowerCase().includes(type) ||
                type.includes(dataType.split('_')[0])
              );
              
              return (
                <Button 
                  size="sm" 
                  variant={isCompanySettingsData ? "default" : "outline"}
                  onClick={() => handleFillData(item.field)}
                  className="text-xs px-2 py-1 h-6 flex-shrink-0"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  {isCompanySettingsData ? 'Configure in Settings' : 'Fill'}
                </Button>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3 overflow-hidden">
      {/* Completion Status */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
            <span className="truncate">Template Completion</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Completion</span>
              <span className="text-xs font-bold text-primary">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground break-words">
              {populatedFields.length} fields populated
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Data Items */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
            <span className="truncate">Missing Info</span>
            {isAnalyzing && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
            <Badge variant="secondary" className="text-xs ml-auto flex-shrink-0">
              {allMissingData.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-80 w-full pr-3">
            <div className="space-y-3 pr-1">
              {isAnalyzing && (
                <div className="text-center py-6">
                  <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-primary" />
                  <div className="text-xs font-medium text-foreground">Analyzing...</div>
                  <div className="text-xs text-muted-foreground">Detecting missing info</div>
                </div>
              )}

              {!isAnalyzing && allMissingData.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-success" />
                  <div className="text-xs font-medium text-foreground">All data available!</div>
                  <div className="text-xs text-muted-foreground">Template ready</div>
                </div>
              )}

              {!isAnalyzing && criticalItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-destructive uppercase tracking-wide">
                    Critical ({criticalItems.length})
                  </div>
                  <div className="space-y-2">
                    {criticalItems.map((item, index) => renderMissingDataItem(item, index, 'critical'))}
                  </div>
                </div>
              )}

              {!isAnalyzing && importantItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-warning uppercase tracking-wide">
                    Important ({importantItems.length})
                  </div>
                  <div className="space-y-2">
                    {importantItems.map((item, index) => renderMissingDataItem(item, index, 'important'))}
                  </div>
                </div>
              )}

              {!isAnalyzing && optionalItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Optional ({optionalItems.length})
                  </div>
                  <div className="space-y-2">
                    {optionalItems.map((item, index) => renderMissingDataItem(item, index, 'optional'))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {suggestions.length > 0 && (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs">
              <Info className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-32 w-full pr-3">
              <div className="space-y-1.5 pr-1">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex gap-2 text-xs">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span className="text-muted-foreground leading-relaxed break-words">{suggestion}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Missing Data Prompt Dialog */}
      <MissingDataPromptDialog
        isOpen={isPromptDialogOpen}
        onClose={() => setIsPromptDialogOpen(false)}
        companyId={companyId}
        missingDataType={selectedDataType}
        onDataSaved={handleDataSaved}
      />
    </div>
  );
}