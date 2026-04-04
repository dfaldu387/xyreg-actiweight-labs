
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SettingsIcon, Users, Package, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArchiveCompanyDialog } from "@/components/company/ArchiveCompanyDialog";
import { InvestorShareDialog } from "@/components/company/InvestorShareDialog";
import { useDevMode } from "@/context/DevModeContext";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { UserRole } from "@/types/documentTypes";

interface CompanyDashboardHeaderProps {
  companyName: string;
  totalProducts: number;
  onTrack: number;
  atRisk: number;
  needsAttention: number;
  companyId?: string;
}

export function CompanyDashboardHeader({
  companyName,
  totalProducts,
  onTrack,
  atRisk,
  needsAttention,
  companyId,
}: CompanyDashboardHeaderProps) {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { isDevMode, selectedRole } = useDevMode();
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  // Check if user is admin via dev mode or normal authentication
  const isAdmin = isDevMode 
    ? (selectedRole === "admin")
    : hasAdminPrivileges(userRole);

  return (
    <div className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">{companyName}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{totalProducts} Products</span>
            </div>
            {onTrack > 0 && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                {onTrack} On Track
              </Badge>
            )}
            {atRisk > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {atRisk} At Risk
              </Badge>
            )}
            {needsAttention > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                {needsAttention} Needs Attention
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isAdmin && companyId && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Investor Share
              </Button>
              <ArchiveCompanyDialog companyId={companyId} companyName={companyName} />
              <InvestorShareDialog
                open={showShareDialog}
                onOpenChange={setShowShareDialog}
                companyId={companyId}
                companyName={companyName}
              />
            </>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/app/company/${encodeURIComponent(companyName)}/settings`)}
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
