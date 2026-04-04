import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import { HCPCS_CODE_TYPES, HCPCS_DEVICE_PRIORITIES } from '@/utils/reimbursement/usHCPCSCodeTypes';
import { useState } from 'react';

export function HCPCSCodeTypeGuide() {
  const getRelevanceIcon = (relevance: string) => {
    switch (relevance) {
      case 'high':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <AlertCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getRelevanceBadge = (relevance: string) => {
    switch (relevance) {
      case 'high':
        return <Badge className="bg-emerald-600">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary">Moderate</Badge>;
      case 'low':
        return <Badge variant="outline">Low Priority</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Priority Guide */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">HCPCS Code Priority for Medical Devices</CardTitle>
          <CardDescription>Focus on these code types based on your device category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {HCPCS_DEVICE_PRIORITIES.map((priority) => (
              <div key={priority.priority} className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">{priority.priority}</Badge>
                <div>
                  <div className="font-medium text-sm mb-1">
                    {priority.codes.join(', ')} - {priority.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{priority.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Type Details */}
      <div className="space-y-4">
        {HCPCS_CODE_TYPES.map((codeType) => (
          <Card key={codeType.code} className={codeType.deviceRelevance === 'high' ? 'border-primary/40' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getRelevanceIcon(codeType.deviceRelevance)}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">
                        {codeType.code}-Codes: {codeType.name}
                      </CardTitle>
                      {getRelevanceBadge(codeType.deviceRelevance)}
                    </div>
                    <Badge variant="secondary" className="mb-2">{codeType.range}</Badge>
                    <CardDescription>{codeType.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Points */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Key Points</h4>
                <ul className="space-y-1">
                  {codeType.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Examples */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Code Examples</h4>
                <div className="space-y-2">
                  {codeType.examples.map((example, idx) => (
                    <div key={idx} className="text-sm bg-secondary/30 rounded px-3 py-2">
                      <code className="text-xs">{example}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subcategories (if available) */}
              {codeType.subcategories && codeType.subcategories.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Detailed Subcategories</h4>
                  <div className="space-y-2">
                    {codeType.subcategories.map((subcategory, idx) => (
                      <SubcategoryItem key={idx} subcategory={subcategory} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SubcategoryItem({ subcategory }: { subcategory: { range: string; name: string; description: string; examples: string[] } }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded hover:bg-secondary/30 transition-colors">
          <div className="text-left">
            <div className="text-sm font-medium">{subcategory.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              <Badge variant="outline" className="text-xs mr-2">{subcategory.range}</Badge>
              {subcategory.description}
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 ml-4 space-y-2">
          {subcategory.examples.map((example, idx) => (
            <div key={idx} className="text-xs bg-secondary/30 rounded px-3 py-2">
              <code className="text-xs">{example}</code>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
