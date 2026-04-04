// src/services/billingService.ts
import { supabase } from "@/integrations/supabase/client";

// Define the BillingPlan type
export type BillingPlan = {
    icon: string; // icon name, e.g., 'CheckCircle', 'Star', etc.
    name: string;
    price: string;
    features: string[];
    button: string;
    highlight: boolean;
};

// Define the plan metadata type
export type PlanMetadata = {
    id: string;
    plan_id: string;
    name: string;
    price: string;
    icon?: string;
    button_text?: string;
    highlight?: boolean;
    description?: string;
    sort_order?: number;
};
interface PlanSubscription {
    plan: string,
    plan_name: string,
}

export class BillingService {
    static async getPlans() {
        const { data, error } = await supabase
            .from('plan_feature')
            .select('*, plan_subscription!inner(plan_name), plan_category!inner(plan_category_name)');

        // console.log("data data", data);
        console.log("error getPlans", error);

        if (error) throw error;
        if (!data) return [];
        return data;
    }

    static async getPlansMetadata(): Promise<PlanMetadata[]> {
        try {
            // Fetch basic plan info from database
            const { data, error } = await supabase
                .from('plan_feature')
                .select(`
                    id,
                    plan_id,
                    plan_subscription!inner(plan_name),
                    plan_category!inner(plan_category_name)
                `);

            if (error) {
                console.error("Error fetching plans metadata:", error);
                throw error;
            }

            if (!data) return [];

            // Static metadata mapping based on plan_id or plan_name
            const staticMetadata = this.getStaticPlanMetadata();

            // Transform the data with static metadata
            return data.map((plan, index) => {
                const planKey = (plan as any).plan_id || (plan as any).id;
                const staticData = staticMetadata[planKey] || staticMetadata[(plan as any).plan_name] || this.getDefaultPlanData((plan as any).plan_name, index);

                return {
                    id: (plan as any).id,
                    plan_id: (plan as any).plan_id,
                    name: (plan as any).plan_name,
                    price: (plan as any).price || staticData.price,
                    icon: staticData.icon,
                    button_text: staticData.button_text,
                    highlight: staticData.highlight,
                    description: staticData.description,
                    sort_order: staticData.sort_order
                };
            });

        } catch (error) {
            console.error("Failed to fetch plans metadata:", error);

            // Fallback: Extract unique plans from plan_feature data
            return this.getPlansMetadataFallback();
        }
    }

    // Static metadata configuration
    private static getStaticPlanMetadata() {
        return {
            // Map by plan_id
            'e067f2f2-ef1a-4b92-b284-8135276c8107': {
                icon: 'CheckCircle',
                button_text: 'Get Started',
                highlight: false,
                description: 'Perfect for small teams getting started',
                sort_order: 1,
                price: '$9/month'
            },
            '29cd1766-75d0-4426-9126-2ef47040d14a': {
                icon: 'Star',
                button_text: 'Choose Professional',
                highlight: true,
                description: 'Most popular plan for growing teams',
                sort_order: 2,
                price: '$29/month'
            },
            'e156723d-fdd9-4df5-85e8-c4cf6e7fa1ed': {
                icon: 'Crown',
                button_text: 'Choose Business',
                highlight: false,
                description: 'Advanced features for established businesses',
                sort_order: 3,
                price: '$59000/month'
            },
            'c2bab443-0f3f-4496-87d0-ddcb4f6cd167': {
                icon: 'Briefcase',
                button_text: 'Contact Sales',
                highlight: false,
                description: 'Custom solutions for large organizations',
                sort_order: 4,
                price: 'Custom'
            },
            // Map by plan_name as fallback
            'Starter': {
                icon: 'CheckCircle',
                button_text: 'Get Started',
                highlight: false,
                description: 'Perfect for small teams getting started',
                sort_order: 1,
                price: '$9/month'
            },
            'Professional': {
                icon: 'Star',
                button_text: 'Choose Professional',
                highlight: true,
                description: 'Most popular plan for growing teams',
                sort_order: 2,
                price: '$29/month'
            },
            'Business': {
                icon: 'Crown',
                button_text: 'Choose Business',
                highlight: false,
                description: 'Advanced features for established businesses',
                sort_order: 3,
                price: '$59/month'
            },
            'Enterprise': {
                icon: 'Briefcase',
                button_text: 'Contact Sales',
                highlight: false,
                description: 'Custom solutions for large organizations',
                sort_order: 4,
                price: 'Custom'
            }
        };
    }

    // Fallback method to extract plan metadata from existing plan_feature data
    static async getPlansMetadataFallback(): Promise<PlanMetadata[]> {
        try {
            const { data, error } = await supabase
                .from('plan_feature')
                .select('plan_id, plan_subscription!inner(plan_name)')
                .order('plan_id');

            if (error) throw error;
            if (!data) return [];

            // Extract unique plans
            const uniquePlans = data.reduce((acc: any[], current) => {
                const existingPlan = acc.find(plan => plan.plan_id === current.plan_id);
                if (!existingPlan) {
                    acc.push({
                        id: current.plan_id,
                        plan_id: current.plan_id,
                        plan_name: (current as any).plan_subscription?.plan_name || 'Unknown Plan'
                    });
                }
                return acc;
            }, []);

            // Get static metadata
            const staticMetadata = this.getStaticPlanMetadata();

            // Transform to metadata format with static data
            return uniquePlans.map((plan, index) => {
                const planKey = plan.plan_id || plan.plan_name;
                const staticData = staticMetadata[planKey] || this.getDefaultPlanData(plan.plan_name, index);

                return {
                    id: plan.id,
                    plan_id: plan.plan_id,
                    name: plan.plan_name,
                    price: staticData.price,
                    icon: staticData.icon,
                    button_text: staticData.button_text,
                    highlight: staticData.highlight,
                    description: staticData.description,
                    sort_order: staticData.sort_order
                };
            });

        } catch (error) {
            console.error("Fallback metadata fetch failed:", error);
            return [];
        }
    }

