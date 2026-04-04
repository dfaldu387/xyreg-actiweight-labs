
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { type PhaseCategory } from '@/services/categoryService';
import { type PhaseWithCategories } from '@/services/phaseCategoryAssignmentService';

interface GroupedPhaseViewProps {
  phases: PhaseWithCategories[];
  categories: PhaseCategory[];
  onEditPhase: (phase: PhaseWithCategories) => void;
  onDeletePhase: (phaseId: string) => void;
  onMovePhase: (fromIndex: number, toIndex: number) => void;
  loading?: boolean;
}

export function GroupedPhaseView({
  phases,
  categories,
  onEditPhase,
  onDeletePhase,
  onMovePhase,
  loading = false
}: GroupedPhaseViewProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(categories.map(cat => cat.id))
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Group phases by category
  const phasesByCategory = React.useMemo(() => {
    const grouped: Record<string, PhaseWithCategories[]> = {};
    
    // Initialize with all categories
    categories.forEach(category => {
      grouped[category.id] = [];
    });
    
    // Add uncategorized group
    grouped['uncategorized'] = [];

    // Group phases
    phases.forEach(phase => {
      if (phase.categories.length === 0) {
        grouped['uncategorized'].push(phase);
      } else {
        phase.categories.forEach(category => {
          if (grouped[category.id]) {
            grouped[category.id].push(phase);
          }
        });
      }
    });

    return grouped;
  }, [phases, categories]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading grouped phases...</p>
      </div>
    );
  }

  const renderPhaseItem = (phase: PhaseWithCategories, index: number, allPhases: PhaseWithCategories[]) => (
    <div key={phase.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-medium text-sm">{phase.name}</div>
          <Badge variant="outline" className="text-xs">
            Position: {phase.position + 1}
          </Badge>
        </div>
        {phase.description && (
          <div className="text-xs text-muted-foreground mb-2">{phase.description}</div>
        )}
        {phase.categories.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {phase.categories.map(category => (
              <Badge key={category.id} variant="secondary" className="text-xs">
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onMovePhase(index, index - 1)}
          disabled={index === 0}
          className="h-6 w-6 p-0"
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onMovePhase(index, index + 1)}
          disabled={index === allPhases.length - 1}
          className="h-6 w-6 p-0"
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEditPhase(phase)}
          className="h-6 w-6 p-0"
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDeletePhase(phase.id)}
          className="h-6 w-6 p-0"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Render categories */}
      {categories.map(category => {
        const categoryPhases = phasesByCategory[category.id] || [];
        const isExpanded = expandedCategories.has(category.id);

        return (
          <Card key={category.id}>
            <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span>{category.name}</span>
                      <Badge variant="outline">{categoryPhases.length}</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {categoryPhases.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No phases in this category</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoryPhases.map((phase, index) => 
                        renderPhaseItem(phase, index, categoryPhases)
                      )}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Render uncategorized phases */}
      {phasesByCategory['uncategorized']?.length > 0 && (
        <Card>
          <Collapsible 
            open={expandedCategories.has('uncategorized')} 
            onOpenChange={() => toggleCategory('uncategorized')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedCategories.has('uncategorized') ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>Uncategorized</span>
                    <Badge variant="outline">{phasesByCategory['uncategorized'].length}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-2">
                  {phasesByCategory['uncategorized'].map((phase, index) => 
                    renderPhaseItem(phase, index, phasesByCategory['uncategorized'])
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}
