import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GraduationCap, 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign,
  Clock,
  Percent,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { getAllFundingStages, FundingStageInfo } from '@/data/fundingStageHelp';

interface FundingStageEducationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundingStageEducationModal({ open, onOpenChange }: FundingStageEducationModalProps) {
  const [selectedStage, setSelectedStage] = useState<string>('overview');
  const stages = getAllFundingStages();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="h-6 w-6 text-primary" />
            MedTech Funding Stages Guide
          </DialogTitle>
        </DialogHeader>

        <Tabs 
          value={selectedStage} 
          onValueChange={setSelectedStage}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 border-b">
            <TabsList className="h-auto p-1 bg-transparent gap-1 flex-wrap">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Overview
              </TabsTrigger>
              {stages.map((stage) => (
                <TabsTrigger 
                  key={stage.key} 
                  value={stage.key}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {stage.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <OverviewContent stages={stages} />
              </TabsContent>
              
              {stages.map((stage) => (
                <TabsContent key={stage.key} value={stage.key} className="mt-0">
                  <StageDetailContent stage={stage} />
                </TabsContent>
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function OverviewContent({ stages }: { stages: FundingStageInfo[] }) {
  return (
    <>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          The MedTech Funding Lifecycle
        </h3>
        <p className="text-muted-foreground">
          Medical device startups typically progress through several funding stages, each designed 
          to achieve specific milestones before raising the next round. Unlike software startups, 
          MedTech companies face regulatory gates, clinical evidence requirements, and longer 
          development timelines that directly impact funding strategy.
        </p>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Stage Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Stage</th>
                  <th className="text-left py-2 font-medium">Amount</th>
                  <th className="text-left py-2 font-medium">Timeline</th>
                  <th className="text-left py-2 font-medium">Dilution</th>
                  <th className="text-left py-2 font-medium">Primary Focus</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stage) => (
                  <tr key={stage.key} className="border-b last:border-0">
                    <td className="py-2 font-medium">{stage.label}</td>
                    <td className="py-2">
                      <Badge variant="secondary">{stage.typicalAmount}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{stage.timelineMonths}</td>
                    <td className="py-2 text-muted-foreground">{stage.dilutionRange}</td>
                    <td className="py-2 text-muted-foreground">{stage.milestones[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Key Takeaways for MedTech Founders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Align funding rounds with regulatory milestones for maximum valuation impact</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Higher device class = more capital required (Class III needs 5-10x Class I)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Consider non-dilutive options (grants, venture debt) to extend runway</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Build 18-24 months runway minimum - regulatory delays are common</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

function StageDetailContent({ stage }: { stage: FundingStageInfo }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold">{stage.label}</h3>
          <p className="text-muted-foreground mt-1">{stage.description}</p>
        </div>
        <Badge className="text-lg px-4 py-2 bg-primary">
          {stage.typicalAmount}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              Timeline
            </div>
            <div className="font-semibold">{stage.timelineMonths}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Percent className="h-4 w-4" />
              Typical Dilution
            </div>
            <div className="font-semibold">{stage.dilutionRange}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Amount Range
            </div>
            <div className="font-semibold">{stage.typicalAmount}</div>
          </CardContent>
        </Card>
      </div>

      {/* MedTech Context */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            MedTech-Specific Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{stage.medtechContext}</p>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Investor Types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Who Invests at This Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stage.investorTypes.map((investor) => (
                <Badge key={investor} variant="secondary">
                  {investor}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Milestones */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Key Milestones Expected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stage.milestones.map((milestone, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{milestone}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
