import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle, Star, Crown, Briefcase, Download, Shield, Calendar, CreditCard } from "lucide-react";
import { BillingService } from "@/services/billingService";
import { StripeService } from "@/services/stripeService";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useParams, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";

export default function BillingPage() {
    const [plans, setPlans] = useState([]); // Initialize as empty array
    const [loading, setLoading] = useState(true); // Add loading state
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
    const [activeTab, setActiveTab] = useState<'plans' | 'billing'>('plans');
    const [billingInfo, setBillingInfo] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const { user } = useAuth();
    const { activeCompanyRole } = useCompanyRole();
    const { companyId } = useParams();
    const [searchParams] = useSearchParams();
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    // console.log('selectedPlan BillingPage', selectedPlan);
    useEffect(() => {
        // Fetch both plans metadata and features dynamically
        const fetchPlans = async () => {
            try {
                setLoading(true);

                // Fetch both plan features and plan metadata
                const [featuresData, plansMetadata] = await Promise.all([
                    BillingService.getPlans(), // Your existing endpoint for features
                    BillingService.getPlansMetadata() // New endpoint for plan metadata
                ]);

                if (featuresData && Array.isArray(featuresData)) {
                    // Transform the flat feature array into grouped plans
                    const transformedPlans = transformPlanData(featuresData, plansMetadata);
                    setPlans(transformedPlans);
                } else {
                    console.error("Invalid plans data format", featuresData);
                    setPlans([]);
                }
            } catch (error) {
                console.error("Error fetching plans", error);
                setPlans([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
        loadCurrentPlan();
    }, [activeCompanyRole, companyId, user]);

    useEffect(() => {
        if (activeTab === 'billing' && user) {
            loadBillingInfo();
        }
    }, [activeTab, user]);

    // Note: Payment success/cancel handling is now done on dedicated pages:
    // - /checkout/success for successful payments
    // - /checkout/cancel for canceled payments
    // This ensures proper user experience with animations and detailed feedback

    // Load current plan from user metadata or company settings
    const loadCurrentPlan = async () => {
        // TODO: Implement plan loading logic
        console.log('Plan loading not yet implemented');
    };

    const loadBillingInfo = async () => {
        try {
            // Fetch current subscription
            const { data: subscription } = await supabase
                .from('stripe_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            setBillingInfo(subscription);

            // Fetch all invoices for this company
            if (companyId) {
                const { data: invoiceList } = await supabase
                    .from('stripe_invoices')
                    .select('*')
                    .eq('company_id', companyId)
                    .order('created_at', { ascending: false });
                setInvoices(invoiceList || []);
            } else {
                setInvoices([]);
            }
        } catch (err) {
            setBillingInfo(null);
            setInvoices([]);
        }
    };

    // Handle plan selection
    const handlePlanSelect = async (plan) => {
        try {
            setIsUpdatingPlan(true);

            // Skip payment for Enterprise plan (contact sales)
            if (plan.name === 'Enterprise' || plan.price === 'Custom') {
                toast.info('Please contact sales for Enterprise plan pricing.');
                return;
            }

            // Skip payment for current plan
            if (selectedPlan === plan.name) {
                toast.info('This is your current plan.');
                return;
            }

            // Use Stripe checkout for plan purchase
            await StripeService.handlePlanPurchase(plan, companyId);

        } catch (error) {
            console.error("Error initiating plan purchase:", error);
            toast.error("Failed to initiate payment. Please try again.");
        } finally {
            setIsUpdatingPlan(false);
        }
    };

    // Cancel subscription handler
    const handleCancelSubscription = async () => {
        if (!billingInfo || !billingInfo.subscription_id) return;
        setIsCancelling(true);
        try {
            await StripeService.cancelSubscription(billingInfo.subscription_id);
            toast.success('Subscription cancelled successfully.');
            loadBillingInfo();
            setShowCancelDialog(false);
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            toast.error('Failed to cancel subscription. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    // Function to transform flat feature data into grouped plan structure
    const transformPlanData = (featuresData, plansMetadata = []) => {
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
        }, {});

        // Create a metadata lookup from the API response
        const metadataLookup = {};
        if (plansMetadata && Array.isArray(plansMetadata)) {
            plansMetadata.forEach(plan => {
                metadataLookup[plan.id || plan.plan_id] = {
                    name: plan.name || plan.plan_name || 'Unknown Plan',
                    price: plan.price || plan.pricing || 'N/A',
                    icon: plan.icon || getDefaultIcon(plan.name),
                    button: plan.button_text || plan.cta || `Choose ${plan.name}` || 'Select Plan',
                    highlight: plan.highlight || plan.featured || plan.is_popular || false,
                    description: plan.description || ''
                };
            });
        }

        // Auto-generate plan names and icons if no metadata provided
        const autoGenerateMetadata = (planId, index) => {
            const planNames = ['Starter', 'Professional', 'Business', 'Enterprise'];
            const icons = ['CheckCircle', 'Star', 'Crown', 'Briefcase'];
            const prices = ['$9/month', '$29/month', '$59/month', 'Custom'];

            return {
                name: planNames[index] || `Plan ${index + 1}`,
                price: prices[index] || 'Contact Us',
                icon: icons[index] || 'CheckCircle',
                button: index === 3 ? 'Contact Sales' : `Choose ${planNames[index] || 'Plan'}`,
                highlight: index === 1, // Highlight the second plan by default
                description: ''
            };
        };

        // Combine grouped features with plan metadata
        const transformedPlans = Object.keys(groupedByPlan).map((planId, index) => {
            const planData = groupedByPlan[planId];

            // Use API metadata if available, otherwise auto-generate
            const metadata = metadataLookup[planId] || autoGenerateMetadata(planId, index);

            return {
                ...metadata,
                planId: planId,
                features: planData.features
            };
        });

        // Sort plans by a logical order if metadata includes sort_order
        return transformedPlans.sort((a, b) => {
            if (a.sort_order !== undefined && b.sort_order !== undefined) {
                return a.sort_order - b.sort_order;
            }
            return 0; // Keep original order if no sort_order
        });
    };

    // Helper function to get default icon based on plan name
    const getDefaultIcon = (planName) => {
        if (!planName) return 'CheckCircle';

        const name = planName.toLowerCase();
        if (name.includes('starter') || name.includes('basic')) return 'CheckCircle';
        if (name.includes('professional') || name.includes('pro')) return 'Star';
        if (name.includes('business') || name.includes('premium')) return 'Crown';
        if (name.includes('enterprise') || name.includes('custom')) return 'Briefcase';

        return 'CheckCircle';
    };

    // Show loading state
    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-12 px-4 flex justify-center items-center min-h-64">
                <div>Loading plans...</div>
            </div>
        );
    }

    // Show message if no plans available
    if (!plans || !Array.isArray(plans) || plans.length === 0) {
        return (
            <div className="max-w-7xl mx-auto py-12 px-4 flex justify-center items-center min-h-64">
                <div>No billing plans available at this time.</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-4 text-center">Billing & Pricing Plans</h1>
            <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
                Choose the plan that fits your team. Upgrade, downgrade, or cancel anytime. All plans come with a 14-day free trial.
            </p>

            <div className="flex mb-8 justify-center gap-4">
                <button
                    className={`px-4 py-2 rounded-t ${activeTab === 'plans' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setActiveTab('plans')}
                >
                    Plans
                </button>
                <button
                    className={`px-4 py-2 rounded-t ${activeTab === 'billing' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setActiveTab('billing')}
                >
                    Billing
                </button>
            </div>

            {activeTab === 'plans' && (
                <>
                    {/* Current Plan Display */}
                    {selectedPlan && (
                        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">Current Plan</h3>
                            <p className="text-blue-700">
                                {activeCompanyRole ? (
                                    <>
                                        <strong>{selectedCompany}</strong> is currently on the <strong>{selectedPlan}</strong> plan.
                                    </>
                                ) : (
                                    <>You are currently on the <strong>{selectedPlan}</strong> plan.</>
                                )}
                            </p>
                        </div>
                    )}

                    {/* No Company Selected Warning */}
                    {!activeCompanyRole && (
                        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-amber-800 mb-2">No Company Selected</h3>
                            <p className="text-amber-700">
                                Please select a company to manage billing and plan settings.
                                Plan changes will only affect your personal account.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {plans.map((plan, idx) => (
                            <Card
                                key={idx}
                                className={`transition-all duration-200 shadow-lg hover:shadow-2xl border border-gray-200 flex flex-col items-center relative overflow-hidden ${plan.highlight ? 'ring-2 ring-yellow-400 scale-105 z-10 bg-yellow-50' : 'bg-white'
                                    } ${selectedPlan === plan.name ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                                    } group`}
                            >
                                <CardHeader className="flex flex-col items-center gap-2 pb-0">
                                    {/* Map icons based on plan type */}
                                    {plan.icon === 'CheckCircle' && <CheckCircle className="w-8 h-8 text-green-500" />}
                                    {plan.icon === 'Star' && <Star className="w-8 h-8 text-blue-500" />}
                                    {plan.icon === 'Crown' && <Crown className="w-8 h-8 text-yellow-500" />}
                                    {plan.icon === 'Briefcase' && <Briefcase className="w-8 h-8 text-purple-500" />}
                                    <CardTitle className="text-2xl font-semibold mt-2 mb-1">{plan.name}</CardTitle>
                                    <div className="text-3xl font-bold mb-2">{plan.price}</div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col items-center w-full px-6">
                                    <ul className="mb-6 space-y-2 text-center w-full">
                                        {plan.features && Array.isArray(plan.features) && plan.features.map((feature, i) => (
                                            <li key={i} className="flex gap-2 text-left font-semibold text-sm text-gray-700">
                                                <span className="text-green-500">✔</span> {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className={`w-full py-2 text-base font-semibold mt-auto group-hover:scale-105 transition-transform duration-200 ${plan.highlight ? 'bg-yellow-400 hover:bg-yellow-500 text-white' : ''
                                            } ${selectedPlan === plan.name ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                                            }`}
                                        variant={plan.highlight || selectedPlan === plan.name ? "default" : "outline"}
                                        onClick={() => handlePlanSelect(plan)}
                                        disabled={isUpdatingPlan || selectedPlan === plan.name}
                                    >
                                        {isUpdatingPlan ? 'Processing...' :
                                            selectedPlan === plan.name ? 'Current Plan' :
                                                plan.name === 'Enterprise' ? 'Contact Sales' :
                                                    `Subscribe to ${plan.name}`}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'billing' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Current Subscription */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Current Subscription</h2>
                        </div>

                        {billingInfo ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Plan</label>
                                        <div className="text-xl font-semibold text-slate-900">{billingInfo.plan_name}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Status</label>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${billingInfo.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                            <span className="text-slate-900 capitalize">{billingInfo.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Next Billing</label>
                                        <div className="text-slate-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {billingInfo.current_period_end ? new Date(billingInfo.current_period_end).toLocaleDateString() : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Amount</label>
                                        <div className="text-xl font-semibold text-slate-900">
                                            {billingInfo.amount_paid ? `$${(billingInfo.amount_paid / 100).toFixed(2)}` : '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-gray-600 text-center">
                                No active subscription found.
                            </div>
                        )}

                        <div className="flex gap-4 mt-8">
                            <button className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                                Update Plan
                            </button>
                            <button
                                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                onClick={() => setShowCancelDialog(true)}
                                disabled={isCancelling}
                            >
                                {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                            </button>
                        </div>
                        {/* Cancel Subscription Confirmation Dialog */}
                        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Cancel Subscription</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to cancel your subscription? This action cannot be undone and you will lose access to premium features at the end of your billing period.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>
                                        No, Keep Subscription
                                    </Button>
                                    <Button variant="destructive" onClick={handleCancelSubscription} disabled={isCancelling}>
                                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Shield className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Payment Method</h2>
                            </div>
                            <button className="text-blue-600 hover:text-blue-700 font-medium">Update</button>
                        </div>

                        {/* If you have payment method info, display it here. Otherwise, show a placeholder. */}
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center text-white text-sm font-bold">
                                {/* You can replace 'VISA' with dynamic brand if available */}
                                {billingInfo && billingInfo.card_brand ? billingInfo.card_brand.toUpperCase() : 'VISA'}
                            </div>
                            <div>
                                <div className="font-medium text-slate-900">
                                    {/* Show last4 if available */}
                                    {billingInfo && billingInfo.card_last4 ? `•••• •••• •••• ${billingInfo.card_last4}` : '•••• •••• •••• 4242'}
                                </div>
                                <div className="text-sm text-slate-600">
                                    {/* Show expiry if available */}
                                    {billingInfo && billingInfo.card_exp_month && billingInfo.card_exp_year ? `Expires ${billingInfo.card_exp_month}/${billingInfo.card_exp_year}` : 'Expires 12/25'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice History */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-6xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Briefcase className="w-6 h-6 text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Invoice History</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-[900px] w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-4 font-medium text-slate-900">Invoice</th>
                                        <th className="text-left py-4 font-medium text-slate-900">Date</th>
                                        <th className="text-left py-4 font-medium text-slate-900">Amount</th>
                                        <th className="text-left py-4 font-medium text-slate-900">Status</th>
                                        <th className="text-left py-4 font-medium text-slate-900">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.length > 0 ? invoices.map((invoice) => (
                                        <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-4 font-mono text-sm text-slate-700">{invoice.invoice_id}</td>
                                            <td className="py-4 text-slate-700">{invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : '-'}</td>
                                            <td className="py-4 font-semibold text-slate-900">${(invoice.amount_paid / 100).toFixed(2)}</td>
                                            <td className="py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : invoice.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                {invoice.hosted_invoice_url ? (
                                                    <a
                                                        href={invoice.hosted_invoice_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="text-center text-slate-500 py-8">No invoices found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}