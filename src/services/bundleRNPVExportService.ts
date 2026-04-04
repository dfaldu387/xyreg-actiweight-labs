import * as XLSX from 'xlsx';
import { formatCurrency } from '@/utils/marketCurrencyUtils';

interface MarketResult {
  npv: number;
  rnpv: number;
  totalRevenue: number;
  totalCosts: number;
  riskAdjustment: number;
  roi: number;
  cannibalizationImpact: number;
  affectedProductsCount: number;
  marketCode: string;
  marketName: string;
  monthlyResults?: Array<{
    month: number;
    year: number;
    revenue: number;
    costs: number;
    netCashFlow: number;
    cumulativeCashFlow: number;
    revenueRiskAdjusted?: number;
    costsRiskAdjusted?: number;
    netCashFlowRiskAdjusted?: number;
    cumulativeCashFlowRiskAdjusted?: number;
  }>;
}

interface MarketInputs {
  marketCode: string;
  marketName: string;
  launchDate: Date | null;
  patentExpiry: number;
  postPatentDeclineRate: number;
  monthlySalesForecast: number;
  initialUnitPrice: number;
  annualSalesForecastChange: number;
  annualUnitPriceChange: number;
  developmentCosts: number;
  clinicalTrialCosts: number;
  regulatoryCosts: number;
  manufacturingCosts: number;
  marketingCosts: number;
  operationalCosts: number;
  discountRate: number;
  projectLifetime: number;
  cannibalizationRate: number;
  affectedProductRevenue: number;
}

interface PortfolioResults {
  rnpv: number;
  roi: number;
  totalCosts: number;
  totalRevenue: number;
  riskAdjustment: number;
  cannibalizationImpact: number;
  affectedProductsCount: number;
  marketCount: number;
}

