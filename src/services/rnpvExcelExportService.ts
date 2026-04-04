import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MarketNPVInputData } from './npvPersistenceService';
import { NPVCalculationResult, MonthlyResult } from './npvCalculationService';

export interface RNPVExportData {
  productName: string;
  marketName: string;
  currency: string;
  exportDate: Date;
  inputData: MarketNPVInputData;
  calculationResult: NPVCalculationResult;
}

export class RNPVExcelExportService {
  /**
   * Export complete rNPV model data to Excel for validation
   */
  static async exportToExcel(data: RNPVExportData): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summarySheet = this.createSummarySheet(data);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Sheet 2: Input Parameters
      const inputsSheet = this.createInputParametersSheet(data);
      XLSX.utils.book_append_sheet(workbook, inputsSheet, 'Input Parameters');

      // Sheet 3: Calculation Assumptions
      const assumptionsSheet = this.createCalculationAssumptionsSheet(data);
      XLSX.utils.book_append_sheet(workbook, assumptionsSheet, 'Calc Assumptions');

      // Sheet 4: Monthly Cash Flows
      const monthlySheet = this.createMonthlyCashFlowsSheet(data);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Cash Flows');

      // Sheet 5: Yearly Summary
      const yearlySheet = this.createYearlySummarySheet(data);
      XLSX.utils.book_append_sheet(workbook, yearlySheet, 'Yearly Summary');

