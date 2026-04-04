import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Settings, DollarSign, Calendar, Zap } from 'lucide-react';
import { CostTemplate, CostTemplateService, CostTemplateOverride } from '@/services/costTemplateService';
import { toast } from 'sonner';

interface CostTemplateSelectorProps {
  marketCode: string;
  deviceClass: string;
  companyId: string;
  onCostsSelected: (costs: Record<string, number>) => void;
  initialCosts?: Record<string, number>;
}

const COST_CATEGORY_ICONS: Record<string, string> = {
  regulatory: '⚖️',
  manufacturing: '🏭',
  clinical: '🩺',
  marketing: '📈',
  distribution: '🚚',
  maintenance: '🔧'
};

const COST_CATEGORY_COLORS: Record<string, string> = {
  regulatory: 'bg-red-50 text-red-700 border-red-200',
  manufacturing: 'bg-blue-50 text-blue-700 border-blue-200',
  clinical: 'bg-green-50 text-green-700 border-green-200',
  marketing: 'bg-purple-50 text-purple-700 border-purple-200',
  distribution: 'bg-orange-50 text-orange-700 border-orange-200',
  maintenance: 'bg-gray-50 text-gray-700 border-gray-200'
};

export const CostTemplateSelector: React.FC<CostTemplateSelectorProps> = ({
  marketCode,
  deviceClass,
  companyId,
  onCostsSelected,
  initialCosts = {}
}) => {
  const [templates, setTemplates] = useState<CostTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCosts, setSelectedCosts] = useState<Record<string, number>>(initialCosts);

  useEffect(() => {
    loadCostTemplates();
  }, [marketCode, deviceClass]);

  const loadCostTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await CostTemplateService.getMarketCostTemplates(marketCode, deviceClass);
      setTemplates(templatesData);
      
      // Initialize costs from templates
      const costs: Record<string, number> = {};
      templatesData.forEach(template => {
        const key = template.costSubcategory || template.costCategory;
        costs[key] = initialCosts[key] || template.typicalCost;
      });
      
      setSelectedCosts(costs);
      onCostsSelected(costs);
    } catch (error) {
      console.error('Error loading cost templates:', error);
      toast.error('Failed to load cost templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCostChange = (key: string, value: number) => {
    const newCosts = { ...selectedCosts, [key]: value };
    setSelectedCosts(newCosts);
    onCostsSelected(newCosts);
  };

  const getTotalCost = () => {
    return Object.values(selectedCosts).reduce((sum, cost) => sum + cost, 0);
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.costCategory]) {
      acc[template.costCategory] = [];
    }
    acc[template.costCategory].push(template);
    return acc;
  }, {} as Record<string, CostTemplate[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Market Cost Templates - {marketCode} ({deviceClass})
            </span>
            <Badge variant="secondary" className="flex items-center gap-1">
              <span>Total: ${getTotalCost().toLocaleString()}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{COST_CATEGORY_ICONS[category]}</span>
                <h3 className="text-lg font-semibold capitalize">{category} Costs</h3>
                <Badge className={COST_CATEGORY_COLORS[category]}>
                  {categoryTemplates.length} item{categoryTemplates.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {categoryTemplates.map(template => {
                  const key = template.costSubcategory || template.costCategory;
                  const currentValue = selectedCosts[key] || template.typicalCost;
                  
                  return (
                    <Card key={template.id} className="border-l-4 border-l-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="font-medium">{template.costSubcategory || template.costCategory}</Label>
                              {template.justification && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>{template.justification}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {template.timelineMonths && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {template.timelineMonths}mo
                                </Badge>
                              )}
                              {template.frequency !== 'one_time' && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  {template.frequency}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {template.costDescription}
                            </p>
                            
                            <div className="text-sm text-muted-foreground">
                              Template range: {CostTemplateService.getCostRangeLabel(template)}
                            </div>
                          </div>
                          
                          <div className="space-y-2 min-w-[200px]">
                            <Input
                              type="number"
                              value={currentValue}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                handleCostChange(key, value);
                              }}
                              placeholder="Enter cost"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          
          {templates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cost templates available for {marketCode} ({deviceClass})</p>
              <p className="text-sm">You can enter custom costs manually</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};