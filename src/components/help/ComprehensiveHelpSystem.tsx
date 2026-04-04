import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedHelpSystem } from './EnhancedHelpSystem';
import { OnboardingWizard } from './OnboardingWizard';
import { ProgressTracker } from './ProgressTracker';
import { InteractiveWalkthrough, PredefinedWalkthroughs } from './InteractiveWalkthrough';
import { HelpAnalytics } from './HelpAnalytics';
import { ContextualTooltip, HelpTooltips } from './ContextualTooltip';
import { VideoPlayer, TutorialVideos } from './VideoPlayer';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useHelpAnalytics } from './HelpAnalytics';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  HelpCircle,
  BookOpen,
  Play,
  BarChart3,
  Lightbulb,
  Target,
  Zap,
  Users,
  Award,
  Settings
} from "lucide-react";

interface ComprehensiveHelpSystemProps {
  className?: string;
}

export function ComprehensiveHelpSystem({ className }: ComprehensiveHelpSystemProps) {
  const { lang } = useTranslation();
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { userRole } = useAuth();
  const { 
    stages, 
    completionPercentage, 
    currentStage,
    completeStep,
    skipStep,
    completeStage,
    completeOnboarding
  } = useOnboarding();
  
  const {
    trackTopicView,
    trackSearch,
    trackOnboardingStep,
    trackVideoProgress,
    trackTooltipInteraction
  } = useHelpAnalytics();

  const demos = [
    {
      id: 'help-system',
      title: 'Enhanced Help System',
      description: 'Comprehensive help center with intelligent search and contextual assistance',
      icon: <HelpCircle className="h-5 w-5" />,
      component: () => (
        <EnhancedHelpSystem
          isOpen={activeDemo === 'help-system'}
          onClose={() => setActiveDemo(null)}
        />
      )
    },
    {
      id: 'onboarding-wizard',
      title: 'Advanced Onboarding Wizard',
      description: 'Role-based multi-stage onboarding with progress tracking',
      icon: <Users className="h-5 w-5" />,
      component: () => (
        <OnboardingWizard
          isOpen={activeDemo === 'onboarding-wizard'}
          onClose={() => setActiveDemo(null)}
          stages={stages}
          currentStage={currentStage}
          completionPercentage={completionPercentage}
          onCompleteStep={completeStep}
          onSkipStep={skipStep}
          onCompleteStage={completeStage}
          onCompleteOnboarding={completeOnboarding}
        />
      )
    },
    {
      id: 'interactive-walkthrough',
      title: 'Interactive Walkthroughs',
      description: 'Guided tours with element highlighting and action validation',
      icon: <Target className="h-5 w-5" />,
      component: () => (
        <InteractiveWalkthrough
          {...PredefinedWalkthroughs.ProductCreation}
          isActive={activeDemo === 'interactive-walkthrough'}
          onComplete={() => setActiveDemo(null)}
          onSkip={() => setActiveDemo(null)}
          onStepComplete={(stepId) => trackOnboardingStep(stepId, 'demo', true)}
        />
      )
    },
    {
      id: 'video-tutorials',
      title: 'Video Tutorial Player',
      description: 'Professional video player with progress tracking and controls',
      icon: <Play className="h-5 w-5" />,
      component: () => (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Video Tutorial Demo</h2>
              <Button variant="ghost" onClick={() => setActiveDemo(null)}>×</Button>
            </div>
            <TutorialVideos.GettingStarted
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              onProgress={(progress) => trackVideoProgress('demo-video', progress, progress >= 100)}
            />
          </div>
        </div>
      )
    },
    {
      id: 'analytics-dashboard',
      title: 'Help Analytics Dashboard',
      description: 'Comprehensive analytics and insights into help system usage',
      icon: <BarChart3 className="h-5 w-5" />,
      component: () => (
        <HelpAnalytics
          isOpen={activeDemo === 'analytics-dashboard'}
          onClose={() => setActiveDemo(null)}
          userRole={userRole || 'viewer'}
        />
      )
    }
  ];

  const tooltipExamples = [
    {
      id: 'company-selector',
      title: 'Company Selector with Tooltip',
      description: 'Smart contextual tooltip that provides just-in-time help',
      component: (
        <HelpTooltips.CompanySelector>
          <Button variant="outline" onClick={() => trackTooltipInteraction('company-selector', 'click')}>
            <Users className="h-4 w-4 mr-2" />
            Select Company
          </Button>
        </HelpTooltips.CompanySelector>
      )
    },
    {
      id: 'add-product',
      title: 'Add Product Button with Help',
      description: 'Interactive tooltip with contextual guidance',
      component: (
        <HelpTooltips.AddProductButton>
          <Button onClick={() => trackTooltipInteraction('add-product', 'click')}>
            <Zap className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </HelpTooltips.AddProductButton>
      )
    },
    {
      id: 'custom-tooltip',
      title: 'Custom Contextual Help',
      description: 'Fully customizable tooltip with rich content',
      component: (
        <ContextualTooltip
          content={{
            title: 'Phase Board Management',
            description: 'This view shows products organized by their current lifecycle phase. You can drag products between phases to update their status.',
            tips: [
              'Use filters to focus on specific product types',
              'Click on any product card to view detailed information',
              'The number badges show how many products are in each phase'
            ],
            videoUrl: '/tutorials/phase-board.mp4'
          }}
          trigger="hover"
          position="bottom"
        >
          <Button variant="outline" onClick={() => trackTooltipInteraction('phase-board', 'click')}>
            <BookOpen className="h-4 w-4 mr-2" />
            Phase Board View
          </Button>
        </ContextualTooltip>
      )
    }
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {lang('comprehensiveHelp.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {lang('comprehensiveHelp.description')}
        </p>
        <div className="flex justify-center gap-4">
          <Badge variant="secondary" className="text-sm">
            <Award className="h-3 w-3 mr-1" />
            {lang('comprehensiveHelp.badges.enterprise')}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Users className="h-3 w-3 mr-1" />
            {lang('comprehensiveHelp.badges.roleBased')}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <BarChart3 className="h-3 w-3 mr-1" />
            {lang('comprehensiveHelp.badges.analytics')}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Lightbulb className="h-3 w-3 mr-1" />
            {lang('comprehensiveHelp.badges.aiSearch')}
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      {completionPercentage > 0 && completionPercentage < 100 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {lang('comprehensiveHelp.progress.title')}
            </CardTitle>
            <CardDescription>
              {lang('comprehensiveHelp.progress.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressTracker
              stages={stages}
              completionPercentage={completionPercentage}
              currentStage={currentStage}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Features Demo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demos.map((demo) => (
          <Card key={demo.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  {demo.icon}
                </div>
                <CardTitle className="text-lg">{demo.title}</CardTitle>
              </div>
              <CardDescription>{demo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setActiveDemo(demo.id)}
                className="w-full"
                variant="outline"
              >
                {lang('comprehensiveHelp.tryDemo')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contextual Help Examples */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{lang('comprehensiveHelp.contextualHelp.title')}</h2>
          <p className="text-muted-foreground">
            {lang('comprehensiveHelp.contextualHelp.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tooltipExamples.map((example) => (
            <Card key={example.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{example.title}</CardTitle>
                <CardDescription className="text-sm">{example.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  {example.component}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {lang('comprehensiveHelp.features.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-primary">{lang('comprehensiveHelp.features.helpDocs.title')}</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.helpDocs.item1')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.helpDocs.item2')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.helpDocs.item3')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.helpDocs.item4')}
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-primary">{lang('comprehensiveHelp.features.onboarding.title')}</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.onboarding.item1')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.onboarding.item2')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.onboarding.item3')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.onboarding.item4')}
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-primary">{lang('comprehensiveHelp.features.analytics.title')}</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.analytics.item1')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.analytics.item2')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.analytics.item3')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.analytics.item4')}
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-primary">{lang('comprehensiveHelp.features.ux.title')}</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.ux.item1')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.ux.item2')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.ux.item3')}
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {lang('comprehensiveHelp.features.ux.item4')}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Button */}
      <div className="text-center">
        <Button onClick={() => setShowAnalytics(true)} variant="outline" size="lg">
          <BarChart3 className="h-4 w-4 mr-2" />
          {lang('comprehensiveHelp.viewAnalytics')}
        </Button>
      </div>

      {/* Render Active Demo */}
      {activeDemo && demos.find(d => d.id === activeDemo)?.component()}

      {/* Analytics Modal */}
      <HelpAnalytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        userRole={userRole || 'viewer'}
      />
    </div>
  );
}