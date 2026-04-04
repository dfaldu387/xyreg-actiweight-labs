import * as React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Shield, User, Clock, X, LogOut } from 'lucide-react';
import { useImpersonation } from '@/hooks/useImpersonation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export function ImpersonationBanner() {
    const { impersonationData, isBeingImpersonated, clearImpersonation } = useImpersonation();
    const { user } = useAuth();
    const [isHidden, setIsHidden] = React.useState(false);
    const [showReturnDialog, setShowReturnDialog] = React.useState(false);
    const [isReturning, setIsReturning] = React.useState(false);
    if (!isBeingImpersonated || !impersonationData || isHidden) {
        // console.log('[ImpersonationBanner] Not showing banner - conditions not met');
        return null;
    }

    const handleReturnToSuperAdmin = async () => {
        try {
            setIsReturning(true);
            
            // Get current session for authorization
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session?.access_token) {
                toast.error('Authentication required');
                return;
            }

            // Call the edge function to return to super admin
            const { data, error } = await supabase.functions.invoke('return-to-super-admin', {
                body: { 
                    superAdminId: impersonationData?.impersonatedBy,
                    superAdminEmail: impersonationData?.impersonatedByEmail
                },
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (error) {
                console.error('[ImpersonationBanner] Return to super admin error:', error);
                toast.error('Failed to return to super admin');
                return;
            }

            if (data?.success && data?.returnUrl) {
                // Clear impersonation data
                clearImpersonation();
                
                toast.success(`Returning to super admin session...`);
                
                // Open the return URL in the current window to complete the return
                window.location.href = data.returnUrl;
                // console.log('[ImpersonationBanner] Return URL:', data.returnUrl);
            } else {
                toast.error('Failed to generate return link');
            }
        } catch (error: any) {
            console.error('[ImpersonationBanner] Error returning to super admin:', error);
            toast.error('Failed to return to super admin session');
        } finally {
            setIsReturning(false);
            setShowReturnDialog(false);
        }
    };

    const formatTime = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, h:mm a');
        } catch (error) {
            console.error('[ImpersonationBanner] Error formatting date:', error);
            return 'Unknown time';
        }
    };

    // Safety check for required data
    if (!user?.email || !impersonationData.impersonatedByEmail) {
        clearImpersonation();
        return null;
    }

    return (
        <>
            <Alert className="border-orange-200 sticky top-0 z-10 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md">
            <div className="flex items-start justify-between w-full">
                <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Shield className="h-5 w-5 text-orange-600" />
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-orange-800 text-lg">
                                Super Admin Impersonation Active
                            </h3>
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                Impersonating
                            </Badge>
                        </div>

                        <AlertDescription className="text-orange-700 space-y-1">
                            <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4" />
                                    <span>
                                        <strong>You are logged in as:</strong> {user.email}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Shield className="h-4 w-4" />
                                    <span>
                                        <strong>Impersonated by:</strong> {impersonationData.impersonatedByEmail}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        <strong>Since:</strong> {formatTime(impersonationData.impersonatedAt)}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm mt-2">
                                You are currently viewing the system as this impersonated user.
                            </p>
                        </AlertDescription>
                    </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReturnDialog(true)}
                        className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                    >
                        <Shield className="h-4 w-4 mr-2" />
                        Return to Super Admin
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsHidden(true)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                        title="Hide banner"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Alert>

        {/* Return to Super Admin Confirmation Dialog */}
        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-700">
                        Return to Super Admin Session
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                        You are about to end the impersonation session and return to your super admin session. 
                        You will be automatically logged in as the super admin.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-orange-800">
                                    Current Impersonation Session
                                </p>
                                <div className="space-y-1 text-sm text-orange-700">
                                    <div><strong>Impersonating:</strong> {user?.email}</div>
                                    <div><strong>Impersonated by:</strong> {impersonationData?.impersonatedByEmail}</div>
                                    <div><strong>Since:</strong> {formatTime(impersonationData?.impersonatedAt || '')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowReturnDialog(false)}
                        disabled={isReturning}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleReturnToSuperAdmin}
                        disabled={isReturning}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {isReturning ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Returning...
                            </>
                        ) : (
                            <>
                                <LogOut className="h-4 w-4 mr-2" />
                                Return to Super Admin
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
