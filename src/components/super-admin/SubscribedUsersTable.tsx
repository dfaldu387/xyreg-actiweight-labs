import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Users as UsersIcon, XCircle, MoreHorizontal, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSubscription {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
  current_period_end: string | null;
  trial_end: string | null;
  stripe_subscription_id: string | null;
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Plan {
  id: string;
  name: string;
  stripe_product_id: string;
  stripe_price_id: string;
}

export function SubscribedUsersTable() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [plans, setPlans] = useState<Map<string, string>>(new Map());
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load plans first
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('id, stripe_product_id, name, stripe_price_id');

      const plansMap = new Map<string, string>();
      plansData?.forEach(plan => {
        plansMap.set(plan.stripe_product_id, plan.name);
      });
      setPlans(plansMap);
      setAvailablePlans(plansData || []);

      // Load subscriptions with user profiles
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
      }

      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(sub => sub.user_id);

        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        // Merge profiles with subscriptions
        const enrichedData = data.map(sub => ({
          ...sub,
          user_profiles: profiles?.find(p => p.id === sub.user_id)
        }));

        setSubscriptions(enrichedData as any);
      } else {
        setSubscriptions([]);
      }
    } catch (error: any) {
      console.error('Error loading subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      toast.success('Subscription removed successfully');
      setDeleteDialogOpen(false);
      setSelectedSubscription(null);
      loadData();
    } catch (error: any) {
      console.error('Error removing subscription:', error);
      toast.error('Failed to remove subscription');
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      // Call Supabase function to cancel subscription in Stripe
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: selectedSubscription.stripe_subscription_id
        }
      });

      if (error) throw error;

      toast.success('Subscription canceled successfully');
      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      loadData();
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handleChangePlan = async () => {
    if (!selectedSubscription || !selectedPlanId) return;

    try {
      const selectedPlan = availablePlans.find(plan => plan.id === selectedPlanId);
      if (!selectedPlan) {
        toast.error('Selected plan not found');
        return;
      }

      // Call Supabase function to change subscription plan in Stripe
      const { data, error } = await supabase.functions.invoke('change-subscription-plan', {
        body: {
          subscriptionId: selectedSubscription.stripe_subscription_id,
          newPriceId: selectedPlan.stripe_price_id
        }
      });

      if (error) throw error;

      toast.success('Subscription plan changed successfully');
      setChangePlanDialogOpen(false);
      setSelectedSubscription(null);
      setSelectedPlanId("");
      loadData();
    } catch (error: any) {
      console.error('Error changing subscription plan:', error);
      toast.error('Failed to change subscription plan');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      trialing: 'bg-blue-100 text-blue-800 border-blue-200',
      past_due: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      canceled: 'bg-red-100 text-red-800 border-red-200',
      incomplete: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  return (
    <>
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                <UsersIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Subscribed Users</CardTitle>
                <CardDescription>
                  Manage user subscriptions and their plan details
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-600">
              Loading subscriptions...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No subscribed users yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => {
                    const profile = subscription.user_profiles as any;
                    const userName = profile
                      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User'
                      : 'Unknown User';
                    const planName = plans.get(subscription.product_id || '') || 'Unknown Plan';

                    return (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">{userName}</TableCell>
                        <TableCell>{profile?.email || 'N/A'}</TableCell>
                        <TableCell>{planName}</TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          {subscription.trial_end
                            ? format(new Date(subscription.trial_end), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                        {/* <TableCell>
                          {subscription.current_period_end 
                            ? format(new Date(subscription.current_period_end), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell> */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(subscription.status === 'trialing' || subscription.status === 'active') && subscription.stripe_subscription_id && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSubscription(subscription);
                                    setChangePlanDialogOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Change Plan"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSubscription(subscription);
                                    setCancelDialogOpen(true);
                                  }}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  title="Cancel Subscription"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Remove from Database"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the subscription in Stripe and update the database.
              The user will lose access to premium features immediately.
              <br /><br />
              {/* <strong>Debug: Dialog open = {cancelDialogOpen.toString()}</strong> */}
              <br />
              <strong>Selected subscription: {selectedSubscription?.id || 'None'}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={changePlanDialogOpen} onOpenChange={setChangePlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a new plan for this user's subscription. The change will be applied immediately.
              <br /><br />
              <strong>Current subscription: {selectedSubscription?.id || 'None'}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a new plan" />
              </SelectTrigger>
              <SelectContent>
                {availablePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={!selectedPlanId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Change Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the subscription from the database. This action cannot be undone.
              Note: This does not cancel the subscription in Stripe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
