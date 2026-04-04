import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addMonths, addDays } from "date-fns";
import { getLaunchedMarkets } from "@/utils/launchStatusUtils";
import { normalizeDeviceClassForTemplate } from "@/utils/pmsDeviceClassMapper";

export interface ActivityGenerationResult {
  success: boolean;
  created: number;
  skipped: number;
  errors: string[];
}

export class PMSActivityGenerationService {
  /**
   * Generate PMS activities for a product based on selected markets
   */
  static async generateActivitiesForProduct(
    productId: string,
    companyId: string,
    markets: any[] // Array of market objects with code and riskClass
  ): Promise<ActivityGenerationResult> {
    const result: ActivityGenerationResult = {
      success: false,
      created: 0,
      skipped: 0,
      errors: []
    };

    try {
      if (!markets || markets.length === 0) {
        result.errors.push('No markets selected for this product');
        return result;
      }

      // Filter for launched markets only
      const launchedMarkets = getLaunchedMarkets(markets);
      
      if (launchedMarkets.length === 0) {
        toast.info('No markets launched yet. Mark markets as launched in Target Markets tab.');
        result.errors.push('No markets have been launched yet');
        return result;
      }

      for (const market of launchedMarkets) {
        const marketCode = market.code;
        const deviceClass = market.riskClass;
        
        // Normalize device class to match template format (e.g., "class-iia" → "IIa")
        const normalizedDeviceClass = normalizeDeviceClassForTemplate(deviceClass);

        // Fetch templates for this market/device class
        let query = supabase
          .from('pms_activity_templates')
          .select('*')
          .eq('market_code', marketCode);

        if (normalizedDeviceClass) {
          query = query.or(`device_class.eq.${normalizedDeviceClass},device_class.is.null`);
        }

        const { data: templates, error: templatesError } = await query;

        if (templatesError) {
          result.errors.push(`Failed to fetch templates for ${marketCode}: ${templatesError.message}`);
          continue;
        }

        for (const template of templates || []) {
          // Check if activity already exists
          const { data: existingActivity } = await supabase
            .from('pms_activity_tracking')
            .select('id')
            .eq('product_id', productId)
            .eq('market_code', marketCode)
            .eq('activity_template_id', template.id)
            .maybeSingle();

          if (existingActivity) {
            result.skipped++;
            continue;
          }

          // Calculate due date based on frequency and market launch date
          const marketLaunchDate = market.actualLaunchDate || market.launchDate;
          const launchDateString = marketLaunchDate 
            ? (typeof marketLaunchDate === 'string' ? marketLaunchDate : marketLaunchDate.toISOString())
            : null;
          const dueDate = this.calculateDueDate(
            template.frequency,
            template.days_before_report,
            launchDateString
          );

          // Create activity tracking record
          const { error: createError } = await supabase
            .from('pms_activity_tracking')
            .insert({
              company_id: companyId,
              product_id: productId,
              market_code: marketCode,
              activity_template_id: template.id,
              activity_name: template.activity_name,
              description: template.description,
              regulatory_reference: template.regulatory_reference,
              due_date: dueDate,
              status: 'pending',
              completion_percentage: 0,
              related_documents: template.checklist_items || []
            });

          if (createError) {
            result.errors.push(
              `Failed to create activity "${template.activity_name}" for ${marketCode}: ${createError.message}`
            );
          } else {
            result.created++;
          }
        }
      }

      result.success = result.created > 0 || (result.errors.length === 0 && result.skipped > 0);

      if (result.success && result.created > 0) {
        toast.success(`Generated ${result.created} PMS activities`);
      } else if (result.skipped > 0 && result.created === 0) {
        toast.info('All activities already exist');
      }

      return result;

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Calculate due date based on frequency, days before report, and market launch date
   */
  private static calculateDueDate(
    frequency: string | null,
    daysBeforeReport: number | null,
    marketLaunchDate?: string | null
  ): string | null {
    // Use market launch date as reference point, or current date if not available
    const referenceDate = marketLaunchDate ? new Date(marketLaunchDate) : new Date();
    let baseDate = new Date(referenceDate);

    // Calculate base date based on frequency from launch date
    switch (frequency) {
      case 'monthly':
        baseDate = addMonths(referenceDate, 1);
        break;
      case 'quarterly':
        baseDate = addMonths(referenceDate, 3);
        break;
      case 'bi-annually':
        baseDate = addMonths(referenceDate, 6);
        break;
      case 'annually':
        baseDate = addMonths(referenceDate, 12);
        break;
      case 'weekly':
        baseDate = addDays(referenceDate, 7);
        break;
      case 'daily':
        baseDate = addDays(referenceDate, 1);
        break;
      case 'on-demand':
        return null; // No automatic due date
      default:
        baseDate = addMonths(referenceDate, 3); // Default to quarterly
    }

    // Subtract days before report if specified
    if (daysBeforeReport && daysBeforeReport > 0) {
      baseDate = addDays(baseDate, -daysBeforeReport);
    }

    return baseDate.toISOString().split('T')[0];
  }

  /**
   * Regenerate activities when markets change
   */
  static async regenerateActivitiesForProduct(
    productId: string,
    companyId: string,
    markets: any[]
  ): Promise<ActivityGenerationResult> {
    // Delete existing activities
    const { error: deleteError } = await supabase
      .from('pms_activity_tracking')
      .delete()
      .eq('product_id', productId);

    if (deleteError) {
      return {
        success: false,
        created: 0,
        skipped: 0,
        errors: [`Failed to delete existing activities: ${deleteError.message}`]
      };
    }

    // Generate new activities
    return this.generateActivitiesForProduct(productId, companyId, markets);
  }
}
