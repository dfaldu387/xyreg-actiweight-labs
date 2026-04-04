import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, Unlink, Users } from "lucide-react";

interface CompactScopeToggleProps {
  scopeView: 'individual' | 'product_family';
  onScopeChange: (scope: 'individual' | 'product_family') => void;
  familyIdentifier?: string;
  showInfoBanner?: boolean;
  infoBannerText?: string;
}

const CompactScopeToggle = ({
  scopeView,
  onScopeChange,
  familyIdentifier,
  showInfoBanner = false,
  infoBannerText,
}: CompactScopeToggleProps) => {
  const tooltipText = scopeView === 'product_family'
    ? 'Shared across product family — click to unlink'
    : 'Individual product — click to link to family';

  return (
    <div className="space-y-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() =>
                onScopeChange(scopeView === 'individual' ? 'product_family' : 'individual')
              }
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              {scopeView === 'product_family' ? (
                <Link className="h-4 w-4 text-blue-500" />
              ) : (
                <Unlink className="h-4 w-4 text-red-500" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showInfoBanner && scopeView === 'product_family' && familyIdentifier && (
        <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border text-sm text-muted-foreground">
          <Users className="h-4 w-4 flex-shrink-0" />
          {infoBannerText || (
            <>
              Shared across all variants with Basic UDI-DI:{" "}
              <strong className="text-foreground">{familyIdentifier}</strong>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactScopeToggle;
