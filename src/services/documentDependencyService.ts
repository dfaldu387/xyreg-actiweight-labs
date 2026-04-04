/**
 * Document Dependency Service
 *
 * Handles document-to-document dependencies using direct Supabase access
 */

import { supabase } from '@/integrations/supabase/client';

export interface DocumentDependency {
    id: string | number;
    source: string;
    target: string;
    type: 'e2s' | 's2s' | 'e2e' | 's2e';
    source_document_name?: string;
    target_document_name?: string;
}

export type DocumentDependencyType = 'e2s' | 's2s' | 'e2e' | 's2e';

/**
 * Map Gantt link types to database dependency types
 */
const mapGanttTypeToDbType = (ganttType: DocumentDependencyType): string => {
    const typeMap: Record<DocumentDependencyType, string> = {
        'e2s': 'finish_to_start',
        's2s': 'start_to_start',
        'e2e': 'finish_to_finish',
        's2e': 'start_to_finish'
    };
    return typeMap[ganttType];
};

/**
 * Map database dependency types to Gantt link types
 */
const mapDbTypeToGanttType = (dbType: string): DocumentDependencyType => {
    const typeMap: Record<string, DocumentDependencyType> = {
        'finish_to_start': 'e2s',
        'start_to_start': 's2s',
        'finish_to_finish': 'e2e',
        'start_to_finish': 's2e'
    };
    return typeMap[dbType] || 'e2s';
};

/**
 * Fetch only document-to-document dependencies for a product
 */
export const getDocumentDependencies = async (productId: string): Promise<DocumentDependency[]> => {
    try {
        // Query product_task_dependencies table
        const { data, error } = await supabase
            .from('product_task_dependencies')
            .select('*')
            .eq('product_id', productId)
            .eq('source_task_type', 'document')
            .eq('target_task_type', 'document')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[DocumentDependencyService] Supabase error:', error);
            throw error;
        }

        // Map to DocumentDependency format
        const dependencies: DocumentDependency[] = (data || []).map(dep => ({
            id: dep.id,
            source: `doc_${dep.source_task_id}`,
            target: `doc_${dep.target_task_id}`,
            type: mapDbTypeToGanttType(dep.dependency_type)
        }));

        return dependencies;
    } catch (error) {
        console.error('[DocumentDependencyService] Error fetching document dependencies:', error);
        throw error;
    }
};

/**
 * Create a new document-to-document dependency
 */
export const createDocumentDependency = async (
    productId: string,
    sourceDocumentId: string,
    targetDocumentId: string,
    dependencyType: DocumentDependencyType
): Promise<DocumentDependency> => {
    try {
        // Remove 'doc_' prefix if present
        const sourceId = sourceDocumentId.replace(/^doc_/, '');
        const targetId = targetDocumentId.replace(/^doc_/, '');

        // Insert into product_task_dependencies
        const { data, error } = await supabase
            .from('product_task_dependencies')
            .insert({
                product_id: productId,
                source_task_id: sourceId,
                source_task_type: 'document',
                target_task_id: targetId,
                target_task_type: 'document',
                dependency_type: mapGanttTypeToDbType(dependencyType)
            })
            .select()
            .single();

        if (error) {
            console.error('[DocumentDependencyService] Supabase error:', error);
            throw error;
        }

        // Return in DocumentDependency format
        return {
            id: data.id,
            source: `doc_${data.source_task_id}`,
            target: `doc_${data.target_task_id}`,
            type: mapDbTypeToGanttType(data.dependency_type)
        };
    } catch (error) {
        console.error('[DocumentDependencyService] Error creating document dependency:', error);
        throw error;
    }
};

/**
 * Delete a document dependency
 */
export const deleteDocumentDependency = async (
    productId: string,
    linkId: string | number
): Promise<void> => {
    try {
        const normalizedLinkId = String(linkId);

        const { error } = await supabase
            .from('product_task_dependencies')
            .delete()
            .eq('id', normalizedLinkId)
            .eq('product_id', productId);

        if (error) {
            console.error('[DocumentDependencyService] Supabase error:', error);
            throw error;
        }
    } catch (error) {
        console.error('[DocumentDependencyService] Error deleting document dependency:', error);
        throw error;
    }
};

/**
 * Get human-readable dependency type label
 */
export const getDependencyTypeLabel = (type: DocumentDependencyType): string => {
    switch (type) {
        case 'e2s': return 'Finish-to-Start (FS)';
        case 's2s': return 'Start-to-Start (SS)';
        case 'e2e': return 'Finish-to-Finish (FF)';
        case 's2e': return 'Start-to-Finish (SF)';
        default: return type;
    }
};

/**
 * Get short dependency type label
 */
export const getShortDependencyLabel = (type: DocumentDependencyType | string): string => {
    switch (type) {
        case 'e2s': return 'FS';
        case 's2s': return 'SS';
        case 'e2e': return 'FF';
        case 's2e': return 'SF';
        default: return String(type).toUpperCase();
    }
};

// Export as default for easier imports
const DocumentDependencyService = {
    getDocumentDependencies,
    createDocumentDependency,
    deleteDocumentDependency,
    getDependencyTypeLabel,
    getShortDependencyLabel,
};

export default DocumentDependencyService;
