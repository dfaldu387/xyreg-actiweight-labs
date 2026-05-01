
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Layers, ExternalLink, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Client } from "@/types/client";
import { useNavigate } from "react-router-dom";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { resolveCompanyToUuid } from "@/utils/simplifiedCompanyResolver";
import { CompanyUsageService } from '@/services/companyUsageService';
import { useTranslation } from "@/hooks/useTranslation";
import { formatDuration } from "@/hooks/useCompanyTime";
import { getCompanyTime, type CompanyTimeData } from "@/hooks/useCompanyTimesBatch";
import { supabase } from "@/integrations/supabase/client";
import { DashboardOtpDialog } from "@/components/DashboardOtpDialog";

interface ClientCardProps {
  client: Client;
  onClientSelect: (client: Client) => void;
  onCompanyDashboardClick?: () => void;
  disabled?: boolean;
  companyTimesMap?: Map<string, CompanyTimeData>;
}

export function ClientCard({ client, onClientSelect, onCompanyDashboardClick, disabled = false, companyTimesMap }: ClientCardProps) {
  const navigate = useNavigate();
  const { switchCompanyRole, companyRoles, refreshCompanyRoles } = useCompanyRole();
  const { lang } = useTranslation();
  const { totalSeconds, weeklySeconds } = getCompanyTime(companyTimesMap, client.id);

  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [targetAppUrl, setTargetAppUrl] = useState("");
  const [otpUserEmail, setOtpUserEmail] = useState("");
  const [otpUserId, setOtpUserId] = useState("");
  const [otpUserName, setOtpUserName] = useState("");
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const getStatusColor = (status: Client["status"]) => {
    switch (status) {
      case "On Track":
        return "bg-success text-success-foreground hover:bg-success/80";
      case "At Risk":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/80";
      case "Needs Attention":
        return "bg-warning text-warning-foreground hover:bg-warning/80";
      default:
        return "";
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    onClientSelect(client);
  };

  const doInternalNavigation = async () => {
    try {
      await CompanyUsageService.recordCompanyAccess(client.id);

      const existingRole = companyRoles.find(role =>
        role.companyName.toLowerCase() === client.name.toLowerCase()
      );

      if (existingRole) {
        await switchCompanyRole(existingRole.companyId, {
          navigateToCompany: false,
          updateUserMetadata: true
        });

        const newContext = {
          companyId: existingRole.companyId,
          companyName: existingRole.companyName,
          productId: null,
          lastUpdated: Date.now()
        };
        sessionStorage.setItem('xyreg_company_context', JSON.stringify(newContext));

        navigate(`/app/company/${encodeURIComponent(existingRole.companyName)}`);
      } else {
        try {
          await refreshCompanyRoles();
          await new Promise(resolve => setTimeout(resolve, 200));
          navigate(`/app/company/${encodeURIComponent(client.name)}`);
        } catch (error) {
          navigate(`/app/company/${encodeURIComponent(client.name)}`);
        }
      }
    } catch (error) {
      navigate(`/app/company/${encodeURIComponent(client.name)}`);
    }
  };

  const navigateToCompanyDashboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || dashboardLoading) return;

    if (onCompanyDashboardClick) {
      onCompanyDashboardClick();
    }

    const otpEnabled = import.meta.env.VITE_OTP_DASHBOARD_ACCESS === 'true';

    if (!otpEnabled) {
      setDashboardLoading(true);
      await doInternalNavigation();
      setDashboardLoading(false);
      return;
    }

    // Check if company has an app_url
    setDashboardLoading(true);
    try {
      const { data: company } = await supabase
        .from("companies")
        .select("app_url")
        .eq("id", client.id)
        .maybeSingle();

      if (company?.app_url) {
        // Get current user info for OTP
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setOtpUserEmail(user.email || "");
          setOtpUserId(user.id);
          setOtpUserName(
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim() ||
            ""
          );
          setTargetAppUrl(company.app_url);
          setShowOtpDialog(true);
        }
      } else {
        await doInternalNavigation();
      }
    } catch {
      await doInternalNavigation();
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleOtpVerified = async () => {
    setShowOtpDialog(false);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const url = new URL(targetAppUrl);
      url.searchParams.set("access_token", session.access_token);
      url.searchParams.set("refresh_token", session.refresh_token);
      url.searchParams.set("company_id", client.id);
      url.searchParams.set("company_name", client.name);
      window.location.href = url.toString();
    }
  };

  return (
    <Card
      data-tour="company-card"
      className={cn(
        "overflow-hidden transition-all duration-200",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-md cursor-pointer"
      )}
      onClick={handleViewDetails}
    >
      <CardContent className="p-0">
        <div className={cn("h-1",
          client.status === "On Track" ? "bg-success" :
            client.status === "At Risk" ? "bg-destructive" : "bg-warning"
        )} />
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h2
                className={cn(
                  "text-lg font-semibold",
                  disabled ? "cursor-not-allowed" : "hover:text-primary hover:underline cursor-pointer"
                )}
                onClick={navigateToCompanyDashboard}
              >
                {client.name}
              </h2>
              <p className="text-sm text-muted-foreground">{client.country}</p>
            </div>
            <Badge className={getStatusColor(client.status)}>
              {client.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm">{lang('clients.device')}: <span className="font-medium">{client.products}</span></p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium">{lang('clients.overallProgress')}</p>
                <Layers className="w-3 h-3 text-muted-foreground" aria-label="Includes development lifecycle phases" />
              </div>
              <span className="text-sm font-medium">{client.progress}%</span>
            </div>
            <Progress
              value={client.progress}
              className={cn(
                client.progress < 60 ? "text-warning" :
                  client.progress > 85 ? "text-success" : ""
              )}
            />
          </div>

          {/* Time tracking stats */}
          {(totalSeconds > 0 || weeklySeconds > 0) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{lang('clients.thisWeek') || 'This week'}: <span className="font-medium text-foreground">{formatDuration(weeklySeconds)}</span></span>
              <span className="text-border">|</span>
              <span>{lang('clients.total') || 'Total'}: <span className="font-medium text-foreground">{formatDuration(totalSeconds)}</span></span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleViewDetails}
              disabled={disabled}
            >
              {lang('clients.viewDetails')}
            </Button>
            <Button
              variant="outline"
              className="flex-1 flex items-center gap-1"
              onClick={navigateToCompanyDashboard}
              disabled={disabled || dashboardLoading}
            >
              {dashboardLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {lang('clients.dashboard')}
                </>
              ) : (
                <>
                  {lang('clients.dashboard')} <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>

      <DashboardOtpDialog
        open={showOtpDialog}
        onOpenChange={setShowOtpDialog}
        onVerified={handleOtpVerified}
        userEmail={otpUserEmail}
        userId={otpUserId}
        userName={otpUserName}
        companyName={client.name}
      />
    </Card>
  );
}
