import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from '@tanstack/react-query';



export class ProductDataTableService {
    static queryClient: QueryClient | null = null;
    
    static setQueryClient(client: QueryClient) {
        this.queryClient = client;
    }
    
    static invalidatePortfolioCache(companyId: string) {
        if (this.queryClient) {
            this.queryClient.invalidateQueries({ queryKey: ['portfolio-sunburst', companyId] });
        }
    }
    static async updateProductModelReference(productId: string, modelReference: string) {
        const { data, error } = await supabase
            .from('products')
            .update({ model_reference: modelReference })
            .eq('id', productId)
            .select('company_id')
            .single();
        if (error) {
            throw error;
        }
        
        // Invalidate portfolio cache for this company
        if (data?.company_id) {
            this.invalidatePortfolioCache(data.company_id);
        }
        
        return { success: true, data: data };
    }

    static async getCompanyCategory(companyId: string) {
        if (!companyId || companyId === 'undefined') {
            throw new Error('Invalid company ID');
        }
        
        const { data, error } = await supabase
            .from('company_device_categories')
            .select('id,name,description')
            .eq('company_id', companyId);
            
        if (error) {
            throw error;
        }
        return { success: true, data: data };
    }

    static async updateProductCategory(productId: string, categoryId: string) {
        const { data, error } = await supabase
            .from('products')
            .update({ device_category: categoryId })
            .eq('id', productId)
            .select('company_id')
            .single();
        if (error) {
            throw error;
        }
        
        // Invalidate portfolio cache for this company
        if (data?.company_id) {
            this.invalidatePortfolioCache(data.company_id);
        }
        
        return { success: true, data: data };
    }

    static async updateProductPlatform(productId: string, platform: string) {
        console.log(`Updating product ${productId} platform to: ${platform}`);
        
        const { data, error } = await supabase
            .from('products')
            .update({ product_platform: platform })
            .eq('id', productId)
            .select('company_id, product_platform')
            .single();
            
        if (error) {
            console.error(`Failed to update product ${productId} platform:`, error);
            throw error;
        }
        
        console.log(`Successfully updated product ${productId} platform to: ${data.product_platform}`);
        
        // Invalidate portfolio cache for this company
        if (data?.company_id) {
            this.invalidatePortfolioCache(data.company_id);
        }
        
        return { success: true, data: data };
    }
    static async getProductVariantsdimensions(companyId: string) {
        const { data, error } = await supabase
            .from('product_variation_dimensions')
            .select('*')
            .eq('company_id', companyId)
        if (error) {
            throw error;
        }
        return { success: true, data: data };
    }
    static async getProductVariantsOptions(dimensionId: string) {
        const { data, error } = await supabase
            .from('product_variation_options')
            .select('*')
            .eq('dimension_id', dimensionId)
        if (error) {
            throw error;
        }
        return { success: true, data: data };
    }
    static async updateProductVariantOption(productId: string, dimensionId: string, optionId: string | null) {
        // Validate required parameters
        if (!productId || productId === 'undefined') {
            throw new Error('Invalid product ID');
        }
        if (!dimensionId || dimensionId === 'undefined') {
            throw new Error('Invalid dimension ID');
        }
        if (optionId === 'undefined') {
            optionId = null;
        }
        // First, ensure a product variant exists for this product
        let { data: existingVariant, error: variantError } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId)
            .limit(1)
            .single();

        let variantId = existingVariant?.id;

        // Create a variant if none exists
        if (!existingVariant) {
            try {
                const { data: newVariant, error: createError } = await supabase
                    .from('product_variants')
                    .insert({ 
                        product_id: productId, 
                        name: 'Default',
                        status: 'active'
                    })
                    .select('id')
                    .single();
                
                if (createError) {
                    // If it's a duplicate constraint error, try to fetch the existing one
                    if (createError.message?.includes('duplicate key value violates unique constraint')) {
                        const { data: existing } = await supabase
                            .from('product_variants')
                            .select('id')
                            .eq('product_id', productId)
                            .limit(1)
                            .single();
                        variantId = existing?.id;
                    } else {
                        throw createError;
                    }
                } else {
                    variantId = newVariant.id;
                }
            } catch (error) {
                // If creation failed, try to fetch existing variant one more time
                const { data: existing } = await supabase
                    .from('product_variants')
                    .select('id')
                    .eq('product_id', productId)
                    .limit(1)
                    .single();
                if (existing) {
                    variantId = existing.id;
                } else {
                    throw error;
                }
            }
        }

        // Now set or update the variant option
        const { data: existingValue } = await supabase
            .from('product_variant_values')
            .select('id')
            .eq('product_variant_id', variantId)
            .eq('dimension_id', dimensionId)
            .limit(1)
            .single();

        if (existingValue) {
            // Update existing value
            const { error: updateError } = await supabase
                .from('product_variant_values')
                .update({ option_id: optionId })
                .eq('id', existingValue.id);
            
            if (updateError) throw updateError;
        } else {
            // Insert new value
            const { error: insertError } = await supabase
                .from('product_variant_values')
                .insert({
                    product_variant_id: variantId,
                    dimension_id: dimensionId,
                    option_id: optionId
                });
            
            if (insertError) throw insertError;
        }

        return { success: true, data: { variantId, dimensionId, optionId } };
    }
}