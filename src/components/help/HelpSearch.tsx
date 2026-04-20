import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { regulatoryGlossary, type GlossaryEntry } from '@/data/regulatoryGlossary';

interface SearchableContent {
  key: string;
  title: string;
  keywords: string[];
}

// Searchable index of help topics — only retained specialised topics + platform guide
const searchableTopics: SearchableContent[] = [
  { key: 'platform-guide', title: 'XyReg Platform Guide', keywords: ['platform', 'walkthrough', 'guide', 'device', 'definition', 'supplier', 'audit', 'compliance', 'setup', 'step-by-step', 'tutorial', 'getting started', 'purpose', 'classification', 'document', 'risk', 'capa', 'change control'] },
  { key: 'genesis-guide', title: 'Genesis Step-by-Step Guide', keywords: ['genesis', 'business-case', 'investor', 'checklist', 'getting-started'] },
  { key: 'smart-cost-overview', title: 'Smart Cost Intelligence', keywords: ['cost', 'estimation', 'market', 'ai', 'intelligence', 'scenario'] },
  { key: 'device-class-multipliers', title: 'Device Class Cost Multipliers', keywords: ['device-class', 'multipliers', 'classification', 'regulatory'] },
  { key: 'cost-scenario-planning', title: 'Cost Scenario Planning', keywords: ['scenarios', 'planning', 'risk-management', 'strategy'] },
  { key: 'currency-inflation-modeling', title: 'Currency & Inflation Modeling', keywords: ['currency', 'inflation', 'financial-modeling', 'economics'] },
  { key: 'business-analysis', title: 'Business Analysis & NPV', keywords: ['business-analysis', 'NPV', 'financial-modeling', 'commercial-planning'] },
  { key: 'billing-subscriptions', title: 'Billing & Subscriptions', keywords: ['billing', 'subscriptions', 'plans', 'financial-management'] },
  { key: 'xyreg-architecture', title: 'Xyreg Architecture', keywords: ['architecture', 'helix', 'compliance', 'regulatory', 'strategy', 'memo', 'digital thread', 'state of control', 'v-model', 'traceability'] },
];

const sourceBadgeColor: Record<string, string> = {
  'MDR / IVDR': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'FDA / 21 CFR': 'bg-red-500/10 text-red-700 dark:text-red-400',
  'ISO 13485 / QMS': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  'ISO 14971 / Risk Management': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  'IEC 62304 / Software': 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  'IEC 62366 / Usability': 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
  'EHDS / PPWR / Sustainability': 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  'General Regulatory': 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

interface HelpSearchProps {
  onSelectTopic: (topicKey: string) => void;
  onClear: () => void;
  onNavigateToGlossary?: (searchTerm: string) => void;
}

export function HelpSearch({ onSelectTopic, onClear, onNavigateToGlossary }: HelpSearchProps) {
  const { lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const topicResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return searchableTopics.filter(topic => 
      topic.title.toLowerCase().includes(query) ||
      topic.keywords.some(keyword => keyword.includes(query))
    );
  }, [searchQuery]);

  const glossaryResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return regulatoryGlossary.filter(entry =>
      entry.term.toLowerCase().includes(query) ||
      entry.definition.toLowerCase().includes(query) ||
      (entry.aliases?.some(a => a.toLowerCase().includes(query)))
    ).slice(0, 8); // Limit to 8 glossary results in dropdown
  }, [searchQuery]);

  const hasResults = topicResults.length > 0 || glossaryResults.length > 0;

  const handleSelectTopic = (topicKey: string) => {
    onSelectTopic(topicKey);
    setSearchQuery('');
  };

  const handleSelectGlossary = (entry: GlossaryEntry) => {
    if (onNavigateToGlossary) {
      onNavigateToGlossary(entry.term);
    }
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={lang('help.search.placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setSearchQuery('');
              onClear();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {searchQuery.trim() && hasResults && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-80 overflow-auto">
          {/* Help Topics */}
          {topicResults.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50">
                Help Topics
              </div>
              {topicResults.map((result) => (
                <button
                  key={result.key}
                  className="w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors"
                  onClick={() => handleSelectTopic(result.key)}
                >
                  {(() => { const t = lang(`help.topics.${result.key}`); return t !== `help.topics.${result.key}` ? t : result.title; })()}
                </button>
              ))}
            </div>
          )}

          {/* Glossary Terms */}
          {glossaryResults.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Glossary
              </div>
              {glossaryResults.map((entry) => (
                <button
                  key={entry.term + entry.category}
                  className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                  onClick={() => handleSelectGlossary(entry)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{entry.term}</span>
                    <span className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${sourceBadgeColor[entry.category] || 'bg-muted text-muted-foreground'}`}>
                      {entry.category.split(' / ')[0]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{entry.definition}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {searchQuery && !hasResults && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg p-3">
          <p className="text-sm text-muted-foreground">{lang('help.search.noResults')}</p>
        </div>
      )}
    </div>
  );
}
