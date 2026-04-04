import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  TrendingUp,
  Layers,
  ArrowUpRight,
  Sparkles,
  Clock,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import type { AggregatedStats, PatternDetectionResult, EscalationAlert } from '@/services/capaAggregationService';
import type { CAPARecord } from '@/types/capa';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPAAggregationPanelProps {
  stats: AggregatedStats | undefined;
  patterns: PatternDetectionResult | undefined;
  escalatedCAPAs: CAPARecord[] | undefined;
  openCAPAs?: CAPARecord[];
  isLoading: boolean;
  onCreateCompanyCAPAForPattern?: (pattern: { category: string; capaIds: string[] }) => void;
}

const alertSeverityStyles = {
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    text: 'text-amber-700',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-700',
  },
};

export function CAPAAggregationPanel({
  stats,
  patterns,
  escalatedCAPAs,
  openCAPAs,
  isLoading,
  onCreateCompanyCAPAForPattern,
}: CAPAAggregationPanelProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();

  const handleCAPAClick = (capaId: string) => {
    // For mock CAPAs, navigate to company CAPA list instead
    if (capaId.startsWith('mock-')) {
      // Navigate to company CAPA page - we'd need company info here
      console.log('Navigate to CAPA:', capaId);
      return;
    }
    navigate(`/app/capa/${capaId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Aggregated Stats Section */}
      {stats && stats.totalOpen > 0 && (
        <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted border border-border">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{lang('capa.aggregatedDeviceCapas')}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center p-2 bg-background/60 rounded border border-border">
              <p className="text-2xl font-bold text-foreground">{stats.totalOpen}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{lang('capa.totalOpen')}</p>
            </div>
            <div className="text-center p-2 bg-background/60 rounded border border-border">
              <p className="text-2xl font-bold text-muted-foreground">
                {stats.devicesWithCAPAs} <span className="text-sm font-normal">/ {stats.totalDevices}</span>
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{lang('capa.devicesAffected')}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Critical: {stats.byPriority.critical}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">High: {stats.byPriority.high}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Medium: {stats.byPriority.medium}</span>
            </div>
          </div>

          {stats.overdue > 0 && (
            <div className="mt-3 flex items-center gap-2 p-2 bg-destructive/10 rounded border border-destructive/20">
              <Clock className="h-3 w-3 text-destructive" />
              <span className="text-xs text-destructive font-medium">{stats.overdue} {lang('capa.overdueCapas')}</span>
            </div>
          )}
        </div>
      )}

      {/* Open CAPAs List - Clickable */}
      {openCAPAs && openCAPAs.length > 0 && (
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {lang('capa.deviceCapas')} ({openCAPAs.length})
            </span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {openCAPAs.slice(0, 5).map((capa) => (
              <div
                key={capa.id}
                className="flex items-center justify-between p-2 bg-background/60 rounded border border-border cursor-pointer hover:bg-background hover:border-primary/30 transition-colors group"
                onClick={() => handleCAPAClick(capa.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-medium text-foreground truncate">
                      {capa.capa_id}
                    </p>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {capa.problem_description?.slice(0, 40)}...
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] ml-2">
                  {capa.status}
                </Badge>
              </div>
            ))}
          </div>

          {openCAPAs.length > 5 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              +{openCAPAs.length - 5} {lang('capa.more')}
            </p>
          )}
        </div>
      )}

      {/* Pattern Detection Alerts */}
      {patterns && patterns.alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-foreground">{lang('capa.autoDetectedPatterns')}</span>
            <Badge variant="secondary" className="text-[10px]">
              {patterns.alerts.length}
            </Badge>
          </div>

          {patterns.alerts.slice(0, 3).map((alert, idx) => (
            <AlertCard
              key={idx}
              alert={alert}
              onCAPAClick={handleCAPAClick}
              onCreateCompanyCAPAForPattern={onCreateCompanyCAPAForPattern}
            />
          ))}

          {patterns.alerts.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{patterns.alerts.length - 3} {lang('capa.moreAlerts')}
            </p>
          )}
        </div>
      )}

      {/* Escalated from Devices */}
      {escalatedCAPAs && escalatedCAPAs.length > 0 && (
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">
              {lang('capa.manuallyEscalated')} {escalatedCAPAs.length}
            </span>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {escalatedCAPAs.slice(0, 5).map((capa) => (
              <div
                key={capa.id}
                className="flex items-center justify-between p-2 bg-white/60 rounded border border-purple-200 cursor-pointer hover:bg-white transition-colors group"
                onClick={() => handleCAPAClick(capa.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-medium text-purple-800 truncate">
                      {capa.capa_id}
                    </p>
                    <ExternalLink className="h-3 w-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-purple-600 truncate">
                    {capa.problem_description?.slice(0, 40)}...
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-600 ml-2">
                  {capa.status}
                </Badge>
              </div>
            ))}
          </div>

          {escalatedCAPAs.length > 5 && (
            <p className="text-xs text-purple-600 text-center mt-2">
              +{escalatedCAPAs.length - 5} {lang('capa.more')}
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {(!stats || stats.totalOpen === 0) && (!patterns || patterns.alerts.length === 0) && (!escalatedCAPAs || escalatedCAPAs.length === 0) && (!openCAPAs || openCAPAs.length === 0) && (
        <div className="p-6 text-center rounded-lg bg-muted/30 border border-border">
          <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{lang('capa.noDeviceCapas')}</p>
          <p className="text-xs text-muted-foreground mt-1">{lang('capa.deviceCapasDescription')}</p>
        </div>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  onCAPAClick,
  onCreateCompanyCAPAForPattern
}: {
  alert: EscalationAlert;
  onCAPAClick: (id: string) => void;
  onCreateCompanyCAPAForPattern?: (pattern: { category: string; capaIds: string[] }) => void;
}) {
  const styles = alertSeverityStyles[alert.severity];
  const Icon = alert.severity === 'critical' ? AlertTriangle : TrendingUp;

  return (
    <div className={cn('p-3 rounded-lg border', styles.bg, styles.border)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', styles.icon)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', styles.text)}>{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>

          {alert.affectedCAPAs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {alert.affectedCAPAs.slice(0, 3).map((capa) => (
                <Badge
                  key={capa.id}
                  variant="outline"
                  className="text-[10px] cursor-pointer hover:bg-background"
                  onClick={() => onCAPAClick(capa.id)}
                >
                  {capa.capaId}
                  {capa.deviceName && <span className="text-muted-foreground ml-1">({capa.deviceName})</span>}
                </Badge>
              ))}
              {alert.affectedCAPAs.length > 3 && (
                <Badge variant="outline" className="text-[10px]">
                  +{alert.affectedCAPAs.length - 3}
                </Badge>
              )}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground mt-2 italic">
            {alert.recommendedAction}
          </p>
        </div>
      </div>
    </div>
  );
}
