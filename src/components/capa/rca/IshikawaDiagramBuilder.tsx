import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  IshikawaData, 
  ISHIKAWA_CATEGORY_LABELS, 
  ISHIKAWA_CATEGORY_COLORS,
  createEmptyIshikawaData 
} from '@/types/rcaData';
import { Plus, X, Fish, Target, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IshikawaDiagramBuilderProps {
  initialData?: IshikawaData | null;
  onSave: (data: IshikawaData) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

type CategoryKey = keyof IshikawaData['categories'];

export function IshikawaDiagramBuilder({ 
  initialData, 
  onSave, 
  isLoading = false,
  readOnly = false 
}: IshikawaDiagramBuilderProps) {
  const [data, setData] = useState<IshikawaData>(
    initialData || createEmptyIshikawaData()
  );
  const [newCauses, setNewCauses] = useState<Record<CategoryKey, string>>({
    man: '',
    machine: '',
    method: '',
    material: '',
    measurement: '',
    environment: ''
  });
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);

  const handleAddCause = (category: CategoryKey) => {
    const cause = newCauses[category].trim();
    if (!cause) return;

    setData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: [...prev.categories[category], cause]
      },
      updatedAt: new Date().toISOString()
    }));
    setNewCauses(prev => ({ ...prev, [category]: '' }));
  };

  const handleRemoveCause = (category: CategoryKey, index: number) => {
    setData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: prev.categories[category].filter((_, i) => i !== index)
      },
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSave = () => {
    onSave(data);
  };

  const totalCauses = Object.values(data.categories).flat().length;
  const categories = Object.keys(data.categories) as CategoryKey[];
  const topCategories = categories.slice(0, 3);
  const bottomCategories = categories.slice(3, 6);

  const renderCategoryCard = (category: CategoryKey) => {
    const causes = data.categories[category];
    const isActive = activeCategory === category;
    
    return (
      <div 
        key={category}
        className={cn(
          "p-3 rounded-lg border-2 transition-all cursor-pointer",
          isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          readOnly && "cursor-default"
        )}
        onClick={() => !readOnly && setActiveCategory(isActive ? null : category)}
      >
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ borderColor: ISHIKAWA_CATEGORY_COLORS[category] }}
          >
            {ISHIKAWA_CATEGORY_LABELS[category]}
          </Badge>
          <span className="text-xs text-muted-foreground">{causes.length}</span>
        </div>
        
        {/* Causes list */}
        <div className="space-y-1 min-h-[40px]">
          {causes.map((cause, i) => (
            <div 
              key={i} 
              className="flex items-center gap-1 text-xs bg-background/80 rounded px-2 py-1 group"
            >
              <span className="flex-1 truncate">{cause}</span>
              {!readOnly && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCause(category, i);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {causes.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Click to add causes</p>
          )}
        </div>

        {/* Add cause input */}
        {isActive && !readOnly && (
          <div className="mt-2 flex gap-1" onClick={e => e.stopPropagation()}>
            <Input
              value={newCauses[category]}
              onChange={(e) => setNewCauses(prev => ({ 
                ...prev, 
                [category]: e.target.value 
              }))}
              placeholder="Add cause..."
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCause(category);
                }
              }}
              autoFocus
            />
            <Button 
              size="sm" 
              className="h-7 px-2"
              onClick={() => handleAddCause(category)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fish className="h-5 w-5" />
          Ishikawa (Fishbone) Diagram
        </CardTitle>
        <CardDescription>
          Identify potential causes organized by the 6M categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Diagram Representation - Fishbone Layout */}
        <div className="relative bg-muted/30 rounded-lg p-6">
          {/* Main grid: categories on left, spine + root cause on right */}
          <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
            {/* Categories column */}
            <div className="space-y-4">
              {/* Top row of categories */}
              <div className="grid grid-cols-3 gap-4">
                {topCategories.map(renderCategoryCard)}
              </div>
              
              {/* Bottom row of categories */}
              <div className="grid grid-cols-3 gap-4">
                {bottomCategories.map(renderCategoryCard)}
              </div>
            </div>

            {/* Spine and Root Cause - positioned to the right, vertically centered */}
            <div className="flex items-center h-full">
              {/* Horizontal spine line */}
              <div className="w-8 h-1 bg-primary/60" />
              {/* Root Cause button */}
              <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-md flex items-center gap-2 whitespace-nowrap">
                <Target className="h-4 w-4" />
                <span className="font-medium text-sm">Root Cause</span>
              </div>
            </div>
          </div>

          {/* Connecting lines from categories to spine (visual overlay) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Top branches - angled lines going up-right */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Line from top row center to spine */}
              <line 
                x1="75%" y1="25%" x2="88%" y2="50%" 
                stroke="hsl(var(--primary) / 0.3)" 
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              {/* Line from bottom row center to spine */}
              <line 
                x1="75%" y1="75%" x2="88%" y2="50%" 
                stroke="hsl(var(--primary) / 0.3)" 
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </svg>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <Badge variant="secondary">
            {totalCauses} potential cause{totalCauses !== 1 ? 's' : ''} identified
          </Badge>
          {Object.entries(data.categories)
            .filter(([_, causes]) => causes.length > 0)
            .map(([category, causes]) => (
              <span key={category} className="text-muted-foreground">
                {ISHIKAWA_CATEGORY_LABELS[category as CategoryKey]}: {causes.length}
              </span>
            ))
          }
        </div>

        {/* Root Cause Conclusion */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Identified Root Cause
          </Label>
          {readOnly ? (
            <div className="bg-muted/50 p-3 rounded-md min-h-[80px]">
              {data.rootCause ? (
                <p className="text-sm whitespace-pre-wrap">{data.rootCause}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No root cause identified yet</p>
              )}
            </div>
          ) : (
            <Textarea
              value={data.rootCause}
              onChange={(e) => setData(prev => ({ 
                ...prev, 
                rootCause: e.target.value,
                updatedAt: new Date().toISOString()
              }))}
              placeholder="Based on the analysis above, document the primary root cause..."
              rows={3}
            />
          )}
        </div>

        {/* Save Button */}
        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Save Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
