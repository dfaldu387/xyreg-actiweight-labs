
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    total: number;
    atRisk: number;
    needsAttention: number;
    onTrack: number;
    overdueDocuments: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-max lg:min-w-0">
        <Card className="flex-shrink-0">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 flex-shrink-0">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">At Risk</p>
            <p className="text-3xl font-bold">{stats.atRisk}</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/10 flex-shrink-0">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Needs Attention</p>
            <p className="text-3xl font-bold">{stats.needsAttention}</p>
          </CardContent>
        </Card>
        <Card className="bg-success/10 flex-shrink-0">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">On Track</p>
            <p className="text-3xl font-bold">{stats.onTrack}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 flex-shrink-0">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Overdue Documents</p>
            <p className="text-3xl font-bold">{stats.overdueDocuments}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
