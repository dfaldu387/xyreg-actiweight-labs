import { MyTrainingPortal } from "@/components/training/MyTrainingPortal";
import { useCompanyId } from "@/hooks/useCompanyId";

export default function MyTrainingPage() {
  const companyId = useCompanyId();

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">My Training</h1>
        <p className="text-sm text-muted-foreground">
          Read → Quiz → Sign. Complete every assigned module to keep your role compliant.
        </p>
      </div>
      <MyTrainingPortal companyId={companyId} />
    </div>
  );
}