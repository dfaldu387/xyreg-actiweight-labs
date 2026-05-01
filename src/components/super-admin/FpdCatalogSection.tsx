import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FpdSopCatalogService,
  TIER_LABELS,
  TIER_BADGE_CLASSES,
  type FpdSopCatalogEntry,
  type FpdTier,
} from '@/services/fpdSopCatalogService';
import { Search, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FpdSopEditDrawer } from './FpdSopEditDrawer';

type TierFilter = 'all' | FpdTier;

/**
 * Super Admin FPD (Foundation / Pathway / Device-specific) catalog tab.
 * Shows the 51 governed SOPs that auto-seed every new company. Edits here
 * propagate to all future onboardings.
 */
export const FpdCatalogSection: React.FC = () => {
  const [entries, setEntries] = useState<FpdSopCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [editing, setEditing] = useState<FpdSopCatalogEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await FpdSopCatalogService.list();
      setEntries(data);
    } catch (err) {
      toast.error('Failed to load FPD catalog');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    return {
      all: entries.length,
      foundation: entries.filter((e) => e.tier === 'foundation').length,
      pathway: entries.filter((e) => e.tier === 'pathway').length,
      device_specific: entries.filter((e) => e.tier === 'device_specific').length,
    };
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (tierFilter !== 'all' && e.tier !== tierFilter) return false;
      if (!q) return true;
      return (
        e.sop_key.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        (e.rationale ?? '').toLowerCase().includes(q)
      );
    });
  }, [entries, search, tierFilter]);

  const openEditor = (entry: FpdSopCatalogEntry) => {
    setEditing(entry);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header / counts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            FPD Catalog · {entries.length} standard SOPs
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These entries auto-seed every new company. Edit a row to update what
            future companies receive. Existing companies are unaffected by edits
            here.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={tierFilter}
              onValueChange={(v) => setTierFilter(v as TierFilter)}
            >
              <TabsList>
                <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                <TabsTrigger value="foundation">
                  Foundation ({counts.foundation})
                </TabsTrigger>
                <TabsTrigger value="pathway">
                  Pathway ({counts.pathway})
                </TabsTrigger>
                <TabsTrigger value="device_specific">
                  Device-specific ({counts.device_specific})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative ml-auto w-full sm:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SOP key, title, rationale…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              Loading FPD catalog…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No entries match your filter.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((entry) => (
                <div
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditor(entry)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openEditor(entry);
                    }
                  }}
                  className={cn(
                    'flex cursor-pointer items-start gap-4 p-4 transition-colors hover:bg-muted/40 focus:bg-muted/40 focus:outline-none',
                    !entry.is_active && 'opacity-60',
                  )}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {entry.sop_key}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', TIER_BADGE_CLASSES[entry.tier])}
                      >
                        {TIER_LABELS[entry.tier]}
                      </Badge>
                      {entry.trigger && entry.trigger !== 'always' && (
                        <Badge variant="secondary" className="text-xs">
                          when: {entry.trigger}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs gap-1">
                        <FileText className="h-3 w-3" />
                        {entry.default_sections?.length ?? 0} sections
                      </Badge>
                      {!entry.is_active && (
                        <Badge variant="destructive" className="text-xs">
                          inactive
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium">{entry.title}</h3>
                    {entry.rationale && (
                      <p className="text-xs text-muted-foreground">
                        {entry.rationale}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditor(entry);
                    }}
                  >
                    Open editor
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side-drawer editor (master content authoring; no review/approve) */}
      <FpdSopEditDrawer
        entry={editing}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setEditing(null);
        }}
        onSaved={load}
      />
    </div>
  );
};

export default FpdCatalogSection;