import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Users, FileOutput } from 'lucide-react';
import { LivePulseInputs } from './LivePulseInputs';
import { MeetingEngine } from './MeetingEngine';
import { ReviewOutputsPlaceholder } from './ReviewOutputsPlaceholder';
import { useTranslation } from '@/hooks/useTranslation';

interface ManagementReviewDashboardProps {
  companyId: string | undefined;
  companyName: string;
}

export function ManagementReviewDashboard({ companyId, companyName }: ManagementReviewDashboardProps) {
  const { lang } = useTranslation();

  return (
    <Tabs defaultValue="live-pulse" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="live-pulse" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {lang('managementReview.livePulseInputs')}
        </TabsTrigger>
        <TabsTrigger value="meeting-engine" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {lang('managementReview.meetingEngine')}
        </TabsTrigger>
        <TabsTrigger value="review-outputs" className="flex items-center gap-2">
          <FileOutput className="h-4 w-4" />
          {lang('managementReview.reviewOutputs')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="live-pulse" className="mt-6">
        <LivePulseInputs companyId={companyId} companyName={companyName} />
      </TabsContent>

      <TabsContent value="meeting-engine" className="mt-6">
        <MeetingEngine companyId={companyId} />
      </TabsContent>

      <TabsContent value="review-outputs" className="mt-6">
        <ReviewOutputsPlaceholder />
      </TabsContent>
    </Tabs>
  );
}
