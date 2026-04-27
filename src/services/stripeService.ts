// import { loadStripe } from '@stripe/stripe-js';
// import { supabase } from '@/integrations/supabase/client';

// // Initialize Stripe with your publishable key
// const stripePromise = loadStripe('pk_test_51RmECBPWQwH62VVmmw878HK0KMJrRcn28Y0Wo8Gsi4kZPuimN6nqN4stV4iwyohTf0TGmzOyRn689oQsnOXwcrLG00lbKwA0m8');

// // Stripe secret key (in production, this should be on the server)
// const STRIPE_SECRET_KEY = 'sk_test_51RmECBPWQwH62VVmhYMKf8EicZZ8g9FbXmildKivZkW53D0HgZbhbc2JjF8NhadwS8Q8d9G5ZOf52lG0o5ASIoJw00mPRclpFv';

// export interface CheckoutSessionData {
//     planId: string;
//     planName: string;
//     price: string;
//     companyId?: string;
//     userId: string;
//     successUrl: string;
//     cancelUrl: string;
// }

// export class StripeService {
//     static async createCheckoutSession(data: CheckoutSessionData) {
//         try {
//             // console.log('Creating checkout session:', data);

//             // Parse price to get amount in cents
//             const parsePrice = (price: string): number => {
//                 if (price === 'Custom') {
//                     throw new Error('Custom pricing not supported for online checkout');
//                 }

//                 // Extract numeric part from price strings like "$29/month", "$29", "29/month", "29"
//                 const match = price.match(/^\$?(\d+(?:\.\d{2})?)/);
//                 if (!match) {
//                     throw new Error(`Invalid price format: ${price}`);
//                 }

//                 return parseInt(match[1]) * 100; // Convert to cents
//             };

//             // Get user email
//             const { data: { user } } = await supabase.auth.getUser();
//             if (!user) {
//                 throw new Error('User not authenticated');
//             }

//             const priceAmount = parsePrice(data.price);

//             // Create Stripe checkout session directly
//             const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//                 body: new URLSearchParams({
//                     'payment_method_types[]': 'card',
//                     'line_items[0][price_data][currency]': 'usd',
//                     'line_items[0][price_data][product_data][name]': `${data.planName} Plan`,
//                     'line_items[0][price_data][product_data][description]': `Subscription to ${data.planName} plan`,
//                     'line_items[0][price_data][unit_amount]': priceAmount.toString(),
//                     'line_items[0][price_data][recurring][interval]': 'month',
//                     'line_items[0][quantity]': '1',
//                     'mode': 'subscription',
//                     'success_url': `${data.successUrl}&session_id={CHECKOUT_SESSION_ID}`,
//                     'cancel_url': data.cancelUrl,
//                     'metadata[planId]': data.planId,
//                     'metadata[planName]': data.planName,
//                     'metadata[companyId]': data.companyId || '',
//                     'metadata[userId]': data.userId,
//                     'customer_email': user.email || '',
//                 }).toString(),
//             });
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 console.error('Stripe API Error:', errorData);
//                 throw new Error(errorData.error?.message || 'Failed to create Stripe checkout session');
//             }

//             const responseData = await response.json();
//             // console.log('Stripe Service: Checkout Session Created Successfully', responseData);
//             const { id: sessionId } = responseData;

//             // Save checkout session to database
//             // console.log('Stripe Service: Saving checkout session to database...');
//             await this.saveCheckoutSession({
//                 sessionId,
//                 userId: data.userId,
//                 companyId: data.companyId,
//                 planId: data.planId,
//                 planName: data.planName,
//                 priceAmount: priceAmount,
//                 metadata: {
//                     planId: data.planId,
//                     planName: data.planName,
//                     companyId: data.companyId || '',
//                     userId: data.userId
//                 }
//             });
//             // console.log('Stripe Service: Checkout session saved to database successfully');

//             return sessionId;
//         } catch (error) {
//             console.error('Error creating checkout session:', error);
//             throw error;
//         }
//     }

//     static async redirectToCheckout(sessionId: string) {
//         try {
//             const stripe = await stripePromise;
//             if (!stripe) {
//                 throw new Error('Stripe failed to load');
//             }

//             const { error } = await stripe.redirectToCheckout({
//                 sessionId,
//             });

//             if (error) {
//                 throw error;
//             }
//         } catch (error) {
//             console.error('Error redirecting to checkout:', error);
//             throw error;
//         }
//     }

//     static async handlePlanPurchase(plan: any, companyId?: string) {
//         try {
//             const { data: { user } } = await supabase.auth.getUser();
//             if (!user) {
//                 throw new Error('User not authenticated');
//             }

//             // Parse price to extract numeric value
//             const parsePrice = (price: string): string => {
//                 if (price === 'Custom') {
//                     throw new Error('Custom pricing not supported for online checkout');
//                 }

//                 // Extract numeric part from price strings like "$29/month", "$29", "29/month", "29"
//                 const match = price.match(/^\$?(\d+(?:\.\d{2})?)/);
//                 if (!match) {
//                     throw new Error(`Invalid price format: ${price}`);
//                 }

//                 return match[1]; // Return just the numeric part
//             };

//             // Create checkout session data
//             const checkoutData: CheckoutSessionData = {
//                 planId: plan.planId,
//                 planName: plan.name,
//                 price: parsePrice(plan.price), // Pass only the numeric part
//                 companyId,
//                 userId: user.id,
//                 successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//                 cancelUrl: `${window.location.origin}/checkout/cancel?reason=user_canceled`,
//             };

//             // Create checkout session
//             const sessionId = await this.createCheckoutSession(checkoutData);

//             // Redirect to Stripe checkout
//             await this.redirectToCheckout(sessionId);
//         } catch (error) {
//             console.error('Error handling plan purchase:', error);
//             throw error;
//         }
//     }

//     // Handle successful payment callback
//     static async handlePaymentSuccess(sessionId: string) {
//         try {
//             // Get session details from Stripe
//             const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
//                 },
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to retrieve session from Stripe');
//             }

//             const session = await response.json();
//             // // console.log('Stripe Service: Payment Success - Session Data', session);
//             const { payment_status, metadata, subscription, customer } = session;
//             const { planName, companyId, userId } = metadata;

