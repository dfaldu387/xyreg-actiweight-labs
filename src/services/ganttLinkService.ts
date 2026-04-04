/**
 * Gantt Link Service
 *
 * Handles all API calls related to Gantt chart links/dependencies
 * Supports both phase links and task links (documents, gap analysis, activities, audits)
 */

import apiClient from '@/lib/apiClient';
import { GanttLink } from '@/types/ganttChart';

export interface CreateLinkParams {
    source: string | number;
    target: string | number;
    type: 'e2s' | 's2s' | 'e2e' | 's2e';
}

/**
 * Fetch all Gantt links (both phase and task dependencies) for a product
 */
export const getGanttLinks = async (productId: string): Promise<GanttLink[]> => {
    try {
        const response = await apiClient.get(`/product/gantt-chart/${productId}/links`);
        return response.data || [];
    } catch (error) {
        console.error('[GanttLinkService] Error fetching links:', error);
        throw error;
    }
};

/**
 * Create a new Gantt link (phase or task dependency)
 * Backend automatically detects link type based on source/target ID format
 */
export const createGanttLink = async (
    productId: string,
    params: CreateLinkParams
): Promise<GanttLink> => {
    try {
        const response = await apiClient.post(
            `/product/gantt-chart/${productId}/links`,
            params
        );
        return response.data;
    } catch (error) {
        console.error('[GanttLinkService] Error creating link:', error);
        throw error;
    }
};

/**
 * Delete a Gantt link by ID
 */
export const deleteGanttLink = async (
    productId: string,
    linkId: string | number
): Promise<void> => {
    try {
        await apiClient.delete(`/product/gantt-chart/${productId}/links/${linkId}`);
    } catch (error) {
        console.error('[GanttLinkService] Error deleting link:', error);
        throw error;
    }
};

// Export as default for easier imports
const GanttLinkService = {
    getGanttLinks,
    createGanttLink,
    deleteGanttLink,
};

export default GanttLinkService;
