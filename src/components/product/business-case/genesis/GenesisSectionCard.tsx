import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight } from 'lucide-react';
import type { GenesisSectionConfig } from '@/config/genesisSections';
import { cn } from '@/lib/utils';

interface GenesisSectionCardProps {
  section: GenesisSectionConfig;
  completedCount: number;
}

/**
 * One row in the Genesis section list — modeled on the Gap Analysis section
 * card (image 4): number circle, title, requirement, progress %, "Individual"
 * style badge, with chevron to drill into the detail view.
 */
export function GenesisSectionCard({
  section,
  completedCount,
}: GenesisSectionCardProps) {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const total = section.subSteps.length;
  const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  const Icon = section.icon;

  const handleOpen = () => {
    const next = new URLSearchParams(searchParams);
    next.set('genesisSection', section.id);
    next.delete('genesisSubstep');
    navigate(
      `/app/product/${productId}/business-case?${next.toString()}`,
    );
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      className={cn(
        'group flex items-center gap-4 p-4 cursor-pointer transition-colors',
        'hover:border-primary/50 hover:bg-muted/30',
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
        {section.number.replace('§', '')}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <h3 className="font-semibold truncate">{section.title}</h3>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{total}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {section.tagline}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-xs font-medium tabular-nums text-muted-foreground w-10 text-right">
            {pct}%
          </span>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Card>
  );
}