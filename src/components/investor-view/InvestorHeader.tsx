import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface InvestorHeaderProps {
  companyName: string;
  companyLogo?: string;
  founderEmail: string;
  isVerified: boolean;
  productName?: string;
  onRequestMonitorAccess?: () => void;
  showMonitorButton?: boolean;
}

export function InvestorHeader({
  companyName,
  companyLogo,
  founderEmail,
  isVerified,
  productName,
  onRequestMonitorAccess,
  showMonitorButton = true
}: InvestorHeaderProps) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const fromDealFlow = searchParams.get('from') === 'deal-flow';
  const fromPreview = searchParams.get('from') === 'preview';

  return (
    <header className={cn((fromDealFlow || fromPreview) ? "top-[42px]" : "top-0", "sticky z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60")}>
      <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row h-auto sm:h-16 py-3 sm:py-0 items-start sm:items-center justify-between gap-3 sm:gap-0">
        {/* Left: Company Name + Product Name */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} className="h-8 w-8 sm:h-10 sm:w-10 rounded-md object-cover flex-shrink-0" />
          ) : (
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-md bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
              <span className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {companyName.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex flex-col min-w-0">
            {productName && (
              <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{productName}</h1>
            )}
            <span className={cn(
              productName ? "text-xs sm:text-sm text-muted-foreground" : "text-base sm:text-xl font-semibold text-foreground",
              "truncate"
            )}>
              {companyName}
            </span>
          </div>
        </div>

        {/* Center-Right: Verified Badge + Actions */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {isVerified && (
            <Badge variant="secondary" className="gap-1 sm:gap-1.5 text-xs whitespace-nowrap">
              <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline">Verified by Xyreg</span>
              <span className="xs:hidden">Verified</span>
            </Badge>
          )}

          {/* Hide request button in preview mode */}
          {!fromPreview && (
            <Button asChild variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm h-8 sm:h-9">
              <a href={`mailto:${founderEmail}`}>
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Request More Information</span>
                <span className="sm:hidden">Contact</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
