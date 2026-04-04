import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Loader2, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useReimbursementStrategy } from '@/hooks/useReimbursementStrategy';
import { MarketSelector } from './MarketSelector';
import { UserProfilePanel, UserProfile } from './UserProfilePanel';
import { EconomicBuyerPanel, EconomicBuyerData } from './EconomicBuyerPanel';
import { MarketWarnings } from './MarketWarnings';
import { ArchitectureSelector, SystemArchitecture } from './ArchitectureSelector';
import { MarketCode } from './marketConfigurations';

interface StakeholderProfilerWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

export function StakeholderProfilerWizard({ 
  open, 
  onOpenChange, 
  productId, 
  companyId 
}: StakeholderProfilerWizardProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, save, isSaving } = useReimbursementStrategy(productId, companyId);

  const [architecture, setArchitecture] = useState<SystemArchitecture>('');
  const [market, setMarket] = useState<MarketCode | ''>('');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    primary_operator: '',
    use_environment: '',
    pain_points: '',
    hmi_type: '',
    host_platform: '',
    deployment_environment: '',
  });
  const [economicBuyer, setEconomicBuyer] = useState<EconomicBuyerData>({
    buyer_type: '',
    procurement_path: '',
    mhlw_category: '',
    vbp_status: '',
    prostheses_list_targeting: false,
    prostheses_list_grouping: '',
    primary_payer: '',
    budget_type: '',
    coding_strategy: '',
    reimbursement_code: '',
    remote_update_capable: false,
    data_hosting_location: '',
    soc2_required: false,
    hipaa_baa_required: false,
  });

  // Load existing data when sheet opens
  useEffect(() => {
    if (data && open) {
      setMarket((data.primary_launch_market as MarketCode) || '');
      
      // Parse user_profile from JSONB
      const rawUserProfile = data.user_profile as Record<string, unknown> | null;
      if (rawUserProfile && typeof rawUserProfile === 'object') {
        setUserProfile({
          primary_operator: String(rawUserProfile.primary_operator || ''),
          use_environment: String(rawUserProfile.use_environment || ''),
          pain_points: String(rawUserProfile.pain_points || ''),
          hmi_type: String(rawUserProfile.hmi_type || ''),
          host_platform: String(rawUserProfile.host_platform || ''),
          deployment_environment: String(rawUserProfile.deployment_environment || ''),
        });
        // Load architecture from user_profile if stored there
        if (rawUserProfile.system_architecture) {
          setArchitecture(rawUserProfile.system_architecture as SystemArchitecture);
        }
      }

      // Load economic buyer data
      const rawEconomicBuyer = data as Record<string, unknown>;
      setEconomicBuyer({
        buyer_type: data.buyer_type || '',
        procurement_path: data.procurement_path || '',
        mhlw_category: data.mhlw_category || '',
        vbp_status: data.vbp_status || '',
        prostheses_list_targeting: data.prostheses_list_targeting || false,
        prostheses_list_grouping: data.prostheses_list_grouping || '',
        primary_payer: data.primary_payer || '',
        budget_type: data.budget_type || '',
        coding_strategy: data.coding_strategy || '',
        reimbursement_code: (data.target_codes as any)?.[0]?.code || '',
        remote_update_capable: Boolean(rawEconomicBuyer.remote_update_capable),
        data_hosting_location: String(rawEconomicBuyer.data_hosting_location || ''),
        soc2_required: Boolean(rawEconomicBuyer.soc2_required),
        hipaa_baa_required: Boolean(rawEconomicBuyer.hipaa_baa_required),
      });
    }
  }, [data, open]);

  // Auto-set budget type based on architecture
  useEffect(() => {
    if (architecture === 'samd' && !economicBuyer.budget_type) {
      setEconomicBuyer(prev => ({ ...prev, budget_type: 'SaaS' }));
    } else if (architecture === 'hardware_simd' && !economicBuyer.budget_type) {
      setEconomicBuyer(prev => ({ ...prev, budget_type: 'CapEx' }));
    } else if (architecture === 'pure_hardware' && !economicBuyer.budget_type) {
      setEconomicBuyer(prev => ({ ...prev, budget_type: 'CapEx' }));
    }
  }, [architecture]);

  const handleSave = async () => {
    try {
      await save({
        primary_launch_market: market,
        user_profile: {
          ...userProfile,
          system_architecture: architecture, // Store architecture in user_profile JSONB
        },
        buyer_type: economicBuyer.buyer_type,
        procurement_path: economicBuyer.procurement_path,
        mhlw_category: economicBuyer.mhlw_category,
        vbp_status: economicBuyer.vbp_status,
        prostheses_list_targeting: economicBuyer.prostheses_list_targeting,
        prostheses_list_grouping: economicBuyer.prostheses_list_grouping,
        primary_payer: economicBuyer.primary_payer,
        budget_type: economicBuyer.budget_type,
        coding_strategy: economicBuyer.coding_strategy,
        // Store reimbursement code in target_codes array for compatibility
        target_codes: economicBuyer.reimbursement_code 
          ? [{ code: economicBuyer.reimbursement_code, type: 'primary' }]
          : [],
      });
      
      // Invalidate business canvas query to update completion status
      queryClient.invalidateQueries({ queryKey: ['funnel-canvas', productId] });
      
      toast.success('Stakeholder profile saved successfully!');
      onOpenChange(false);
    } catch (error: any) {
      console.error('[StakeholderProfiler] Save error:', error);
      toast.error('Failed to save: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Global Stakeholder Profiler
          </SheetTitle>
          <SheetDescription>
            Define your system architecture, target user (clinical), and economic buyer profiles based on your primary launch market.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {/* Architecture Selector - Top (Step 0 concept) */}
            <ArchitectureSelector 
              value={architecture}
              onChange={setArchitecture}
            />

            {/* Market Selector */}
            <MarketSelector 
              value={market} 
              onChange={setMarket} 
            />

            {/* Warnings */}
            <MarketWarnings 
              market={market}
              userProfile={userProfile}
              economicBuyer={economicBuyer}
            />

            {/* Two-Panel Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: User Profile */}
              <UserProfilePanel 
                value={userProfile}
                onChange={setUserProfile}
                architecture={architecture}
              />

              {/* Right: Economic Buyer */}
              <EconomicBuyerPanel 
                market={market}
                value={economicBuyer}
                onChange={setEconomicBuyer}
                architecture={architecture}
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={isSaving || !market || !architecture}
                className="min-w-[140px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
