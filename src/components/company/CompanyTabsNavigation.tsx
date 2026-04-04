
import { useNavigate } from "react-router-dom";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCog, FileText, ClipboardCheck, Settings, BarChart2, UsersRound } from "lucide-react";

interface CompanyTabsNavigationProps {
  companyName: string;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function CompanyTabsNavigation({ 
  companyName, 
  activeTab, 
  onTabChange 
}: CompanyTabsNavigationProps) {
  const navigate = useNavigate();
  const encodedCompanyName = encodeURIComponent(companyName);

  // Handle tab change with client-side state instead of navigation for most tabs
  const handleTabChange = (value: string) => {
    onTabChange(value);
  };

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <TabsList className="inline-flex h-auto bg-muted p-1 text-muted-foreground w-full max-w-full">
        <div className="flex flex-wrap gap-1 w-full">
          <TabsTrigger 
            value="lifecycle-phases"
            onClick={() => handleTabChange("lifecycle-phases")}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap flex-shrink-0"
          >
            Lifecycle Phases
          </TabsTrigger>
          <TabsTrigger 
            value="document-control"
            onClick={() => handleTabChange("document-control")}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap flex-shrink-0"
          >
            <FileText className="inline-block mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Document CIs
          </TabsTrigger>
          <TabsTrigger 
            value="gap-analysis"
            onClick={() => handleTabChange("gap-analysis")}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap flex-shrink-0"
          >
            <BarChart2 className="inline-block mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Gap Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="audits"
            onClick={() => handleTabChange("audits")}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap flex-shrink-0"
          >
            <ClipboardCheck className="inline-block mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Audits
          </TabsTrigger>
          <TabsTrigger 
            value="review-assigned-documents"
            onClick={() => handleTabChange("review-assigned-documents")}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap flex-shrink-0"
          >
            <FileText className="inline-block mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Review Assigned Documents
          </TabsTrigger>
          <TabsTrigger 
            value="users"
            onClick={() => handleTabChange("users")}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap flex-shrink-0"
          >
            <Users className="inline-block mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Users
          </TabsTrigger>
          <TabsTrigger 
            value="permissions"
            onClick={() => handleTabChange("permissions")}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap flex-shrink-0"
          >
            <UsersRound className="inline-block mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Reviewers
          </TabsTrigger>
          <TabsTrigger 
            value="roles"
            onClick={() => handleTabChange("roles")}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap flex-shrink-0"
          >
            <UserCog className="inline-block mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Roles
          </TabsTrigger>
          <TabsTrigger 
            value="general"
            onClick={() => handleTabChange("general")}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap flex-shrink-0"
          >
            <Settings className="inline-block mr-1 h-3 w-3 sm:h-4 sm:w-4" /> General
          </TabsTrigger>
        </div>
      </TabsList>
    </div>
  );
}