    // Default plan data generator
    private static getDefaultPlanData(planName: string, index: number) {
        const planNames = ['Starter', 'Professional', 'Business', 'Enterprise'];
        const icons = ['CheckCircle', 'Star', 'Crown', 'Briefcase'];
        const prices = ['$9/month', '$29/month', '$59/month', 'Custom'];
        const descriptions = [
            'Perfect for small teams getting started',
            'Most popular plan for growing teams',
            'Advanced features for established businesses',
            'Custom solutions for large organizations'
        ];

        const defaultName = planNames[index] || `Plan ${index + 1}`;

        return {
            icon: icons[index] || 'CheckCircle',
            button_text: index === 3 ? 'Contact Sales' : `Choose ${defaultName}`,
            highlight: index === 1, // Highlight Professional plan by default
            description: descriptions[index] || `Features for ${defaultName}`,
            sort_order: index + 1,
            price: prices[index] || 'Contact Us'
        };
    }

    // Helper methods for generating default values (keeping for backward compatibility)
    private static getDefaultIcon(planName: string): string {
        if (!planName) return 'CheckCircle';

        const name = planName.toLowerCase();
        if (name.includes('starter') || name.includes('basic') || name.includes('free')) return 'CheckCircle';
        if (name.includes('professional') || name.includes('pro') || name.includes('standard')) return 'Star';
        if (name.includes('business') || name.includes('premium') || name.includes('plus')) return 'Crown';
        if (name.includes('enterprise') || name.includes('custom') || name.includes('ultimate')) return 'Briefcase';

        return 'CheckCircle';
    }

    private static getDefaultPrice(planName: string, index: number): string {
        const name = planName.toLowerCase();

        if (name.includes('free') || name.includes('starter')) return 'Free';
        if (name.includes('enterprise') || name.includes('custom')) return 'Custom';

        // Default pricing tiers
        const defaultPrices = ['$9/month', '$29/month', '$59/month', '$99/month'];
        return defaultPrices[index] || 'Contact Us';
    }

    private static getDefaultButtonText(planName: string): string {
        const name = planName.toLowerCase();

        if (name.includes('free')) return 'Get Started Free';
        if (name.includes('enterprise') || name.includes('custom')) return 'Contact Sales';

        return `Choose ${planName}`;
    }

    // Method to get combined plans data (features + metadata)
    static async getCombinedPlansData(): Promise<BillingPlan[]> {
        try {
            const [featuresData, metadataArray] = await Promise.all([
                this.getPlans(),
                this.getPlansMetadata()
            ]);

            return this.transformPlanData(featuresData, metadataArray);
        } catch (error) {
            console.error("Error getting combined plans data:", error);
            throw error;
        }
    }

    // Transform method (moved from component to service)
    private static transformPlanData(featuresData: any[], plansMetadata: PlanMetadata[] = []): BillingPlan[] {
        // Group features by plan_id
        const groupedByPlan = featuresData.reduce((acc, feature) => {
            const planId = feature.plan_id;

            if (!acc[planId]) {
                acc[planId] = {
                    planId: planId,
                    features: []
                };
            }

            // Format feature display text
            const featureText = feature.feature_value === 'Included'
                ? feature.feature_name
                : `${feature.feature_name}: ${feature.feature_value}`;

            acc[planId].features.push(featureText);

            return acc;
        }, {} as any);

        // Create a metadata lookup
        const metadataLookup: { [key: string]: PlanMetadata } = {};
        plansMetadata.forEach(plan => {
            metadataLookup[plan.plan_id] = plan;
        });

        // Combine grouped features with plan metadata
        const transformedPlans = Object.keys(groupedByPlan).map((planId, index) => {
            const planData = groupedByPlan[planId];
            const metadata = metadataLookup[planId];

            if (metadata) {
                return {
                    icon: metadata.icon || this.getDefaultIcon(metadata.name),
                    name: metadata.name,
                    price: metadata.price,
                    features: planData.features,
                    button: metadata.button_text || this.getDefaultButtonText(metadata.name),
                    highlight: metadata.highlight || false
                };
            } else {
                // Fallback if no metadata found
                return {
                    icon: 'CheckCircle',
                    name: `Plan ${index + 1}`,
                    price: 'Contact Us',
                    features: planData.features,
                    button: 'Select Plan',
                    highlight: false
                };
            }
        });

        // Sort by sort_order if available
        return transformedPlans.sort((a, b) => {
            const aMetadata = plansMetadata.find(m => m.name === a.name);
            const bMetadata = plansMetadata.find(m => m.name === b.name);

            if (aMetadata?.sort_order !== undefined && bMetadata?.sort_order !== undefined) {
                return aMetadata.sort_order - bMetadata.sort_order;
            }
            return 0;
        });
    }
}