
import { Building, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useDevMode } from "@/context/DevModeContext";

export function EmptyDashboardState() {
  const navigate = useNavigate();
  const { isDevMode } = useDevMode();
  
  return (
    <Card className="w-full max-w-md mx-auto border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          No Company Selected
        </CardTitle>
        <CardDescription>
          You need to select a company before you can view the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">
            In development mode, you need to:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
            <li>Enable DevMode on the landing page</li>
            <li>Add at least one company to your portfolio</li>
            <li>Set a primary company</li>
          </ol>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          onClick={() => navigate("/landing")} 
          className="w-full"
          variant="default"
        >
          Go to Developer Settings
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {isDevMode && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            DevMode is active. Configure your company settings on the landing page.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
