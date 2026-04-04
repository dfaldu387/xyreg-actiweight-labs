import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface ContentSelection {
  type: string;
  title: string;
  enabled: boolean;
  options?: Record<string, any>;
}

interface ContentTypeSelectorProps {
  selections: ContentSelection[];
  onSelectionChange: (selections: ContentSelection[]) => void;
}

const CONTENT_CATEGORIES = [
  {
    category: 'Product Information',
    icon: '📋',
    items: [
      {
        type: 'product_overview',
        title: 'Product Overview',
        description: 'Name, description, intended use, key features',
      },
      {
        type: 'intended_use',
        title: 'Intended Use & Claims',
        description: 'Indications for use, contraindications',
      },
      {
        type: 'technical_specs',
        title: 'Technical Specifications',
        description: 'Device classification, risk class',
      },
    ],
  },
  {
    category: 'Financial Data',
    icon: '💰',
    items: [
      {
        type: 'financials',
        title: 'Financial Performance',
        description: 'Revenue, units sold, market performance',
        hasOptions: true,
      },
    ],
  },
  {
    category: 'Regulatory & Compliance',
    icon: '✅',
    items: [
      {
        type: 'regulatory_status',
        title: 'Market Registrations',
        description: 'Regulatory status by market',
        hasOptions: true,
      },
      {
        type: 'certifications',
        title: 'Certifications & Approvals',
        description: 'ISO certifications, quality approvals',
      },
    ],
  },
  {
    category: 'Clinical Evidence',
    icon: '🔬',
    items: [
      {
        type: 'clinical_evidence',
        title: 'Clinical Trial Summary',
        description: 'Study results, safety & efficacy data',
      },
    ],
  },
  {
    category: 'Technical Documentation',
    icon: '📄',
    items: [
      {
        type: 'custom_document',
        title: 'Link Existing Documents',
        description: 'Select documents from document library',
      },
    ],
  },
];

export function ContentTypeSelector({ selections, onSelectionChange }: ContentTypeSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CONTENT_CATEGORIES.map(c => c.category))
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const isSelected = (type: string) => {
    return selections.some(s => s.type === type && s.enabled);
  };

  const toggleSelection = (type: string, title: string) => {
    const existing = selections.find(s => s.type === type);
    
    if (existing) {
      onSelectionChange(
        selections.map(s => 
          s.type === type ? { ...s, enabled: !s.enabled } : s
        )
      );
    } else {
      onSelectionChange([
        ...selections,
        { type, title, enabled: true, options: {} },
      ]);
    }
  };

  return (
    <div className="space-y-4">
      {CONTENT_CATEGORIES.map((category) => (
        <Card key={category.category}>
          <Collapsible
            open={expandedCategories.has(category.category)}
            onOpenChange={() => toggleCategory(category.category)}
          >
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                  </div>
                  {expandedCategories.has(category.category) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                {category.items.map((item) => (
                  <div key={item.type} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
                    <Checkbox
                      id={item.type}
                      checked={isSelected(item.type)}
                      onCheckedChange={() => toggleSelection(item.type, item.title)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={item.type}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {item.title}
                      </Label>
                      <CardDescription className="text-xs mt-1">
                        {item.description}
                      </CardDescription>
                      {item.hasOptions && isSelected(item.type) && (
                        <div className="mt-2 text-xs text-muted-foreground italic">
                          Configuration options will be available in next step
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
