import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Globe, ExternalLink, Search, Network, ListChecks, BookMarked } from 'lucide-react';
import {
  EU_MDR_OVERVIEW,
  EU_IVDR_OVERVIEW,
  MDCG_GUIDANCE,
  GLOBAL_MARKETS,
  DIGITAL_THREAD,
  LAUNCH_PLANS,
  REGIONS,
  PATHWAY_DESCRIPTIONS,
  type GlobalMarket,
} from './moduleContent/regulatoryAtlasContent';

interface RegulatoryAtlasViewProps {
  onBack: () => void;
}

const pathwayColor: Record<GlobalMarket['pathway'], string> = {
  Direct: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  Reliance: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  Hybrid: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
};

export function RegulatoryAtlasView({ onBack }: RegulatoryAtlasViewProps) {
  const [marketSearch, setMarketSearch] = useState('');
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<GlobalMarket | null>(null);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);

  const filteredMarkets = useMemo(() => {
    let list = GLOBAL_MARKETS;
    if (activeRegion) list = list.filter(m => m.region === activeRegion);
    if (marketSearch.trim()) {
      const q = marketSearch.toLowerCase();
      list = list.filter(m =>
        m.country.toLowerCase().includes(q) ||
        m.authority.toLowerCase().includes(q) ||
        m.primaryRegulation.toLowerCase().includes(q) ||
        m.notes.toLowerCase().includes(q)
      );
    }
    return list;
  }, [marketSearch, activeRegion]);

  if (selectedMarket) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => setSelectedMarket(null)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Atlas
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{selectedMarket.country}</h2>
            <Badge variant="outline" className={`text-[10px] ${pathwayColor[selectedMarket.pathway]}`}>
              {selectedMarket.pathway}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{selectedMarket.region} · {selectedMarket.authority}</p>
        </div>

        <div className="space-y-2 text-sm">
          <Card className="p-3 space-y-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Primary regulation</p>
              <p className="text-sm font-medium">{selectedMarket.primaryRegulation}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">QMS expectation</p>
              <p className="text-sm">{selectedMarket.qmsExpectation}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Unique identifier</p>
              <p className="text-sm">{selectedMarket.uniqueId}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pathway</p>
              <p className="text-xs text-muted-foreground">{PATHWAY_DESCRIPTIONS[selectedMarket.pathway]}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Notes</p>
              <p className="text-xs">{selectedMarket.notes}</p>
            </div>
            {selectedMarket.link && (
              <a
                href={selectedMarket.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Authority website <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="space-y-1">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Regulatory Atlas
        </h2>
        <p className="text-xs text-muted-foreground">
          EU MDR/IVDR deep-dive · {GLOBAL_MARKETS.length} global markets · digital thread · launch checklists
        </p>
      </div>

      <Tabs defaultValue="eu" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto">
          <TabsTrigger value="eu" className="text-[11px] px-1 py-1.5 gap-1">
            <BookMarked className="h-3 w-3" /> EU
          </TabsTrigger>
          <TabsTrigger value="global" className="text-[11px] px-1 py-1.5 gap-1">
            <Globe className="h-3 w-3" /> Global
          </TabsTrigger>
          <TabsTrigger value="thread" className="text-[11px] px-1 py-1.5 gap-1">
            <Network className="h-3 w-3" /> Thread
          </TabsTrigger>
          <TabsTrigger value="launch" className="text-[11px] px-1 py-1.5 gap-1">
            <ListChecks className="h-3 w-3" /> Launch
          </TabsTrigger>
        </TabsList>

        {/* EU MDR / IVDR */}
        <TabsContent value="eu" className="space-y-3 mt-3">
          <Card className="p-3 space-y-1.5">
            <a
              href="https://eur-lex.europa.eu/eli/reg/2017/745/oj"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <h3 className="text-sm font-semibold text-primary">EU MDR — Regulation (EU) 2017/745</h3>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{EU_MDR_OVERVIEW}</pre>
          </Card>
          <Card className="p-3 space-y-1.5">
            <a
              href="https://eur-lex.europa.eu/eli/reg/2017/746/oj"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <h3 className="text-sm font-semibold text-primary">EU IVDR — Regulation (EU) 2017/746</h3>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{EU_IVDR_OVERVIEW}</pre>
          </Card>
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              MDCG Guidance ({MDCG_GUIDANCE.length})
            </h3>
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {MDCG_GUIDANCE.map(g => (
                <a
                  key={g.id}
                  href={g.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md border border-border/50 p-2.5 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight flex items-center gap-1.5">
                        <span className="text-primary">{g.id}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{g.title}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">{g.topic}</Badge>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Global Markets */}
        <TabsContent value="global" className="space-y-3 mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries, authorities, regulations..."
              value={marketSearch}
              onChange={(e) => setMarketSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge
              variant={activeRegion === null ? 'default' : 'outline'}
              className="cursor-pointer text-[10px] px-2 py-0.5"
              onClick={() => setActiveRegion(null)}
            >
              All regions
            </Badge>
            {REGIONS.map(r => (
              <Badge
                key={r}
                variant={activeRegion === r ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] px-2 py-0.5"
                onClick={() => setActiveRegion(prev => prev === r ? null : r)}
              >
                {r}
              </Badge>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground px-1">
            {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} · click any row to drill down
          </p>

          <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
            {filteredMarkets.map(m => (
              <button
                key={m.country}
                onClick={() => setSelectedMarket(m)}
                className="w-full text-left rounded-md border border-border/50 p-2.5 hover:bg-accent/40 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{m.country}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m.authority}</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">{m.primaryRegulation}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Badge variant="outline" className={`text-[9px] ${pathwayColor[m.pathway]}`}>
                      {m.pathway}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">{m.region}</span>
                  </div>
                </div>
              </button>
            ))}
            {filteredMarkets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No markets match your search.</p>
            )}
          </div>
        </TabsContent>

        {/* Digital Thread */}
        <TabsContent value="thread" className="space-y-2 mt-3">
          <p className="text-xs text-muted-foreground px-1">
            Global standards that link the same evidence across multiple regulators — design once, leverage everywhere.
          </p>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {DIGITAL_THREAD.map(s => (
              <Card key={s.acronym} className="p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{s.acronym}</h4>
                  <span className="text-[10px] text-muted-foreground">— {s.name}</span>
                </div>
                <p className="text-xs"><span className="font-medium">Scope:</span> <span className="text-muted-foreground">{s.scope}</span></p>
                <p className="text-xs"><span className="font-medium">Why it matters:</span> <span className="text-muted-foreground">{s.why}</span></p>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Launch Checklist */}
        <TabsContent value="launch" className="space-y-3 mt-3">
          <div className="flex flex-wrap gap-1">
            {LAUNCH_PLANS.map((p, i) => (
              <Badge
                key={p.deviceClass}
                variant={selectedPlanIdx === i ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] px-2 py-0.5"
                onClick={() => setSelectedPlanIdx(i)}
              >
                {p.deviceClass.split(' ')[0]} {p.deviceClass.split(' ')[1] ?? ''}
              </Badge>
            ))}
          </div>

          {(() => {
            const plan = LAUNCH_PLANS[selectedPlanIdx];
            return (
              <div className="space-y-3">
                <Card className="p-3 space-y-1">
                  <h3 className="text-sm font-semibold">{plan.deviceClass}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </Card>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                    Recommended launch sequence
                  </h4>
                  <div className="space-y-1.5">
                    {plan.recommendedSequence.map(step => (
                      <div key={step.order} className="flex gap-2.5 rounded-md border border-border/50 p-2.5">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {step.order}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{step.market}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{step.rationale}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                    Prerequisites (must be in place before market entry)
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {plan.prerequisites.map(p => (
                      <Badge key={p} variant="secondary" className="text-[10px] px-2 py-0.5">{p}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
