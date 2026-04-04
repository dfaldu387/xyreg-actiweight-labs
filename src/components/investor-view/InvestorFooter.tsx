import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";

export function InvestorFooter() {
  return (
    <footer className="border-t bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1800px] w-full mx-auto px-6 lg:px-10 py-12">
        <div className="text-center space-y-6">
          <p className="text-muted-foreground">
            Powered by <span className="font-semibold text-indigo-600 dark:text-indigo-400">Xyreg</span>
          </p>
          
          <Separator className="max-w-xs mx-auto" />
          
          <div>
            <Button 
              asChild 
              size="lg" 
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <a href="/">
                Validate your own device idea for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            The Operating System for MedTech
          </p>
        </div>
      </div>
    </footer>
  );
}