      // Generate file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const filename = `rNPV_Model_${data.productName.replace(/[^a-z0-9]/gi, '_')}_${data.marketName}_${new Date().toISOString().split('T')[0]}`;
      saveAs(blob, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting rNPV to Excel:', error);
      throw new Error('Failed to export rNPV data to Excel');
    }
  }

  /**
   * Sheet 1: Summary - High-level KPIs
   */
  private static createSummarySheet(data: RNPVExportData): XLSX.WorkSheet {
    const { productName, marketName, currency, exportDate, calculationResult } = data;
    
    const rows = [
      ['rNPV Model Validation Export'],
      [''],
      ['PRODUCT INFORMATION'],
      ['Product Name', productName],
      ['Market', marketName],
      ['Currency', currency],
      ['Export Date', exportDate.toISOString().split('T')[0]],
      ['Export Time', exportDate.toISOString().split('T')[1].split('.')[0]],
      [''],
      ['KEY RESULTS'],
      ['Metric', 'Value', 'Unit'],
      ['Net Present Value (NPV)', calculationResult.npv, currency],
      ['Total Revenue', calculationResult.totalRevenue, currency],
      ['Total Operating Costs', calculationResult.totalCosts, currency],
      ['Total R&D Costs', calculationResult.totalRndCosts, currency],
      ['Total Cannibalization Loss', calculationResult.totalCannibalizationLoss, currency],
      ['Total Projected Profit', calculationResult.totalProjectedProfit, currency],
      [''],
      ['PERFORMANCE METRICS'],
      ['Internal Rate of Return (IRR)', calculationResult.irr, '%'],
      ['Average Annual Profit Margin', calculationResult.averageAnnualProfitMargin, '%'],
      ['Payback Period (Nominal)', calculationResult.paybackPeriodMonths, 'months'],
      ['NPV Break-even Time', calculationResult.npvBreakEvenMonths, 'months'],
      [''],
      ['DATA QUALITY'],
      ['Monthly Data Points', calculationResult.monthlyResults.length, 'months'],
      ['Development Months', calculationResult.monthlyResults.filter(m => m.phase === 'development').length, 'months'],
      ['Revenue Months', calculationResult.monthlyResults.filter(m => m.phase === 'revenue').length, 'months'],
    ];

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * Sheet 2: Input Parameters - All input values used
   */
  private static createInputParametersSheet(data: RNPVExportData): XLSX.WorkSheet {
    const { inputData } = data;
    
    const rows = [
      ['INPUT PARAMETERS'],
      ['All values used in the rNPV calculation'],
      [''],
      ['CATEGORY', 'PARAMETER', 'VALUE', 'UNIT'],
      [''],
      ['TIMING'],
      ['', 'Market Launch Date', inputData.marketLaunchDate ? new Date(inputData.marketLaunchDate).toISOString().split('T')[0] : 'Not Set', 'Date'],
      ['', 'Forecast Duration', inputData.forecastDuration, 'months'],
      ['', 'Development Phase Duration', inputData.developmentPhaseMonths, 'months'],
      [''],
      ['REVENUE MODEL'],
      ['', 'Monthly Sales Forecast', inputData.monthlySalesForecast, 'units/month'],
      ['', 'Annual Sales Growth Rate', inputData.annualSalesForecastChange, '%'],
      ['', 'Initial Unit Price', inputData.initialUnitPrice, data.currency],
      ['', 'Annual Price Change', inputData.annualUnitPriceChange, '%'],
      [''],
      ['COST STRUCTURE'],
      ['', 'Initial Variable Cost (COGS)', inputData.initialVariableCost, data.currency + '/unit'],
      ['', 'Annual Variable Cost Change', inputData.annualVariableCostChange, '%'],
      ['', 'Allocated Monthly Fixed Costs', inputData.allocatedMonthlyFixedCosts, data.currency + '/month'],
      ['', 'Annual Fixed Cost Change', inputData.annualFixedCostChange, '%'],
      [''],
      ['R&D COSTS'],
      ['', 'R&D Work Costs', inputData.rndWorkCosts, data.currency],
      ['', 'R&D Work Costs Spread', inputData.rndWorkCostsSpread, 'months'],
      ['', 'R&D Material/Machine Costs', inputData.rndMaterialMachineCosts, data.currency],
      ['', 'R&D Material/Machine Spread', inputData.rndMaterialMachineSpread, 'months'],
      ['', 'R&D Startup Production Costs', inputData.rndStartupProductionCosts, data.currency],
      ['', 'R&D Startup Production Spread', inputData.rndStartupProductionSpread, 'months'],
      ['', 'R&D Patent Costs', inputData.rndPatentCosts, data.currency],
      ['', 'R&D Patent Spread', inputData.rndPatentSpread, 'months'],
      [''],
      ['MARKETING'],
      ['', 'Total Marketing Budget', inputData.totalMarketingBudget, data.currency],
      ['', 'Marketing Spread', inputData.marketingSpreadMonths, 'months'],
      [''],
      ['FINANCIAL PARAMETERS'],
      ['', 'Discount Rate', inputData.discountRate, '%'],
      ['', 'Royalty Rate', inputData.royaltyRate, '%'],
      [''],
      ['PATENT & LIFECYCLE'],
      ['', 'Patent Expiry Year', inputData.patentExpiry, 'year'],
      ['', 'Post-Patent Decline Rate', inputData.postPatentDeclineRate, '%'],
      [''],
      ['CANNIBALIZATION'],
      ['', 'Cannibalized Revenue (Monthly)', inputData.cannibalizedRevenue, data.currency + '/month'],
      ['', 'Affected Products Count', inputData.affectedProducts?.length || 0, 'products'],
    ];

    // Add affected products if any
    if (inputData.affectedProducts && inputData.affectedProducts.length > 0) {
      rows.push(['']);
      rows.push(['AFFECTED PRODUCTS DETAIL']);
      rows.push(['', 'Product ID', 'Product Name', 'Total Cannibalization %', 'Months to Reach Roof']);
      inputData.affectedProducts.forEach(product => {
        rows.push(['', product.productId, product.productName, product.totalCannibalizationPercentage || 0, product.monthsToReachRoof || 0]);
      });
    }

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * Sheet 3: Calculation Assumptions - Formulas and derived values
   */
  private static createCalculationAssumptionsSheet(data: RNPVExportData): XLSX.WorkSheet {
    const { inputData } = data;
    const monthlyDiscountRate = inputData.discountRate / 100 / 12;
    
    const totalRndCosts = 
      inputData.rndWorkCosts + 
      inputData.rndMaterialMachineCosts + 
      inputData.rndStartupProductionCosts + 
      inputData.rndPatentCosts;

    const rows = [
      ['CALCULATION ASSUMPTIONS & FORMULAS'],
      ['This sheet documents the formulas used in the rNPV model'],
      [''],
      ['DISCOUNT RATE CONVERSION'],
      ['Formula', 'Value'],
      ['Annual Discount Rate', `${inputData.discountRate}%`],
      ['Monthly Discount Rate Formula', 'Annual Rate / 100 / 12'],
      ['Monthly Discount Rate', `${(monthlyDiscountRate * 100).toFixed(6)}%`],
      ['Monthly Discount Rate (decimal)', monthlyDiscountRate.toFixed(8)],
      [''],
      ['PRESENT VALUE CALCULATION'],
      ['Formula', 'PV = Cash Flow / (1 + Monthly Rate)^Month'],
      ['Example Month 12', `PV = CF / (1 + ${monthlyDiscountRate.toFixed(6)})^12`],
      ['Discount Factor Month 12', (1 / Math.pow(1 + monthlyDiscountRate, 12)).toFixed(6)],
      [''],
      ['REVENUE GROWTH MODEL'],
      ['Formula', 'Revenue(year) = Base Revenue × (1 + Growth Rate)^(year-1)'],
      ['Annual Growth Rate', `${inputData.annualSalesForecastChange}%`],
      ['Year 1 Multiplier', '1.0000'],
      ['Year 2 Multiplier', Math.pow(1 + inputData.annualSalesForecastChange / 100, 1).toFixed(4)],
      ['Year 3 Multiplier', Math.pow(1 + inputData.annualSalesForecastChange / 100, 2).toFixed(4)],
      ['Year 5 Multiplier', Math.pow(1 + inputData.annualSalesForecastChange / 100, 4).toFixed(4)],
      [''],
      ['COST CALCULATIONS'],
      ['Monthly Revenue (Base)', inputData.monthlySalesForecast * inputData.initialUnitPrice],
      ['Monthly COGS (Base)', inputData.monthlySalesForecast * inputData.initialVariableCost],
      ['Gross Margin per Unit', inputData.initialUnitPrice - inputData.initialVariableCost],
      ['Gross Margin %', inputData.initialUnitPrice > 0 ? 
        `${((inputData.initialUnitPrice - inputData.initialVariableCost) / inputData.initialUnitPrice * 100).toFixed(2)}%` : 'N/A'],
      [''],
      ['R&D COST ALLOCATION'],
      ['Total R&D Investment', totalRndCosts],
      ['Work Costs Allocation', `${inputData.rndWorkCosts} over ${inputData.rndWorkCostsSpread} months`],
      ['Material/Machine Allocation', `${inputData.rndMaterialMachineCosts} over ${inputData.rndMaterialMachineSpread} months`],
      ['Startup Production Allocation', `${inputData.rndStartupProductionCosts} over ${inputData.rndStartupProductionSpread} months`],
      ['Patent Costs Allocation', `${inputData.rndPatentCosts} over ${inputData.rndPatentSpread} months`],
      [''],
      ['NET CASH FLOW FORMULA'],
      ['Formula', 'NCF = Revenue - Operating Costs - R&D Costs - Cannibalization'],
      ['Development Phase', 'NCF = 0 - 0 - R&D Costs - 0'],
      ['Revenue Phase', 'NCF = Revenue - COGS - Fixed Costs - Cannibalization'],
      [''],
      ['NPV FORMULA'],
      ['Formula', 'NPV = Σ (NCF_month / (1 + monthly_rate)^month)'],
      ['Summation', 'Sum of all monthly present values from month 1 to end'],
      [''],
      ['IRR CALCULATION'],
      ['Method', 'Newton-Raphson iterative method'],
      ['Tolerance', '0.0001'],
      ['Max Iterations', '100'],
    ];

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * Sheet 4: Monthly Cash Flows - Complete month-by-month breakdown
   */
  private static createMonthlyCashFlowsSheet(data: RNPVExportData): XLSX.WorkSheet {
    const { calculationResult, inputData, currency } = data;
    const monthlyDiscountRate = inputData.discountRate / 100 / 12;
    
    const headers = [
      'Month',
      'Year',
      'Phase',
      `Revenue (${currency})`,
      `Operating Costs (${currency})`,
      `R&D Costs (${currency})`,
      `Cannibalization (${currency})`,
      `Net Cash Flow (${currency})`,
      'Discount Factor',
      `Present Value (${currency})`,
      `Cumulative CF (${currency})`,
      `Cumulative NPV (${currency})`,
    ];

    const rows: (string | number)[][] = [headers];
    
    // Check if we have valid monthly results
    const hasValidMonthlyResults = calculationResult.monthlyResults && 
      calculationResult.monthlyResults.length > 0 &&
      calculationResult.monthlyResults[0]?.presentValue !== undefined;
    
    if (hasValidMonthlyResults) {
      let cumulativeNPV = 0;
      
      calculationResult.monthlyResults.forEach((monthResult: MonthlyResult) => {
        const discountFactor = 1 / Math.pow(1 + monthlyDiscountRate, monthResult.month);
        const presentValue = monthResult.presentValue ?? 0;
        cumulativeNPV += presentValue;
        
        rows.push([
          monthResult.month ?? 0,
          Math.ceil((monthResult.month ?? 1) / 12),
          monthResult.phase ?? 'revenue',
          monthResult.revenue ?? 0,
          monthResult.costs ?? 0,
          monthResult.rndCosts ?? 0,
          monthResult.cannibalizationLoss ?? 0,
          monthResult.netCashFlow ?? 0,
          parseFloat(discountFactor.toFixed(6)),
          parseFloat(presentValue.toFixed(2)),
          parseFloat((monthResult.cumulativeCashFlow ?? 0).toFixed(2)),
          parseFloat(cumulativeNPV.toFixed(2)),
        ]);
      });
    } else {
      // Generate monthly data from aggregate totals when detailed data is unavailable
      const totalMonths = inputData.forecastDuration || 60;
      const devMonths = inputData.developmentPhaseMonths || 0;
      const revenueMonths = totalMonths - devMonths;
      
      // Calculate monthly averages
      const monthlyRevenue = revenueMonths > 0 ? (calculationResult.totalRevenue || 0) / revenueMonths : 0;
      const monthlyCosts = revenueMonths > 0 ? (calculationResult.totalCosts || 0) / revenueMonths : 0;
      const monthlyRnd = devMonths > 0 ? (calculationResult.totalRndCosts || 0) / devMonths : 0;
      const monthlyCannibalization = revenueMonths > 0 ? (calculationResult.totalCannibalizationLoss || 0) / revenueMonths : 0;
      
      let cumulativeCF = 0;
      let cumulativeNPV = 0;
      
      for (let month = 1; month <= totalMonths; month++) {
        const isDev = month <= devMonths;
        const rev = isDev ? 0 : monthlyRevenue;
        const costs = isDev ? 0 : monthlyCosts;
        const rnd = isDev ? monthlyRnd : 0;
        const cannib = isDev ? 0 : monthlyCannibalization;
        const ncf = rev - costs - rnd - cannib;
        const discountFactor = 1 / Math.pow(1 + monthlyDiscountRate, month);
        const pv = ncf * discountFactor;
        
        cumulativeCF += ncf;
        cumulativeNPV += pv;
        
        rows.push([
          month,
          Math.ceil(month / 12),
          isDev ? 'development' : 'revenue',
          parseFloat(rev.toFixed(2)),
          parseFloat(costs.toFixed(2)),
          parseFloat(rnd.toFixed(2)),
          parseFloat(cannib.toFixed(2)),
          parseFloat(ncf.toFixed(2)),
          parseFloat(discountFactor.toFixed(6)),
          parseFloat(pv.toFixed(2)),
          parseFloat(cumulativeCF.toFixed(2)),
          parseFloat(cumulativeNPV.toFixed(2)),
        ]);
      }
    }

    // Add totals row
    rows.push([]);
    rows.push([
      'TOTALS',
      '',
      '',
      calculationResult.totalRevenue ?? 0,
      calculationResult.totalCosts ?? 0,
      calculationResult.totalRndCosts ?? 0,
      calculationResult.totalCannibalizationLoss ?? 0,
      (calculationResult.totalRevenue ?? 0) - (calculationResult.totalCosts ?? 0) - (calculationResult.totalRndCosts ?? 0) - (calculationResult.totalCannibalizationLoss ?? 0),
      '',
      calculationResult.npv ?? 0,
      '',
      calculationResult.npv ?? 0,
    ]);

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * Sheet 5: Yearly Summary - Aggregated annual data
   */
  private static createYearlySummarySheet(data: RNPVExportData): XLSX.WorkSheet {
    const { calculationResult, inputData, currency } = data;
    const monthlyDiscountRate = inputData.discountRate / 100 / 12;
    
    // Aggregate monthly data by year
    const yearlyData: Record<number, {
      revenue: number;
      costs: number;
      rndCosts: number;
      cannibalization: number;
      netCashFlow: number;
      presentValue: number;
    }> = {};

    // Check if we have valid monthly results
    const hasValidMonthlyResults = calculationResult.monthlyResults && 
      calculationResult.monthlyResults.length > 0 &&
      calculationResult.monthlyResults[0]?.presentValue !== undefined;

    if (hasValidMonthlyResults) {
      calculationResult.monthlyResults.forEach((monthResult: MonthlyResult) => {
        const year = Math.ceil((monthResult.month ?? 1) / 12);
        
        if (!yearlyData[year]) {
          yearlyData[year] = {
            revenue: 0,
            costs: 0,
            rndCosts: 0,
            cannibalization: 0,
            netCashFlow: 0,
            presentValue: 0,
          };
        }
        
        yearlyData[year].revenue += monthResult.revenue ?? 0;
        yearlyData[year].costs += monthResult.costs ?? 0;
        yearlyData[year].rndCosts += monthResult.rndCosts ?? 0;
        yearlyData[year].cannibalization += monthResult.cannibalizationLoss ?? 0;
        yearlyData[year].netCashFlow += monthResult.netCashFlow ?? 0;
        yearlyData[year].presentValue += monthResult.presentValue ?? 0;
      });
    } else {
      // Generate yearly data from aggregate totals
      const totalYears = Math.ceil((inputData.forecastDuration || 60) / 12);
      const devYears = Math.ceil((inputData.developmentPhaseMonths || 0) / 12);
      const revenueYears = Math.max(totalYears - devYears, 1);
      
      const yearlyRevenue = (calculationResult.totalRevenue || 0) / revenueYears;
      const yearlyCosts = (calculationResult.totalCosts || 0) / revenueYears;
      const yearlyRnd = devYears > 0 ? (calculationResult.totalRndCosts || 0) / devYears : 0;
      const yearlyCannib = (calculationResult.totalCannibalizationLoss || 0) / revenueYears;
      
      for (let year = 1; year <= totalYears; year++) {
        const isDev = year <= devYears;
        const rev = isDev ? 0 : yearlyRevenue;
        const costs = isDev ? 0 : yearlyCosts;
        const rnd = isDev ? yearlyRnd : 0;
        const cannib = isDev ? 0 : yearlyCannib;
        const ncf = rev - costs - rnd - cannib;
        const avgMonthInYear = (year - 1) * 12 + 6;
        const discountFactor = 1 / Math.pow(1 + monthlyDiscountRate, avgMonthInYear);
        const pv = ncf * discountFactor;
        
        yearlyData[year] = {
          revenue: rev,
          costs: costs,
          rndCosts: rnd,
          cannibalization: cannib,
          netCashFlow: ncf,
          presentValue: pv,
        };
      }
    }

    const headers = [
      'Year',
      `Annual Revenue (${currency})`,
      `Annual Operating Costs (${currency})`,
      `Annual R&D Costs (${currency})`,
      `Annual Cannibalization (${currency})`,
      `Annual Net Cash Flow (${currency})`,
      `Annual Present Value (${currency})`,
      `Cumulative NPV (${currency})`,
    ];

    const rows: (string | number)[][] = [
      ['YEARLY SUMMARY'],
      ['Aggregated annual data for validation'],
      [''],
      headers,
    ];
    
    let cumulativeNPV = 0;
    const years = Object.keys(yearlyData).map(Number).sort((a, b) => a - b);
    
    years.forEach(year => {
      const yearData = yearlyData[year];
      cumulativeNPV += yearData.presentValue;
      
      rows.push([
        year,
        parseFloat(yearData.revenue.toFixed(2)),
        parseFloat(yearData.costs.toFixed(2)),
        parseFloat(yearData.rndCosts.toFixed(2)),
        parseFloat(yearData.cannibalization.toFixed(2)),
        parseFloat(yearData.netCashFlow.toFixed(2)),
        parseFloat(yearData.presentValue.toFixed(2)),
        parseFloat(cumulativeNPV.toFixed(2)),
      ]);
    });

    // Add totals
    rows.push([]);
    rows.push([
      'TOTAL',
      calculationResult.totalRevenue ?? 0,
      calculationResult.totalCosts ?? 0,
      calculationResult.totalRndCosts ?? 0,
      calculationResult.totalCannibalizationLoss ?? 0,
      (calculationResult.totalRevenue ?? 0) - (calculationResult.totalCosts ?? 0) - (calculationResult.totalRndCosts ?? 0) - (calculationResult.totalCannibalizationLoss ?? 0),
      calculationResult.npv ?? 0,
      calculationResult.npv ?? 0,
    ]);

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * Export simplified data from Genesis Essential view
   */
  static async exportEssentialToExcel(data: {
    productName: string;
    marketCode: string;
    currency: string;
    inputs: {
      launchDate: string;
      forecastDurationYears: number;
      monthlyUnits: number;
      unitPrice: number;
      annualGrowthPercent: number;
      cogsPerUnit: number;
      developmentCosts: number;
      discountRate: number;
    };
    results: {
      npv: number;
      peakRevenue: number;
      grossMargin: number;
      breakEvenYear: number | null;
      yearlyData: Array<{ year: number; revenue: number; profit: number; cumulative: number }>;
    };
  }): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();
      const { productName, marketCode, currency, inputs, results } = data;

      // Summary Sheet
      const summaryRows = [
        ['rNPV Essential Model Export'],
        [''],
        ['Product', productName],
        ['Market', marketCode],
        ['Currency', currency],
        ['Export Date', new Date().toISOString().split('T')[0]],
        [''],
        ['KEY RESULTS'],
        ['Net Present Value (NPV)', results.npv, currency],
        ['Peak Annual Revenue', results.peakRevenue, currency],
        ['Gross Margin', results.grossMargin, '%'],
        ['Break-even Year', results.breakEvenYear || 'Not reached', 'year'],
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');

      // Inputs Sheet
      const inputRows = [
        ['INPUT PARAMETERS'],
        [''],
        ['Parameter', 'Value', 'Unit'],
        ['Launch Date', inputs.launchDate || 'Not Set', 'Date'],
        ['Forecast Duration', inputs.forecastDurationYears, 'years'],
        ['Monthly Units Sold', inputs.monthlyUnits, 'units/month'],
        ['Unit Price', inputs.unitPrice, currency],
        ['Annual Growth Rate', inputs.annualGrowthPercent, '%'],
        ['COGS per Unit', inputs.cogsPerUnit, currency + '/unit'],
        ['Development Costs', inputs.developmentCosts, currency],
        ['Discount Rate', inputs.discountRate, '%'],
        [''],
        ['DERIVED VALUES'],
        ['Annual Units (Base)', inputs.monthlyUnits * 12, 'units/year'],
        ['Annual Revenue (Base)', inputs.monthlyUnits * 12 * inputs.unitPrice, currency],
        ['Annual COGS (Base)', inputs.monthlyUnits * 12 * inputs.cogsPerUnit, currency],
        ['Gross Profit per Unit', inputs.unitPrice - inputs.cogsPerUnit, currency],
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(inputRows), 'Inputs');

      // Yearly Cash Flows
      const yearlyHeaders = ['Year', `Revenue (${currency})`, `Profit (${currency})`, `Cumulative (${currency})`];
      const yearlyRows: (string | number)[][] = [
        ['YEARLY CASH FLOWS'],
        [''],
        yearlyHeaders,
      ];
      results.yearlyData.forEach(y => {
        yearlyRows.push([y.year, y.revenue, y.profit, y.cumulative]);
      });
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(yearlyRows), 'Yearly Cash Flows');

      // Calculation Formulas
      const formulaRows = [
        ['CALCULATION FORMULAS'],
        [''],
        ['Formula', 'Expression'],
        ['Monthly Discount Rate', `${inputs.discountRate}% / 12 = ${(inputs.discountRate / 12).toFixed(4)}%`],
        ['Revenue Growth (Year N)', `Base × (1 + ${inputs.annualGrowthPercent}%)^(N-1)`],
        ['Gross Margin', `(Price - COGS) / Price × 100 = ${results.grossMargin.toFixed(2)}%`],
        ['NPV', 'Sum of discounted annual profits - Development Costs'],
        [''],
        ['EXAMPLE CALCULATIONS'],
        ['Year 1 Revenue', `${inputs.monthlyUnits * 12} × ${inputs.unitPrice} = ${inputs.monthlyUnits * 12 * inputs.unitPrice}`],
        ['Year 1 COGS', `${inputs.monthlyUnits * 12} × ${inputs.cogsPerUnit} = ${inputs.monthlyUnits * 12 * inputs.cogsPerUnit}`],
        ['Year 1 Gross Profit', `${inputs.monthlyUnits * 12 * inputs.unitPrice} - ${inputs.monthlyUnits * 12 * inputs.cogsPerUnit} = ${inputs.monthlyUnits * 12 * (inputs.unitPrice - inputs.cogsPerUnit)}`],
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(formulaRows), 'Formulas');

      // Generate file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const filename = `rNPV_Essential_${productName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`;
      saveAs(blob, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting essential rNPV to Excel:', error);
      throw new Error('Failed to export rNPV data to Excel');
    }
  }
}
