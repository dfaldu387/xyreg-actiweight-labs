import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { CPT_CATEGORIES, type CPTCategory } from '@/utils/reimbursement/usCPTCategories';

export function CPTCategoryBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const filteredCategories = CPT_CATEGORIES.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.range.includes(searchTerm)
  );

  const toggleCategory = (code: string) => {
    setExpandedCategories((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const getRelevanceBadge = (applicability: string) => {
    if (applicability.toLowerCase().includes('very high') || applicability.toLowerCase().includes('high')) {
      return <Badge variant="default" className="bg-emerald-600">High Relevance</Badge>;
    }
    if (applicability.toLowerCase().includes('moderate')) {
      return <Badge variant="secondary">Moderate</Badge>;
    }
    return <Badge variant="outline">Limited</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by category name, range, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="space-y-3">
        {filteredCategories.map((category) => {
          const isExpanded = expandedCategories.includes(category.code);
          return (
            <Card key={category.code}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.code)}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 text-left">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <Badge variant="outline">{category.range}</Badge>
                            {getRelevanceBadge(category.deviceApplicability)}
                          </div>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="pl-8 space-y-4">
                      <div className="text-sm">
                        <span className="font-medium">Device Applicability: </span>
                        <span className="text-muted-foreground">{category.deviceApplicability}</span>
                      </div>

                      {category.subcategories && category.subcategories.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Subcategories</h4>
                          <div className="space-y-3">
                            {category.subcategories.map((sub, idx) => (
                              <div key={idx} className="border-l-2 border-primary/20 pl-4 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-xs">{sub.range}</Badge>
                                  <span className="text-sm font-medium">{sub.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{sub.description}</p>
                                {sub.examples && sub.examples.length > 0 && (
                                  <div className="text-xs">
                                    <span className="font-medium">Device Examples: </span>
                                    <span className="text-muted-foreground">{sub.examples.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No categories found matching "{searchTerm}"
          </CardContent>
        </Card>
      )}
    </div>
  );
}
