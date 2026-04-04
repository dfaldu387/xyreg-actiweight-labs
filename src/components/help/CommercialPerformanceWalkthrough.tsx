import React, { useState } from 'react';
import { InteractiveWalkthrough } from './InteractiveWalkthrough';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useTranslation';
import {
  Play,
  Database,
  Link,
  Brain,
  Calculator,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'focus' | 'none';
  highlight?: boolean;
  required?: boolean;
  completionCheck?: () => boolean;
}

interface WalkthroughConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  steps: WalkthroughStep[];
}

export const commercialWalkthroughs: WalkthroughConfig[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Commercial Performance',
    description: 'First-time user orientation to the commercial performance dashboard',
    icon: <Play className="h-5 w-5" />,
    difficulty: 'beginner',
    estimatedTime: '5 minutes',
    steps: [
      {
        id: 'welcome-overview',
        title: 'Welcome to Commercial Performance',
        description: 'This is your central hub for managing financial data, forecasting, and analyzing commercial performance across your medical device portfolio.',
        target: '[data-tour="commercial-performance-page"]',
        position: 'center',
        action: 'none',
        highlight: false
      },
      {
        id: 'date-selector',
        title: 'Select Your Analysis Period',
        description: 'Choose the time period for your analysis. The date picker allows you to focus on specific months or view year-over-year trends.',
        target: '[data-tour="date-picker"]',
        position: 'bottom',
        action: 'click'
      },
      {
        id: 'financial-data-table',
        title: 'Review Financial Data',
        description: 'This table shows your revenue and cost data by product and month. You can sort, filter, and analyze performance trends.',
        target: '[data-tour="financial-data-table"]',
        position: 'top',
        action: 'none'
      },
      {
        id: 'upload-data-button',
        title: 'Add New Financial Data',
        description: 'Click here to upload new financial data via CSV or add entries manually. This keeps your analysis current.',
        target: '[data-tour="upload-csv-button"]',
        position: 'left',
        action: 'hover'
      },
      {
        id: 'forecasting-widgets',
        title: 'Explore Forecasting Tools',
        description: 'These widgets provide AI-powered forecasting and market intelligence to predict future performance.',
        target: '[data-tour="forecasting-widgets"]',
        position: 'top',
        action: 'none'
      }
    ]
  },
  {
    id: 'data-input-workflow',
    title: 'Financial Data Input Workflow',
    description: 'Learn how to add and manage financial data effectively',
    icon: <Database className="h-5 w-5" />,
    difficulty: 'beginner',
    estimatedTime: '8 minutes',
    steps: [
      {
        id: 'start-csv-upload',
        title: 'Start CSV Upload Process',
        description: 'Click the "Upload Financial CSV" button to begin importing your financial data from spreadsheets.',
        target: '[data-tour="upload-csv-button"]',
        position: 'bottom',
        action: 'click',
        required: true
      },
      {
        id: 'select-csv-file',
        title: 'Choose Your CSV File',
        description: 'Select a properly formatted CSV file. Ensure it includes columns for Product, Month, Revenue, and Costs.',
        target: '[data-tour="csv-file-input"]',
        position: 'top',
        action: 'click'
      },
      {
        id: 'review-csv-preview',
        title: 'Review Data Preview',
        description: 'Check the preview to ensure your data is correctly parsed. Look for any formatting issues or missing values.',
        target: '[data-tour="csv-preview-table"]',
        position: 'bottom',
        action: 'none'
      },
      {
        id: 'map-csv-columns',
        title: 'Map CSV Columns',
        description: 'Map your CSV columns to the system fields. This ensures data is imported into the correct categories.',
        target: '[data-tour="csv-column-mapping"]',
        position: 'right',
        action: 'none'
      },
      {
        id: 'confirm-csv-upload',
        title: 'Confirm Upload',
        description: 'Review the mapping and click "Import Data" to add the financial information to your system.',
        target: '[data-tour="confirm-csv-upload"]',
        position: 'top',
        action: 'click',
        required: true
      },
      {
        id: 'manual-entry-alternative',
        title: 'Alternative: Manual Entry',
        description: 'For single entries or corrections, use the "Add Entry" button to input data manually.',
        target: '[data-tour="add-entry-button"]',
        position: 'left',
        action: 'hover'
      },
      {
        id: 'verify-data-table',
        title: 'Verify in Data Table',
        description: 'Your new data should now appear in the financial data table. Verify accuracy and completeness.',
        target: '[data-tour="financial-data-table"]',
        position: 'top',
        action: 'none'
      }
    ]
  },
  {
    id: 'smart-relationships',
    title: 'Smart Product Relationships Setup',
    description: 'Configure product relationships and multipliers for revenue forecasting',
    icon: <Link className="h-5 w-5" />,
    difficulty: 'intermediate',
    estimatedTime: '12 minutes',
    steps: [
      {
        id: 'open-relationships-manager',
        title: 'Open Portfolio Relationships',
        description: 'Navigate to the Portfolio Relationships Manager to configure how your products work together.',
        target: '[data-tour="portfolio-relationships"]',
        position: 'bottom',
        action: 'click'
      },
      {
        id: 'add-new-relationship',
        title: 'Add New Product Relationship',
        description: 'Click "Add Relationship" to create connections between main products and their accessories or bundles.',
        target: '[data-tour="add-relationship-button"]',
        position: 'top',
        action: 'click',
        required: true
      },
      {
        id: 'select-main-product',
        title: 'Choose Main Product',
        description: 'Select the primary product that drives sales of related items. This is typically your main device or platform.',
        target: '[data-tour="main-product-selector"]',
        position: 'right',
        action: 'click'
      },
      {
        id: 'select-related-product',
        title: 'Choose Related Product',
        description: 'Select the accessory, consumable, or service that is sold alongside the main product.',
        target: '[data-tour="related-product-selector"]',
        position: 'right',
        action: 'click'
      },
      {
        id: 'configure-initial-multiplier',
        title: 'Set Initial Multiplier',
        description: 'Define how much additional revenue this relationship generates initially (e.g., 1.5x means 50% more revenue).',
        target: '[data-tour="initial-multiplier-input"]',
        position: 'left',
        action: 'focus'
      },
      {
        id: 'configure-recurring-multiplier',
        title: 'Set Recurring Multiplier',
        description: 'Define ongoing revenue impact. For consumables, this might be 0.3x monthly (30% of main product value each month).',
        target: '[data-tour="recurring-multiplier-input"]',
        position: 'left',
        action: 'focus'
      },
      {
        id: 'set-lifecycle-duration',
        title: 'Set Relationship Duration',
        description: 'Specify how long this relationship remains active (in months). Consider customer switching costs and product lifecycles.',
        target: '[data-tour="lifecycle-duration-input"]',
        position: 'left',
        action: 'focus'
      },
      {
        id: 'configure-seasonality',
        title: 'Add Seasonality Factors (Optional)',
        description: 'If this product has seasonal patterns, adjust the monthly multipliers to reflect demand variations.',
        target: '[data-tour="seasonality-factors"]',
        position: 'bottom',
        action: 'none'
      },
      {
        id: 'save-relationship',
        title: 'Save Relationship',
        description: 'Click "Save" to create the relationship. The system will now use these multipliers in revenue forecasting.',
        target: '[data-tour="save-relationship-button"]',
        position: 'top',
        action: 'click',
        required: true
      },
      {
        id: 'review-relationships-list',
        title: 'Review All Relationships',
        description: 'Your new relationship appears in the list. You can edit multipliers or add more relationships as needed.',
        target: '[data-tour="relationships-list"]',
        position: 'top',
        action: 'none'
      }
    ]
  },
  {
    id: 'forecasting-analysis',
    title: 'Forecasting & Analysis Workflow',
    description: 'Use AI forecasting tools and interpret results for business planning',
    icon: <Brain className="h-5 w-5" />,
    difficulty: 'intermediate',
    estimatedTime: '10 minutes',
    steps: [
      {
        id: 'basic-forecasting-widget',
        title: 'Basic Forecasting Overview',
        description: 'This widget shows trend-based forecasts using your historical data. Review the projected growth patterns.',
        target: '[data-tour="basic-forecasting-widget"]',
        position: 'bottom',
        action: 'none'
      },
      {
        id: 'smart-forecasting-widget',
        title: 'Smart Forecasting Engine',
        description: 'The Smart Forecasting widget incorporates product relationships and market intelligence for more accurate predictions.',
        target: '[data-tour="smart-forecasting-widget"]',
        position: 'bottom',
        action: 'click'
      },
      {
        id: 'calculate-smart-revenue',
        title: 'Generate Smart Revenue Forecast',
        description: 'Click "Calculate Smart Revenue" to generate AI-powered forecasts that consider all product relationships.',
        target: '[data-tour="calculate-smart-revenue"]',
        position: 'left',
        action: 'click',
        required: true
      },
      {
        id: 'review-forecast-scenarios',
        title: 'Review Forecast Scenarios',
        description: 'Examine the conservative, expected, and optimistic scenarios. Each represents different market conditions.',
        target: '[data-tour="forecast-scenarios"]',
        position: 'top',
        action: 'none'
      },
      {
        id: 'understand-confidence-levels',
        title: 'Understand Confidence Levels',
        description: 'Higher confidence indicates more reliable predictions based on data quality and market stability.',
        target: '[data-tour="confidence-indicators"]',
        position: 'right',
        action: 'none'
      },
      {
        id: 'ai-prognosis-factors',
        title: 'AI Prognosis Factors',
        description: 'This panel shows market intelligence factors affecting your forecasts, including competitive and economic trends.',
        target: '[data-tour="ai-prognosis-factors"]',
        position: 'left',
        action: 'click'
      },
      {
        id: 'interpret-market-factors',
        title: 'Interpret Market Factors',
        description: 'Review how market growth, competition, regulation, and technology trends impact your revenue projections.',
        target: '[data-tour="market-factors-list"]',
        position: 'bottom',
        action: 'none'
      },
      {
        id: 'export-forecast-data',
        title: 'Export Forecast Results',
        description: 'Use the export options to save forecast data for presentations, budgeting, or further analysis.',
        target: '[data-tour="export-forecast-button"]',
        position: 'top',
        action: 'hover'
      }
    ]
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features & rNPV Integration',
    description: 'Master advanced analytics and financial modeling capabilities',
    icon: <Calculator className="h-5 w-5" />,
    difficulty: 'advanced',
    estimatedTime: '15 minutes',
    steps: [
      {
        id: 'update-rnpv-model',
        title: 'Update rNPV Model',
        description: 'Click "Update rNPV Model" to integrate commercial performance data with financial valuation models.',
        target: '[data-tour="update-rnpv-button"]',
        position: 'bottom',
        action: 'click'
      },
      {
        id: 'review-rnpv-integration',
        title: 'Review rNPV Integration',
        description: 'The system automatically feeds revenue forecasts into risk-adjusted NPV calculations for investment analysis.',
        target: '[data-tour="rnpv-integration-panel"]',
        position: 'left',
        action: 'none'
      },
      {
        id: 'sensitivity-analysis',
        title: 'Run Sensitivity Analysis',
        description: 'Analyze how changes in key assumptions (pricing, costs, market size) affect financial outcomes.',
        target: '[data-tour="sensitivity-analysis"]',
        position: 'right',
        action: 'click'
      },
      {
        id: 'scenario-comparison',
        title: 'Compare Scenarios',
        description: 'Compare different business scenarios side-by-side to understand risk and opportunity ranges.',
        target: '[data-tour="scenario-comparison"]',
        position: 'top',
        action: 'none'
      },
      {
        id: 'portfolio-optimization',
        title: 'Portfolio Optimization',
        description: 'Use portfolio-level analytics to optimize resource allocation across your product portfolio.',
        target: '[data-tour="portfolio-optimization"]',
        position: 'bottom',
        action: 'click'
      },
      {
        id: 'advanced-filters',
        title: 'Advanced Filtering',
        description: 'Use advanced filters to analyze specific product segments, markets, or time periods in detail.',
        target: '[data-tour="advanced-filters"]',
        position: 'right',
        action: 'click'
      },
      {
        id: 'custom-dashboards',
        title: 'Create Custom Dashboards',
        description: 'Build personalized dashboards combining multiple analytics views for executive reporting.',
        target: '[data-tour="custom-dashboard-button"]',
        position: 'top',
        action: 'hover'
      },
      {
        id: 'export-comprehensive-report',
        title: 'Generate Comprehensive Reports',
        description: 'Export complete analysis reports including forecasts, scenarios, and recommendations for stakeholders.',
        target: '[data-tour="comprehensive-report-export"]',
        position: 'left',
        action: 'click'
      }
    ]
  }
];

