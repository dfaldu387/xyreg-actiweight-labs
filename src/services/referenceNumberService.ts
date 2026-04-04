/**
 * Service for generating Internal Device IDs (system-generated identifiers)
 * NOTE: These are NOT EUDAMED reference numbers - they are internal tracking IDs
 * Format: {COMPANY_CODE}-{PRODUCT_CODE}-{VARIANT}
 */

import { supabase } from '@/integrations/supabase/client';

export class ReferenceNumberService {
  /**
   * Generate a company code from company name
   * Takes first 6 characters, uppercase, removes spaces
   */
  private static generateCompanyCode(companyName: string): string {
    return companyName
      .replace(/\s+/g, '')
      .toUpperCase()
      .substring(0, 6)
      .padEnd(6, 'X'); // Pad with X if less than 6 chars
  }

  /**
   * Get the next product code for a company
   * Returns a 6-digit number (e.g., "000001")
   */
  private static async getNextProductCode(companyId: string): Promise<string> {
    // Get count of existing products for this company
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .not('eudamed_reference_number', 'is', null);

    if (error) {
      console.error('[ReferenceNumberService] Error counting products:', error);
      // Fallback to random number if count fails
      return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    }

    // Increment count by 1 and pad to 6 digits
    const nextNumber = (count || 0) + 1;
    return String(nextNumber).padStart(6, '0');
  }

  /**
   * Generate a complete EUDAMED reference number
   * Format: COMPCO-000001-001
   */
  static async generateReferenceNumber(
    companyId: string,
    companyName: string,
    variant: string = '001'
  ): Promise<string> {
    const companyCode = this.generateCompanyCode(companyName);
    const productCode = await this.getNextProductCode(companyId);
    
    return `${companyCode}-${productCode}-${variant}`;
  }

  /**
   * Check if a reference number already exists
   */
  static async referenceNumberExists(referenceNumber: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('eudamed_reference_number', referenceNumber)
      .maybeSingle();

    if (error) {
      console.error('[ReferenceNumberService] Error checking reference number:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Assign reference number to product
   */
  static async assignReferenceNumber(
    productId: string,
    referenceNumber: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .update({ eudamed_reference_number: referenceNumber })
      .eq('id', productId);

    if (error) {
      console.error('[ReferenceNumberService] Error assigning reference number:', error);
      return false;
    }

    return true;
  }

  /**
   * Generate and assign reference number to a product
   */
  static async generateAndAssign(
    productId: string,
    companyId: string,
    companyName: string
  ): Promise<string | null> {
    try {
      const referenceNumber = await this.generateReferenceNumber(companyId, companyName);
      const success = await this.assignReferenceNumber(productId, referenceNumber);
      
      if (success) {
        console.log('[ReferenceNumberService] Assigned reference number:', referenceNumber);
        return referenceNumber;
      }
      
      return null;
    } catch (error) {
      console.error('[ReferenceNumberService] Error in generateAndAssign:', error);
      return null;
    }
  }
}
