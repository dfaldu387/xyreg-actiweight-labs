import { PhaseData, CompanyVentureBlueprintData } from '@/types/blueprint';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, TrendingUp, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/context/LanguageContext';

interface BlueprintDashboardProps {
  phases: PhaseData[];
  data: CompanyVentureBlueprintData;
  onPhaseClick: (phaseId: number) => void;
}

export function BlueprintDashboard({ phases, data, onPhaseClick }: BlueprintDashboardProps) {
  const { lang } = useTranslation();
  const { language } = useLanguage();
  const totalActivities = phases.reduce((sum, phase) => sum + phase.activities.length, 0);
  const completedCount = data.completedActivities.length;
  const completionPercent = Math.round((completedCount / totalActivities) * 100);

  // Get date-fns locale based on current language
  const dateLocale = language === 'de' ? { locale: de } : undefined;

  // Calculate phase-specific completion
  const phaseProgress = phases.map(phase => {
    const phaseActivityIds = phase.activities.map(a => a.id);
    const phaseCompleted = phaseActivityIds.filter(id => data.completedActivities.includes(id)).length;
    const phaseTotal = phaseActivityIds.length;
    const phasePercent = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
    return {
      ...phase,
      completed: phaseCompleted,
      total: phaseTotal,
      percent: phasePercent
    };
  });

  // Get completion color
  const getCompletionColor = (percent: number) => {
    if (percent >= 67) return 'text-success';
    if (percent >= 34) return 'text-warning';
    return 'text-destructive';
  };

  const getCompletionBg = (percent: number) => {
    if (percent >= 67) return 'bg-success/10 border-success/20';
    if (percent >= 34) return 'bg-warning/10 border-warning/20';
    return 'bg-destructive/10 border-destructive/20';
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Overall Progress Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {lang('commercial.blueprint.progressTitle')}
          </CardTitle>
          <CardDescription>
            {lang('commercial.blueprint.progressSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Progress Indicator */}
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{lang('commercial.blueprint.overallCompletion')}</span>
                <span className={`font-bold ${getCompletionColor(completionPercent)}`}>
                  {completionPercent}%
                </span>
              </div>
              <Progress value={completionPercent} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {lang('commercial.blueprint.activitiesCompleted').replace('{{completed}}', String(completedCount)).replace('{{total}}', String(totalActivities))}
              </p>
            </div>
            
            {/* Circular indicator */}
            <div className="flex flex-col items-center justify-center">
              <div className={`relative w-24 h-24 rounded-full border-8 ${
                completionPercent >= 67 ? 'border-success' : 
                completionPercent >= 34 ? 'border-warning' : 
                'border-destructive'
              } flex items-center justify-center bg-background`}>
                <span className="text-2xl font-bold">{completionPercent}%</span>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {data.lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{lang('commercial.blueprint.lastUpdated')} {formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true, ...dateLocale })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase Completion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phaseProgress.map((phase) => (
          <Card 
            key={phase.id}
            className={`cursor-pointer transition-all hover:shadow-md border ${getCompletionBg(phase.percent)}`}
            onClick={() => onPhaseClick(phase.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium line-clamp-2">
                    {lang('commercial.blueprint.phase')} {phase.id}: {phase.title}
                  </CardTitle>
                </div>
                {phase.percent === 100 && (
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 ml-2" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={phase.percent} className="h-2" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">
                  {phase.completed}/{phase.total} {lang('commercial.blueprint.activities')}
                </span>
                <span className={`font-bold ${getCompletionColor(phase.percent)}`}>
                  {phase.percent}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{lang('commercial.blueprint.totalActivities')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{totalActivities}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{lang('commercial.blueprint.completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold text-success">{completedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{lang('commercial.blueprint.remaining')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalActivities - completedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
