import { useState, useEffect } from 'react';
import { planService } from '@/services/plansService';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useCompanyId } from './useCompanyId';

export interface PlanPermissions {
    canAddDocuments: boolean;
    canAddPhases: boolean;
    currentPlan: string;
    isLoading: boolean;
    error: string | null;
}

export function usePlanPermissions(): PlanPermissions {
    const [permissions, setPermissions] = useState<PlanPermissions>({
        canAddDocuments: false,
        canAddPhases: false,
        currentPlan: 'Starter',
        isLoading: true,
        error: null
    });
    const companyId = useCompanyId();
    useEffect(() => {
        loadPermissions();
    }, [companyId]);
    
    const loadPermissions = async () => {
        try {
            setPermissions(prev => ({ ...prev, isLoading: true, error: null }));

            if (!companyId) {
                setPermissions(prev => ({ ...prev, isLoading: false }));
                return;
            }

            // Get subscription status from planService
            const status = await planService.getSubscriptionStatus(companyId);
            
            // If expired or no access, deny all permissions
            if (!status.canAccess || status.isExpired) {
                setPermissions({
                    canAddDocuments: false,
                    canAddPhases: false,
                    currentPlan: status.currentPlan || 'None',
                    isLoading: false,
                    error: status.isExpired ? 'Your subscription has expired' : 'No active subscription'
                });
                return;
            }

            // Check feature access based on current plan
            const canAddDocuments = planService.canAccessFeature(status.currentPlan, 'advanced_documents');
            const canAddPhases = planService.canAccessFeature(status.currentPlan, 'custom_phases');

            setPermissions({
                canAddDocuments,
                canAddPhases,
                currentPlan: status.currentPlan || 'Starter',
                isLoading: false,
                error: null
            });
        } catch (error) {
            console.error('Error loading plan permissions:', error);
            setPermissions(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to load plan permissions'
            }));
        }
    };

    return permissions;
}

// Hook for checking specific feature availability
export function useFeaturePermission(feature: string) {
    const [hasPermission, setHasPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const companyId = useCompanyId();
    useEffect(() => {
        checkPermission();
    }, [feature]);

    const checkPermission = async () => {
        try {
            setIsLoading(true);
            
            if (!companyId) {
                setHasPermission(false);
                setIsLoading(false);
                return;
            }

            // Get subscription status
            const status = await planService.getSubscriptionStatus(companyId);
            
            // Check if subscription is valid and feature is accessible
            if (!status.canAccess || status.isExpired) {
                setHasPermission(false);
            } else {
                setHasPermission(planService.canAccessFeature(status.currentPlan, feature));
            }
        } catch (error) {
            console.error(`Error checking permission for ${feature}:`, error);
            setHasPermission(false);
        } finally {
            setIsLoading(false);
        }
    };

    return { hasPermission, isLoading };
} 