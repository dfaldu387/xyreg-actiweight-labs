import { supabase } from "@/integrations/supabase/client";

export interface CSVRowData {
  product_id: string;
  product_name: string;
  platform: string;
  category: string;
  market_code: string;
  period_start: string;
  period_end: string;
  revenue_amount: number;
  cogs_amount: number;
  units_sold: number;
  attributed_revenue?: number;
  currency_code: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ParseResult {
  data: CSVRowData[];
  errors: ValidationError[];
  warnings: string[];
}

export class CSVCommercialDataParser {
  private static readonly REQUIRED_HEADERS = [
    'Product ID',
    'Product Name', 
    'Platform',
    'Category',
    'Market Code',
    'Period (YYYY-MM)',
    'Actual Revenue',
    'Actual COGS',
    'Units Sold',
    'Currency Code'
  ];

  private static readonly OPTIONAL_HEADERS = [
    'Attributed Revenue'
  ];

  private static readonly VALID_MARKETS = ['US', 'EU', 'CA', 'AU', 'JP', 'UK', 'DE', 'FR'];
  private static readonly VALID_CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'JPY', 'GBP'];

  static parseCSV(csvContent: string): ParseResult {
    const lines = csvContent.trim().split('\n');
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const data: CSVRowData[] = [];

    if (lines.length < 2) {
      errors.push({ row: 0, field: 'file', message: 'CSV file must contain header and at least one data row' });
      return { data, errors, warnings };
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const headerValidation = this.validateHeaders(headers);
    
    if (headerValidation.errors.length > 0) {
      errors.push(...headerValidation.errors);
      return { data, errors, warnings };
    }

    warnings.push(...headerValidation.warnings);

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      
      if (row.length !== headers.length) {
        errors.push({ 
          row: i + 1, 
          field: 'structure', 
          message: `Row has ${row.length} columns but expected ${headers.length}` 
        });
        continue;
      }

      const rowData = this.parseRow(row, headers, i + 1);
      if (rowData.errors.length > 0) {
        errors.push(...rowData.errors);
      } else if (rowData.data) {
        data.push(rowData.data);
      }
    }

    return { data, errors, warnings };
  }

  private static validateHeaders(headers: string[]): { errors: ValidationError[], warnings: string[] } {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check required headers
    for (const required of this.REQUIRED_HEADERS) {
      if (!headers.some(h => h.toLowerCase() === required.toLowerCase())) {
        errors.push({
          row: 0,
          field: 'headers',
          message: `Missing required column: "${required}"`
        });
      }
    }

    // Check for optional headers
    if (!headers.some(h => h.toLowerCase() === 'attributed revenue')) {
      warnings.push('Optional "Attributed Revenue" column not found - accessory attribution will be skipped');
    }

    return { errors, warnings };
  }

