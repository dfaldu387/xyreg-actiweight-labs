import React, { useState, useEffect } from 'react';
import { Lightbulb, CheckCircle, Sparkles, AlertCircle, Settings, ExternalLink, Loader2, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MissingDataPromptDialog } from './MissingDataPromptDialog';
import { AIMissingDataAnalysis } from '@/services/aiMissingDataAnalysis';
import { CompanyDataSourceIndicator } from './CompanyDataSourceIndicator';
import { AIContentRecommendationService } from '@/services/aiContentRecommendationService';

interface SmartSuggestion {
  id: string;
  type: 'missing_data' | 'content_enhancement' | 'regulatory_requirement' | 'ai_recommendation';
  title: string;
  description: string;
  priority: 'critical' | 'important' | 'optional';
  category: string;
  actionable: boolean;
  action?: {
    type: 'company_settings' | 'ai_generate' | 'manual_input' | 'external_link';
    label: string;
    data?: any;
  };
  suggestion?: string;
  sources?: string[];
  bracketSuggestion?: string;
  insertionPoint?: {
    afterText: string;
    beforeText: string;
    sectionName: string;
  };
  contentSnippet?: string;
}

interface SmartSuggestionsPanelProps {
  missingData: any[];
  populatedFields: string[];
  completionPercentage: number;
  suggestions: string[];
  companyId: string;
  templateContent: string;
  onDataUpdated?: () => void;
  onContentEnhancement?: (suggestion: SmartSuggestion) => void;
}

