import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  countTierASopsPresent,
  seedTierASopsForCompany,
  seedAllTierBSopsForCompany,
} from '@/services/sopAutoSeedService';
import { TIER_A_AUTO_SEED, TIER_B_CONDITIONAL } from '@/constants/sopAutoSeedTiers';
import { formatSopDisplayId } from '@/constants/sopAutoSeedTiers';

interface SopAutoSeedStatusProps {
  companyId: string;
  companyName?: string;
  /** Called after a successful seed to let parents refresh their lists. */
  onSeeded?: () => void;
}

/**
 * Compact status strip shown in DocumentControl that:
 *  - Reports how many Tier A SOPs are already present.
 *  - Offers a one-click re-seed for any missing Tier A SOPs.
 *  - Offers a "Seed Tier B" button (all conditional SOPs at once).
 *
 * Lives at the top of Document Control because foundation SOPs are the
 * primary thing a new admin sees there.
 */
export function SopAutoSeedStatus({ companyId, companyName, onSeeded }: SopAutoSeedStatusProps) {
  const [count, setCount] = useState<number | null>(null);
  const [isSeedingA, setIsSeedingA] = useState(false);
  const [isSeedingB, setIsSeedingB] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const total = TIER_A_AUTO_SEED.length;

  const refresh = async () => {
    if (!companyId) return;
    const n = await countTierASopsPresent(companyId);
    setCount(n);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleSeedA = async () => {
    if (!companyId || !companyName) return;
    setIsSeedingA(true);
    try {
      const r = await seedTierASopsForCompany(companyId, companyName);
      if (r.inserted > 0) {
        toast.success(`Seeded ${r.inserted} foundation SOP${r.inserted === 1 ? '' : 's'}`);
      } else if (r.skipped === total) {
        toast.info('All foundation SOPs already present');
      }
      if (r.failed > 0) {
        toast.error(`${r.failed} SOP${r.failed === 1 ? '' : 's'} failed to seed`);
      }
      await refresh();
      onSeeded?.();
    } catch (err) {
      toast.error('Failed to seed foundation SOPs');
      console.error(err);
    } finally {
      setIsSeedingA(false);
    }
  };

  const handleSeedB = async () => {
    if (!companyId || !companyName) return;
    setIsSeedingB(true);
    try {
      const r = await seedAllTierBSopsForCompany(companyId, companyName);
      if (r.inserted > 0) {
        toast.success(`Seeded ${r.inserted} pathway-conditional SOP${r.inserted === 1 ? '' : 's'}`);
      } else {
        toast.info('All pathway-conditional SOPs already present');
      }
      if (r.failed > 0) {
        toast.error(`${r.failed} failed to seed`);
      }
      await refresh();
      onSeeded?.();
    } catch (err) {
      toast.error('Failed to seed pathway SOPs');
      console.error(err);
    } finally {
      setIsSeedingB(false);
    }
  };

  const allPresent = count !== null && count >= total;
  const anyMissing = count !== null && count < total;

  return (
    <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          {allPresent ? (
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="text-foreground">Foundation SOPs auto-created</span>
          <Badge variant={allPresent ? 'default' : 'outline'} className="text-xs">
            {count ?? '…'} / {total}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ({TIER_B_CONDITIONAL.length} more available as pathway-conditional)
          </span>
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-expanded={showBreakdown}
          >
            {showBreakdown ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Hide breakdown
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                View Tier A breakdown
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {anyMissing && (
            <Button
              size="sm"
              variant="default"
              onClick={handleSeedA}
              disabled={isSeedingA || !companyName}
            >
              {isSeedingA ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  Seeding…
                </>
              ) : (
                `Seed ${total - (count ?? 0)} missing Tier A SOP${total - (count ?? 0) === 1 ? '' : 's'}`
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSeedB}
            disabled={isSeedingB || !companyName}
          >
            {isSeedingB ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                Seeding…
              </>
            ) : (
              'Seed Tier B (pathway-conditional)'
            )}
          </Button>
        </div>
      </div>

      {showBreakdown && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">
            These {total} SOPs are pure ISO 13485 / 21 CFR 820 framework
            documents — content is identical across companies (only
            <code className="mx-1 px-1 rounded bg-muted text-foreground">[Company Name]</code>
            is substituted). That is why they can be auto-created at onboarding.
          </p>
          <ul className="grid gap-1 sm:grid-cols-2 text-xs">
            {TIER_A_AUTO_SEED.map((entry) => (
              <li
                key={entry.sop}
                className="flex items-start gap-2 rounded border border-border/60 bg-background/50 px-2 py-1.5"
              >
                <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                  {formatSopDisplayId(entry.sop)}
                </Badge>
                <span className="text-muted-foreground">{entry.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
