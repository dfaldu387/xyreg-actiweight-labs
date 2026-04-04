import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ExternalLink, Gauge, Flame, Globe } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import type { ApprovedMonitorAccess } from '@/hooks/useInvestorMonitorAccess';

interface PortfolioTableViewProps {
  data: ApprovedMonitorAccess[];
}

export function PortfolioTableView({ data }: PortfolioTableViewProps) {
  const navigate = useNavigate();

  // Mock KPI data
  const getViability = () => Math.floor(Math.random() * 30) + 60;
  const getRunway = () => Math.floor(Math.random() * 18) + 6;

  const getRunwayColor = (months: number) => {
    if (months >= 12) return 'text-emerald-600 bg-emerald-500/10';
    if (months >= 6) return 'text-amber-600 bg-amber-500/10';
    return 'text-red-600 bg-red-500/10';
  };

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[250px]">Company</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="w-[80px]">Class</TableHead>
            <TableHead className="w-[120px]">Phase</TableHead>
            <TableHead className="w-[120px]">
              <div className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" />
                Viability
              </div>
            </TableHead>
            <TableHead className="w-[100px]">
              <div className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" />
                Runway
              </div>
            </TableHead>
            <TableHead className="w-[100px]">
              <div className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Markets
              </div>
            </TableHead>
            <TableHead className="w-[130px]">Updated</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((access) => {
            const company = access.companies;
            const product = access.products;
            const shareSettings = access.company_investor_share_settings;
            const viability = getViability();
            const runway = getRunway();

            return (
              <TableRow 
                key={access.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/investor/monitor/${shareSettings.public_slug}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      {company.logo_url ? (
                        <AvatarImage src={company.logo_url} alt={company.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        <Building2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{company.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product?.name || '-'}
                </TableCell>
                <TableCell>
                  {product?.class ? (
                    <Badge variant="secondary" className="text-xs">
                      {product.class}
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {product?.current_lifecycle_phase || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  {(shareSettings.show_viability_score ?? true) ? (
                    <div className="flex items-center gap-2">
                      <Progress value={viability} className="w-12 h-1.5" />
                      <span className="text-xs font-medium">{viability}%</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {(shareSettings.show_burn_rate ?? false) ? (
                    <Badge variant="secondary" className={`text-xs ${getRunwayColor(runway)}`}>
                      {runway} mo
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {(shareSettings.show_regulatory_status_map ?? true) ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-emerald-600">EU✓</span>
                      <span className="text-amber-600">US⏳</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(shareSettings.updated_at), { addSuffix: true })}
                  </span>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/investor/monitor/${shareSettings.public_slug}`);
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
