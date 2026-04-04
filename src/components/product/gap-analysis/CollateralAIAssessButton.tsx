import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Assessment {
  standardId: string;
  name: string;
  topic: string;
  fieldId: string;
  applicable: 'Yes' | 'No' | 'N/A';
  justification: string;
}

interface CollateralAIAssessButtonProps {
  productId: string;
  onApply: (updates: Record<string, string>) => void;
}

export function CollateralAIAssessButton({ productId, onApply }: CollateralAIAssessButtonProps) {
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAssess = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-collateral-assessment', {
        body: { productId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const items: Assessment[] = data.assessments || [];
      setAssessments(items);
      setSelected(new Set(items.map(a => a.standardId)));
      setDialogOpen(true);
    } catch (e: any) {
      toast({ title: 'AI Assessment failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleApply = () => {
    const updates: Record<string, string> = {};
    assessments.forEach(a => {
      if (selected.has(a.standardId) && a.fieldId) {
        updates[a.fieldId] = a.applicable;
        updates[`${a.fieldId}_justification`] = a.justification;
      }
    });
    onApply(updates);
    setDialogOpen(false);
    toast({ title: 'Suggestions applied', description: `${selected.size} standard(s) updated` });
  };

  const getIcon = (applicable: string) => {
    if (applicable === 'Yes') return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (applicable === 'No') return <XCircle className="h-4 w-4 text-red-500" />;
    return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleAssess}
        disabled={loading}
        className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-300 text-violet-700 hover:from-violet-100 hover:to-purple-100 dark:from-violet-950/30 dark:to-purple-950/30 dark:border-violet-700 dark:text-violet-300"
      >
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        AI Assess Applicability
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Collateral Standards Assessment
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Based on your product profile. Select which suggestions to apply.</p>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {assessments.map(a => (
              <label
                key={a.standardId}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selected.has(a.standardId) ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"
                )}
              >
                <Checkbox
                  checked={selected.has(a.standardId)}
                  onCheckedChange={() => toggleSelect(a.standardId)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getIcon(a.applicable)}
                    <span className="text-sm font-medium">{a.name}</span>
                    <span className={cn(
                      "text-xs font-semibold px-1.5 py-0.5 rounded",
                      a.applicable === 'Yes' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                      a.applicable === 'No' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {a.applicable}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.topic}</p>
                  <p className="text-sm text-foreground mt-1 italic">{a.justification}</p>
                </div>
              </label>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={selected.size === 0}>
              Apply {selected.size} Suggestion{selected.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
