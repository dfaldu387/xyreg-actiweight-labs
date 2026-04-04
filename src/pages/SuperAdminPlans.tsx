import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, Crown, Star, Users, Check, Trash2, Edit2, UsersRound, RotateCcw, BarChart3, Menu } from "lucide-react";
import { getCurrencySymbol } from "@/utils/currencyUtils";
import { CreatePlanDialog } from "@/components/super-admin/CreatePlanDialog";
import { EditPlanDialog } from "@/components/super-admin/EditPlanDialog";
import { SubscribedUsersTable } from "@/components/super-admin/SubscribedUsersTable";
import { StripeDashboard } from "@/components/super-admin/StripeDashboard";
import { useSubscriptionPlans, SubscriptionPlan } from "@/hooks/useSubscriptionPlans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

export default function SuperAdminPlans() {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const { plans, isLoading, refreshPlans, getStats, restoredPlans, isRestoredLoading } = useSubscriptionPlans();
  const stats = getStats();

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', selectedPlan.id);

      if (error) throw error;

      toast.success('Plan deactivated successfully');
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
      refreshPlans();
    } catch (error: any) {
      console.error('Error deactivating plan:', error);
      toast.error('Failed to deactivate plan');
    }
  };

  const handleRestorePlan = async (plan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: true })
        .eq('id', plan.id);

      if (error) throw error;

      toast.success('Plan restored successfully');
      refreshPlans();
    } catch (error: any) {
      console.error('Error restoring plan:', error);
      toast.error('Failed to restore plan');
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Subscription Plans
              </h1>
              <p className="text-slate-600">
                Create and manage subscription plans for companies
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Plans</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Active Plans</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Featured Plans</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.featured}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Crown className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-[800px] grid-cols-4">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Active Plans
            </TabsTrigger>
            <TabsTrigger value="restore" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Restore Plan
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UsersRound className="h-4 w-4" />
              Subscribed Users
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <StripeDashboard />
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-800">
                  Available Plans
                </h2>
                <p className="text-slate-600">
                  Manage subscription plan configurations
                </p>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Settings className="mr-2 h-4 w-4" />
                Create New Plan
              </Button>
            </div>

            {/* Plans Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading plans...</p>
              </div>
            ) : plans.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No plans yet</h3>
                  <p className="text-slate-600 mb-4">Create your first subscription plan to get started</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    Create First Plan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {plans.filter(p => p.is_active).map((plan) => (
                  <Card
                    key={plan.id}
                    className={`border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 ${plan.is_featured ? 'border-2 border-purple-200' : ''
                      }`}
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        {plan.is_featured ? (
                          <Star className="h-8 w-8 text-purple-600" />
                        ) : (
                          <Users className="h-8 w-8 text-slate-600" />
                        )}
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      {plan.is_featured && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          Most Popular
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-3xl font-bold text-slate-800 mb-4">
                        {getCurrencySymbol(plan.currency)}{plan.price}
                        <span className="text-sm text-slate-500">/{plan.interval}</span>
                      </div>
                      <div className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm text-slate-600">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(`/super-admin/app/plans/${encodeURIComponent(plan.name)}/menu-access`)}
                        >
                          <Menu className="h-4 w-4 mr-2" />
                          Menu Access
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Restore Plan Tab */}
          <TabsContent value="restore" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-800">
                  Inactive Plans
                </h2>
                <p className="text-slate-600">
                  Restore deactivated subscription plans
                </p>
              </div>
            </div>

            {/* Inactive Plans Grid */}
            {isRestoredLoading ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading plans...</p>
              </div>
            ) : restoredPlans.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <RotateCcw className="h-12 w-12 text-slate-400 mx-auto mb-4 mt-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No inactive plans</h3>
                  <p className="text-slate-600">All plans are currently active</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {restoredPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 opacity-75"
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        {plan.is_featured ? (
                          <Star className="h-8 w-8 text-slate-600" />
                        ) : (
                            <Users className="h-8 w-8 text-slate-600" />
                        )}
                      </div>
                      <CardTitle className="text-xl text-slate-600">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <Badge variant="outline" className="bg-slate-100 text-slate-600">
                        Inactive
                      </Badge>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-3xl font-bold text-slate-600 mb-4">
                        {getCurrencySymbol(plan.currency)}{plan.price}
                        <span className="text-sm text-slate-500">/{plan.interval}</span>
                      </div>
                      <div className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm text-slate-500">
                            <Check className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleRestorePlan(plan)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore Plan
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Subscribed Users Tab */}
          <TabsContent value="users">
            <SubscribedUsersTable />
          </TabsContent>
        </Tabs>
      </div>

      <CreatePlanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refreshPlans}
      />

      <EditPlanDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refreshPlans}
        plan={selectedPlan}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate "{selectedPlan?.name}" and move it to the Restore Plan tab.
              You can reactivate it later. Note: This does not affect the Stripe product/price.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Deactivate Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
