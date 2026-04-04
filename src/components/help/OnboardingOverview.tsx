import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Play, CheckCircle, Clock, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModuleProgress } from "@/hooks/useModuleProgress";
import { allModules } from "./moduleContent";
import { ModuleContent } from "@/types/onboarding";
import { useTranslation } from '@/hooks/useTranslation';
import { useGenesisRestrictions } from '@/hooks/useGenesisRestrictions';

interface OnboardingOverviewProps {
  onModuleSelect: (module: ModuleContent) => void;
}

export function OnboardingOverview({ onModuleSelect }: OnboardingOverviewProps) {
  const { lang } = useTranslation();
  const { userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { isGenesis } = useGenesisRestrictions();
  const { getCompletionPercentage, isModuleCompleted, isModuleInProgress, getOverallProgress } = useModuleProgress();

  // Helper function to get translated category name
  const getTranslatedCategory = (category: string): string => {
    const categoryKeyMap: Record<string, string> = {
      'Smart Cost Intelligence': 'smartCostIntelligence',
      'Getting Started': 'gettingStarted',
      'Mission Control': 'missionControl',
      'Company Management': 'companyManagement',
      'Product Management': 'productManagement',
      'Document Management': 'documentManagement',
      'Compliance & Gap Analysis': 'complianceGapAnalysis',
      'Audit Management': 'auditManagement',
      'Classification & Risk': 'classificationRisk',
      'User Management': 'userManagement',
      'Business Analysis': 'businessAnalysis',
      'Communications': 'communications',
      'Financial Management': 'financialManagement',
      'Archive Management': 'archiveManagement',
      'Core Platform': 'corePlatform'
    };
    const key = categoryKeyMap[category];
    return key ? lang(`enhancedHelp.categories.${key}`) : category;
  };

  // Helper function to get translated difficulty
  const getTranslatedDifficulty = (difficulty: string): string => {
    const difficultyKeyMap: Record<string, string> = {
      'beginner': 'beginner',
      'intermediate': 'intermediate',
      'advanced': 'advanced'
    };
    const key = difficultyKeyMap[difficulty.toLowerCase()];
    return key ? lang(`enhancedHelp.difficulty.${key}`) : difficulty;
  };

  // Genesis-relevant module IDs
  const GENESIS_MODULE_IDS = ['genesis-guide', 'business-analysis', 'funding-stages', 'product-management'];

  const visibleModules = isGenesis
    ? allModules.filter(m => GENESIS_MODULE_IDS.includes(m.id))
    : allModules;

  const availableModules = visibleModules.filter(module => 
    module.roles.includes(userRole || 'viewer')
  );

  const filteredModules = availableModules.filter(module =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.overview.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedModules = filteredModules.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, ModuleContent[]>);

  const overallProgress = getOverallProgress(availableModules.map(m => m.id));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{lang('onboardingOverview.title')}</h1>
          <p className="text-muted-foreground mt-1">{lang('onboardingOverview.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <div className="text-sm text-muted-foreground">{lang('onboardingOverview.overallProgress')}</div>
          </div>
          <Award className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={lang('onboardingOverview.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-6">
        {Object.entries(groupedModules).map(([category, modules]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{getTranslatedCategory(category)}</CardTitle>
              <CardDescription>
                {lang('onboardingOverview.completedOf', { completed: modules.filter(m => isModuleCompleted(m.id)).length, total: modules.length })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {modules.map(module => {
                const progress = getCompletionPercentage(module.id);
                const completed = isModuleCompleted(module.id);
                const inProgress = isModuleInProgress(module.id);

                return (
                  <div key={module.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-shrink-0">
                      {completed ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : inProgress ? (
                        <Clock className="h-6 w-6 text-orange-500" />
                      ) : (
                        <Play className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{module.title}</h3>
                        <Badge variant="outline" className="text-xs">{lang('onboardingOverview.minutes', { time: module.estimatedTime })}</Badge>
                        <Badge variant="secondary" className="text-xs">{getTranslatedDifficulty(module.difficulty)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{module.overview.description}</p>
                      {progress > 0 && !completed && (
                        <Progress value={progress} className="mt-2 h-1" />
                      )}
                    </div>
                    <Button onClick={() => onModuleSelect(module)} size="sm">
                      {completed ? lang('onboardingOverview.review') : inProgress ? lang('onboardingOverview.continue') : lang('onboardingOverview.start')}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
