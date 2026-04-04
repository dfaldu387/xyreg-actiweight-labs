import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useUserTransactions } from '@/hooks/useUserTransactions';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { Calendar, CreditCard, Package, Clock, AlertCircle, Receipt, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function BillingTab() {
  const { subscription, currentPlan, isLoading, refreshSubscription } = useSubscription();
  const { subscriptionStatus, trialDaysLeft } = useFeatureAccess();
  const { transactions, totalPaid, isLoading: transactionsLoading, refreshTransactions } = useUserTransactions();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  
  // Download state
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  
  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);
  
  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset pagination when transactions change
  useEffect(() => {
    setCurrentPage(1);
  }, [transactions.length]);

  // Download invoice function
  const handleDownloadInvoice = async (transactionId: string, transactionType: string) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(transactionId));
      
      if (transactionType === 'subscription') {
        // For subscription invoices, use Stripe's invoice PDF URL
        const { data, error } = await supabase.functions.invoke('get-invoice-pdf', {
          body: { invoiceId: transactionId }
        });
        
        if (error) throw error;
        
        if (data?.customPdf) {
          // Handle custom PDF (trial invoices)
          const pdfBlob = new Blob([
            Uint8Array.from(atob(data.customPdf), c => c.charCodeAt(0))
          ], { type: 'application/pdf' });
          
          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `trial-invoice-${transactionId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else if (data?.pdfUrl) {
          // Handle Stripe PDF URL (paid invoices)
          window.open(data.pdfUrl, '_blank');
        } else {
          // Fallback: create a simple receipt for subscription invoices too
          const transaction = transactions.find(t => t.id === transactionId);
          if (transaction) {
            const receiptData = {
              id: transaction.id,
              amount: transaction.amount,
              currency: transaction.currency,
              status: transaction.status,
              description: transaction.description,
              date: new Date(transaction.created * 1000).toLocaleDateString(),
              type: 'Subscription Invoice'
            };
            
            const receiptText = `
SUBSCRIPTION INVOICE
====================
Invoice ID: ${receiptData.id}
Amount: ${receiptData.currency.toUpperCase()} ${(receiptData.amount / 100).toFixed(2)}
Status: ${receiptData.status.toUpperCase()}
Date: ${receiptData.date}
Description: ${receiptData.description}
Type: ${receiptData.type}
            `.trim();
            
            const blob = new Blob([receiptText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${transactionId}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }
      } else {
        // For payment intents, create a simple receipt
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
          const receiptData = {
            id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            description: transaction.description,
            date: new Date(transaction.created * 1000).toLocaleDateString(),
            type: 'Payment Receipt'
          };
          
          // Create and download a simple text receipt
          const receiptText = `
PAYMENT RECEIPT
================
Transaction ID: ${receiptData.id}
Amount: ${receiptData.currency.toUpperCase()} ${(receiptData.amount / 100).toFixed(2)}
Status: ${receiptData.status.toUpperCase()}
Date: ${receiptData.date}
Description: ${receiptData.description}
Type: ${receiptData.type}
          `.trim();
          
          const blob = new Blob([receiptText], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `receipt-${transactionId}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  const handleManageSubscription = () => {
    setShowManageDialog(true);
  };

  const handleCancelSubscription = async () => {
    try {
      setIsProcessing(true);
      
      // Get the user's subscription ID from the database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .single();

      if (subError || !subData?.stripe_subscription_id) {
        throw new Error('Subscription not found');
      }

      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: subData.stripe_subscription_id }
      });
      
      if (error) throw error;
      
      toast.success('Subscription cancelled successfully');
      setShowCancelDialog(false);
      setShowManageDialog(false);
      refreshSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePlan = async (newProductId: string) => {
    try {
      setIsProcessing(true);
      
      const newPlan = plans.find(p => p.stripe_product_id === newProductId);
      if (!newPlan) throw new Error('Plan not found');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .single();

      if (subError || !subData?.stripe_subscription_id) {
        throw new Error('Subscription not found');
      }

      const { data, error } = await supabase.functions.invoke('change-subscription-plan', {
        body: { 
          subscriptionId: subData.stripe_subscription_id,
          newPriceId: newPlan.stripe_price_id
        }
      });
      
      if (error) throw error;
      
      toast.success(`Plan updated to ${newPlan.name} successfully`);
      setShowManageDialog(false);
      refreshSubscription();
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Failed to change plan. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscription?.subscribed && !subscriptionStatus?.isTrialing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription yet. Choose a plan to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const plan = plans.find(p => p.stripe_product_id === subscription?.product_id);

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your subscription details and billing information</CardDescription>
              </div>
              {subscription?.subscribed && (
                <Button onClick={handleManageSubscription} variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Information */}
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Plan Name</p>
                  <p className="text-2xl font-bold">{plan?.name || 'Unknown'}</p>
                </div>
                <div>
                  {subscriptionStatus?.isTrialing && (
                    <Badge variant="outline" className="text-sm">
                      <Clock className="mr-1 h-3 w-3" />
                      Trial
                    </Badge>
                  )}
                  {subscriptionStatus?.isActive && !subscriptionStatus?.isTrialing && (
                    <Badge className="text-sm">Active</Badge>
                  )}
                  {subscriptionStatus?.isExpired && (
                    <Badge variant="destructive" className="text-sm">Expired</Badge>
                  )}
                </div>
              </div>

              {/* Pricing */}
              {plan && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Price</p>
                    <p className="text-xl font-semibold">${plan.price}</p>
                  </div>
                </div>
              )}

              {/* Trial Days Left or Subscription End */}
              {subscriptionStatus?.isTrialing && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">Trial Days Remaining</p>
                    <p className="text-xl font-semibold">{trialDaysLeft} days</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {subscription?.trial_end && subscriptionStatus?.isTrialing && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Trial Ends On</p>
                    <p className="text-lg font-medium">
                      {new Date(subscription.trial_end).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {subscription?.subscription_end && !subscriptionStatus?.isTrialing && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Next Billing Date</p>
                    <p className="text-lg font-medium">
                      {new Date(subscription.subscription_end).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Plan Features */}
            {plan && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Plan Features</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Transactions
                </CardTitle>
                <CardDescription>Your payment history and transaction details</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-primary">${totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {new Date(transaction.created * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>{transaction.description || 'Subscription Payment'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={transaction.status === 'succeeded' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${(transaction.amount / 100).toFixed(2)} {transaction.currency.toUpperCase()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(transaction.id, transaction.type || 'payment_intent')}
                            disabled={downloadingIds.has(transaction.id)}
                            className="h-8 w-8 p-0 hover:bg-muted"
                            title={transaction.type === 'subscription' ? 'Download invoice PDF' : 'Download receipt'}
                          >
                            {downloadingIds.has(transaction.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-2">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, transactions.length)} of {transactions.length} transactions
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {/* Show page numbers with ellipsis for large page counts */}
                        {totalPages <= 7 ? (
                          // Show all pages if 7 or fewer
                          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          ))
                        ) : (
                          // Show smart pagination for many pages
                          <>
                            {/* Always show first page */}
                            <Button
                              variant={currentPage === 1 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                              className="w-8 h-8 p-0"
                            >
                              1
                            </Button>
                            
                            {/* Show ellipsis if current page is far from start */}
                            {currentPage > 3 && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            
                            {/* Show pages around current page */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(page => 
                                page > 1 && 
                                page < totalPages && 
                                Math.abs(page - currentPage) <= 1
                              )
                              .map((page) => (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              ))}
                            
                            {/* Show ellipsis if current page is far from end */}
                            {currentPage < totalPages - 2 && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            
                            {/* Always show last page */}
                            <Button
                              variant={currentPage === totalPages ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-8 h-8 p-0"
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manage Billing Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Your Subscription</DialogTitle>
            <DialogDescription>
              Update your plan or cancel your subscription
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Plan */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Current Plan</h4>
                <Badge>{plan?.name}</Badge>
              </div>
              <p className="text-2xl font-bold">${plan?.price}/month</p>
            </div>

            {/* Change Plan Options */}
            <div>
              <h4 className="font-semibold mb-3">Change Plan</h4>
              <div className="grid gap-3">
                {plansLoading ? (
                  <div className="text-center py-4">Loading plans...</div>
                ) : (
                  plans.map((planOption) => {
                    const isCurrentPlan = subscription?.product_id === planOption.stripe_product_id;
                    
                    return (
                      <div
                        key={planOption.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          isCurrentPlan ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold">{planOption.name}</h5>
                              {isCurrentPlan && (
                                <Badge variant="outline" className="text-xs">Current</Badge>
                              )}
                            </div>
                            <p className="text-lg font-bold text-primary">${planOption.price}/month</p>
                            <ul className="mt-2 space-y-1">
                              {planOption.features.slice(0, 2).map((feature, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-1">
                                  <span className="text-primary">✓</span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {!isCurrentPlan && (
                            <Button
                              onClick={() => handleChangePlan(planOption.stripe_product_id)}
                              disabled={isProcessing}
                              variant={planOption.price > (plan?.price || 0) ? 'default' : 'outline'}
                            >
                              {planOption.price > (plan?.price || 0) ? 'Upgrade' : 'Downgrade'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cancel Subscription */}
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                disabled={isProcessing}
                className="w-full"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Cancel Subscription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your subscription. You'll lose access to all premium features at the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Cancelling...' : 'Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
