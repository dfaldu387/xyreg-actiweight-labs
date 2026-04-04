import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crosshair, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedProductCreationDialog } from "@/components/product/EnhancedProductCreationDialog";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useProductCreationContext } from "@/hooks/useProductCreationContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";

export default function GenesisLandingPage() {
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { isLoading } = useCompanyRole();
  const { handleProductCreated } = useProductCreationContext();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [checkingProducts, setCheckingProducts] = useState(true);

  // Auto-redirect to existing device's Genesis flow if user already has a product
  useEffect(() => {
    if (!companyId || isLoading) return;

    const checkExistingProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id')
          .eq('company_id', companyId)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          // User has a device — redirect to its Genesis checklist
          navigate(`/app/product/${data[0].id}/business-case?tab=genesis`, { replace: true });
          return;
        }
      } catch (err) {
        console.error('[GenesisLandingPage] Error checking products:', err);
      }
      setCheckingProducts(false);
    };

    checkExistingProducts();
  }, [companyId, isLoading, navigate]);

  const onProductCreated = (productId: string, projectId?: string) => {
    handleProductCreated(productId, projectId);
    // Navigate to the Genesis checklist for the new product
    navigate(`/app/product/${productId}/business-case?tab=genesis`);
  };

  if (isLoading || checkingProducts) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-500/5">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Crosshair className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">XyReg Genesis</h1>
              <p className="text-sm text-muted-foreground">Investor Readiness Framework</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-6">
            <Rocket className="h-4 w-4" />
            Get Started
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Launch Your Medical Device Journey
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            XyReg Genesis guides startups through the essential steps to prepare your medical device for investor review. Begin by creating your first device.
          </p>
        </div>

        {/* Create Device Card */}
        <Card className="border-2 border-dashed border-amber-500/30 hover:border-amber-500/50 transition-colors bg-gradient-to-br from-card to-amber-500/5">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 rounded-full bg-amber-500/10 w-fit">
              <Crosshair className="h-10 w-10 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Create Your First Device</CardTitle>
            <CardDescription className="text-base max-w-md mx-auto">
              Start your investor readiness journey by registering your medical device. This is the foundation for all Genesis checklist items.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button 
              size="lg" 
              onClick={() => setShowCreateDialog(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
            >
              Create Device
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                What happens next?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 text-xs font-medium">1</div>
                  <span>Define device identity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 text-xs font-medium">2</div>
                  <span>Complete 20-step checklist</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 text-xs font-medium">3</div>
                  <span>Share with investors</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Already have devices?{" "}
            <button 
              onClick={() => navigate('/app')}
              className="text-amber-600 hover:text-amber-700 underline underline-offset-2"
            >
              Go to Dashboard
            </button>
          </p>
        </div>
      </div>

      {/* Device Creation Dialog */}
      {companyId && (
        <EnhancedProductCreationDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          companyId={companyId}
          onProductCreated={onProductCreated}
        />
      )}
    </div>
  );
}