interface CommercialPerformanceWalkthroughProps {
  className?: string;
}

export function CommercialPerformanceWalkthrough({ className }: CommercialPerformanceWalkthroughProps) {
  const { lang } = useTranslation();
  const [activeWalkthrough, setActiveWalkthrough] = useState<string | null>(null);
  const [completedWalkthroughs, setCompletedWalkthroughs] = useState<Set<string>>(new Set());

  const handleWalkthroughComplete = (walkthroughId: string) => {
    setCompletedWalkthroughs(prev => new Set([...prev, walkthroughId]));
    setActiveWalkthrough(null);
  };

  const handleWalkthroughSkip = () => {
    setActiveWalkthrough(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const activeWalkthroughConfig = activeWalkthrough 
    ? commercialWalkthroughs.find(w => w.id === activeWalkthrough)
    : null;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-primary">{lang('commercialHelp.walkthrough.title')}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {lang('commercialHelp.walkthrough.description')}
        </p>
      </div>

      {/* Walkthrough Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {commercialWalkthroughs.map((walkthrough) => (
          <Card key={walkthrough.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-3 rounded-lg text-primary">
                  {walkthrough.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg mb-1">{walkthrough.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {walkthrough.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={getDifficultyColor(walkthrough.difficulty)}>
                      {walkthrough.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {walkthrough.estimatedTime}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      {walkthrough.steps.length} {lang('commercialHelp.walkthrough.steps')}
                    </Badge>
                    {completedWalkthroughs.has(walkthrough.id) && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {lang('commercialHelp.walkthrough.completed')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setActiveWalkthrough(walkthrough.id)}
                disabled={activeWalkthrough !== null}
                className="w-full"
              >
                {completedWalkthroughs.has(walkthrough.id) ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {lang('commercialHelp.walkthrough.reviewWalkthrough')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {lang('commercialHelp.walkthrough.startWalkthrough')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Summary */}
      {completedWalkthroughs.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {lang('commercialHelp.walkthrough.yourProgress')}
            </CardTitle>
            <CardDescription>
              {lang('commercialHelp.walkthrough.progressDescription', { completed: completedWalkthroughs.size, total: commercialWalkthroughs.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(completedWalkthroughs.size / commercialWalkthroughs.length) * 100}%` }}
                />
              </div>
              <div className="text-sm font-medium text-primary">
                {Math.round((completedWalkthroughs.size / commercialWalkthroughs.length) * 100)}%
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {Array.from(completedWalkthroughs).map(id => {
                const walkthrough = commercialWalkthroughs.find(w => w.id === id);
                return walkthrough ? (
                  <Badge key={id} className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {walkthrough.title}
                  </Badge>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {lang('commercialHelp.walkthrough.tipsForSuccess')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                {lang('commercialHelp.walkthrough.tips.dataManagement.title')}
              </h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {lang('commercialHelp.walkthrough.tips.dataManagement.tip1')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.dataManagement.tip2')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.dataManagement.tip3')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.dataManagement.tip4')}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Link className="h-4 w-4" />
                {lang('commercialHelp.walkthrough.tips.productRelationships.title')}
              </h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {lang('commercialHelp.walkthrough.tips.productRelationships.tip1')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.productRelationships.tip2')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.productRelationships.tip3')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.productRelationships.tip4')}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Brain className="h-4 w-4" />
                {lang('commercialHelp.walkthrough.tips.aiForecasting.title')}
              </h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {lang('commercialHelp.walkthrough.tips.aiForecasting.tip1')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.aiForecasting.tip2')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.aiForecasting.tip3')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.aiForecasting.tip4')}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {lang('commercialHelp.walkthrough.tips.financialAnalysis.title')}
              </h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {lang('commercialHelp.walkthrough.tips.financialAnalysis.tip1')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.financialAnalysis.tip2')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.financialAnalysis.tip3')}</li>
                <li>• {lang('commercialHelp.walkthrough.tips.financialAnalysis.tip4')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Walkthrough */}
      {activeWalkthroughConfig && (
        <InteractiveWalkthrough
          title={activeWalkthroughConfig.title}
          description={activeWalkthroughConfig.description}
          steps={activeWalkthroughConfig.steps}
          isActive={activeWalkthrough !== null}
          onComplete={() => handleWalkthroughComplete(activeWalkthroughConfig.id)}
          onSkip={handleWalkthroughSkip}
          onStepComplete={(stepId) => {
            // console.log(`Completed step: ${stepId} in walkthrough: ${activeWalkthrough}`);
          }}
          autoAdvance={false}
        />
      )}
    </div>
  );
}