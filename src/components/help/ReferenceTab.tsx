import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Activity, FileText, Play, Book, BookOpen, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useTranslation } from '@/hooks/useTranslation';
import { regulatoryGlossary, GLOSSARY_CATEGORIES, type GlossaryEntry } from '@/data/regulatoryGlossary';
import { RegulatoryAtlasView } from './RegulatoryAtlasView';
import { GLOBAL_MARKETS } from './moduleContent/regulatoryAtlasContent';

interface HelpTopic {
  id: string;
  titleKey: string;
  descriptionKey: string;
  categoryKey: string;
  contentKey: string;
  userRoles: string[];
  tags: string[];
}

const helpTopics: HelpTopic[] = [
  {
    id: 'smart-cost-overview',
    titleKey: 'help.reference.smartCost.overview.title',
    descriptionKey: 'help.reference.smartCost.overview.description',
    categoryKey: 'help.reference.categories.smartCost',
    contentKey: 'help.reference.smartCost.overview.content',
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    tags: ['cost-intelligence', 'ai', 'estimation'],
  },
  {
    id: 'device-class-multipliers',
    titleKey: 'help.reference.smartCost.multipliers.title',
    descriptionKey: 'help.reference.smartCost.multipliers.description',
    categoryKey: 'help.reference.categories.smartCost',
    contentKey: 'help.reference.smartCost.multipliers.content',
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    tags: ['device-class', 'multipliers'],
  },
  {
    id: 'business-analysis',
    titleKey: 'help.reference.business.analysis.title',
    descriptionKey: 'help.reference.business.analysis.description',
    categoryKey: 'help.reference.categories.business',
    contentKey: 'help.reference.business.analysis.content',
    userRoles: ['admin', 'company_admin', 'consultant'],
    tags: ['business-analysis', 'NPV', 'financial-modeling'],
  },
  {
    id: 'billing-subscriptions',
    titleKey: 'help.reference.business.billing.title',
    descriptionKey: 'help.reference.business.billing.description',
    categoryKey: 'help.reference.categories.business',
    contentKey: 'help.reference.business.billing.content',
    userRoles: ['admin', 'company_admin'],
    tags: ['billing', 'subscriptions'],
  },
];

