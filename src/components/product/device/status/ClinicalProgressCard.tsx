import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircularProgressRing } from '@/components/common/CircularProgressRing';
import { Users } from "lucide-react";
import { useClinicalTrials } from '@/hooks/useClinicalTrials';
import { useTranslation } from '@/hooks/useTranslation';

interface ClinicalProgressCardProps {
  productId: string;
  companyId: string;
}

export function ClinicalProgressCard({ productId, companyId }: ClinicalProgressCardProps) {
  const { lang } = useTranslation();
  const { trials, isLoading } = useClinicalTrials(productId, companyId);

  // Get the most recent/active trial
  const activeTrial = trials.find(t => t.status === 'in_progress') || trials[0];

  const enrollmentProgress = activeTrial
    ? Math.round((activeTrial.actual_enrollment / activeTrial.target_enrollment) * 100)
    : 0;

  const actualEnrollment = activeTrial?.actual_enrollment || 0;
  const targetEnrollment = activeTrial?.target_enrollment || 0;

  const getStudyPhaseLabel = (phase: string) => {
    const phaseKeyMap: Record<string, string> = {
      'protocol': 'deviceStatus.studyPhases.protocol',
      'ethics_review': 'deviceStatus.studyPhases.ethicsReview',
      'enrollment': 'deviceStatus.studyPhases.enrollment',
      'data_collection': 'deviceStatus.studyPhases.dataCollection',
      'analysis': 'deviceStatus.studyPhases.analysis',
      'reporting': 'deviceStatus.studyPhases.reporting',
      'completed': 'deviceStatus.studyPhases.completed'
    };
    return phaseKeyMap[phase] ? lang(phaseKeyMap[phase]) : phase;
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white shadow-lg animate-pulse">
        <CardContent className="p-3 flex flex-col items-center text-center space-y-1 h-[80px]" />
      </Card>
    );
  }

  if (!activeTrial) {
    return (
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white shadow-lg">
        <CardContent className="p-3 flex flex-col items-center text-center space-y-1">
          <div className="flex items-center gap-2 text-white/90 text-[10px] uppercase tracking-[0.3em]">
            <Users className="h-3 w-3" />
            <span>{lang('deviceStatus.clinicalProgress')}</span>
          </div>
          <div className="relative inline-flex items-center justify-center">
            <CircularProgressRing
              value={0}
              size={60}
              strokeWidth={5}
              color="white"
              backgroundColor="rgba(255,255,255,0.25)"
            />
            <div className="absolute text-lg font-bold">N/A</div>
          </div>
          <p className="text-[10px] text-white/80">{lang('deviceStatus.noClinicalTrials')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white shadow-lg">
      <CardContent className="p-3 flex flex-col items-center text-center space-y-1">
        <div className="flex items-center gap-2 text-white/90 text-[10px] uppercase tracking-[0.3em]">
          <Users className="h-3 w-3" />
          <span>{lang('deviceStatus.clinicalProgress')}</span>
        </div>
        <div className="relative inline-flex items-center justify-center">
          <CircularProgressRing
            value={Math.min(enrollmentProgress, 100)}
            size={60}
            strokeWidth={5}
            color="white"
            backgroundColor="rgba(255,255,255,0.25)"
          />
          <div className="absolute text-lg font-bold">
            {enrollmentProgress}%
          </div>
        </div>
        <Badge className="bg-white/20 text-white border-white/30 text-[9px]">
          {getStudyPhaseLabel(activeTrial.study_phase)}
        </Badge>
        <p className="text-[10px] text-white/80">
          {lang('deviceStatus.patients').replace('{{actual}}', String(actualEnrollment)).replace('{{target}}', String(targetEnrollment))}
        </p>
      </CardContent>
    </Card>
  );
}
