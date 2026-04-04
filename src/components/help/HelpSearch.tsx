import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

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

interface HelpSearchProps {
  onSelectTopic: (topicKey: string) => void;
  onClear: () => void;
}

export function HelpSearch({ onSelectTopic, onClear }: HelpSearchProps) {
  const { lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return searchableTopics.filter(topic => 
      topic.title.toLowerCase().includes(query) ||
      topic.keywords.some(keyword => keyword.includes(query))
    );
  }, [searchQuery]);

  const handleSelect = (topicKey: string) => {
    onSelectTopic(topicKey);
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
      
      {searchResults.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-auto">
          {searchResults.map((result) => (
            <button
              key={result.key}
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors"
              onClick={() => handleSelect(result.key)}
            >
              {(() => { const t = lang(`help.topics.${result.key}`); return t !== `help.topics.${result.key}` ? t : result.title; })()}
            </button>
          ))}
        </div>
      )}
      
      {searchQuery && searchResults.length === 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg p-3">
          <p className="text-sm text-muted-foreground">{lang('help.search.noResults')}</p>
        </div>
      )}
    </div>
  );
}
