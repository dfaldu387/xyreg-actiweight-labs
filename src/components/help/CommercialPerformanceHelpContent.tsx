import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Database, 
  Link, 
  Brain, 
  Calculator, 
  FileSpreadsheet, 
  Upload, 
  Plus,
  DollarSign,
  Target,
  BarChart3,
  Zap,
  HelpCircle
} from "lucide-react";
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';

export interface CommercialHelpTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  icon: React.ReactNode;
  userRoles: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: string;
}

export const commercialHelpTopics: CommercialHelpTopic[] = [
  {
    id: 'financial-data-overview',
    title: 'Financial Data Management',
    description: 'Learn how to input, manage, and analyze financial data for your medical devices',
    category: 'Data Management',
    icon: <Database className="h-5 w-5" />,
    difficulty: 'beginner',
    estimatedTime: '5 minutes',
    content: `# Financial Data Management

Master the fundamentals of managing financial data for your medical device portfolio.

## Overview

The Financial Data Management system allows you to:
- Track revenue, costs, and profitability by device and month
- Import data via CSV uploads or manual entry
- Monitor performance across different markets and time periods
- Generate forecasts based on historical data

## Data Input Methods

### 1. CSV Upload
- Format: Use the provided CSV template
- Required Fields: Device Name, Month, Revenue, Costs
- Optional Fields: Market, Currency, Notes
- Validation: Automatic data validation and error reporting
- Best Practice: Upload monthly to maintain current data

### 2. Manual Entry
- Quick Entry: Add individual data points through the interface
- Bulk Entry: Use the batch entry dialog for multiple records
- Real-time Validation: Immediate feedback on data quality
- Auto-complete: Device names and markets are suggested

## Data Categories

### Revenue Data
- Net Sales: Total revenue after discounts and returns
- Gross Revenue: Total sales before adjustments
- Market Breakdown: Revenue by geographic region
- Currency Handling: Automatic conversion to base currency

### Cost Data
- COGS: Cost of goods sold
- R&D Expenses: Research and development costs
- Marketing Costs: Sales and marketing expenses
- Regulatory Costs: Compliance and approval expenses

### Profitability Metrics
- Gross Margin: (Revenue - COGS) / Revenue
- Operating Margin: Operating income / Revenue
- Net Profit: Total revenue minus all expenses
- ROI: Return on investment calculations

## Best Practices

### Data Quality
1. Consistent Timing: Enter data on the same schedule (monthly recommended)
2. Complete Records: Ensure all required fields are populated
3. Validation: Review automatic data quality checks
4. Currency: Use consistent currency or let system convert

### Organization
1. Device Naming: Use consistent device names across all entries
2. Market Codes: Standardize geographic market identifiers
3. Categories: Properly categorize revenue and cost types
4. Documentation: Add notes for unusual entries or adjustments

## Troubleshooting

### Common Issues
- Missing Data: Use interpolation tools for gap filling
- Currency Conversion: Verify exchange rates and base currency settings
- Duplicate Entries: Use deduplication tools to clean data
- Format Errors: Check CSV format against provided template

### Data Validation
- Range Checks: System validates reasonable value ranges
- Trend Analysis: Flags unusual month-over-month changes
- Completeness: Identifies missing data points
- Consistency: Checks for data format consistency`,
    userRoles: ['admin', 'company_admin', 'editor'],
    tags: ['financial-data', 'revenue', 'costs', 'csv-upload', 'data-entry']
  },
  {
    id: 'smart-revenue-forecasting',
    title: 'Smart Revenue Forecasting',
    description: 'AI-powered revenue forecasting with device relationships and multipliers',
    category: 'Forecasting',
    icon: <Brain className="h-5 w-5" />,
    difficulty: 'intermediate',
    estimatedTime: '8 minutes',
    content: `# Smart Revenue Forecasting

Leverage AI-powered forecasting to predict future revenue based on device relationships and market intelligence.

## System Overview

The Smart Revenue Engine uses machine learning to:
- Analyze historical revenue patterns
- Model device relationship impacts
- Apply market intelligence multipliers
- Generate confidence-weighted forecasts

## Key Concepts

### Product Relationships
- Main Products: Primary revenue-generating devices
- Accessories: Supporting products that drive additional revenue
- Bundles: Combined product offerings with relationship multipliers

### Smart Multipliers
- Initial Multiplier: One-time revenue boost from product launches
- Recurring Multiplier: Ongoing revenue impact from related products
- Lifecycle Duration: Time period over which relationships remain active
- Seasonality Factors: Monthly adjustment factors for seasonal variations

## Setting Up Smart Relationships

### 1. Define Main Products
Example: "CardioMonitor Pro"
- Primary medical device
- Base revenue stream
- Drives accessory sales

### 2. Configure Accessories
Example: "CardioMonitor Electrodes"
- Recurring purchase item
- Tied to main product sales
- Recurring multiplier: 2.5x monthly

### 3. Set Multipliers
- Conservative: 1.2x - 1.5x (safe estimates)
- Typical: 1.5x - 2.5x (market standard)
- Aggressive: 2.5x - 4.0x (optimistic scenarios)

## Forecast Types

### Historical Pattern Forecasting
- Trend Analysis: Identifies growth/decline patterns
- Seasonal Adjustment: Accounts for cyclical variations
- Market Maturity: Adjusts for product lifecycle stage

### Relationship-Based Forecasting
- Cross-Product Impact: How one product affects another's sales
- Market Penetration: Geographic expansion revenue modeling
- Customer Lifecycle: Revenue per customer over time

### AI-Enhanced Scenarios
- Market Intelligence: External market factor integration
- Competitive Analysis: Market share impact modeling
- Economic Factors: Inflation and economic cycle adjustments

## Best Practices

### Data Requirements
1. Historical Data: Minimum 12 months for reliable forecasting
2. Complete Relationships: All major product connections defined
3. Market Data: External market intelligence integration
4. Regular Updates: Monthly data refresh for accuracy

### Multiplier Configuration
1. Start Conservative: Use lower multipliers initially
2. Validate with History: Compare predictions to known outcomes
3. Adjust Gradually: Refine multipliers based on performance
4. Document Assumptions: Record reasoning for multiplier choices`,
    userRoles: ['admin', 'company_admin', 'consultant'],
    tags: ['forecasting', 'ai', 'revenue-prediction', 'product-relationships', 'multipliers']
  },
  {
    id: 'product-relationships',
    title: 'Product Relationships & Portfolio Management',
    description: 'Configure and manage relationships between main products, accessories, and bundles',
    category: 'Portfolio Management',
    icon: <Link className="h-5 w-5" />,
    difficulty: 'intermediate',
    estimatedTime: '10 minutes',
    content: `# Product Relationships & Portfolio Management

Master the configuration and management of complex product relationships for accurate revenue modeling.

## Understanding Product Relationships

### Relationship Types

#### Main Product to Accessory
Most common relationship in medical devices:
- Example: Ventilator with Breathing Circuits, Filters, Sensors
- Revenue Impact: Accessories generate recurring revenue
- Multiplier Effect: 1 main product sale = X accessory sales over time

#### Product Bundles
Combined offerings that increase average selling price:
- Example: "Complete Cardiac Monitoring Package"
- Components: Monitor + Electrodes + Software License
- Bundle Multiplier: Often 0.8x - 0.9x (discount factor)

#### Cross-Selling Relationships
Products that drive sales of other products:
- Example: Surgical Robot leads to Training Services and Maintenance
- Market Expansion: One product opens markets for others
- Network Effects: More products = stronger competitive position

## Configuring Relationships

### Step 1: Identify Main Products
Main products are typically:
- High ASP Items: Expensive capital equipment
- Market Drivers: Products that open new customer relationships
- Platform Products: Devices that enable accessory sales

### Step 2: Map Dependencies
For each main product, identify:
- Required Accessories: Must-have items for operation
- Optional Accessories: Items that enhance functionality
- Service Products: Training, maintenance, support
- Upgrade Paths: Next-generation or premium versions

### Step 3: Quantify Relationships
Set realistic multipliers based on:
- Historical Data: Actual ratios from past sales
- Market Research: Industry benchmarks and studies
- Customer Behavior: Usage patterns and purchase cycles
- Competitive Analysis: How competitors structure offerings

## Multiplier Configuration Guide

### Initial Multiplier (One-time Impact)
Represents immediate revenue boost from product launch:

#### Conservative (1.1x - 1.3x)
- Use When: New market entry, uncertain demand
- Example: 1.2x for new geography expansion
- Risk Level: Low risk of overestimation

#### Typical (1.3x - 2.0x)
- Use When: Established market, known relationships
- Example: 1.8x for proven accessory attachment rate
- Risk Level: Moderate, based on historical data

#### Aggressive (2.0x - 4.0x)
- Use When: Strong market position, network effects
- Example: 3.5x for platform products with ecosystem
- Risk Level: Higher, requires strong justification

### Recurring Multiplier (Ongoing Impact)
Models continuous revenue generation:

#### Monthly Recurring Revenue
- Consumables: 0.2x - 0.8x monthly (high-frequency items)
- Services: 0.1x - 0.3x monthly (maintenance, support)
- Software: 0.05x - 0.15x monthly (SaaS, licenses)

#### Annual Recurring Revenue
- Maintenance Contracts: 0.1x - 0.2x annually
- Upgrade Cycles: 0.8x - 1.2x every 3-5 years
- Training Programs: 0.05x - 0.1x annually

## Best Practices

### Performance Tracking
Regular review of:
- Actual vs. Predicted: Accuracy of relationship models
- Multiplier Performance: Which relationships over/under-perform
- Market Changes: Shifts in customer behavior or competition
- Product Lifecycle: Changes as products mature`,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    tags: ['product-relationships', 'portfolio', 'multipliers', 'revenue-attribution', 'lifecycle']
  },
  {
    id: 'ai-forecasting',
    title: 'AI Forecasting & Prognosis Factors',
    description: 'Understand and interpret AI-generated market forecasts and prognosis factors',
    category: 'AI Intelligence',
    icon: <Zap className="h-5 w-5" />,
    difficulty: 'advanced',
    estimatedTime: '12 minutes',
    content: `# AI Forecasting & Prognosis Factors

Master the interpretation and application of AI-generated market intelligence for strategic decision making.

## AI Forecasting Overview

The AI Forecasting Engine analyzes multiple data sources to generate intelligent market predictions:

### Data Sources
- Internal Data: Historical revenue, costs, product relationships
- Market Intelligence: Industry reports, competitive analysis
- Economic Indicators: GDP, healthcare spending, demographic trends
- Regulatory Environment: Approval timelines, policy changes
- Technology Trends: Innovation cycles, adoption curves

### AI Model Types
- Time Series Models: LSTM networks for historical pattern recognition
- Regression Models: Multi-variate analysis of market factors
- Ensemble Methods: Combining multiple models for robust predictions
- Monte Carlo Simulation: Probabilistic scenario generation

## Prognosis Factors Explained

### Market Dynamics (Weight: 25%)
Factors affecting overall market conditions:

#### Market Growth Rate
- Positive Indicators: Aging population, increased healthcare access
- Negative Indicators: Economic recession, healthcare budget cuts
- AI Analysis: Correlation with historical device adoption

#### Competitive Landscape
- Market Concentration: Number and strength of competitors
- Innovation Rate: Frequency of new product launches
- Switching Costs: Difficulty for customers to change vendors
- AI Insight: Competitive advantage sustainability

### Technology Factors (Weight: 20%)
Impact of technological advancement:

#### Innovation Cycle Position
- Emerging: High growth potential, high uncertainty
- Growth: Rapid adoption, increasing competition
- Mature: Stable demand, incremental improvements
- Declining: Replacement by new technologies

### Economic Indicators (Weight: 20%)
Macroeconomic factors affecting demand:

#### Healthcare Spending
- Government Budgets: Public healthcare investment
- Private Investment: Venture capital and R&D spending
- Insurance Coverage: Reimbursement availability
- Patient Affordability: Out-of-pocket payment capacity

## Interpreting AI Predictions

### Confidence Levels
Understanding prediction reliability:

#### High Confidence (85-95%)
- Strong Data: Multiple years of consistent patterns
- Stable Environment: Low market volatility
- Clear Trends: Obvious directional indicators
- Use Case: Strategic planning, investment decisions

#### Medium Confidence (65-85%)
- Moderate Data: Some historical patterns available
- Dynamic Environment: Some market changes
- Mixed Signals: Conflicting indicators present
- Use Case: Tactical planning, scenario analysis

#### Low Confidence (less than 65%)
- Limited Data: New markets or products
- Volatile Environment: Rapid market changes
- Weak Signals: Unclear trend directions
- Use Case: Risk assessment, contingency planning

## Best Practices for AI Insights

### Data Quality Management
- Regular Updates: Monthly data refresh for accuracy
- Data Validation: Cross-checking with external sources
- Bias Detection: Identifying and correcting data skews
- Source Diversity: Multiple data inputs for robustness

### Human-AI Collaboration
- Expert Validation: Subject matter expert review of predictions
- Contextual Adjustment: Local market knowledge integration
- Feedback Loops: Improving models with outcome data
- Decision Transparency: Understanding AI recommendation basis`,
    userRoles: ['admin', 'company_admin', 'consultant'],
    tags: ['ai-forecasting', 'prognosis-factors', 'market-intelligence', 'prediction', 'analytics']
  },
  {
    id: 'rnpv-integration',
    title: 'rNPV Model Integration',
    description: 'Connect commercial performance data with risk-adjusted NPV analysis',
    category: 'Financial Analysis',
    icon: <Calculator className="h-5 w-5" />,
    difficulty: 'advanced',
    estimatedTime: '15 minutes',
    content: `# rNPV Model Integration

Learn how to integrate commercial performance data with risk-adjusted Net Present Value (rNPV) analysis for comprehensive financial planning.

## rNPV Overview

Risk-adjusted NPV provides a sophisticated financial modeling approach that accounts for:
- Probability-weighted outcomes based on regulatory and commercial risks
- Time-value of money using appropriate discount rates
- Multiple scenario modeling for comprehensive risk assessment
- Sensitivity analysis to identify key value drivers

### Key Components

#### Cash Flow Modeling
- Revenue Projections: Based on commercial performance forecasts
- Cost Structure: Including development, regulatory, and operational costs
- Investment Timeline: Capital requirements and deployment schedule
- Working Capital: Inventory, receivables, and operational cash needs

#### Risk Assessment
- Regulatory Risk: Probability of approval and timeline uncertainty
- Commercial Risk: Market acceptance and competitive response
- Technical Risk: Development success probability
- Market Risk: Economic and healthcare policy changes

## Commercial Data Integration

### Revenue Input Sources
Commercial performance data feeds directly into rNPV calculations:

#### Historical Revenue Analysis
- Growth Trends: Used for baseline revenue projections
- Seasonality Patterns: Monthly adjustment factors
- Market Penetration: Customer adoption rate modeling
- Price Realization: Average selling price trends

#### Product Relationship Modeling
- Main Product Revenue: Primary cash flow streams
- Accessory Revenue: Recurring and one-time additional revenue
- Service Revenue: Maintenance, training, and support income
- Upgrade Revenue: Product enhancement and next-generation sales

## rNPV Calculation Methodology

### Multi-Scenario Modeling
The system generates multiple scenarios based on commercial data:

#### Optimistic Scenario (P90)
- Revenue: Top 10th percentile of commercial forecasts
- Costs: Lower end of cost projections
- Timeline: Accelerated development and approval
- Market: Favorable competitive and regulatory environment

#### Base Case Scenario (P50)
- Revenue: Median commercial performance forecast
- Costs: Expected cost structure
- Timeline: Standard development and approval timeline
- Market: Normal competitive and regulatory conditions

#### Pessimistic Scenario (P10)
- Revenue: Bottom 10th percentile of forecasts
- Costs: Upper end of cost projections
- Timeline: Delayed development and approval
- Market: Challenging competitive and regulatory environment

### Risk-Adjusted Calculations
Each scenario receives probability weighting based on commercial and technical factors.

## Integration Workflows

### Data Flow Architecture
Seamless integration between commercial and financial analysis:

#### Automated Data Transfer
- Revenue Forecasts: Direct feed from commercial forecasting
- Cost Projections: Integration with financial planning systems
- Risk Assessments: Regulatory and commercial risk factors
- Market Intelligence: External data source integration

#### Real-time Updates
- Monthly Refresh: Updated commercial data triggers rNPV recalculation
- Scenario Updates: New market intelligence updates scenario probabilities
- Performance Tracking: Actual vs. projected variance analysis
- Alert Systems: Significant change notifications to stakeholders

## Best Practices

### Model Validation
- Historical Backtesting: Validate model accuracy with past projects
- Cross-validation: Compare with external benchmarks and industry data
- Expert Review: Subject matter expert validation of assumptions
- Sensitivity Testing: Robustness analysis under extreme conditions

### Governance and Controls
- Assumption Documentation: Clear record of all model inputs and logic
- Approval Workflows: Multi-level review for key decisions
- Version Control: Tracking of model changes and updates
- Audit Trail: Complete record of decision-making process`,
    userRoles: ['admin', 'company_admin', 'consultant'],
    tags: ['rnpv', 'financial-modeling', 'risk-analysis', 'valuation', 'decision-support']
  }
];

