
import { supabase } from "@/integrations/supabase/client";
import { CompanyGapTemplateService } from "@/services/CompanyGapTemplateService";
import { createGapAnalysisItem, deleteGapAnalysisItemsByProduct, checkExistingGapItems } from "@/services/gapAnalysisService";
import { SmartFilterService, DeviceCharacteristics } from "@/services/SmartFilterService";

interface CreateGapAnalysisResult {
  success: boolean;
  message: string;
  itemsCreated: number;
  duplicatesSkipped: number;
  autoExcluded?: number;
  filterSummary?: {
    totalItems: number;
    applicableCount: number;
    excludedCount: number;
  };
}

export const createDefaultGapAnalysisItems = async (
  productId: string, 
  clearExisting: boolean = false,
  applySmartFilter: boolean = true
): Promise<CreateGapAnalysisResult> => {
  try {
    console.log("Creating default gap analysis items:", { productId, clearExisting });
    
    let itemsCreated = 0;
    let duplicatesSkipped = 0;

    // Clear existing items if requested
    if (clearExisting) {
      console.log("Clearing existing gap analysis items...");
      const deleteSuccess = await deleteGapAnalysisItemsByProduct(productId);
      if (!deleteSuccess) {
        return {
          success: false,
          message: "Failed to clear existing gap analysis items",
          itemsCreated: 0,
          duplicatesSkipped: 0
        };
      }
      console.log("Existing items cleared successfully");
    }

    // Get product's company ID to determine enabled templates
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('company_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return {
        success: false,
        message: "Failed to find product or determine company",
        itemsCreated: 0,
        duplicatesSkipped: 0
      };
    }

    // Get enabled templates for the company
    const enabledTemplates = await CompanyGapTemplateService.getEnabledTemplatesForCompany(product.company_id);
    
    if (enabledTemplates.length === 0) {
      return {
        success: false,
        message: "No gap analysis templates are enabled for this company. Please enable templates in company settings.",
        itemsCreated: 0,
        duplicatesSkipped: 0
      };
    }

    console.log(`Creating gap analysis items from ${enabledTemplates.length} enabled templates...`);
    
    // Get product details for smart filtering
    let deviceCharacteristics: DeviceCharacteristics | null = null;
    if (applySmartFilter && productId) {
      const { data: productDetails, error: productDetailsError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productDetails && !productDetailsError) {
        deviceCharacteristics = SmartFilterService.extractDeviceCharacteristics(productDetails);
        console.log(`Extracted device characteristics for smart filtering:`, deviceCharacteristics);
      }
    }
    
    let autoExcluded = 0;
    let totalTemplateItems = 0;
    
    // Helper function to get exclusion criteria from template item
    function getExclusionCriteria(item: any): string {
      // Map common clause patterns to exclusion criteria
      const clause = item.clause || '';
      const requirement = item.requirement?.toLowerCase() || '';
      
      if (clause === '5' || requirement.includes('substance') || requirement.includes('particle')) {
        return 'Device has no body contact';
      }
      if (clause.startsWith('17.2') || requirement.includes('software')) {
        return 'Device contains no software';
      }
      if (clause.startsWith('19.3') || clause.startsWith('19.4')) {
        return 'Device is not an active implantable medical device';
      }
      if (clause.startsWith('19') && requirement.includes('sterile')) {
        return 'Device is not provided sterile';
      }
      if (clause === '17' || requirement.includes('lay person')) {
        return 'Device is for professional use only';
      }
      if (clause === '12' || requirement.includes('electromagnetic')) {
        return 'Device is non-electrical';
      }
      if (clause === '13' || clause === '14' || requirement.includes('radiation')) {
        return 'Device does not emit radiation';
      }
      
      return 'Never excluded';
    }
    
    // Create items from all enabled templates
    for (const template of enabledTemplates) {
      console.log(`Processing template: ${template.name} with ${template.checklistItems?.length || 0} items`);
      
      const templateItems = template.checklistItems || [];
      totalTemplateItems += templateItems.length;
      
      // Apply smart filtering if enabled and characteristics available
      let itemsToCreate = templateItems;
      if (applySmartFilter && deviceCharacteristics) {
        const filterResult = SmartFilterService.applySmartFilter(
          templateItems.map((item: any) => ({
            ...item,
            keyStandards: item.auditGuidance?.split(',') || [],
            excludesIf: getExclusionCriteria(item),
          })),
          deviceCharacteristics
        );
        
        itemsToCreate = filterResult.applicable;
        autoExcluded += filterResult.excluded.filter(e => e.isAutomatic).length;
        
        console.log(`Smart filter applied: ${filterResult.applicable.length} applicable, ${filterResult.excluded.length} excluded`);
      }
      
      for (const templateItem of itemsToCreate) {
        try {
          // All items are now created as company-wide by default
          // This matches the behavior when enabling templates
          const newItem = {
            product_id: null, // Company-wide items
            requirement: templateItem.requirement,
            framework: template.framework,
            section: templateItem.section,
            clause_id: templateItem.clause,
            clause_summary: templateItem.description,
            category: templateItem.category,
            status: 'non_compliant',
            action_needed: '',
            priority: (templateItem as any).priority || 'medium'
          };

          const result = await createGapAnalysisItem(newItem);
          
          if (result) {
            itemsCreated++;
            console.log(`Created company-wide item ${itemsCreated}: ${templateItem.clause}`);
          } else {
            // Item was skipped due to duplicate constraint
            duplicatesSkipped++;
            console.log(`Skipped duplicate item: ${templateItem.clause}`);
          }
        } catch (error) {
          console.error("Error creating individual gap analysis item:", error);
          // Continue with other items even if one fails
          duplicatesSkipped++;
        }
      }
    }

    const totalProcessed = itemsCreated + duplicatesSkipped;
    console.log(`Gap analysis creation completed: ${itemsCreated} created, ${duplicatesSkipped} skipped, ${totalProcessed} total processed`);

    if (itemsCreated === 0 && duplicatesSkipped > 0) {
      return {
        success: true,
        message: `All ${duplicatesSkipped} items already exist. No new items were created.`,
        itemsCreated: 0,
        duplicatesSkipped
      };
    }

    const filterSummary = {
      totalItems: totalTemplateItems,
      applicableCount: itemsCreated + duplicatesSkipped,
      excludedCount: autoExcluded
    };

    let message = '';
    if (itemsCreated > 0) {
      message = `Successfully created ${itemsCreated} gap analysis items`;
      if (duplicatesSkipped > 0) {
        message += ` (${duplicatesSkipped} duplicates skipped)`;
      }
      if (autoExcluded > 0) {
        message += ` (${autoExcluded} auto-excluded by smart filter)`;
      }
    } else {
      message = "No new items were created";
    }

    return {
      success: true,
      message,
      itemsCreated,
      duplicatesSkipped,
      autoExcluded,
      filterSummary
    };

  } catch (error) {
    console.error("Error in createDefaultGapAnalysisItems:", error);
    return {
      success: false,
      message: `Failed to create gap analysis items: ${error instanceof Error ? error.message : 'Unknown error'}`,
      itemsCreated: 0,
      duplicatesSkipped: 0
    };
  }
};

export const checkExistingGapAnalysisItems = async (productId: string): Promise<number> => {
  return checkExistingGapItems(productId);
};