  private static parseRow(row: string[], headers: string[], rowNumber: number): { data?: CSVRowData, errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    const data: Partial<CSVRowData> = {};

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      const value = row[i];

      switch (header) {
        case 'product id':
          if (!value) {
            errors.push({ row: rowNumber, field: 'product_id', message: 'Product ID is required' });
          } else {
            data.product_id = value;
          }
          break;

        case 'product name':
          data.product_name = value || '';
          break;

        case 'platform':
          data.platform = value || '';
          break;

        case 'category':
          data.category = value || '';
          break;

        case 'market code':
          if (!value) {
            errors.push({ row: rowNumber, field: 'market_code', message: 'Market Code is required' });
          } else if (!this.VALID_MARKETS.includes(value.toUpperCase())) {
            errors.push({ 
              row: rowNumber, 
              field: 'market_code', 
              message: `Invalid market code "${value}". Valid codes: ${this.VALID_MARKETS.join(', ')}`,
              value 
            });
          } else {
            data.market_code = value.toUpperCase();
          }
          break;

        case 'period (yyyy-mm)':
          if (!value) {
            errors.push({ row: rowNumber, field: 'period', message: 'Period is required' });
          } else if (!/^\d{4}-\d{2}$/.test(value)) {
            errors.push({ 
              row: rowNumber, 
              field: 'period', 
              message: 'Period must be in YYYY-MM format',
              value 
            });
          } else {
            const [year, month] = value.split('-');
            data.period_start = `${year}-${month}-01`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            data.period_end = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
          }
          break;

        case 'actual revenue':
          const revenue = parseFloat(value);
          if (isNaN(revenue) || revenue < 0) {
            errors.push({ 
              row: rowNumber, 
              field: 'revenue_amount', 
              message: 'Revenue must be a valid positive number',
              value 
            });
          } else {
            data.revenue_amount = revenue;
          }
          break;

        case 'actual cogs':
          const cogs = parseFloat(value);
          if (isNaN(cogs) || cogs < 0) {
            errors.push({ 
              row: rowNumber, 
              field: 'cogs_amount', 
              message: 'COGS must be a valid positive number',
              value 
            });
          } else {
            data.cogs_amount = cogs;
          }
          break;

        case 'units sold':
          const units = parseInt(value);
          if (isNaN(units) || units < 0) {
            errors.push({ 
              row: rowNumber, 
              field: 'units_sold', 
              message: 'Units sold must be a valid positive integer',
              value 
            });
          } else {
            data.units_sold = units;
          }
          break;

        case 'attributed revenue':
          if (value && value.trim() !== '') {
            const attributed = parseFloat(value);
            if (isNaN(attributed) || attributed < 0) {
              errors.push({ 
                row: rowNumber, 
                field: 'attributed_revenue', 
                message: 'Attributed revenue must be a valid positive number',
                value 
              });
            } else {
              data.attributed_revenue = attributed;
            }
          }
          break;

        case 'currency code':
          if (!value) {
            data.currency_code = 'EUR'; // Default
          } else if (!this.VALID_CURRENCIES.includes(value.toUpperCase())) {
            errors.push({ 
              row: rowNumber, 
              field: 'currency_code', 
              message: `Invalid currency code "${value}". Valid codes: ${this.VALID_CURRENCIES.join(', ')}`,
              value 
            });
          } else {
            data.currency_code = value.toUpperCase();
          }
          break;
      }
    }

    if (errors.length === 0 && data.product_id && data.market_code && data.period_start) {
      return { data: data as CSVRowData, errors: [] };
    }

    return { errors };
  }

  static async uploadCommercialData(data: CSVRowData[], companyId: string): Promise<{ success: number, failed: number, errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        // Calculate profit margin
        const profit_margin_percentage = row.revenue_amount > 0 
          ? ((row.revenue_amount - row.cogs_amount) / row.revenue_amount) * 100 
          : 0;

        // Insert main revenue record
        const { error: revenueError } = await supabase
          .from('product_revenues')
          .upsert({
            product_id: row.product_id,
            market_code: row.market_code,
            period_start: row.period_start,
            period_end: row.period_end,
            revenue_amount: row.revenue_amount,
            cogs_amount: row.cogs_amount,
            units_sold: row.units_sold,
            profit_margin_percentage,
            currency_code: row.currency_code,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          }, {
            onConflict: 'product_id,market_code,period_start'
          });

        if (revenueError) {
          errors.push(`Failed to upload data for ${row.product_name}: ${revenueError.message}`);
          failed++;
          continue;
        }

        // Handle attributed revenue if present
        if (row.attributed_revenue && row.attributed_revenue > 0) {
          // This would be handled by the smart revenue engine
          // For now, we'll store it as a note in calculation_metadata
          const calculationMonth = row.period_start.substring(0, 7); // YYYY-MM format
          
          const { error: attributedError } = await supabase
            .from('smart_revenue_calculations')
            .upsert({
              company_id: companyId,
              main_product_id: row.product_id,
              accessory_product_id: row.product_id, // Self-reference for uploaded attribution
              calculation_month: calculationMonth,
              total_attributed_revenue: row.attributed_revenue,
              calculation_metadata: {
                source: 'csv_upload',
                product_name: row.product_name,
                upload_timestamp: new Date().toISOString()
              }
            }, {
              onConflict: 'company_id,main_product_id,accessory_product_id,calculation_month'
            });

          if (attributedError) {
            // Don't fail the main upload for attribution errors
            console.warn(`Failed to store attributed revenue for ${row.product_name}:`, attributedError);
          }
        }

        success++;
      } catch (error) {
        errors.push(`Unexpected error for ${row.product_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }
}