export class BundleRNPVExportService {
  /**
   * Export bundle rNPV analysis to Excel with multiple sheets
   */
  static exportToExcel(
    bundleName: string,
    marketResults: Record<string, MarketResult>,
    marketInputs: Record<string, MarketInputs>,
    portfolioResults: PortfolioResults,
    selectedMarkets: Array<{ code: string; name: string }>
  ): void {
    const workbook = XLSX.utils.book_new();

    // 1. Portfolio Summary Sheet
    this.addPortfolioSummarySheet(workbook, bundleName, marketResults, portfolioResults, selectedMarkets);

    // 2. Market Comparison Sheet
    this.addMarketComparisonSheet(workbook, marketResults, selectedMarkets);

    // 3. Individual Market Sheets (one per product)
    selectedMarkets.forEach(market => {
      const result = marketResults[market.code];
      const inputs = marketInputs[market.code];
      if (result && inputs) {
        this.addMarketDetailSheet(workbook, market, result, inputs);
      }
    });

    // 4. Cash Flow Timeline Sheet (all markets combined)
    this.addCashFlowTimelineSheet(workbook, marketResults, selectedMarkets);

    // Download the file
    const fileName = `${bundleName}_rNPV_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private static addPortfolioSummarySheet(
    workbook: XLSX.WorkBook,
    bundleName: string,
    marketResults: Record<string, MarketResult>,
    portfolioResults: PortfolioResults,
    selectedMarkets: Array<{ code: string; name: string }>
  ): void {
    const data = [
      ['Bundle rNPV Analysis - Portfolio Summary'],
      ['Bundle Name:', bundleName],
      ['Export Date:', new Date().toLocaleDateString()],
      ['Number of Products:', selectedMarkets.length],
      [],
      ['Portfolio Metrics'],
      ['Metric', 'Value'],
      ['Total Risk-Adjusted NPV (rNPV)', this.formatNumber(portfolioResults.rnpv)],
      ['Total Revenue', this.formatNumber(portfolioResults.totalRevenue)],
      ['Total Costs', this.formatNumber(portfolioResults.totalCosts)],
      ['Portfolio ROI', `${portfolioResults.roi.toFixed(2)}%`],
      ['Average Risk Adjustment', `${portfolioResults.riskAdjustment.toFixed(2)}%`],
      ['Cannibalization Impact', this.formatNumber(portfolioResults.cannibalizationImpact)],
      ['Markets Analyzed', portfolioResults.marketCount],
      [],
      ['Product Performance Summary'],
      ['Product Name', 'rNPV', 'ROI', 'Revenue', 'Costs', 'Risk'],
    ];

    selectedMarkets.forEach(market => {
      const result = marketResults[market.code];
      if (result) {
        data.push([
          market.name || market.code,
          this.formatNumber(result.rnpv),
          `${result.roi.toFixed(2)}%`,
          this.formatNumber(result.totalRevenue),
          this.formatNumber(result.totalCosts),
          `${result.riskAdjustment.toFixed(2)}%`,
        ]);
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Portfolio Summary');
  }

  private static addMarketComparisonSheet(
    workbook: XLSX.WorkBook,
    marketResults: Record<string, MarketResult>,
    selectedMarkets: Array<{ code: string; name: string }>
  ): void {
    const data: any[][] = [
      ['Market Comparison - Side by Side'],
      [],
      ['Product', 'rNPV', 'NPV', 'ROI (%)', 'Total Revenue', 'Total Costs', 'Risk Adjustment (%)', 'Cannibalization Impact'],
    ];

    selectedMarkets.forEach(market => {
      const result = marketResults[market.code];
      if (result) {
        data.push([
          market.name || market.code,
          Number(result.rnpv),
          Number(result.npv),
          Number(result.roi.toFixed(2)),
          Number(result.totalRevenue),
          Number(result.totalCosts),
          Number(result.riskAdjustment.toFixed(2)),
          Number(result.cannibalizationImpact),
        ]);
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 18 },
      { wch: 15 },
      { wch: 20 },
      { wch: 22 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Market Comparison');
  }

  private static addMarketDetailSheet(
    workbook: XLSX.WorkBook,
    market: { code: string; name: string },
    result: MarketResult,
    inputs: MarketInputs
  ): void {
    const data = [
      [`Product: ${market.name || market.code}`],
      [],
      ['Financial Results'],
      ['Metric', 'Value'],
      ['Risk-Adjusted NPV (rNPV)', this.formatNumber(result.rnpv)],
      ['Standard NPV', this.formatNumber(result.npv)],
      ['Total Revenue', this.formatNumber(result.totalRevenue)],
      ['Total Costs', this.formatNumber(result.totalCosts)],
      ['Return on Investment (ROI)', `${result.roi.toFixed(2)}%`],
      ['Risk Adjustment Factor', `${result.riskAdjustment.toFixed(2)}%`],
      ['Cannibalization Impact', this.formatNumber(result.cannibalizationImpact)],
      [],
      ['Input Parameters'],
      ['Parameter', 'Value'],
      ['Launch Date', inputs.launchDate ? inputs.launchDate.toLocaleDateString() : 'Not set'],
      ['Patent Expiry Year', inputs.patentExpiry],
      ['Post-Patent Decline Rate', `${inputs.postPatentDeclineRate}%`],
      ['Monthly Sales Forecast', this.formatNumber(inputs.monthlySalesForecast)],
      ['Initial Unit Price', this.formatNumber(inputs.initialUnitPrice)],
      ['Annual Sales Forecast Change', `${inputs.annualSalesForecastChange}%`],
      ['Annual Unit Price Change', `${inputs.annualUnitPriceChange}%`],
      ['Project Lifetime (years)', inputs.projectLifetime],
      ['Discount Rate', `${inputs.discountRate}%`],
      [],
      ['Cost Breakdown'],
      ['Cost Category', 'Amount'],
      ['Development Costs', this.formatNumber(inputs.developmentCosts)],
      ['Clinical Trial Costs', this.formatNumber(inputs.clinicalTrialCosts)],
      ['Regulatory Costs', this.formatNumber(inputs.regulatoryCosts)],
      ['Manufacturing Costs', this.formatNumber(inputs.manufacturingCosts)],
      ['Marketing Costs', this.formatNumber(inputs.marketingCosts)],
      ['Operational Costs', this.formatNumber(inputs.operationalCosts)],
      ['Total Costs', this.formatNumber(result.totalCosts)],
    ];

    // Add monthly cash flow data if available
    if (result.monthlyResults && result.monthlyResults.length > 0) {
      data.push(
        [],
        ['Monthly Cash Flow Projection'],
        ['Month', 'Year', 'Revenue', 'Costs', 'Net Cash Flow', 'Cumulative Cash Flow', 'Risk-Adj Revenue', 'Risk-Adj Costs', 'Risk-Adj Net CF', 'Risk-Adj Cumulative']
      );

      result.monthlyResults.forEach(month => {
        data.push([
          month.month,
          month.year,
          month.revenue,
          month.costs,
          month.netCashFlow,
          month.cumulativeCashFlow,
          month.revenueRiskAdjusted || 0,
          month.costsRiskAdjusted || 0,
          month.netCashFlowRiskAdjusted || 0,
          month.cumulativeCashFlowRiskAdjusted || 0,
        ]);
      });
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
    ];

    // Sanitize sheet name (max 31 chars, no special characters)
    const sheetName = (market.name || market.code)
      .substring(0, 31)
      .replace(/[:\\/?*\[\]]/g, '_');

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  private static addCashFlowTimelineSheet(
    workbook: XLSX.WorkBook,
    marketResults: Record<string, MarketResult>,
    selectedMarkets: Array<{ code: string; name: string }>
  ): void {
    // Find the maximum number of months across all markets
    let maxMonths = 0;
    Object.values(marketResults).forEach(result => {
      if (result.monthlyResults && result.monthlyResults.length > maxMonths) {
        maxMonths = result.monthlyResults.length;
      }
    });

    const headers = ['Month', 'Year'];
    selectedMarkets.forEach(market => {
      headers.push(`${market.name || market.code} - Net CF`);
      headers.push(`${market.name || market.code} - Cumulative`);
    });

    const data = [
      ['Cash Flow Timeline - All Products'],
      [],
      headers,
    ];

    // Build rows for each month
    for (let i = 0; i < maxMonths; i++) {
      const row: any[] = [];
      
      // Get month and year from first available market
      const firstMarket = selectedMarkets[0];
      const firstResult = marketResults[firstMarket.code];
      if (firstResult?.monthlyResults?.[i]) {
        row.push(firstResult.monthlyResults[i].month);
        row.push(firstResult.monthlyResults[i].year);
      } else {
        row.push(i + 1);
        row.push('');
      }

      // Add data for each market
      selectedMarkets.forEach(market => {
        const result = marketResults[market.code];
        if (result?.monthlyResults?.[i]) {
          row.push(result.monthlyResults[i].netCashFlowRiskAdjusted || result.monthlyResults[i].netCashFlow);
          row.push(result.monthlyResults[i].cumulativeCashFlowRiskAdjusted || result.monthlyResults[i].cumulativeCashFlow);
        } else {
          row.push(0);
          row.push(0);
        }
      });

      data.push(row);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    const colWidths = [{ wch: 8 }, { wch: 8 }];
    selectedMarkets.forEach(() => {
      colWidths.push({ wch: 18 });
      colWidths.push({ wch: 18 });
    });
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cash Flow Timeline');
  }

  private static formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
