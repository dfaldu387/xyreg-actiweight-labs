export const MARKET_ANALYSIS_TOOLTIPS: Record<string, string> = {
  // Revenue Model
  'launchDate': 'The date when the product is expected to launch in this market (actual or estimated from regulatory information)',
  'patentExpiry': 'The year when the patent protection expires, allowing competitors to enter',
  'postPatentDeclineRate': 'Annual percentage decline in sales after patent expiry due to generic competition (typically 20-40%)',
  'monthlySalesForecast': 'Expected number of units sold per month at market maturity',
  'initialUnitPrice': 'The selling price per unit at product launch',
  'annualSalesForecastChange': 'Expected annual percentage change in unit sales (positive for growth, negative for decline)',
  'annualUnitPriceChange': 'Expected annual percentage change in unit price (e.g., inflation, market dynamics)',
  
  // Cost Structure
  'developmentCosts': 'Total R&D and development costs for this market (design, testing, prototyping)',
  'clinicalTrialCosts': 'Costs for clinical studies and trials required in this market',
  'regulatoryCosts': 'Regulatory submission fees, consultants, and compliance costs (FDA, CE Mark, etc.)',
  'manufacturingCosts': 'Per-unit manufacturing and production costs (COGS)',
  'customerAcquisitionCost': 'Total cost to acquire one customer (marketing, sales, demos, travel, etc.). CAC helps assess commercial scalability and unit economics.',
  'marketingCosts': 'Annual marketing, sales, and promotional expenses for this market',
  'operationalCosts': 'Annual operational costs including distribution, support, and overhead',
  
  // Risk Assessment
  'technicalRisk': 'Probability of technical development failure or delays (0-100%)',
  'regulatoryRisk': 'Probability of regulatory approval issues or delays (0-100%)',
  'commercialRisk': 'Probability of market adoption or sales underperformance (0-100%)',
  'competitiveRisk': 'Probability of competitive threats impacting market share (0-100%)',
  
  // Financial Parameters
  'discountRate': 'Weighted Average Cost of Capital (WACC) or required rate of return for NPV calculation',
  'taxRate': 'Corporate tax rate applicable in this market (as percentage)',
  'projectLifetime': 'Total number of years to evaluate the project (typically 10-20 years)',
  
  // Cannibalization
  'cannibalizationRate': 'Percentage of existing product sales that will be replaced by this new product',
  'affectedProductRevenue': 'Annual revenue from existing products that may be cannibalized',
};
