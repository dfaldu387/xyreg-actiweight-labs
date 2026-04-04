import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2 } from 'lucide-react';
import type { BomItem } from '@/types/bom';
import { useTranslation } from '@/hooks/useTranslation';

interface DeviceComponentMin {
  id: string;
  name: string;
  description: string;
  component_type: string;
}

interface ProposedMatch {
  bomItem: BomItem;
  component: DeviceComponentMin;
  score: number;
  accepted: boolean;
}

interface BomAutoLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BomItem[];
  components: DeviceComponentMin[];
  onApply: (links: { id: string; component_id: string }[]) => void;
  isApplying?: boolean;
}

const STOP_WORDS = new Set(['kit', 'set', 'unit', 'assembly', 'module', 'system', 'the', 'a', 'an', 'of', 'for']);
const PREFIX_REGEX = /^(e-link|g660|g-660)\s*/i;

function normalize(str: string): string[] {
  return str
    .toLowerCase()
    .replace(PREFIX_REGEX, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function jaccardScore(a: string, b: string): number {
  const wordsA = new Set(normalize(a));
  const wordsB = new Set(normalize(b));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

const THRESHOLD = 0.3;

export function BomAutoLinkDialog({ open, onOpenChange, items, components, onApply, isApplying }: BomAutoLinkDialogProps) {
  const { lang } = useTranslation();
  const initialMatches = useMemo(() => {
    const unlinked = items.filter(i => !i.component_id);
    const matches: ProposedMatch[] = [];

    for (const bomItem of unlinked) {
      let bestMatch: DeviceComponentMin | null = null;
      let bestScore = 0;

      for (const comp of components) {
        const score = jaccardScore(bomItem.description, comp.name);
        if (score > bestScore && score >= THRESHOLD) {
          bestScore = score;
          bestMatch = comp;
        }
      }

      if (bestMatch) {
        matches.push({ bomItem, component: bestMatch, score: bestScore, accepted: true });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }, [items, components]);

  const [matches, setMatches] = useState<ProposedMatch[]>(initialMatches);

  // Reset when dialog opens with new data
  React.useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches]);

  const toggleMatch = (idx: number) => {
    setMatches(prev => prev.map((m, i) => i === idx ? { ...m, accepted: !m.accepted } : m));
  };

  const handleApply = () => {
    const links = matches.filter(m => m.accepted).map(m => ({
      id: m.bomItem.id,
      component_id: m.component.id,
    }));
    onApply(links);
  };

  const acceptedCount = matches.filter(m => m.accepted).length;
  const unlinkedCount = items.filter(i => !i.component_id).length;
  const unmatchedCount = unlinkedCount - matches.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" /> {lang('bom.autoLinkTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">
          {lang('bom.matchesFound', { matches: matches.length, unlinked: unlinkedCount })}
          {unmatchedCount > 0 && <span> {lang('bom.noMatchSuffix', { count: unmatchedCount })}</span>}
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {lang('bom.noMatchesFound')}
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {matches.map((m, idx) => (
                <div
                  key={m.bomItem.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    m.accepted ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'
                  }`}
                >
                  <Checkbox
                    checked={m.accepted}
                    onCheckedChange={() => toggleMatch(idx)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{m.bomItem.description}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="text-sm text-primary truncate">{m.component.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(m.score * 100)}% {lang('bom.match')}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">{m.component.component_type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{lang('common.cancel')}</Button>
          <Button onClick={handleApply} disabled={acceptedCount === 0 || isApplying}>
            {isApplying ? lang('bom.linking') : (acceptedCount !== 1 ? lang('bom.linkItemsPlural', { count: acceptedCount }) : lang('bom.linkItems', { count: acceptedCount }))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
