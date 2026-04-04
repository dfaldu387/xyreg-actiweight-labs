import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import { BillingTab } from '@/components/subscription/BillingTab';
import { CurrencyService } from '@/services/currencyService';
import { detectUserLocaleCurrency, formatLocalPrice } from '@/utils/localeUtils';
import { getCurrencySymbol } from '@/utils/currencyUtils';

// Plan Card Component
function PlanCard({ 
  plan, 
  isCurrentPlan, 
  isPopular, 
  subscription, 
  localCurrency, 
  convertPrice,
  isLoading,
  loadingPlan,
  onSelect 
}: any) {
  const [localPrice, setLocalPrice] = useState<number | null>(null);

  useEffect(() => {
    if (localCurrency.currency !== 'EUR') {
      convertPrice(plan.price).then(setLocalPrice);
    }
  }, [plan.price, localCurrency]);

  return (
    <Card 
      className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''} ${isPopular ? 'border-primary shadow-lg' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary">Most Popular</Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-4 right-4">
          <Badge variant="secondary">Your Plan</Badge>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>
          {plan.description && (
            <p className="mt-2 text-sm">{plan.description}</p>
          )}
          <div className="mt-4">
            <span className="text-4xl font-bold">
              {getCurrencySymbol(plan.currency)}{plan.price}
            </span>
            <span className="text-muted-foreground">/{plan.interval}</span>
            {localCurrency.currency !== 'EUR' && localPrice && (
              <div className="text-sm text-muted-foreground mt-1">
                ≈ {formatLocalPrice(localPrice, localCurrency.currency)}/{plan.interval}
              </div>
            )}
          </div>
          {subscription?.trial_end && isCurrentPlan && subscription.status === 'trialing' && (
            <div className="mt-2">
              <Badge variant="outline">
                Trial until {new Date(subscription.trial_end).toLocaleDateString()}
              </Badge>
            </div>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : isPopular ? 'default' : 'secondary'}
          disabled={isLoading || loadingPlan === plan.id || isCurrentPlan}
          onClick={() => onSelect(plan)}
        >
          {loadingPlan === plan.id ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            'Start Free Trial'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { user } = useAuth();
  const { subscription, currentPlan, isLoading, refreshSubscription } = useSubscription();
  const { plans, isLoading: plansLoading, error: plansError } = useSubscriptionPlans();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [localCurrency, setLocalCurrency] = useState(detectUserLocaleCurrency());

  // Convert EUR price to local currency
  const convertPrice = async (eurPrice: number) => {
    if (localCurrency.currency === 'EUR') {
      return eurPrice;
    }
    try {
      const result = await CurrencyService.convertCurrency(eurPrice, 'EUR', localCurrency.currency);
      return Math.round(result.convertedAmount);
    } catch (error) {
      console.error('Currency conversion error:', error);
      return eurPrice;
    }
  };

  const handleSelectPlan = async (plan: any) => {
    if (!user) {
      toast.error('Please sign in to continue');
      navigate('/');
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.stripe_price_id }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {returnTo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(decodeURIComponent(returnTo))}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
          Start your 30-day free trial today.
          </p>
        </div>

        <Tabs defaultValue="billing" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto mb-8 grid-cols-2">
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-8">
            {subscription?.subscribed && (
              <div className="text-center">
                {/* <Button onClick={handleManageSubscription} variant="outline">
                  Manage Subscription
                </Button> */}
                <Button 
                  onClick={refreshSubscription} 
                  variant="ghost" 
                  size="sm"
                  className="ml-2"
                >
                  Refresh Status
                </Button>
              </div>
            )}

            {plansLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading plans...</p>
              </div>
            ) : plansError ? (
              <div className="text-center py-12 text-destructive">
                <p>Error loading plans. Please try again later.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan) => {
                  const isCurrentPlan = subscription?.product_id === plan.stripe_product_id;
                  const isPopular = plan.is_featured;

                  return (
                    <PlanCard 
                      key={plan.id}
                      plan={plan}
                      isCurrentPlan={isCurrentPlan}
                      isPopular={isPopular}
                      subscription={subscription}
                      localCurrency={localCurrency}
                      convertPrice={convertPrice}
                      isLoading={isLoading}
                      loadingPlan={loadingPlan}
                      onSelect={handleSelectPlan}
                    />
                  );
                })}
              </div>

            )}

            <div className="mt-12 text-center text-sm text-muted-foreground">
              <p>All plans include a 30-day free trial. Cancel anytime during the trial period at no cost.</p>
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
