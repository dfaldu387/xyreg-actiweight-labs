import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Activity, 
  Shield,
  Wallet,
  TrendingUp,
  Clock
} from 'lucide-react';

interface InvestorMonitorDashboardProps {
  shareSettings: any;
  company: any;
  product: any;
}

export const InvestorMonitorDashboard: React.FC<InvestorMonitorDashboardProps> = ({
  shareSettings,
  company,
  product,
}) => {
  const showRnpv = shareSettings?.show_rnpv ?? false;
  const showBurnRate = shareSettings?.show_burn_rate ?? false;
  const showClinicalEnrollment = shareSettings?.show_clinical_enrollment ?? true;
  const showRegulatoryStatus = shareSettings?.show_regulatory_status_map ?? true;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Investor Pulse</h2>
        <p className="text-slate-500 mt-1">Key metrics and status overview</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valuation Snapshot */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valuation Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showRnpv ? (
              <div>
                <p className="text-3xl font-bold text-slate-900">$2.4M</p>
                <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs last quarter
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400">Data Not Shared</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regulatory Traffic Light */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Regulatory Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showRegulatoryStatus ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">US (FDA)</span>
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">EU (MDR)</span>
                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Planned</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">UK (UKCA)</span>
                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Planned</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400">Data Not Shared</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Pathway */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Cash Pathway
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showBurnRate ? (
              <div>
                <p className="text-3xl font-bold text-slate-900">18 mo</p>
                <p className="text-sm text-slate-500 mt-1">Runway remaining</p>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400">Data Not Shared</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clinical Velocity */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Clinical Velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showClinicalEnrollment ? (
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-100"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${65 * 1.76} 176`}
                      className="text-indigo-600"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
                    65%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Enrollment</p>
                  <p className="text-xs text-slate-500">65/100 patients</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400">Data Not Shared</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            Recent Significant Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { date: '2024-12-01', event: 'Completed Phase 2 Design Verification', type: 'milestone' },
              { date: '2024-11-15', event: 'Submitted 510(k) Pre-Submission Package', type: 'regulatory' },
              { date: '2024-11-01', event: 'Reached 50% Clinical Enrollment', type: 'clinical' },
              { date: '2024-10-20', event: 'Series A Term Sheet Signed', type: 'funding' },
              { date: '2024-10-05', event: 'ISO 13485 Certification Achieved', type: 'quality' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="text-xs text-slate-400 w-24 flex-shrink-0">
                  {item.date}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{item.event}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-xs capitalize"
                >
                  {item.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
