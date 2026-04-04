
import { DashboardHeader } from "@/components/DashboardHeader";
import { HybridUserManagement } from "@/components/permissions/HybridUserManagement";
import { CompanyMetadataResetButton } from "@/components/CompanyMetadataResetButton";

export default function Permissions() {
  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <CompanyMetadataResetButton />
          </div>
          <HybridUserManagement companyId={undefined} />
        </div>
      </div>
    </div>
  );
}
