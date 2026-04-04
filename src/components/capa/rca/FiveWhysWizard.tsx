import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FiveWhysData, 
  createEmptyFiveWhysData 
} from '@/types/rcaData';
import { HelpCircle, ArrowDown, Plus, Trash2, Save, Target, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FiveWhysWizardProps {
  initialData?: FiveWhysData | null;
  problemStatement?: string;
  onSave: (data: FiveWhysData) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function FiveWhysWizard({ 
  initialData, 
  problemStatement = '',
  onSave, 
  isLoading = false,
  readOnly = false 
}: FiveWhysWizardProps) {
  const [data, setData] = useState<FiveWhysData>(
    initialData || createEmptyFiveWhysData(problemStatement)
  );
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const handleProblemChange = (value: string) => {
    setData(prev => ({
      ...prev,
      problemStatement: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleAddWhy = () => {
    const nextLevel = data.whyChain.length + 1;
    if (nextLevel > 5) return;

    const previousAnswer = data.whyChain[data.whyChain.length - 1]?.answer || data.problemStatement;
    
    setData(prev => ({
      ...prev,
      whyChain: [
        ...prev.whyChain,
        {
          level: nextLevel,
          question: `Why did ${previousAnswer.toLowerCase().slice(0, 50)}${previousAnswer.length > 50 ? '...' : ''} happen?`,
          answer: ''
        }
      ],
      updatedAt: new Date().toISOString()
    }));
    setExpandedLevel(nextLevel);
  };

  const handleUpdateWhy = (index: number, field: 'question' | 'answer', value: string) => {
    setData(prev => ({
      ...prev,
      whyChain: prev.whyChain.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleRemoveWhy = (index: number) => {
    setData(prev => ({
      ...prev,
      whyChain: prev.whyChain.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        level: i + 1
      })),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSave = () => {
    onSave(data);
  };

  const canAddMore = data.whyChain.length < 5;
  const lastAnswer = data.whyChain[data.whyChain.length - 1]?.answer || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          5 Whys Analysis
        </CardTitle>
        <CardDescription>
          Drill down to the root cause by asking "Why?" iteratively
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Problem Statement */}
        <div className="space-y-2">
          <Label className="font-medium">Problem Statement</Label>
          {readOnly ? (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <p className="text-sm">{data.problemStatement || 'No problem statement defined'}</p>
            </div>
          ) : (
            <Textarea
              value={data.problemStatement}
              onChange={(e) => handleProblemChange(e.target.value)}
              placeholder="What is the problem we are investigating?"
              rows={2}
              className="border-destructive/50"
            />
          )}
        </div>

        {/* Why Chain */}
        <div className="space-y-3">
          {data.whyChain.map((item, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index > 0 && (
                <div className="absolute left-6 -top-3 w-px h-3 bg-border" />
              )}
              
              <div className={cn(
                "border rounded-lg transition-all",
                expandedLevel === item.level ? "border-primary shadow-sm" : "border-border",
                item.answer ? "bg-background" : "bg-muted/30"
              )}>
                <div 
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedLevel(expandedLevel === item.level ? null : item.level)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                    {item.level}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      Why #{item.level}
                    </p>
                    {item.answer && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.answer}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.answer ? (
                      <Badge variant="secondary" className="text-xs">Answered</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    )}
                    {expandedLevel === item.level ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedLevel === item.level && (
                  <div className="px-3 pb-3 space-y-3 border-t pt-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Question</Label>
                      {readOnly ? (
                        <p className="text-sm bg-muted/50 p-2 rounded">{item.question}</p>
                      ) : (
                        <Textarea
                          value={item.question}
                          onChange={(e) => handleUpdateWhy(index, 'question', e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Answer</Label>
                      {readOnly ? (
                        <p className="text-sm bg-muted/50 p-2 rounded">{item.answer || 'Not answered'}</p>
                      ) : (
                        <Textarea
                          value={item.answer}
                          onChange={(e) => handleUpdateWhy(index, 'answer', e.target.value)}
                          placeholder="Why did this happen?"
                          rows={2}
                          className="text-sm"
                        />
                      )}
                    </div>

                    {!readOnly && (
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveWhy(index);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Arrow to next */}
              {index < data.whyChain.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Add Why Button */}
          {!readOnly && canAddMore && (
            <div className="flex justify-center pt-2">
              <Button 
                variant="outline" 
                onClick={handleAddWhy}
                disabled={data.whyChain.length > 0 && !lastAnswer}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Why #{data.whyChain.length + 1}
              </Button>
            </div>
          )}

          {data.whyChain.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Start your analysis by adding the first "Why?"
              </p>
              {!readOnly && (
                <Button variant="outline" onClick={handleAddWhy}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Analysis
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {data.whyChain.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Progress:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "w-6 h-2 rounded-full",
                    level <= data.whyChain.length 
                      ? data.whyChain[level - 1]?.answer 
                        ? "bg-primary" 
                        : "bg-primary/40"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {data.whyChain.filter(w => w.answer).length}/5 answered
            </span>
          </div>
        )}

        {/* Root Cause Conclusion */}
        <div className="space-y-2 pt-4 border-t">
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
              placeholder="Based on the 5 Whys analysis, document the root cause..."
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