//             // Check if payment was successful
//             if (payment_status !== 'paid') {
//                 throw new Error('Payment not completed');
//             }

//             // Get current plan for history tracking
//             const { data: { user } } = await supabase.auth.getUser();
//             const currentPlan = user?.user_metadata?.selectedPlan || 'Starter';

//             // Save subscription data if available
//             if (subscription) {
//                 await this.saveSubscription({
//                     subscriptionId: subscription.id,
//                     checkoutSessionId: sessionId,
//                     userId,
//                     companyId: companyId || undefined,
//                     planName,
//                     status: subscription.status,
//                     currentPeriodStart: subscription.current_period_start,
//                     currentPeriodEnd: subscription.current_period_end,
//                     metadata: subscription.metadata
//                 });
//             }

//             // Record plan change
//             await this.recordPlanChange({
//                 userId,
//                 companyId: companyId || undefined,
//                 oldPlan: currentPlan,
//                 newPlan: planName,
//                 changeReason: 'payment',
//                 subscriptionId: subscription?.id,
//                 checkoutSessionId: sessionId
//             });

//             // Update the plan in the database directly
//             if (companyId && companyId !== '') {
//                 // Update company plan
//                 const { error: companyError } = await supabase
//                     .from('companies')
//                     .update({ subscription_plan: planName })
//                     .eq('id', companyId);

//                 if (companyError) {
//                     throw new Error('Failed to update company plan');
//                 }

//                 // Also update user metadata to reflect the company plan
//                 const { error: userError } = await supabase.auth.updateUser({
//                     data: { selectedPlan: planName }
//                 });

//                 if (userError) {
//                     throw new Error('Failed to update user plan');
//                 }
//             } else {
//                 // Update user plan only
//                 const { error: userError } = await supabase.auth.updateUser({
//                     data: { selectedPlan: planName }
//                 });

//                 if (userError) {
//                     throw new Error('Failed to update user plan');
//                 }
//             }

//             // After fetching session and getting customer
//             if (customer) {
//                 await (supabase as any)
//                     .from('stripe_checkout_sessions')
//                     .update({ customer_id: customer, subscription_id: subscription })
//                     .eq('session_id', sessionId);
//             }

//             return true;
//         } catch (error) {
//             console.error('Error handling payment success:', error);
//             throw error;
//         }
//     }

//     // Save checkout session to database
//     private static async saveCheckoutSession(data: {
//         sessionId: string;
//         userId: string;
//         companyId?: string;
//         planId: string;
//         planName: string;
//         priceAmount: number;
//         metadata: any;
//     }) {
//         try {
//             // console.log('Stripe Service: Inserting checkout session data:', {
//                 session_id: data.sessionId,
//                 user_id: data.userId,
//                 company_id: data.companyId || null,
//                 plan_id: data.planId,
//                 plan_name: data.planName,
//                 price_amount: data.priceAmount
//             });

//             const { error } = await (supabase as any)
//                 .from('stripe_checkout_sessions')
//                 .insert({
//                     session_id: data.sessionId,
//                     user_id: data.userId,
//                     company_id: data.companyId || null,
//                     plan_id: data.planId,
//                     plan_name: data.planName,
//                     price_amount: data.priceAmount,
//                     metadata: data.metadata
//                 });

//             if (error) {
//                 console.error('Error saving checkout session:', error);
//                 // Don't throw error as this is not critical for the checkout flow
//             } else {
//                 // console.log('Stripe Service: Checkout session saved successfully to database');
//             }
//         } catch (error) {
//             console.error('Error saving checkout session:', error);
//             // Don't throw error as this is not critical for the checkout flow
//         }
//     }

//     // Save subscription to database
//     private static async saveSubscription(data: {
//         subscriptionId: string;
//         checkoutSessionId: string;
//         userId: string;
//         companyId?: string;
//         planName: string;
//         status: string;
//         currentPeriodStart?: string;
//         currentPeriodEnd?: string;
//         metadata?: any;
//     }) {
//         try {
//             const { error } = await (supabase as any)
//                 .from('stripe_subscriptions')
//                 .insert({
//                     subscription_id: data.subscriptionId,
//                     checkout_session_id: data.checkoutSessionId,
//                     user_id: data.userId,
//                     company_id: data.companyId || null,
//                     plan_name: data.planName,
//                     status: data.status,
//                     current_period_start: data.currentPeriodStart,
//                     current_period_end: data.currentPeriodEnd,
//                     metadata: data.metadata || {}
//                 });

//             if (error) {
//                 console.error('Error saving subscription:', error);
//             }
//         } catch (error) {
//             console.error('Error saving subscription:', error);
//         }
//     }

//     // Record plan change in history
//     private static async recordPlanChange(data: {
//         userId: string;
//         companyId?: string;
//         oldPlan?: string;
//         newPlan: string;
//         changeReason?: string;
//         subscriptionId?: string;
//         checkoutSessionId?: string;
//     }) {
//         try {
//             const { error } = await (supabase as any)
//                 .from('plan_history')
//                 .insert({
//                     user_id: data.userId,
//                     company_id: data.companyId || null,
//                     old_plan: data.oldPlan || null,
//                     new_plan: data.newPlan,
//                     change_reason: data.changeReason || 'payment',
//                     subscription_id: data.subscriptionId || null,
//                     checkout_session_id: data.checkoutSessionId || null,
//                     changed_by: data.userId
//                 });

//             if (error) {
//                 console.error('Error recording plan change:', error);
//             }
//         } catch (error) {
//             console.error('Error recording plan change:', error);
//         }
//     }

// }

import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { newPricingService } from '@/services/newPricingService';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Stripe secret key (in production, this should be on the server)
const STRIPE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY || '';

