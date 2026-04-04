import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Activity, FileText, Play, Book } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useTranslation } from '@/hooks/useTranslation';

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
    id: 'genesis-guide',
    titleKey: 'help.reference.guides.genesis.title',
    descriptionKey: 'help.reference.guides.genesis.description',
    categoryKey: 'help.reference.categories.guides',
    contentKey: 'help.reference.guides.genesis.content',
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
    tags: ['genesis', 'business-case', 'investor'],
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

export function ReferenceTab() {
  const { lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const { userRole } = useAuth();

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
