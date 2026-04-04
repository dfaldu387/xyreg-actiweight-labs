import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, CheckCircle, Lightbulb, AlertCircle, BookOpen, X, Clock, Award, Play } from "lucide-react";
import { ModuleContent } from "@/types/onboarding";
import { useModuleProgress } from "@/hooks/useModuleProgress";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ImageViewer } from "./ImageViewer";
import { KeyboardShortcut } from "./KeyboardShortcut";
import { useTranslation } from '@/hooks/useTranslation';
import { ScrollArea } from "@/components/ui/scroll-area";
import { hasPlatformTour } from '@/data/platformGuideTourConfigs';
import { useOnboardingTour } from '@/context/OnboardingTourContext';

interface ModuleDeepDiveProps {
  module: ModuleContent;
  onClose: () => void;
  onCloseDialog?: () => void; // closes the parent help dialog for tour launch
  initialStep?: number;
}

export function ModuleDeepDive({ module, onClose, onCloseDialog, initialStep = 0 }: ModuleDeepDiveProps) {
  const { lang } = useTranslation();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const { startPlatformTour } = useOnboardingTour();

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

  const getTranslatedDifficulty = (difficulty: string): string => {
    const difficultyKeyMap: Record<string, string> = {
      'Beginner': 'beginner',
      'Intermediate': 'intermediate',
      'Advanced': 'advanced'
    };
    const key = difficultyKeyMap[difficulty];
    return key ? lang(`enhancedHelp.difficulty.${key}`) : difficulty;
  };

  const getModuleTitle = (): string => {
    if (!module.translationKey) return module.title;
    const translated = lang(`modules.${module.translationKey}.title`);
    return translated && !translated.includes('modules.') ? translated : module.title;
  };

  const getModuleDescription = (): string => {
    if (!module.translationKey) return module.overview.description;
    const translated = lang(`modules.${module.translationKey}.overview.description`);
    return translated && !translated.includes('modules.') ? translated : module.overview.description;
  };

  const getModuleWhoUsesIt = (): string => {
    if (!module.translationKey) return module.overview.whoUsesIt;
    const translated = lang(`modules.${module.translationKey}.overview.whoUsesIt`);
    return translated && !translated.includes('modules.') ? translated : module.overview.whoUsesIt;
  };

  const getModuleKeyBenefits = (): string[] => {
    if (!module.translationKey) return module.overview.keyBenefits;
    return module.overview.keyBenefits.map((benefit, i) => {
      const translated = lang(`modules.${module.translationKey}.overview.keyBenefits.${i}`);
      return translated && !translated.includes('modules.') ? translated : benefit;
    });
  };

  const getStepTitle = (stepIndex: number): string => {
    const step = module.steps[stepIndex];
    if (!step || !module.translationKey) return step?.title || '';
    const translated = lang(`modules.${module.translationKey}.steps.${stepIndex}.title`);
    return translated && !translated.includes('modules.') ? translated : step.title;
  };

  const getStepContent = (stepIndex: number): string => {
    const step = module.steps[stepIndex];
    if (!step || !module.translationKey) return step?.content || '';
    const translated = lang(`modules.${module.translationKey}.steps.${stepIndex}.content`);
    return translated && !translated.includes('modules.') ? translated : step.content;
  };

  const getStepTips = (stepIndex: number): string[] => {
    const step = module.steps[stepIndex];
    if (!step?.tips || !module.translationKey) return step?.tips || [];
    return step.tips.map((tip, i) => {
      const translated = lang(`modules.${module.translationKey}.steps.${stepIndex}.tips.${i}`);
      return translated && !translated.includes('modules.') ? translated : tip;
    });
  };

  const getStepCommonMistakes = (stepIndex: number): string[] => {
    const step = module.steps[stepIndex];
    if (!step?.commonMistakes || !module.translationKey) return step?.commonMistakes || [];
    return step.commonMistakes.map((mistake, i) => {
      const translated = lang(`modules.${module.translationKey}.steps.${stepIndex}.commonMistakes.${i}`);
      return translated && !translated.includes('modules.') ? translated : mistake;
    });
  };

  const getExampleScenario = (exampleIndex: number): string => {
    const example = module.examples?.[exampleIndex];
    if (!example || !module.translationKey) return example?.scenario || '';
    const translated = lang(`modules.${module.translationKey}.examples.${exampleIndex}.scenario`);
    return translated && !translated.includes('modules.') ? translated : example.scenario;
  };

  const getExampleDescription = (exampleIndex: number): string => {
    const example = module.examples?.[exampleIndex];
    if (!example?.description || !module.translationKey) return example?.description || '';
    const translated = lang(`modules.${module.translationKey}.examples.${exampleIndex}.description`);
    return translated && !translated.includes('modules.') ? translated : example.description;
  };

  const getExampleSteps = (exampleIndex: number): string[] => {
    const example = module.examples?.[exampleIndex];
    if (!example?.steps || !module.translationKey) return example?.steps || [];
    return example.steps.map((step, i) => {
      const translated = lang(`modules.${module.translationKey}.examples.${exampleIndex}.steps.${i}`);
      return translated && !translated.includes('modules.') ? translated : step;
    });
  };

  const getExampleExpectedOutcome = (exampleIndex: number): string => {
    const example = module.examples?.[exampleIndex];
    if (!example?.expectedOutcome || !module.translationKey) return example?.expectedOutcome || '';
    const translated = lang(`modules.${module.translationKey}.examples.${exampleIndex}.expectedOutcome`);
    return translated && !translated.includes('modules.') ? translated : example.expectedOutcome;
  };

  const getBestPractices = (): string[] => {
    if (!module.translationKey) return module.bestPractices;
    return module.bestPractices.map((practice, i) => {
      const translated = lang(`modules.${module.translationKey}.bestPractices.${i}`);
      return translated && !translated.includes('modules.') ? translated : practice;
    });
  };

  const {
    startModule,
    completeStep,
    completeModule,
    getModuleProgress,
    getCompletionPercentage
  } = useModuleProgress();

  useEffect(() => {
    const progress = getModuleProgress(module.id);
    if (!progress) {
      startModule(module.id, module.steps.length);
    }
    if (initialStep === undefined && progress?.currentStep) {
      setCurrentStep(progress.currentStep);
    }
  }, [module.id]);

  const currentStepData = module.steps[currentStep];
  const progress = getCompletionPercentage(module.id);
  const moduleProgress = getModuleProgress(module.id);

  const handleNext = () => {
    completeStep(module.id, currentStep);
    if (currentStep < module.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeModule(module.id);
      setTimeout(() => onClose(), 100);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const isStepCompleted = (stepIndex: number): boolean => {
    return moduleProgress?.completedSteps?.includes(stepIndex) || false;
  };

  return (
    <div className="flex h-full gap-0">
      {/* Main Content - Left Side */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 space-y-3 pb-4 border-b">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {lang('moduleDeepDive.backToLearning')}
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {lang('moduleDeepDive.minutes', { time: module.estimatedTime })}
              </Badge>
              <Badge variant="secondary">{getTranslatedDifficulty(module.difficulty)}</Badge>
              <Badge>{getTranslatedCategory(module.category)}</Badge>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{getModuleTitle()}</h1>
            <p className="text-sm text-muted-foreground">{getModuleDescription()}</p>
          </div>
        </div>

        {/* Step Header */}
        <div className="flex-shrink-0 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">
                {getStepTitle(currentStep)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {lang('moduleDeepDive.stepProgress', { current: currentStep + 1, total: module.steps.length, percent: progress })}
              </p>
            </div>
            {currentStepData && hasPlatformTour(currentStepData.id) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => {
                  if (onCloseDialog) onCloseDialog();
                  setTimeout(() => startPlatformTour(currentStepData.id), 300);
                }}
              >
                <Play className="h-4 w-4" />
                {lang('moduleDeepDive.tryItLive')}
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-auto pt-4">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">{lang('moduleDeepDive.tabs.content')}</TabsTrigger>
              <TabsTrigger value="overview">{lang('moduleDeepDive.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="examples">{lang('moduleDeepDive.tabs.examples')}</TabsTrigger>
              <TabsTrigger value="reference">{lang('moduleDeepDive.tabs.reference')}</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6 mt-6">
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={getStepContent(currentStep)} />
              </div>

              {currentStepData?.media?.screenshot && (
                <div className="my-6">
                  <ImageViewer 
                    src={currentStepData.media.screenshot} 
                    alt={`${currentStepData.title} - Screenshot`}
                    className="max-w-3xl mx-auto"
                  />
                </div>
              )}

              {currentStepData?.tips && currentStepData.tips.length > 0 && (
                <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-500 p-2">
                        <Lightbulb className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                          {lang('moduleDeepDive.proTips')}
                        </h3>
                        <ul className="space-y-2">
                          {getStepTips(currentStep).map((tip, i) => (
                            <li key={i} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                              <span className="text-blue-500 font-bold mt-0.5">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStepData?.commonMistakes && currentStepData.commonMistakes.length > 0 && (
                <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-orange-500 p-2">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">
                          {lang('moduleDeepDive.commonMistakes')}
                        </h3>
                        <ul className="space-y-2">
                          {getStepCommonMistakes(currentStep).map((mistake, i) => (
                            <li key={i} className="text-sm text-orange-800 dark:text-orange-200 flex items-start gap-2">
                              <span className="text-orange-500 font-bold mt-0.5">⚠</span>
                              <span>{mistake}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  size="lg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {lang('moduleDeepDive.previousStep')}
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  {currentStep + 1} / {module.steps.length}
                </div>

                <Button
                  onClick={handleNext}
                  size="lg"
                  className={currentStep === module.steps.length - 1 ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {currentStep === module.steps.length - 1 ? (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      {lang('moduleDeepDive.completeModule')}
                    </>
                  ) : (
                    <>
                      {lang('moduleDeepDive.nextStep')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{lang('moduleDeepDive.aboutModule')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{getModuleDescription()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{lang('moduleDeepDive.whoUsesIt')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{getModuleWhoUsesIt()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{lang('moduleDeepDive.keyBenefits')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {getModuleKeyBenefits().map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples" className="mt-6 space-y-4">
              {module.examples && module.examples.length > 0 ? (
                module.examples.map((example, i) => (
                  <Card key={i} className="border-2">
                    <CardHeader className="bg-muted/50">
                      <CardTitle className="text-lg flex items-start gap-2">
                        <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        {getExampleScenario(i)}
                      </CardTitle>
                      {example.description && (
                        <p className="text-sm text-muted-foreground mt-2">{getExampleDescription(i)}</p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                        {lang('moduleDeepDive.stepByStep')}
                      </h4>
                      <ol className="space-y-3">
                        {getExampleSteps(i).map((step, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                              {j + 1}
                            </span>
                            <span className="text-sm pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                      {example.expectedOutcome && (
                        <Card className="mt-6 border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/50">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-green-900 dark:text-green-100 text-sm mb-1">
                                  {lang('moduleDeepDive.expectedOutcome')}
                                </p>
                                <p className="text-sm text-green-800 dark:text-green-200">
                                  {getExampleExpectedOutcome(i)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{lang('moduleDeepDive.noExamples')}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reference" className="mt-6 space-y-6">
              {module.quickReference?.shortcuts && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{lang('moduleDeepDive.keyboardShortcuts')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {module.quickReference.shortcuts.map((shortcut, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                          <KeyboardShortcut shortcut={shortcut.key} />
                          <span className="text-sm flex-1 ml-4">{shortcut.action}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {module.quickReference?.commonTasks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{lang('moduleDeepDive.commonTasks')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {module.quickReference.commonTasks.map((task, i) => {
                        const translatedTask = module.translationKey
                          ? (lang(`modules.${module.translationKey}.quickReference.commonTasks.${i}.task`) !== `modules.${module.translationKey}.quickReference.commonTasks.${i}.task`
                            ? lang(`modules.${module.translationKey}.quickReference.commonTasks.${i}.task`) : task.task)
                          : task.task;
                        const translatedSteps = task.steps.map((step, j) => {
                          if (!module.translationKey) return step;
                          const t = lang(`modules.${module.translationKey}.quickReference.commonTasks.${i}.steps.${j}`);
                          return t && !t.includes('modules.') ? t : step;
                        });
                        const translatedTime = module.translationKey
                          ? (lang(`modules.${module.translationKey}.quickReference.commonTasks.${i}.estimatedTime`) !== `modules.${module.translationKey}.quickReference.commonTasks.${i}.estimatedTime`
                            ? lang(`modules.${module.translationKey}.quickReference.commonTasks.${i}.estimatedTime`) : task.estimatedTime)
                          : task.estimatedTime;
                        return (
                        <div key={i} className="border-l-2 border-primary pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm">{translatedTask}</h4>
                            {translatedTime && (
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {translatedTime}
                              </Badge>
                            )}
                          </div>
                          <ol className="space-y-1 text-sm text-muted-foreground">
                            {translatedSteps.map((step, j) => (
                              <li key={j}>{j + 1}. {step}</li>
                            ))}
                          </ol>
                        </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {module.bestPractices && module.bestPractices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{lang('moduleDeepDive.bestPractices')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {getBestPractices().map((practice, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Sidebar - Steps Navigation (Genesis-style) */}
      <div className="w-72 border-l bg-muted/30 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
            {lang('moduleDeepDive.sections') || 'Sections'}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {module.steps.map((step, index) => {
              const isActive = index === currentStep;
              const completed = isStepCompleted(index);
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-start gap-3 group ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/30 shadow-sm' 
                      : completed 
                        ? 'bg-green-50/50 dark:bg-green-950/20 hover:bg-green-50 dark:hover:bg-green-950/30' 
                        : 'hover:bg-accent/50'
                  }`}
                >
                  {/* Step Number / Check */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20'
                  }`}>
                    {completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  {/* Step Title */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${
                      isActive 
                        ? 'text-primary' 
                        : completed 
                          ? 'text-green-700 dark:text-green-400' 
                          : 'text-foreground'
                    }`}>
                      {getStepTitle(index)}
                    </p>
                    {step.tips && step.tips.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {step.tips.length} {lang('moduleDeepDive.tipsCount')}
                      </p>
                    )}
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="flex-shrink-0 w-1.5 h-7 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