// Stripe Price IDs from environment
export const STRIPE_PRICES = {
    // Base Plans
    CORE_BASE: import.meta.env.VITE_STRIPE_PRICE_CORE_BASE,
    ENTERPRISE: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE,

    // Power Packs (€349/mo each)
    BUILD_PACK: import.meta.env.VITE_STRIPE_PRICE_BUILD_PACK,
    OPS_PACK: import.meta.env.VITE_STRIPE_PRICE_OPS_PACK,
    MONITOR_PACK: import.meta.env.VITE_STRIPE_PRICE_MONITOR_PACK,
    GROWTH_SUITE: import.meta.env.VITE_STRIPE_PRICE_GROWTH_SUITE, // €1,199/mo (all 3 packs bundled)

    // Specialist Modules
    PREDICATE_FINDER: import.meta.env.VITE_STRIPE_PRICE_PREDICATE_FINDER, // €99/mo
    IP_PATENT: import.meta.env.VITE_STRIPE_PRICE_IP_PATENT, // €149/mo

    // Usage-based Add-ons
    CORE_EXTRA_DEVICE: import.meta.env.VITE_STRIPE_PRICE_CORE_EXTRA_DEVICE, // €150/mo
    CORE_EXTRA_MODULE: import.meta.env.VITE_STRIPE_PRICE_CORE_EXTRA_MODULE, // €100/mo (module slot)
    CORE_AI_BOOSTER: import.meta.env.VITE_STRIPE_PRICE_CORE_AI_BOOSTER, // €50/mo
    GENESIS_AI_BOOSTER: import.meta.env.VITE_STRIPE_PRICE_GENESIS_AI_BOOSTER, // €49/mo

    // Investor Add-ons
    INVESTOR_STARTER: import.meta.env.VITE_STRIPE_PRICE_INVESTOR_STARTER,
    INVESTOR_GROWTH: import.meta.env.VITE_STRIPE_PRICE_INVESTOR_GROWTH,
    KPI_WATCHTOWER: import.meta.env.VITE_STRIPE_PRICE_KPI_WATCHTOWER, // €199/co/mo
    DD_ROOM: import.meta.env.VITE_STRIPE_PRICE_DD_ROOM, // €99/room/mo
};

// Pack ID to Stripe Price ID mapping
export const PACK_PRICE_MAPPING: Record<string, string> = {
    'build': STRIPE_PRICES.BUILD_PACK,
    'ops': STRIPE_PRICES.OPS_PACK,
    'monitor': STRIPE_PRICES.MONITOR_PACK,
};

// Pack pricing (in cents for Stripe)
export const PACK_PRICES: Record<string, number> = {
    'build': 34900,    // €349
    'ops': 34900,      // €349
    'monitor': 34900,  // €349
    'growth_suite': 70000, // €700 (discounted bundle - saves €347 vs buying separately)
};

// Specialist module pricing (in cents)
export const SPECIALIST_PRICES: Record<string, number> = {
    'predicate_finder': 9900,  // €99
    'ip_patent': 14900,        // €149
};

// Plan tier mapping to Stripe Price IDs
export const PLAN_PRICE_MAPPING: Record<string, string> = {
    'genesis': '', // Free plan, no Stripe price
    'enterprise': STRIPE_PRICES.ENTERPRISE,
    'genesis_ai_booster': STRIPE_PRICES.GENESIS_AI_BOOSTER,
    'core': STRIPE_PRICES.CORE_BASE,
    'core_extra_device': STRIPE_PRICES.CORE_EXTRA_DEVICE,
    'core_extra_module': STRIPE_PRICES.CORE_EXTRA_MODULE,
    'core_ai_booster': STRIPE_PRICES.CORE_AI_BOOSTER,
    'investor_starter': STRIPE_PRICES.INVESTOR_STARTER,
    'investor_growth': STRIPE_PRICES.INVESTOR_GROWTH,
    'kpi_watchtower': STRIPE_PRICES.KPI_WATCHTOWER,
    'dd_room': STRIPE_PRICES.DD_ROOM,
};

export interface CheckoutSessionData {
    planId: string;
    planName: string;
    price: string;
    stripePriceId?: string; // Stripe Price ID for pre-configured products
    companyId?: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
    // Additional configuration for tiered pricing
    tier?: 'genesis' | 'core' | 'enterprise' | 'investor';

    // Usage-based add-ons
    extraDevices?: number;
    extraModules?: number;
    aiBoosterPacks?: number;

    // Power Packs (Build, Ops, Monitor)
    selectedPacks?: string[];  // ['build', 'ops', 'monitor']
    isGrowthSuite?: boolean;   // true if all 3 packs selected (bundle discount)

    // Individual modules (à la carte)
    selectedModules?: string[]; // ['ai-requirements', 'pms-vigilance']

    // Specialist modules
    specialistModules?: {
        predicateFinder?: boolean;
        ipPatent?: boolean;
    };

    // Investor-specific
    kpiWatchtowerCount?: number;
    ddRoomCount?: number;

}