export function CommercialPerformanceHelpContent() {
  const [selectedTopic, setSelectedTopic] = useState<CommercialHelpTopic | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'Data Management', name: 'Data Management', icon: <Database className="h-4 w-4" /> },
    { id: 'Forecasting', name: 'Forecasting', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'Portfolio Management', name: 'Portfolio Management', icon: <Link className="h-4 w-4" /> },
    { id: 'AI Intelligence', name: 'AI Intelligence', icon: <Brain className="h-4 w-4" /> },
    { id: 'Financial Analysis', name: 'Financial Analysis', icon: <Calculator className="h-4 w-4" /> }
  ];

  const filteredTopics = selectedCategory === 'all' 
    ? commercialHelpTopics 
    : commercialHelpTopics.filter(topic => topic.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">Commercial Performance & Forecasting Help</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Master the commercial performance management system with comprehensive guides covering data management, 
          smart forecasting, product relationships, and AI-powered analytics.
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              {category.icon}
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Topic List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Help Topics
            </h3>
            <div className="space-y-2">
              {filteredTopics.map((topic) => (
                <Card 
                  key={topic.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTopic?.id === topic.id ? 'ring-2 ring-primary shadow-md' : ''
                  }`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        {topic.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium leading-tight">
                          {topic.title}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {topic.description}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getDifficultyColor(topic.difficulty)}`}
                          >
                            {topic.difficulty}
                          </Badge>
                          {topic.estimatedTime && (
                            <Badge variant="outline" className="text-xs">
                              {topic.estimatedTime}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Content Display */}
          <div className="lg:col-span-2">
            {selectedTopic ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                      {selectedTopic.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{selectedTopic.title}</CardTitle>
                      <CardDescription className="mt-1">{selectedTopic.description}</CardDescription>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className={getDifficultyColor(selectedTopic.difficulty)}>
                          {selectedTopic.difficulty}
                        </Badge>
                        {selectedTopic.estimatedTime && (
                          <Badge variant="outline">
                            <Target className="h-3 w-3 mr-1" />
                            {selectedTopic.estimatedTime}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {selectedTopic.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-line text-sm leading-relaxed">
                      {selectedTopic.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <HelpCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Select a Help Topic</h3>
                  <p className="text-muted-foreground">
                    Choose a topic from the left to view detailed guidance and best practices.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and workflows in commercial performance management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Upload className="h-6 w-6" />
              <span className="font-medium">Upload Financial Data</span>
              <span className="text-xs text-muted-foreground">CSV import guide</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Link className="h-6 w-6" />
              <span className="font-medium">Setup Product Relationships</span>
              <span className="text-xs text-muted-foreground">Configure multipliers</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Brain className="h-6 w-6" />
              <span className="font-medium">Run Smart Forecast</span>
              <span className="text-xs text-muted-foreground">AI predictions</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Calculator className="h-6 w-6" />
              <span className="font-medium">Analyze rNPV</span>
              <span className="text-xs text-muted-foreground">Financial modeling</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}