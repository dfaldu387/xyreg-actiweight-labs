import React, { useState } from 'react';
import { Activity, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { useInvestorMonitorAccess, useMonitorAccessStatus } from '@/hooks/useInvestorMonitorAccess';
import { useNavigate } from 'react-router-dom';

interface MonitorAccessRequestCardProps {
  shareSettingsId: string;
  companyId: string;
  productId?: string;
  companyName: string;
  publicSlug: string;
}

export function MonitorAccessRequestCard({
  shareSettingsId,
  companyId,
  productId,
  companyName,
  publicSlug,
}: MonitorAccessRequestCardProps) {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useInvestorProfile();
  const { requestAccess, isRequesting } = useInvestorMonitorAccess();
  const { data: accessStatus, isLoading: statusLoading } = useMonitorAccessStatus(shareSettingsId);
  const [message, setMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  // Don't show if not an investor
  if (profileLoading || !profile) {
    return null;
  }

  if (statusLoading) {
    return (
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardContent className="py-6 text-center">
          <div className="animate-pulse h-8 w-48 mx-auto bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const handleRequestAccess = () => {
    requestAccess({
      shareSettingsId,
      companyId,
      productId,
      message: message.trim() || undefined,
    });
    setShowMessageInput(false);
    setMessage('');
  };

  const handleGoToMonitor = () => {
    navigate(`/investor/monitor/${publicSlug}`);
  };

  const handleGoToDashboard = () => {
    navigate('/investor/dashboard');
  };

  // Render based on status
  if (!accessStatus) {
    // No request yet - show request button
    return (
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">Continuous Monitoring Access</CardTitle>
              <p className="text-sm text-muted-foreground">
                Request real-time access to {companyName}'s KPIs and progress
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showMessageInput ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Add an optional message to introduce yourself or explain your interest..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleRequestAccess} disabled={isRequesting}>
                  <Send className="h-4 w-4 mr-2" />
                  {isRequesting ? 'Sending...' : 'Send Request'}
                </Button>
                <Button variant="outline" onClick={() => setShowMessageInput(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowMessageInput(true)} className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              Request Monitor Access
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (accessStatus.status === 'pending') {
    return (
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Access Request Pending</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Waiting for {companyName} to review your request
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500/50 text-amber-600">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (accessStatus.status === 'approved') {
    return (
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">Monitor Access Granted</CardTitle>
                <p className="text-sm text-muted-foreground">
                  You have continuous monitoring access to {companyName}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleGoToMonitor}>
              <Activity className="h-4 w-4 mr-2" />
              View Monitor Portal
            </Button>
            <Button variant="outline" onClick={handleGoToDashboard}>
              My Portfolio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Denied or revoked
  return (
    <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-base">Access {accessStatus.status === 'revoked' ? 'Revoked' : 'Denied'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your request for monitor access was {accessStatus.status}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-destructive/50 text-destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {accessStatus.status === 'revoked' ? 'Revoked' : 'Denied'}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