export class StripeService {
    /**
     * Create a checkout session using pre-configured Stripe Price IDs
     * This method supports both single plan purchases and multi-item checkouts (with add-ons)
     */
    static async createCheckoutSession(data: CheckoutSessionData) {
        try {
            // Get user email
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Build line items based on configuration
            const lineItems = this.buildLineItems(data);

            if (lineItems.length === 0) {
                throw new Error('No valid line items for checkout');
            }

            // Determine if this is a subscription or one-time purchase
            const hasRecurring = lineItems.some(item => item.isRecurring);
            const mode = hasRecurring ? 'subscription' : 'payment';

            // Build the request body
            const bodyParams = new URLSearchParams();
            bodyParams.append('payment_method_types[]', 'card');
            bodyParams.append('mode', mode);
            bodyParams.append('success_url', data.successUrl.includes('?')
                ? `${data.successUrl}&session_id={CHECKOUT_SESSION_ID}`
                : `${data.successUrl}?session_id={CHECKOUT_SESSION_ID}`);
            bodyParams.append('cancel_url', data.cancelUrl);
            bodyParams.append('customer_email', user.email || '');
            bodyParams.append('allow_promotion_codes', 'true');

            // Add metadata
            bodyParams.append('metadata[planId]', data.planId);
            bodyParams.append('metadata[planName]', data.planName);
            bodyParams.append('metadata[tier]', data.tier || '');
            bodyParams.append('metadata[companyId]', data.companyId || '');
            bodyParams.append('metadata[userId]', data.userId);
            bodyParams.append('metadata[stripePriceId]', data.stripePriceId || lineItems[0]?.priceId || '');

            // Add line items
            lineItems.forEach((item, index) => {
                if (item.priceId) {
                    // Use pre-configured Stripe Price ID
                    bodyParams.append(`line_items[${index}][price]`, item.priceId);
                    bodyParams.append(`line_items[${index}][quantity]`, item.quantity.toString());
                } else {
                    // Fallback to dynamic pricing (for custom amounts)
                    bodyParams.append(`line_items[${index}][price_data][currency]`, 'eur');
                    bodyParams.append(`line_items[${index}][price_data][product_data][name]`, item.name);
                    bodyParams.append(`line_items[${index}][price_data][product_data][description]`, item.description || '');
                    bodyParams.append(`line_items[${index}][price_data][unit_amount]`, item.amount.toString());
                    if (item.isRecurring) {
                        bodyParams.append(`line_items[${index}][price_data][recurring][interval]`, 'month');
                    }
                    bodyParams.append(`line_items[${index}][quantity]`, item.quantity.toString());
                }
            });

            // Add subscription metadata if it's a subscription
            if (mode === 'subscription') {
                bodyParams.append('subscription_data[metadata][planId]', data.planId);
                bodyParams.append('subscription_data[metadata][planName]', data.planName);
                bodyParams.append('subscription_data[metadata][tier]', data.tier || '');
                bodyParams.append('subscription_data[metadata][stripePriceId]', data.stripePriceId || lineItems[0]?.priceId || '');
                // Add-on metadata
                if (data.selectedPacks?.length) {
                    bodyParams.append('subscription_data[metadata][selectedPacks]', JSON.stringify(data.selectedPacks));
                }
                if (data.isGrowthSuite) {
                    bodyParams.append('subscription_data[metadata][isGrowthSuite]', 'true');
                }
                if (data.specialistModules) {
                    bodyParams.append('subscription_data[metadata][specialistModules]', JSON.stringify(data.specialistModules));
                }
                if (data.selectedModules?.length) {
                    bodyParams.append('subscription_data[metadata][selectedModules]', JSON.stringify(data.selectedModules));
                }
                if (data.extraDevices) {
                    bodyParams.append('subscription_data[metadata][extraDevices]', data.extraDevices.toString());
                }
                if (data.aiBoosterPacks) {
                    bodyParams.append('subscription_data[metadata][aiBoosterPacks]', data.aiBoosterPacks.toString());
                }
            }

            // Create Stripe checkout session
            const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: bodyParams.toString(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Stripe API Error:', errorData);
                throw new Error(errorData.error?.message || 'Failed to create Stripe checkout session');
            }

            const responseData = await response.json();
            const { id: sessionId, url: checkoutUrl } = responseData;

            // Calculate total price amount
            const priceAmount = lineItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);

            // Save checkout session to database with Stripe Price ID
            await this.saveCheckoutSession({
                sessionId,
                userId: data.userId,
                companyId: data.companyId,
                planId: data.planId,
                planName: data.planName,
                priceAmount: priceAmount,
                stripePriceId: data.stripePriceId || lineItems[0]?.priceId,
                tier: data.tier,
                metadata: {
                    planId: data.planId,
                    planName: data.planName,
                    tier: data.tier,
                    stripePriceId: data.stripePriceId || lineItems[0]?.priceId,
                    companyId: data.companyId || '',
                    userId: data.userId,
                    extraDevices: data.extraDevices || 0,
                    aiBoosterPacks: data.aiBoosterPacks || 0,
                    selectedPacks: data.selectedPacks || [],
                    isGrowthSuite: data.isGrowthSuite || false,
                    specialistModules: data.specialistModules || {},
                    selectedModules: data.selectedModules || [],
                    kpiWatchtowerCount: data.kpiWatchtowerCount || 0,
                    ddRoomCount: data.ddRoomCount || 0,
                }
            });

            return { sessionId, checkoutUrl };
        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw error;
        }
    }

    /**
     * Build line items for checkout based on plan configuration
     * Supports: base plans, power packs, specialist modules, devices, AI boosters
     */
    private static buildLineItems(data: CheckoutSessionData): Array<{
        priceId?: string;
        name: string;
        description?: string;
        amount: number;
        quantity: number;
        isRecurring: boolean;
    }> {
        const lineItems: Array<{
            priceId?: string;
            name: string;
            description?: string;
            amount: number;
            quantity: number;
            isRecurring: boolean;
        }> = [];

        // If no stripePriceId and no tier, create a dynamic price line item (e.g. coupon flat rate)
        if (!data.stripePriceId && !data.tier) {
            const amount = this.parsePrice(data.price) * 100; // Convert to cents
            if (amount > 0) {
                lineItems.push({
                    name: data.planName,
                    description: `${data.planName} subscription`,
                    amount,
                    quantity: 1,
                    isRecurring: true,
                });
                return lineItems;
            }
        }

        // If a specific Stripe Price ID is provided (single item purchase), use it
        if (data.stripePriceId && !data.tier) {
            const isAiBooster = data.planId?.toLowerCase().includes('ai_booster') ||
                                data.planId?.toLowerCase().includes('aibooster') ||
                                data.planName?.toLowerCase().includes('ai booster');

            lineItems.push({
                priceId: data.stripePriceId,
                name: data.planName,
                amount: this.parsePrice(data.price) * 100,
                quantity: data.aiBoosterPacks || 1,
                isRecurring: !isAiBooster,
            });
            return lineItems;
        }

        // Build items based on tier (full checkout with add-ons)
        if (data.tier) {
            const isAddOnOnly = data.planId?.toLowerCase().includes('addons_only');

            // 1. BASE PLAN
            if (!isAddOnOnly) {
                const tierPriceId = PLAN_PRICE_MAPPING[data.tier];
                if (tierPriceId) {
                    lineItems.push({
                        priceId: tierPriceId,
                        name: `${data.planName} Base`,
                        description: 'Core platform subscription',
                        amount: 49900, // €499 base
                        quantity: 1,
                        isRecurring: true,
                    });
                } else if (data.tier === 'enterprise') {
                    // Enterprise — flat €1,000/mo, full access
                    lineItems.push({
                        name: 'Enterprise',
                        description: 'Full platform access — all modules & power packs',
                        amount: 100000, // €1,000
                        quantity: 1,
                        isRecurring: true,
                    });
                } else if (data.tier === 'core') {
                    // Fallback for core without price ID
                    lineItems.push({
                        name: `${data.planName} Base`,
                        description: 'Core platform subscription',
                        amount: 49900,
                        quantity: 1,
                        isRecurring: true,
                    });
                }
            }

            // Enterprise is a single flat-rate item — skip all add-ons
            if (data.tier === 'enterprise') {
                return lineItems;
            }

            // 2. POWER PACKS (Build, Ops, Monitor)
            if (data.isGrowthSuite) {
                // All 3 packs at discounted bundle rate (€1,199 instead of €1,047)
                if (STRIPE_PRICES.GROWTH_SUITE) {
                    lineItems.push({
                        priceId: STRIPE_PRICES.GROWTH_SUITE,
                        name: 'Growth Suite Bundle',
                        description: 'Build + Ops + Monitor Packs (Discounted)',
                        amount: PACK_PRICES['growth_suite'], // €1,199
                        quantity: 1,
                        isRecurring: true,
                    });
                } else {
                    // Fallback: Growth Suite without Stripe Price ID (dynamic pricing)
                    lineItems.push({
                        name: 'Growth Suite (All Packs)',
                        description: 'Build + Ops + Monitor Packs - Discounted Bundle',
                        amount: PACK_PRICES['growth_suite'], // €1,199 = 119900 cents
                        quantity: 1,
                        isRecurring: true,
                    });
                }
            } else if (data.selectedPacks && data.selectedPacks.length > 0) {
                // Individual packs
                for (const packId of data.selectedPacks) {
                    const priceId = PACK_PRICE_MAPPING[packId];
                    const packNames: Record<string, string> = {
                        'build': 'Build Pack',
                        'ops': 'Ops Pack',
                        'monitor': 'Monitor Pack',
                    };
                    const packDescriptions: Record<string, string> = {
                        'build': 'AI-powered R&D acceleration modules',
                        'ops': 'Quality operations & audit management',
                        'monitor': 'Post-market surveillance & clinical',
                    };

                    if (priceId) {
                        lineItems.push({
                            priceId,
                            name: packNames[packId] || `${packId} Pack`,
                            description: packDescriptions[packId],
                            amount: PACK_PRICES[packId] || 34900, // €349
                            quantity: 1,
                            isRecurring: true,
                        });
                    } else {
                        // Fallback without Stripe Price ID
                        lineItems.push({
                            name: packNames[packId] || `${packId} Pack`,
                            description: packDescriptions[packId],
                            amount: PACK_PRICES[packId] || 34900,
                            quantity: 1,
                            isRecurring: true,
                        });
                    }
                }
            }

            // 3. SPECIALIST MODULES (Predicate Finder, IP Patent)
            if (data.specialistModules?.predicateFinder) {
                if (STRIPE_PRICES.PREDICATE_FINDER) {
                    lineItems.push({
                        priceId: STRIPE_PRICES.PREDICATE_FINDER,
                        name: 'Predicate Finder',
                        description: 'FDA 510(k) AI scraper & analysis',
                        amount: SPECIALIST_PRICES['predicate_finder'], // €99
                        quantity: 1,
                        isRecurring: true,
                    });
                } else {
                    lineItems.push({
                        name: 'Predicate Finder',
                        description: 'FDA 510(k) AI scraper & analysis',
                        amount: SPECIALIST_PRICES['predicate_finder'],
                        quantity: 1,
                        isRecurring: true,
                    });
                }
            }

            if (data.specialistModules?.ipPatent) {
                if (STRIPE_PRICES.IP_PATENT) {
                    lineItems.push({
                        priceId: STRIPE_PRICES.IP_PATENT,
                        name: 'IP & Patent FTO',
                        description: 'Freedom to operate analysis & patent tracking',
                        amount: SPECIALIST_PRICES['ip_patent'], // €149
                        quantity: 1,
                        isRecurring: true,
                    });
                } else {
                    lineItems.push({
                        name: 'IP & Patent FTO',
                        description: 'Freedom to operate analysis & patent tracking',
                        amount: SPECIALIST_PRICES['ip_patent'],
                        quantity: 1,
                        isRecurring: true,
                    });
                }
            }

            // 4. EXTRA DEVICES (€150/mo each)
            if (data.extraDevices && data.extraDevices > 0) {
                if (STRIPE_PRICES.CORE_EXTRA_DEVICE) {
                    lineItems.push({
                        priceId: STRIPE_PRICES.CORE_EXTRA_DEVICE,
                        name: 'Extra Device',
                        description: `${data.extraDevices} additional device slot(s)`,
                        amount: 15000,
                        quantity: data.extraDevices,
                        isRecurring: true,
                    });
                } else {
                    lineItems.push({
                        name: 'Extra Device',
                        description: `${data.extraDevices} additional device slot(s)`,
                        amount: 15000,
                        quantity: data.extraDevices,
                        isRecurring: true,
                    });
                }
            }

            // 5. AI BOOSTER PACKS (€50 each, recurring monthly)
            if (data.aiBoosterPacks && data.aiBoosterPacks > 0) {
                const priceId = data.tier === 'genesis' ? STRIPE_PRICES.GENESIS_AI_BOOSTER : STRIPE_PRICES.CORE_AI_BOOSTER;
                const amount = data.tier === 'genesis' ? 4900 : 5000; // €49 or €50

                if (priceId) {
                    lineItems.push({
                        priceId,
                        name: 'AI Booster Pack',
                        description: `500 AI credits — consumed per AI generation`,
                        amount,
                        quantity: data.aiBoosterPacks,
                        isRecurring: true, // Monthly recurring
                    });
                } else {
                    lineItems.push({
                        name: 'AI Booster Pack',
                        description: `500 AI credits — consumed per AI generation`,
                        amount,
                        quantity: data.aiBoosterPacks,
                        isRecurring: true,
                    });
                }
            }

            // 6. INVESTOR ADD-ONS
            if (data.kpiWatchtowerCount && data.kpiWatchtowerCount > 0) {
                if (STRIPE_PRICES.KPI_WATCHTOWER) {
                    lineItems.push({
                        priceId: STRIPE_PRICES.KPI_WATCHTOWER,
                        name: 'KPI Watchtower',
                        description: `Live portfolio metrics for ${data.kpiWatchtowerCount} companies`,
                        amount: 19900, // €199/company/mo
                        quantity: data.kpiWatchtowerCount,
                        isRecurring: true,
                    });
                }
            }

            if (data.ddRoomCount && data.ddRoomCount > 0) {
                if (STRIPE_PRICES.DD_ROOM) {
                    lineItems.push({
                        priceId: STRIPE_PRICES.DD_ROOM,
                        name: 'Due Diligence Room',
                        description: `${data.ddRoomCount} secure data room(s)`,
                        amount: 9900, // €99/room/mo
                        quantity: data.ddRoomCount,
                        isRecurring: true,
                    });
                }
            }
        }

        // Fallback to dynamic pricing if nothing else matched
        if (lineItems.length === 0) {
            const priceAmount = this.parsePrice(data.price) * 100;
            if (priceAmount > 0) {
                lineItems.push({
                    name: `${data.planName} Plan`,
                    description: `Subscription to ${data.planName} plan`,
                    amount: priceAmount,
                    quantity: 1,
                    isRecurring: true,
                });
            }
        }

        return lineItems;
    }

    /**
     * Parse price string to numeric value
     */
    private static parsePrice(price: string): number {
        if (!price || price === 'Custom' || price === 'Free') {
            return 0;
        }
        const match = price.match(/[€$]?(\d+(?:\.\d{2})?)/);
        return match ? parseFloat(match[1]) : 0;
    }

    static async redirectToCheckout(checkoutUrl: string) {
        // Redirect to Stripe checkout page
        window.location.href = checkoutUrl;
    }

    static async handlePlanPurchase(plan: any, companyId?: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Parse price to extract numeric value
            const parsePrice = (price: string): number => {
                if (price === 'Custom') {
                    throw new Error('Custom pricing not supported for online checkout');
                }

                // Extract numeric part from price strings like "€29/month", "$29", "29/month", "29"
                const match = price.match(/[€$]?(\d+(?:\.\d{2})?)/);
                if (!match) {
                    return 0; // Default to 0 if no price found
                }

                return parseFloat(match[1]);
            };

            const priceAmount = parsePrice(plan.price);

            // Handle free plan (€0) - skip Stripe and activate directly
            if (priceAmount === 0 && !plan.stripePriceId) {
                // console.log('Free plan selected, activating directly...');

                // Update user metadata with the selected plan
                const { error: userError } = await supabase.auth.updateUser({
                    data: { selectedPlan: plan.name }
                });

                if (userError) {
                    throw new Error('Failed to activate free plan');
                }

                // Record plan change in history
                await this.recordPlanChange({
                    userId: user.id,
                    companyId: companyId,
                    oldPlan: user.user_metadata?.selectedPlan || 'None',
                    newPlan: plan.name,
                    changeReason: 'free_plan_activation',
                });

                // Redirect to success page
                window.location.href = `${window.location.origin}/checkout/success?plan=${plan.planId}&free=true`;
                return;
            }

            // Create checkout session data for paid plans
            const checkoutData: CheckoutSessionData = {
                planId: plan.planId,
                planName: plan.name,
                price: priceAmount.toString(),
                stripePriceId: plan.stripePriceId, // Pass Stripe Price ID
                tier: plan.tier, // Pass tier (genesis, core, enterprise, investor)
                companyId,
                userId: user.id,
                successUrl: `${window.location.origin}/checkout/success`,
                cancelUrl: `${window.location.origin}/checkout/cancel?reason=user_canceled`,
                // Pass additional options for multi-item checkouts
                extraDevices: plan.extraDevices,
                aiBoosterPacks: plan.aiBoosterPacks,
                // Power Packs (Build, Ops, Monitor)
                selectedPacks: plan.selectedPacks,
                isGrowthSuite: plan.isGrowthSuite,
                // Individual modules (à la carte)
                selectedModules: plan.selectedModules,
                // Specialist modules
                specialistModules: plan.specialistModules,
                // Investor add-ons
                kpiWatchtowerCount: plan.kpiWatchtowerCount,
                ddRoomCount: plan.ddRoomCount,
            };

            // Create checkout session
            const { sessionId, checkoutUrl } = await this.createCheckoutSession(checkoutData);

            // Redirect to Stripe checkout
            await this.redirectToCheckout(checkoutUrl);
        } catch (error) {
            console.error('Error handling plan purchase:', error);
            throw error;
        }
    }

    // Record plan change in history (made public for free plan activation)
    static async recordPlanChange(data: {
        userId: string;
        companyId?: string;
        oldPlan?: string;
        newPlan: string;
        changeReason?: string;
        subscriptionId?: string;
        checkoutSessionId?: string;
    }) {
        try {
            // Note: checkout_session_id is stored in metadata since it's a string, not UUID
            const { error } = await (supabase as any)
                .from('plan_history')
                .insert({
                    user_id: data.userId,
                    company_id: data.companyId || null,
                    old_plan: data.oldPlan || null,
                    new_plan: data.newPlan,
                    change_reason: data.changeReason || 'payment',
                    subscription_id: data.subscriptionId || null,
                    changed_by: data.userId,
                    metadata: {
                        checkout_session_id: data.checkoutSessionId || null
                    }
                });

            if (error) {
                console.error('Error recording plan change:', error);
            }
        } catch (error) {
            console.error('Error recording plan change:', error);
        }
    }

    // Handle successful payment callback - USES ONLY NEW PRICING TABLES
    static async handlePaymentSuccess(sessionId: string) {
        try {
            // Get session details from Stripe
            const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to retrieve session from Stripe');
            }

            const session = await response.json();
            console.log('[StripeService] Payment Success - Session Data:', JSON.stringify(session, null, 2));
            const { payment_status, metadata = {}, subscription, customer, amount_total } = session;

            // Extract values from metadata with defaults
            const planName = metadata.planName || metadata.plan_name || 'Helix OS';
            const companyId = metadata.companyId || metadata.company_id || null;
            const userId = metadata.userId || metadata.user_id || null;
            const tier = metadata.tier || 'core';
            const extraDevices = metadata.extraDevices ? parseInt(metadata.extraDevices) : 0;
            const aiBoosterPacks = metadata.aiBoosterPacks ? parseInt(metadata.aiBoosterPacks) : 0;

            // Extract add-on data (packs, modules, etc.)
            let selectedPacks: string[] = [];
            try {
                selectedPacks = metadata.selectedPacks ? JSON.parse(metadata.selectedPacks) : [];
            } catch { selectedPacks = []; }

            const isGrowthSuite = metadata.isGrowthSuite === 'true' || metadata.isGrowthSuite === true;

            let specialistModules: { predicateFinder?: boolean; ipPatent?: boolean } = {};
            try {
                specialistModules = metadata.specialistModules ? JSON.parse(metadata.specialistModules) : {};
            } catch { specialistModules = {}; }

            let selectedModules: string[] = [];
            try {
                selectedModules = metadata.selectedModules ? JSON.parse(metadata.selectedModules) : [];
            } catch { selectedModules = []; }

            const kpiWatchtowerCount = metadata.kpiWatchtowerCount ? parseInt(metadata.kpiWatchtowerCount) : 0;
            const ddRoomCount = metadata.ddRoomCount ? parseInt(metadata.ddRoomCount) : 0;

            console.log('[StripeService] Extracted metadata:', {
                planName, companyId, userId, tier,
                extraDevices, aiBoosterPacks,
                selectedPacks, isGrowthSuite, specialistModules, selectedModules
            });

            // Check if payment was successful or trial started
            const isValidPayment = payment_status === 'paid' ||
                                   payment_status === 'no_payment_required' ||
                                   (subscription && session.status === 'complete');

            if (!isValidPayment) {
                console.error('[StripeService] Payment not completed. Status:', payment_status, 'Session status:', session.status);
                throw new Error('Payment not completed');
            }

            // Get current user as fallback for userId
            const { data: { user } } = await supabase.auth.getUser();
            const effectiveUserId = userId || user?.id;

            if (!effectiveUserId) {
                throw new Error('User ID not found in metadata or session');
            }

            // Determine the plan tier
            const planTier = tier || (planName?.toLowerCase().includes('core') || planName?.toLowerCase().includes('helix') ? 'core' :
                                      planName?.toLowerCase().includes('enterprise') ? 'enterprise' : 'genesis');

            // Calculate trial end date (30 days from now for trial subscriptions)
            let trialEndsAt: string | undefined;
            if (payment_status === 'no_payment_required') {
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + 30);
                trialEndsAt = trialEnd.toISOString();
            }

            // Find company ID - either from metadata or from user's primary company
            let effectiveCompanyId = companyId;
            if (!effectiveCompanyId) {
                const { data: accessData } = await supabase
                    .from('user_company_access')
                    .select('company_id')
                    .eq('user_id', effectiveUserId)
                    .eq('is_primary', true)
                    .single();

                effectiveCompanyId = accessData?.company_id || null;
            }

            if (!effectiveCompanyId) {
                console.warn('[StripeService] No company found for user. Plan will be assigned to user metadata only.');
                // Update user metadata
                await supabase.auth.updateUser({
                    data: { selectedPlan: planName }
                });
                return true;
            }

            // Assign plan using new pricing service with all details including add-ons
            await newPricingService.assignPlanToCompanyWithOptions({
                companyId: effectiveCompanyId,
                planName: planTier,
                userId: effectiveUserId,
                status: trialEndsAt ? 'trial' : 'active',
                trialEndsAt,
                extraDevices,
                aiBoosterPacks,
                monthlyTotal: amount_total ? amount_total / 100 : undefined,
                stripeSubscriptionId: subscription || undefined,
                stripeCustomerId: customer || undefined,
                // Add-on details
                selectedPacks,
                isGrowthSuite,
                specialistModules,
                selectedModules,
                kpiWatchtowerCount,
                ddRoomCount,
            });

            console.log('[StripeService] Plan assigned to new_pricing_company_plans:', planTier, 'for company:', effectiveCompanyId);

            // Update company's subscription_plan field for backward compatibility
            await supabase
                .from('companies')
                .update({ subscription_plan: planName })
                .eq('id', effectiveCompanyId);

            // Update user metadata
            await supabase.auth.updateUser({
                data: { selectedPlan: planName }
            });

            // Save customer_id and subscription_id to stripe_checkout_sessions
            // so the billing tab can look up the payment method
            if (customer || subscription) {
                await (supabase as any)
                    .from('stripe_checkout_sessions')
                    .update({
                        customer_id: customer || null,
                        subscription_id: subscription || null,
                    })
                    .eq('session_id', sessionId);
            }

            // Save subscription to stripe_subscriptions table for billing tab display
            if (subscription) {
                // Fetch full subscription details from Stripe
                try {
                    const subResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                        },
                    });

                    if (subResponse.ok) {
                        const subData = await subResponse.json();
                        await this.saveSubscription({
                            subscriptionId: subscription,
                            checkoutSessionId: sessionId,
                            userId: effectiveUserId,
                            companyId: effectiveCompanyId || undefined,
                            planName,
                            status: subData.status || 'active',
                            currentPeriodStart: subData.current_period_start
                                ? new Date(subData.current_period_start * 1000).toISOString()
                                : undefined,
                            currentPeriodEnd: subData.current_period_end
                                ? new Date(subData.current_period_end * 1000).toISOString()
                                : undefined,
                            stripePriceId: metadata.stripePriceId,
                            tier: planTier,
                            metadata: subData.metadata,
                        });
                    }
                } catch (subError) {
                    console.error('[StripeService] Error saving subscription details:', subError);
                }

                // Fetch and save invoice for this subscription
                await this.fetchAndSaveInvoice(subscription, effectiveUserId, effectiveCompanyId || undefined);
            }

            return true;
        } catch (error) {
            console.error('Error handling payment success:', error);
            throw error;
        }
    }

    // Cancel a subscription
    static async cancelSubscription(subscriptionId: string) {
        try {
            // Cancel the subscription in Stripe
            const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to cancel subscription');
            }

            // Update the subscription status in the database
            await (supabase as any)
                .from('stripe_subscriptions')
                .update({ status: 'canceled' })
                .eq('subscription_id', subscriptionId);

            return true;
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            throw error;
        }
    }

    // Fetch and save invoice data from Stripe
    private static async fetchAndSaveInvoice(subscriptionId: string, userId: string, companyId?: string) {
        try {
            // Fetch invoices for the subscription
            const response = await fetch(`https://api.stripe.com/v1/invoices?subscription=${subscriptionId}&limit=1`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                },
            });

            if (!response.ok) {
                console.error('Failed to fetch invoice from Stripe');
                return;
            }

            const invoiceData = await response.json();

            if (invoiceData.data && invoiceData.data.length > 0) {
                const invoice = invoiceData.data[0]; // Get the most recent invoice

                await this.saveInvoice({
                    invoiceId: invoice.id,
                    subscriptionId: subscriptionId,
                    userId: userId,
                    companyId: companyId,
                    customerId: invoice.customer,
                    amount: invoice.amount_paid,
                    currency: invoice.currency,
                    status: invoice.status,
                    invoiceUrl: invoice.invoice_pdf,
                    hostedInvoiceUrl: invoice.hosted_invoice_url,
                    periodStart: invoice.period_start,
                    periodEnd: invoice.period_end,
                    metadata: invoice.metadata || {}
                });
            }
        } catch (error) {
            console.error('Error fetching and saving invoice:', error);
            // Don't throw error as this is not critical for the checkout flow
        }
    }

    // Save checkout session to database with Stripe Price ID
    private static async saveCheckoutSession(data: {
        sessionId: string;
        userId: string;
        companyId?: string;
        planId: string;
        planName: string;
        priceAmount: number;
        stripePriceId?: string;
        tier?: string;
        metadata: any;
    }) {
        try {
            

            // Store stripe_price_id and tier in metadata to avoid column issues
            const { error } = await (supabase as any)
                .from('stripe_checkout_sessions')
                .insert({
                    session_id: data.sessionId,
                    user_id: data.userId,
                    company_id: data.companyId || null,
                    plan_id: data.planId,
                    plan_name: data.planName,
                    price_amount: data.priceAmount,
                    metadata: {
                        ...data.metadata,
                        stripe_price_id: data.stripePriceId,
                        tier: data.tier
                    }
                });

            if (error) {
                console.error('Error saving checkout session:', error);
                // Don't throw error as this is not critical for the checkout flow
            } else {
                // console.log('Stripe Service: Checkout session saved successfully to database');
            }
        } catch (error) {
            console.error('Error saving checkout session:', error);
            // Don't throw error as this is not critical for the checkout flow
        }
    }

    // Save subscription to database with Stripe Price ID and tier
    private static async saveSubscription(data: {
        subscriptionId: string;
        checkoutSessionId: string;
        userId: string;
        companyId?: string;
        planName: string;
        status: string;
        currentPeriodStart?: string;
        currentPeriodEnd?: string;
        stripePriceId?: string;
        tier?: string;
        metadata?: any;
    }) {
        try {
            

            // Base insert data (columns that definitely exist)
            const insertData: any = {
                subscription_id: data.subscriptionId,
                user_id: data.userId,
                company_id: data.companyId || null,
                plan_name: data.planName,
                status: data.status,
                current_period_start: data.currentPeriodStart,
                current_period_end: data.currentPeriodEnd,
                metadata: {
                    ...(data.metadata || {}),
                    stripe_price_id: data.stripePriceId,
                    tier: data.tier
                }
            };

            const { error } = await (supabase as any)
                .from('stripe_subscriptions')
                .insert(insertData);

            if (error) {
                console.error('Error saving subscription:', error);
            } else {
                // console.log('Stripe Service: Subscription saved successfully to database');
            }
        } catch (error) {
            console.error('Error saving subscription:', error);
        }
    }

    // Save/update user_subscriptions table (used by useSubscription hook)
    private static async saveToUserSubscriptions(data: {
        userId: string;
        subscriptionId: string;
        productId: string;
        planName: string;
        status: string;
        currentPeriodEnd: string;
        stripePriceId?: string;
        tier?: string;
    }) {
        try {
           

            // Check if user already has a subscription record
            const { data: existingRecord, error: fetchError } = await (supabase as any)
                .from('user_subscriptions')
                .select('id')
                .eq('user_id', data.userId)
                .single();

            // Base data without columns that might not exist
            const baseData = {
                stripe_subscription_id: data.subscriptionId,
                product_id: data.productId,
                status: data.status,
                current_period_end: data.currentPeriodEnd,
            };

            if (existingRecord) {
                // Update existing record
                const { error: updateError } = await (supabase as any)
                    .from('user_subscriptions')
                    .update({
                        ...baseData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', data.userId);

                if (updateError) {
                    console.error('Error updating user_subscriptions:', updateError);
                } else {
                    // console.log('Stripe Service: user_subscriptions updated successfully');
                }
            } else {
                // Insert new record
                const { error: insertError } = await (supabase as any)
                    .from('user_subscriptions')
                    .insert({
                        user_id: data.userId,
                        ...baseData
                    });

                if (insertError) {
                    console.error('Error inserting user_subscriptions:', insertError);
                } else {
                    // console.log('Stripe Service: user_subscriptions inserted successfully');
                }
            }
        } catch (error) {
            console.error('Error in saveToUserSubscriptions:', error);
            // Don't throw - this is not critical for the payment flow
        }
    }

    // Save invoice to database
    private static async saveInvoice(data: {
        invoiceId: string;
        subscriptionId: string;
        userId: string;
        companyId?: string;
        customerId: string;
        amount: number;
        currency: string;
        status: string;
        invoiceUrl?: string;
        hostedInvoiceUrl?: string;
        periodStart?: number;
        periodEnd?: number;
        metadata?: any;
    }) {
        try {
            // console.log('Stripe Service: Saving invoice to database:', data.invoiceId);

            const { error } = await (supabase as any)
                .from('stripe_invoices')
                .insert({
                    invoice_id: data.invoiceId,
                    subscription_id: data.subscriptionId,
                    user_id: data.userId,
                    company_id: data.companyId || null,
                    customer_id: data.customerId,
                    amount_paid: data.amount,
                    currency: data.currency,
                    status: data.status,
                    invoice_url: data.invoiceUrl,
                    hosted_invoice_url: data.hostedInvoiceUrl,
                    paid_at: data.periodStart ? new Date(data.periodStart * 1000).toISOString() : null,
                    // period_end: data.periodEnd ? new Date(data.periodEnd * 1000).toISOString() : null,
                    metadata: data.metadata || {}
                });

            if (error) {
                console.error('Error saving invoice:', error);
            } else {
                // console.log('Stripe Service: Invoice saved successfully to database');
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
        }
    }

}