const categoryIconMap: Record<string, React.ReactNode> = {
  'help.reference.categories.guides': <Play className="h-4 w-4" />,
  'help.reference.categories.smartCost': <Activity className="h-4 w-4" />,
  'help.reference.categories.business': <FileText className="h-4 w-4" />,
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const sourceBadgeColor: Record<string, string> = {
  'MDR / IVDR': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'FDA / 21 CFR': 'bg-red-500/10 text-red-700 dark:text-red-400',
  'ISO 13485 / QMS': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  'ISO 14971 / Risk Management': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  'IEC 62304 / Software': 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  'IEC 62366 / Usability': 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
  'EHDS / PPWR / Sustainability': 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  'MDCG Guidance': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  'Harmonised Standards': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  'General Regulatory': 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

function GlossaryView({ onBack, initialSearch }: { onBack: () => void; initialSearch?: string }) {
  const [glossarySearch, setGlossarySearch] = useState(initialSearch || '');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const highlightRef = React.useRef<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Sync initialSearch when it changes (e.g. clicking a glossary result from search)
  React.useEffect(() => {
    if (initialSearch) {
      setGlossarySearch(initialSearch);
      highlightRef.current = initialSearch;
    }
  }, [initialSearch]);

  const filtered = useMemo(() => {
    let entries = regulatoryGlossary;
    if (activeCategory) {
      entries = entries.filter(e => e.category === activeCategory);
    }
    if (glossarySearch.trim()) {
      const q = glossarySearch.toLowerCase();
      entries = entries.filter(e =>
        e.term.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        (e.aliases?.some(a => a.toLowerCase().includes(q)))
      );
    }
    if (glossarySearch.trim()) {
      const q = glossarySearch.toLowerCase();
      const tier = (e: typeof entries[0]) => {
        const name = e.term.toLowerCase();
        if (name.startsWith(q)) return 0;
        if (name.includes(q)) return 1;
        if (e.aliases?.some(a => a.toLowerCase().includes(q))) return 2;
        return 3;
      };
      return entries.sort((a, b) => tier(a) - tier(b) || a.term.localeCompare(b.term));
    }
    return entries.sort((a, b) => a.term.localeCompare(b.term));
  }, [glossarySearch, activeCategory]);

  const letterGroups = useMemo(() => {
    const groups: Record<string, GlossaryEntry[]> = {};
    for (const entry of filtered) {
      const letter = entry.term[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(entry);
    }
    return groups;
  }, [filtered]);

  const availableLetters = new Set(Object.keys(letterGroups));

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="space-y-1">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Regulatory Nomenclature
        </h2>
        <p className="text-xs text-muted-foreground">
          {regulatoryGlossary.length} terms from MDR, IVDR, FDA, ISO, IEC, EHDS, PPWR and more
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search terms, definitions, or sources..."
          value={glossarySearch}
          onChange={(e) => setGlossarySearch(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={activeCategory === null ? 'default' : 'outline'}
          className="cursor-pointer text-[10px] px-2 py-0.5"
          onClick={() => setActiveCategory(null)}
        >
          All
        </Badge>
        {GLOSSARY_CATEGORIES.map(cat => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            className="cursor-pointer text-[10px] px-2 py-0.5"
            onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
          >
            {cat.split(' / ')[0]}
          </Badge>
        ))}
      </div>

      {/* A-Z nav */}
      {!glossarySearch.trim() && (
        <div className="flex flex-wrap gap-0.5">
          {ALPHABET.map(letter => (
            <button
              key={letter}
              disabled={!availableLetters.has(letter)}
              onClick={() => {
                document.getElementById(`glossary-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`w-6 h-6 text-[10px] font-medium rounded ${
                availableLetters.has(letter)
                  ? 'text-primary hover:bg-accent cursor-pointer'
                  : 'text-muted-foreground/30 cursor-default'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {glossarySearch.trim() && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Terms */}
      <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {glossarySearch.trim() ? (
          /* Flat relevance-ranked list when searching */
          <div className="space-y-1.5">
            {filtered.map(entry => (
              <div key={entry.term + entry.category} className="rounded-md border border-border/40 p-2.5 hover:bg-accent/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight">{entry.term}</p>
                  <span className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${sourceBadgeColor[entry.category] || 'bg-muted text-muted-foreground'}`}>
                    {entry.source}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{entry.definition}</p>
                {entry.aliases && entry.aliases.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Also: {entry.aliases.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Letter-grouped alphabetical display when not searching */
          Object.entries(letterGroups).sort(([a], [b]) => a.localeCompare(b)).map(([letter, entries]) => (
            <div key={letter} id={`glossary-${letter}`}>
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-1">
                <span className="text-xs font-bold text-primary">{letter}</span>
                <div className="border-b border-border/50 mt-0.5" />
              </div>
              <div className="space-y-1.5 mt-1.5">
                {entries.map(entry => (
                  <div key={entry.term + entry.category} className="rounded-md border border-border/40 p-2.5 hover:bg-accent/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{entry.term}</p>
                      <span className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${sourceBadgeColor[entry.category] || 'bg-muted text-muted-foreground'}`}>
                        {entry.source}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{entry.definition}</p>
                    {entry.aliases && entry.aliases.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        Also: {entry.aliases.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No terms found matching your search.</p>
        )}
      </div>
    </div>
  );
}

interface ReferenceTabProps {
  initialGlossarySearch?: string | null;
  onGlossaryOpened?: () => void;
}

export function ReferenceTab({ initialGlossarySearch, onGlossaryOpened }: ReferenceTabProps = {}) {
  const { lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showAtlas, setShowAtlas] = useState(false);
  const [glossarySearchOverride, setGlossarySearchOverride] = useState<string | undefined>(undefined);
  const { userRole } = useAuth();

  // Auto-open glossary when navigated from search
  React.useEffect(() => {
    if (initialGlossarySearch) {
      setGlossarySearchOverride(initialGlossarySearch);
      setShowGlossary(true);
      onGlossaryOpened?.();
    }
  }, [initialGlossarySearch, onGlossaryOpened]);

  const filtered = helpTopics.filter(topic => {
    if (!topic.userRoles.includes(userRole || 'viewer')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return lang(topic.titleKey).toLowerCase().includes(q) ||
             lang(topic.descriptionKey).toLowerCase().includes(q) ||
             topic.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const categories = Array.from(new Set(filtered.map(t => t.categoryKey)));

  if (showGlossary) {
    return <GlossaryView onBack={() => { setShowGlossary(false); setGlossarySearchOverride(undefined); }} initialSearch={glossarySearchOverride} />;
  }

  if (showAtlas) {
    return <RegulatoryAtlasView onBack={() => setShowAtlas(false)} />;
  }

  if (selectedTopic) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTopic(null)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> {lang('common.back')}
        </Button>
        <MarkdownRenderer content={lang(selectedTopic.contentKey)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={lang('help.reference.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Regulatory Atlas card — always at top */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
          <Globe className="h-4 w-4" /> Regulatory Atlas
        </h3>
        <Card
          className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-primary/20 bg-primary/5"
          onClick={() => setShowAtlas(true)}
        >
          <p className="text-sm font-medium flex items-center gap-2">
            EU MDR/IVDR & Global Markets
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{GLOBAL_MARKETS.length} markets</Badge>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            EU MDR/IVDR deep-dive, MDCG guidance, 14 global authorities, digital thread (IMDRF/MDSAP/UDI), and class-based launch checklists
          </p>
        </Card>
      </div>

      {/* Glossary card */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
          <BookOpen className="h-4 w-4" /> Nomenclature
        </h3>
        <Card
          className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-primary/20 bg-primary/5"
          onClick={() => setShowGlossary(true)}
        >
          <p className="text-sm font-medium flex items-center gap-2">
            Regulatory Glossary
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{regulatoryGlossary.length} terms</Badge>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Searchable nomenclature from MDR, FDA, ISO 13485, ISO 14971, IEC 62304, IEC 62366, EHDS, PPWR and more
          </p>
        </Card>
      </div>

      {categories.map(catKey => (
        <div key={catKey} className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
            {categoryIconMap[catKey] || <Book className="h-4 w-4" />} {lang(catKey)}
          </h3>
          {filtered.filter(t => t.categoryKey === catKey).map(topic => (
            <Card
              key={topic.id}
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/50"
              onClick={() => setSelectedTopic(topic)}
            >
              <p className="text-sm font-medium">{lang(topic.titleKey)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{lang(topic.descriptionKey)}</p>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
