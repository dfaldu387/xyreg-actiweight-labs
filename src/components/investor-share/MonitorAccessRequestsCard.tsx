import React, { useState } from 'react';
import { Users, CheckCircle, XCircle, Clock, ExternalLink, Shield, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMonitorAccessRequests, type MonitorAccessRequest } from '@/hooks/useMonitorAccessRequests';
import { formatDistanceToNow } from 'date-fns';

interface MonitorAccessRequestsCardProps {
  companyId: string | undefined;
}

function InvestorRow({ 
  request, 
  onApprove, 
  onDeny, 
  onRevoke,
  showActions = true,
  actionType = 'approve-deny',
}: { 
  request: MonitorAccessRequest;
  onApprove?: () => void;
  onDeny?: () => void;
  onRevoke?: () => void;
  showActions?: boolean;
  actionType?: 'approve-deny' | 'revoke';
}) {
  const investor = request.investor_profiles;
  const initials = investor.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{investor.full_name}</span>
            {investor.verification_tier === 'verified' && (
              <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-600">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {investor.company_name && <span>{investor.company_name} • </span>}
            {investor.typical_check_size && <span>{investor.typical_check_size}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {investor.linkedin_url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(investor.linkedin_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        {showActions && actionType === 'approve-deny' && (
          <>
            <Button
              size="sm"
              onClick={onApprove}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeny}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Deny
            </Button>
          </>
        )}
        {showActions && actionType === 'revoke' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRevoke}
            className="text-destructive hover:text-destructive"
          >
            <Ban className="h-4 w-4 mr-1" />
            Revoke
          </Button>
        )}
        {!showActions && (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(request.responded_at || request.requested_at), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}

export function MonitorAccessRequestsCard({ companyId }: MonitorAccessRequestsCardProps) {
  const { 
    pendingRequests, 
    approvedRequests, 
    deniedRequests,
    isLoading,
    approve,
    deny,
    revoke,
  } = useMonitorAccessRequests(companyId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRequests = pendingRequests.length + approvedRequests.length + deniedRequests.length;

  if (totalRequests === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Monitor Access Requests</CardTitle>
              <CardDescription>
                No access requests yet. Investors can request continuous monitoring access from your share page.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Monitor Access Requests</CardTitle>
              <CardDescription>
                Manage investor access to your continuous monitoring portal
              </CardDescription>
            </div>
          </div>
          {pendingRequests.length > 0 && (
            <Badge variant="default">
              <Clock className="h-3 w-3 mr-1" />
              {pendingRequests.length} Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={pendingRequests.length > 0 ? "pending" : "approved"}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              {approvedRequests.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({approvedRequests.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="denied">
              Denied
              {deniedRequests.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({deniedRequests.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending requests
              </p>
            ) : (
              <div>
                {pendingRequests.map(request => (
                  <InvestorRow
                    key={request.id}
                    request={request}
                    onApprove={() => approve({ requestId: request.id })}
                    onDeny={() => deny({ requestId: request.id })}
                    actionType="approve-deny"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            {approvedRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No approved investors
              </p>
            ) : (
              <div>
                {approvedRequests.map(request => (
                  <InvestorRow
                    key={request.id}
                    request={request}
                    onRevoke={() => revoke(request.id)}
                    actionType="revoke"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="denied" className="mt-4">
            {deniedRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No denied requests
              </p>
            ) : (
              <div>
                {deniedRequests.map(request => (
                  <InvestorRow
                    key={request.id}
                    request={request}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
