import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Circle, ArrowRight, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  label: string;
  complete: boolean;
  route: string;
}

interface InvestorShareQuickNavProps {
  readinessChecklist: ChecklistItem[];
  overallProgress: number;
}

export function InvestorShareQuickNav({ readinessChecklist, overallProgress }: InvestorShareQuickNavProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Determine context from returnTo parameter
  const returnTo = searchParams.get('returnTo');
  const isVentureBlueprint = returnTo === 'venture-blueprint';
  
  const title = isVentureBlueprint ? 'Venture Blueprint Essentials' : 'XyReg Genesis Essentials';

  const handleNavigate = (route: string) => {
    const returnParam = returnTo || 'investor-share';
    navigate(`${route}${route.includes('?') ? '&' : '?'}returnTo=${returnParam}`);
  };

  return (
    <div className="sticky top-6 w-64 hidden lg:block">
      <div className="bg-card rounded-xl border shadow-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Investor Readiness Checklist</p>
        </div>

        {/* Navigation Items */}
        <div className="p-2">
          {readinessChecklist.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavigate(item.route)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors group",
                item.complete 
                  ? "hover:bg-emerald-500/10" 
                  : "hover:bg-primary/10"
              )}
            >
              {item.complete ? (
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={cn(
                "text-sm flex-1 truncate",
                item.complete ? "text-muted-foreground" : "font-medium"
              )}>
                {item.label}
              </span>
              <ArrowRight className={cn(
                "h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                item.complete ? "text-emerald-500" : "text-primary"
              )} />
            </button>
          ))}
        </div>

        {/* Progress Footer */}
        <div className="px-4 py-3 border-t bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Overall Progress</span>
            <span className={cn(
              "text-xs font-semibold",
              overallProgress === 100 ? "text-emerald-500" : "text-primary"
            )}>
              {overallProgress}%
            </span>
          </div>
          <Progress 
            value={overallProgress} 
            className={cn(
              "h-2",
              overallProgress === 100 && "[&>div]:bg-emerald-500"
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {overallProgress === 100 
              ? '✓ Ready to share with investors' 
              : `${readinessChecklist.filter(i => !i.complete).length} sections remaining`
            }
          </p>
        </div>

        {/* Upgrade CTA */}
        <div className="px-4 py-3 border-t border-dashed border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-1.5">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Unlock Advanced Analysis</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Competitive Landscape, Regulatory Timeline, rNPV & more
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => {
              const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
              navigate(`/pricing?returnTo=${returnUrl}`);
            }}
          >
            Upgrade →
          </Button>
        </div>
      </div>
    </div>
  );
}
