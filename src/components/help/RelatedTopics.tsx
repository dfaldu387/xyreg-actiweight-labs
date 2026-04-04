import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface RelatedTopic {
  key: string;
  title: string;
}

// Define related topics for each help topic
const relatedTopicsMap: Record<string, RelatedTopic[]> = {
  'viability-scorecard': [
    { key: 'venture-blueprint', title: 'Venture Blueprint' },
    { key: 'market-sizing', title: 'Market Sizing' },
    { key: 'regulatory', title: 'Regulatory Strategy' },
  ],
  'venture-blueprint': [
    { key: 'viability-scorecard', title: 'Viability Scorecard' },
    { key: 'business-canvas', title: 'Business Canvas' },
    { key: 'readiness-gates', title: 'Readiness Gates' },
  ],
  'business-canvas': [
    { key: 'venture-blueprint', title: 'Venture Blueprint' },
    { key: 'market-sizing', title: 'Market Sizing' },
    { key: 'team-profile', title: 'Team Profile' },
  ],
  'team-profile': [
    { key: 'business-canvas', title: 'Business Canvas' },
    { key: 'company-settings', title: 'Company Settings' },
  ],
  'market-sizing': [
    { key: 'viability-scorecard', title: 'Viability Scorecard' },
    { key: 'competition', title: 'Competition Analysis' },
    { key: 'reimbursement', title: 'Reimbursement Strategy' },
  ],
  'competition': [
    { key: 'market-sizing', title: 'Market Sizing' },
    { key: 'regulatory', title: 'Regulatory Strategy' },
  ],
  'clinical-trials': [
    { key: 'regulatory', title: 'Regulatory Strategy' },
    { key: 'milestones', title: 'Milestones' },
    { key: 'documents', title: 'Documents' },
  ],
  'readiness-gates': [
    { key: 'milestones', title: 'Milestones' },
    { key: 'venture-blueprint', title: 'Venture Blueprint' },
  ],
  'udi-management': [
    { key: 'eudamed', title: 'EUDAMED Registration' },
    { key: 'regulatory', title: 'Regulatory Strategy' },
    { key: 'device-definition', title: 'Device Definition' },
  ],
  'eudamed': [
    { key: 'udi-management', title: 'UDI Management' },
    { key: 'regulatory', title: 'Regulatory Strategy' },
    { key: 'documents', title: 'Documents' },
  ],
  'milestones': [
    { key: 'readiness-gates', title: 'Readiness Gates' },
    { key: 'documents', title: 'Documents' },
  ],
  'documents': [
    { key: 'qms', title: 'Quality Management' },
    { key: 'milestones', title: 'Milestones' },
    { key: 'regulatory', title: 'Regulatory Strategy' },
  ],
  'regulatory': [
    { key: 'udi-management', title: 'UDI Management' },
    { key: 'clinical-trials', title: 'Clinical Trials' },
    { key: 'documents', title: 'Documents' },
  ],
  'device-definition': [
    { key: 'udi-management', title: 'UDI Management' },
    { key: 'regulatory', title: 'Regulatory Strategy' },
  ],
  'qms': [
    { key: 'documents', title: 'Documents' },
    { key: 'company-settings', title: 'Company Settings' },
  ],
  'company-settings': [
    { key: 'qms', title: 'Quality Management' },
    { key: 'team-profile', title: 'Team Profile' },
  ],
  'reimbursement': [
    { key: 'market-sizing', title: 'Market Sizing' },
    { key: 'viability-scorecard', title: 'Viability Scorecard' },
  ],
};

interface RelatedTopicsProps {
  currentTopic: string;
  onNavigate: (topicKey: string) => void;
}

export function RelatedTopics({ currentTopic, onNavigate }: RelatedTopicsProps) {
  const { lang } = useTranslation();
  const relatedTopics = relatedTopicsMap[currentTopic] || [];

  if (relatedTopics.length === 0) return null;

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">{lang('help.relatedTopics')}</h4>
      <div className="flex flex-wrap gap-2">
        {relatedTopics.map((topic) => (
          <Button
            key={topic.key}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onNavigate(topic.key)}
          >
            {lang(`help.topics.${topic.key}`) || topic.title}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        ))}
      </div>
    </div>
  );
}
