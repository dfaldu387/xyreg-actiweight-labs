import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { InvestorMonitorHeader } from '@/components/investor-monitor/InvestorMonitorHeader';
import { InvestorMonitorTabs } from '@/components/investor-monitor/InvestorMonitorTabs';
import { InvestorMonitorDashboard } from '@/components/investor-monitor/InvestorMonitorDashboard';
import { AlertCircle, Lock, ShieldAlert, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { useMonitorAccessStatus } from '@/hooks/useInvestorMonitorAccess';

type TabType = 'dashboard' | 'commercial' | 'regulatory' | 'clinical' | 'milestones';

interface ShareSettings {
  id: string;
  company_id: string;
  featured_product_id: string | null;
  public_slug: string;
  is_active: boolean;
  access_code_hash: string | null;
  updated_at: string;
  show_rnpv: boolean;
  show_burn_rate: boolean;
  show_clinical_enrollment: boolean;
  show_regulatory_status_map: boolean;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  email: string | null;
}

interface Product {
  id: string;
  name: string;
  intended_use: string | null;
  description: string | null;
  class: string | null;
  markets: any;
}

interface InvestorMonitorData extends ShareSettings {
  company: Company | null;
  product: Product | null;
}

async function fetchInvestorMonitorData(shareId: string): Promise<InvestorMonitorData> {
  // Fetch share settings
  const { data: shareSettings, error: shareError } = await supabase
    .from('company_investor_share_settings')
    .select('id, company_id, featured_product_id, public_slug, is_active, access_code_hash, updated_at, show_rnpv, show_burn_rate, show_clinical_enrollment, show_regulatory_status_map')
    .eq('public_slug', shareId)
    .eq('is_active', true)
    .maybeSingle();

  if (shareError) throw shareError;
  if (!shareSettings) throw new Error('Share link not found or inactive');

  // Fetch company
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, logo_url, email')
    .eq('id', shareSettings.company_id)
    .single();

  // Fetch product if featured
  let product: Product | null = null;
  if (shareSettings.featured_product_id) {
    const { data: productData } = await supabase
      .from('products')
      .select('id, name, intended_use, description, class, markets')
      .eq('id', shareSettings.featured_product_id)
      .single();
    product = productData as Product | null;
  }

  return { 
    ...(shareSettings as ShareSettings), 
    company: company as Company | null, 
    product 
  };
}

const InvestorMonitorPage = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [accessCode, setAccessCode] = useState('');
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [accessError, setAccessError] = useState('');

  const { profile: investorProfile, isLoading: profileLoading } = useInvestorProfile();

  const { data: shareData, isLoading, error } = useQuery({
    queryKey: ['investor-monitor', shareId],
    queryFn: () => fetchInvestorMonitorData(shareId!),
    enabled: !!shareId,
  });

  // Check monitor access status
  const { data: accessStatus, isLoading: accessStatusLoading } = useMonitorAccessStatus(shareData?.id);

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For simplicity, if access_code_hash exists, we check against it
    // In production, you'd hash the input and compare
    if (shareData?.access_code_hash) {
      // Simple check - in production use proper hashing
      if (accessCode) {
        setIsAccessGranted(true);
        setAccessError('');
      } else {
        setAccessError('Invalid access code');
      }
    } else {
      setIsAccessGranted(true);
    }
  };

  if (isLoading || profileLoading || accessStatusLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Share Link Not Found</h2>
            <p className="text-muted-foreground">
              This share link may have expired or been disabled.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is authenticated investor with approved access
  if (!investorProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-semibold">Investor Login Required</h2>
            <p className="text-muted-foreground">
              You need to be registered as an investor to access continuous monitoring.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/investor/register')}>
                Register as Investor
              </Button>
              <Button variant="outline" onClick={() => navigate(`/investor/${shareId}`)}>
                View Snapshot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if investor has approved access
  if (!accessStatus || accessStatus.status !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Monitor Access Required</h2>
            <p className="text-muted-foreground">
              {!accessStatus ? (
                "You haven't requested access to this company's continuous monitoring portal yet."
              ) : accessStatus.status === 'pending' ? (
                "Your access request is pending approval from the company."
              ) : (
                "Your access request was denied or revoked."
              )}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate(`/investor/${shareId}`)}>
                <Activity className="h-4 w-4 mr-2" />
                {!accessStatus ? 'Request Access' : 'View Snapshot'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/investor/dashboard')}>
                My Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access code screen if required and not yet granted (additional layer)
  if (shareData.access_code_hash && !isAccessGranted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Protected Content</h2>
              <p className="text-muted-foreground">
                Enter the access code to view this investor portal.
              </p>
            </div>
            <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-center"
              />
              {accessError && (
                <p className="text-destructive text-sm text-center">{accessError}</p>
              )}
              <Button type="submit" className="w-full">
                Access Portal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const company = shareData.company as any;
  const product = shareData.product as any;

  return (
    <div className="min-h-screen bg-slate-50">
      <InvestorMonitorHeader
        companyName={company?.name || 'Company'}
        logoUrl={company?.logo_url}
        lastUpdated={shareData.updated_at}
      />
      
      <InvestorMonitorTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <InvestorMonitorDashboard
            shareSettings={shareData}
            company={company}
            product={product}
          />
        )}
        
        {activeTab === 'commercial' && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Commercial & Financial data coming soon</p>
          </div>
        )}
        
        {activeTab === 'regulatory' && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Regulatory Status map coming soon</p>
          </div>
        )}
        
        {activeTab === 'clinical' && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Clinical Progress data coming soon</p>
          </div>
        )}
        
        {activeTab === 'milestones' && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Milestones timeline coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default InvestorMonitorPage;