export function SmartSuggestionsPanel({ 
  missingData = [], 
  populatedFields = [], 
  completionPercentage = 0, 
  suggestions = [],
  companyId,
  templateContent,
  onDataUpdated,
  onContentEnhancement
}: SmartSuggestionsPanelProps) {
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState<string>('');
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Ensure smartSuggestions is always an array
  const safeSuggestions = smartSuggestions || [];

  useEffect(() => {
    generateSmartSuggestions();
  }, [templateContent, companyId, missingData]);

  const generateSmartSuggestions = async () => {
    if (!templateContent || !companyId) return;
    
    setIsAnalyzing(true);
    try {
      const newSuggestions: SmartSuggestion[] = [];

      // 1. Process missing data into actionable suggestions
      for (const item of missingData) {
        const dataType = getMissingDataType(item.field);
        const isCompanySettingsData = isCompanySettingsField(dataType);
        
        newSuggestions.push({
          id: `missing-${item.field}`,
          type: 'missing_data',
          title: item.description,
          description: item.suggestion || 'Required for document completion',
          priority: item.priority,
          category: 'Data Collection',
          actionable: true,
          action: {
            type: isCompanySettingsData ? 'company_settings' : 'manual_input',
            label: isCompanySettingsData ? 'Configure in Settings' : 'Fill Data',
            data: { field: item.field, dataType }
          },
          suggestion: item.suggestion
        });
      }

      // 2. Generate AI content recommendations
      try {
        const aiRecommendations = await AIContentRecommendationService.generateContentRecommendations(
          templateContent,
          companyId
        );
        
            aiRecommendations.forEach((rec, index) => {
          const isGapAnalysis = rec.recommendationType === 'gap_analysis';
          newSuggestions.push({
            id: `ai-rec-${index}`,
            type: 'ai_recommendation',
            title: rec.title,
            description: rec.description,
            priority: rec.priority as any,
            category: isGapAnalysis ? 'Gap Analysis' : 'Content Enhancement',
            actionable: true,
            action: {
              type: 'ai_generate',
              label: isGapAnalysis ? 'Add Missing Content' : 'Generate Content',
              data: rec
            },
            sources: rec.sources,
            bracketSuggestion: rec.bracketSuggestion,
            insertionPoint: rec.insertionPoint,
            contentSnippet: rec.contentSnippet
          });
        });
      } catch (error) {
        console.error('Error generating AI recommendations:', error);
      }

      // 3. Add regulatory compliance suggestions
      const regulatorySuggestions = generateRegulatorySuggestions(templateContent);
      newSuggestions.push(...regulatorySuggestions);

      // 4. Add content enhancement opportunities
      const enhancementSuggestions = generateContentEnhancements(templateContent, populatedFields ?? []);
      newSuggestions.push(...enhancementSuggestions);

      // Sort by priority and actionability
      newSuggestions.sort((a, b) => {
        const priorityOrder = { 'critical': 0, 'important': 1, 'optional': 2 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        if (a.actionable && !b.actionable) return -1;
        if (!a.actionable && b.actionable) return 1;
        return 0;
      });

      setSmartSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateRegulatorySuggestions = (content: string): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];
    
    // Check for ISO 13485 requirements
    if (content.toLowerCase().includes('quality management') || content.toLowerCase().includes('qms')) {
      suggestions.push({
        id: 'iso-13485-compliance',
        type: 'regulatory_requirement',
        title: 'ISO 13485 Compliance Check',
        description: 'Ensure document meets ISO 13485 quality management system requirements',
        priority: 'important',
        category: 'Regulatory Compliance',
        actionable: true,
        action: {
          type: 'external_link',
          label: 'View ISO 13485 Guide',
          data: { url: 'https://www.iso.org/iso-13485-medical-devices.html' }
        }
      });
    }
    
    // Check for MDR requirements
    if (content.toLowerCase().includes('medical device') || content.toLowerCase().includes('mdr')) {
      suggestions.push({
        id: 'mdr-compliance',
        type: 'regulatory_requirement',
        title: 'MDR Compliance Requirements',
        description: 'Verify compliance with EU Medical Device Regulation (MDR)',
        priority: 'critical',
        category: 'Regulatory Compliance',
        actionable: true,
        action: {
          type: 'external_link',
          label: 'Check MDR Requirements',
          data: { url: 'https://ec.europa.eu/health/md_sector/new_regulations/index_en.htm' }
        }
      });
    }

    return suggestions;
  };

  const generateContentEnhancements = (content: string, fields: string[]): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];
    
    // Suggest adding risk management content
    if (!content.toLowerCase().includes('risk management') && fields.length > 3) {
      suggestions.push({
        id: 'add-risk-management',
        type: 'content_enhancement',
        title: 'Add Risk Management Section',
        description: 'Consider adding risk management procedures to enhance document completeness',
        priority: 'optional',
        category: 'Content Enhancement',
        actionable: true,
        action: {
          type: 'ai_generate',
          label: 'Generate Risk Management Content',
          data: { 
            sectionType: 'risk_management',
            prompt: 'Generate risk management procedures for medical device documentation'
          }
        }
      });
    }

    // Suggest training requirements
    if (!content.toLowerCase().includes('training') && content.toLowerCase().includes('procedure')) {
      suggestions.push({
        id: 'add-training-requirements',
        type: 'content_enhancement',
        title: 'Add Training Requirements',
        description: 'Include training and competency requirements for this procedure',
        priority: 'important',
        category: 'Content Enhancement',
        actionable: true,
        action: {
          type: 'ai_generate',
          label: 'Generate Training Section',
          data: { 
            sectionType: 'training',
            prompt: 'Generate training and competency requirements'
          }
        }
      });
    }

    return suggestions;
  };

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
    return field.toLowerCase().replace(/\s+/g, '_');
  };

  const isCompanySettingsField = (dataType: string): boolean => {
    const companySettingsTypes = [
      'retention_periods', 'edm_system', 'document_numbering', 
      'document_retention', 'retention_period', 'record_retention',
      'document_management', 'document_control_system', 'edm', 'dms',
      'numbering_system', 'document_numbering_system', 'document_format'
    ];
    
    return companySettingsTypes.some(type => 
      dataType.includes(type) || type.includes(dataType.split('_')[0])
    );
  };

  const handleSuggestionAction = (suggestion: SmartSuggestion) => {
    const action = suggestion.action;
    if (!action) return;

    switch (action.type) {
      case 'company_settings':
        const currentUrl = new URL(window.location.href);
        const companyName = currentUrl.pathname.split('/')[3];
        window.open(`/app/company/${companyName}/settings?tab=general`, '_blank');
        break;
        
      case 'manual_input':
        setSelectedDataType(action.data.dataType);
        setIsPromptDialogOpen(true);
        break;
        
      case 'ai_generate':
        onContentEnhancement?.(suggestion);
        break;
        
      case 'external_link':
        window.open(action.data.url, '_blank');
        break;
    }
  };

  const handleDataSaved = async (data: any) => {
    try {
      onDataUpdated?.();
      await generateSmartSuggestions(); // Refresh suggestions
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const getTypeIcon = (type: SmartSuggestion['type']) => {
    switch (type) {
      case 'missing_data':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'content_enhancement':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'regulatory_requirement':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'ai_recommendation':
        return <Brain className="w-4 h-4 text-purple-600" />;
      default:
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getPriorityColor = (priority: SmartSuggestion['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'important':
        return 'border-yellow-200 bg-yellow-50';
      case 'optional':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const criticalSuggestions = safeSuggestions.filter(s => s.priority === 'critical');
  const importantSuggestions = safeSuggestions.filter(s => s.priority === 'important');
  const optionalSuggestions = safeSuggestions.filter(s => s.priority === 'optional');

  return (
    <div className="w-full space-y-3 overflow-hidden">
      {/* Completion Status */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
            <span className="truncate">Document Status</span>
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
              {(populatedFields?.length ?? 0)} fields integrated
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Suggestions */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <Lightbulb className="w-3 h-3 text-yellow-600 flex-shrink-0" />
            <span className="truncate">Smart Suggestions</span>
            {isAnalyzing && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
            <Badge variant="secondary" className="text-xs ml-auto flex-shrink-0">
              {safeSuggestions.length}
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
                  <div className="text-xs text-muted-foreground">Generating smart suggestions</div>
                </div>
              )}

              {!isAnalyzing && safeSuggestions.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-success" />
                  <div className="text-xs font-medium text-foreground">All optimized!</div>
                  <div className="text-xs text-muted-foreground">No suggestions at this time</div>
                </div>
              )}

              {/* Critical Suggestions */}
              {!isAnalyzing && criticalSuggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                    Critical ({criticalSuggestions.length})
                  </div>
                  <div className="space-y-2">
                    {criticalSuggestions.map((suggestion) => (
                      <SuggestionCard 
                        key={suggestion.id} 
                        suggestion={suggestion} 
                        onAction={handleSuggestionAction}
                        getTypeIcon={getTypeIcon}
                        getPriorityColor={getPriorityColor}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Important Suggestions */}
              {!isAnalyzing && importantSuggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">
                    Important ({importantSuggestions.length})
                  </div>
                  <div className="space-y-2">
                    {importantSuggestions.map((suggestion) => (
                      <SuggestionCard 
                        key={suggestion.id} 
                        suggestion={suggestion} 
                        onAction={handleSuggestionAction}
                        getTypeIcon={getTypeIcon}
                        getPriorityColor={getPriorityColor}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Suggestions */}
              {!isAnalyzing && optionalSuggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    Enhancement ({optionalSuggestions.length})
                  </div>
                  <div className="space-y-2">
                    {optionalSuggestions.map((suggestion) => (
                      <SuggestionCard 
                        key={suggestion.id} 
                        suggestion={suggestion} 
                        onAction={handleSuggestionAction}
                        getTypeIcon={getTypeIcon}
                        getPriorityColor={getPriorityColor}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

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

interface SuggestionCardProps {
  suggestion: SmartSuggestion;
  onAction: (suggestion: SmartSuggestion) => void;
  getTypeIcon: (type: SmartSuggestion['type']) => React.ReactNode;
  getPriorityColor: (priority: SmartSuggestion['priority']) => string;
}

function SuggestionCard({ suggestion, onAction, getTypeIcon, getPriorityColor }: SuggestionCardProps) {
  return (
    <div className={`p-2 border rounded-md ${getPriorityColor(suggestion.priority)} w-full max-w-full overflow-hidden`}>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            {getTypeIcon(suggestion.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground break-words leading-tight">
              {suggestion.title}
            </div>
            <div className="text-xs text-muted-foreground break-words leading-tight mt-1">
              {suggestion.description}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-xs">
                {suggestion.category}
              </Badge>
              {suggestion.type === 'missing_data' && (
                <CompanyDataSourceIndicator 
                  dataType={suggestion.action?.data?.dataType || ''} 
                  className="text-xs"
                />
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {suggestion.priority}
          </Badge>
        </div>
        
        {suggestion.bracketSuggestion && (
          <div className="text-xs font-mono bg-yellow-50 border border-yellow-200 rounded p-2 break-words leading-tight ml-6">
            <div className="text-amber-700 font-medium">{suggestion.bracketSuggestion}</div>
          </div>
        )}
        
        {suggestion.insertionPoint && (
          <div className="text-xs text-muted-foreground break-words leading-tight pl-6 space-y-1">
            <div>📍 <span className="font-medium">Insert after:</span> "{suggestion.insertionPoint.afterText}"</div>
            <div className="pl-4"><span className="font-medium">Before:</span> "{suggestion.insertionPoint.beforeText}"</div>
          </div>
        )}
        
        {suggestion.contentSnippet && (
          <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2 break-words leading-tight ml-6">
            <div className="text-blue-700 font-medium mb-1">Suggested content:</div>
            <div className="text-blue-600">{suggestion.contentSnippet}</div>
          </div>
        )}

        {suggestion.suggestion && (
          <div className="text-xs text-muted-foreground break-words leading-tight pl-6">
            💡 {suggestion.suggestion}
          </div>
        )}
        
        {suggestion.sources && suggestion.sources.length > 0 && (
          <div className="text-xs text-blue-600 break-words leading-tight pl-6">
            📚 Sources: {suggestion.sources.join(', ')}
          </div>
        )}
        
        {suggestion.actionable && suggestion.action && (
          <div className="flex justify-end pl-6">
            <Button 
              size="sm" 
              variant={suggestion.action.type === 'company_settings' ? "default" : "outline"}
              onClick={() => onAction(suggestion)}
              className="text-xs px-2 py-1 h-6 flex-shrink-0"
            >
              {suggestion.action.type === 'company_settings' && <Settings className="w-3 h-3 mr-1" />}
              {suggestion.action.type === 'ai_generate' && <Sparkles className="w-3 h-3 mr-1" />}
              {suggestion.action.type === 'external_link' && <ExternalLink className="w-3 h-3 mr-1" />}
              {suggestion.action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}