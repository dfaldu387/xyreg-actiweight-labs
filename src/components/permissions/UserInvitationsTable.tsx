
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Mail, X, RotateCcw } from "lucide-react";
import { useInvitations, UserInvitation } from "@/hooks/useInvitations";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/useTranslation";

interface UserInvitationsTableProps {
  companyId: string;
}

export function UserInvitationsTable({ companyId }: UserInvitationsTableProps) {
  const { lang } = useTranslation();
  const { invitations, isLoading, cancelInvitation, resendInvitation } = useInvitations(companyId);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleCancelInvitation = async (invitationId: string) => {
    setActioningId(invitationId);
    await cancelInvitation(invitationId);
    setActioningId(null);
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActioningId(invitationId);
    await resendInvitation(invitationId);
    setActioningId(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'accepted': return 'secondary';
      case 'expired': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'default';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      case 'consultant': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{lang('companySettings.invitations.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{lang('companySettings.invitations.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          {lang('companySettings.invitations.noPendingInvitations')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lang('companySettings.invitations.titleWithCount', { count: invitations.length })}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang('companySettings.invitations.email')}</TableHead>
              <TableHead>{lang('companySettings.invitations.accessLevel')}</TableHead>
              <TableHead>{lang('companySettings.invitations.type')}</TableHead>
              <TableHead>{lang('common.status')}</TableHead>
              <TableHead>{lang('companySettings.invitations.invited')}</TableHead>
              <TableHead>{lang('companySettings.invitations.expires')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">{invitation.email}</TableCell>
                <TableCell>
                  <Badge className={getAccessLevelColor(invitation.access_level)}>
                    {invitation.access_level}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={invitation.is_internal ? "default" : "secondary"}>
                    {invitation.is_internal ? lang('companySettings.invitations.internal') : lang('companySettings.invitations.external')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(invitation.status)}>
                    {lang(`companySettings.invitations.statuses.${invitation.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(invitation.invited_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(invitation.expires_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={actioningId === invitation.id}>
                        {actioningId === invitation.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {invitation.status === 'pending' && (
                        <>
                          <DropdownMenuItem onClick={() => handleResendInvitation(invitation.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            {lang('companySettings.invitations.resend')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {lang('common.cancel')}
                          </DropdownMenuItem>
                        </>
                      )}
                      {invitation.status === 'expired' && (
                        <DropdownMenuItem onClick={() => handleResendInvitation(invitation.id)}>
                          <Mail className="h-4 w-4 mr-2" />
                          {lang('companySettings.invitations.sendNewInvitation')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
