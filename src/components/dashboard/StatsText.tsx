
interface StatsTextProps {
  stats: {
    total: number;
    atRisk: number;
    needsAttention: number;
    onTrack: number;
    overdueDocuments: number;
  };
}

export function StatsText({ stats }: StatsTextProps) {
  const parts = [`${stats.total} Products`];
  
  if (stats.onTrack > 0) {
    parts.push(`${stats.onTrack} On Track`);
  }
  
  if (stats.atRisk > 0) {
    parts.push(`${stats.atRisk} At Risk`);
  }
  
  if (stats.needsAttention > 0) {
    parts.push(`${stats.needsAttention} Needs Attention`);
  }
  
  if (stats.overdueDocuments > 0) {
    parts.push(`${stats.overdueDocuments} Overdue Documents`);
  }

  return (
    <p className="text-sm text-muted-foreground">
      {parts.join(' · ')}
    </p>
  );
}
