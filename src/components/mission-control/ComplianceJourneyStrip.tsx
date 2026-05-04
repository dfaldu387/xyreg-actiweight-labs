import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Building2,
  PenTool,
  ShieldAlert,
  FlaskConical,
  FileCheck2,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ComplianceJourneyContent } from "@/components/compliance-journey/ComplianceJourneyContent";
import { useCompanyProducts } from "@/hooks/useCompanyProducts";

interface ComplianceJourneyStripProps {
  companyName?: string;
  companyId?: string;
}

type StageColor = "green" | "blue" | "purple" | "gold";
type StageScope = "company" | "product";

interface Stage {
  id: string;
  number: string;
  title: string;
  standard: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
  color: StageColor;
  scope: StageScope;
  // Builder when a single product context is available
  buildProductHref?: (productId: string) => string;
  // Builder for company-level destinations
  buildCompanyHref?: (companyName: string) => string;
}

const STAGES: Stage[] = [
  {
    id: "foundation",
    number: "01",
    title: "Foundation",
    standard: "ISO 13485",
    caption: "Set up the QMS your device will live inside.",
    icon: Building2,
    color: "green",
    scope: "company",
    buildCompanyHref: (c) =>
      `/app/company/${encodeURIComponent(c)}?dashboardTab=qms-foundation`,
  },
  {
    id: "design",
    number: "02",
    title: "Design",
    standard: "IEC 62304 · 62366",
    caption: "Define inputs, outputs and design controls.",
    icon: PenTool,
    color: "blue",
    scope: "product",
    buildProductHref: (pid) =>
      `/app/product/${pid}/design-risk-controls?tab=requirement-specifications&subTab=user-needs`,
  },
  {
    id: "risk",
    number: "03",
    title: "Risk",
    standard: "ISO 14971",
    caption: "Identify hazards, estimate and control risk.",
    icon: ShieldAlert,
    color: "purple",
    scope: "product",
    buildProductHref: (pid) =>
      `/app/product/${pid}/design-risk-controls?tab=risk-management`,
  },
  {
    id: "evidence",
    number: "04",
    title: "Evidence",
    standard: "V&V protocols",
    caption: "Verify and validate against requirements.",
    icon: FlaskConical,
    color: "blue",
    scope: "product",
    buildProductHref: (pid) =>
      `/app/product/${pid}/design-risk-controls?tab=verification-validation&subTab=vv-plan`,
  },
  {
    id: "dossier",
    number: "05",
    title: "Dossier",
    standard: "MDR / IVDR",
    caption: "Compile the technical file for submission.",
    icon: FileCheck2,
    color: "purple",
    scope: "product",
    buildProductHref: (pid) => `/app/product/${pid}/technical-file`,
  },
];

const COLOR_MAP: Record<
  StageColor,
  { hex: string; soft: string; ring: string; label: string }
> = {
  green: {
    hex: "#1F8A4C",
    soft: "rgba(31,138,76,0.08)",
    ring: "rgba(31,138,76,0.35)",
    label: "Quality",
  },
  blue: {
    hex: "#2E5BFF",
    soft: "rgba(46,91,255,0.08)",
    ring: "rgba(46,91,255,0.35)",
    label: "Engineering",
  },
  purple: {
    hex: "#6B3FA0",
    soft: "rgba(107,63,160,0.08)",
    ring: "rgba(107,63,160,0.35)",
    label: "Regulatory",
  },
  gold: {
    hex: "#C9A227",
    soft: "rgba(201,162,39,0.08)",
    ring: "rgba(201,162,39,0.35)",
    label: "Strategy",
  },
};

const COLLAPSE_KEY = "mc:journey-strip:collapsed";

export function ComplianceJourneyStrip({
  companyName,
  companyId,
}: ComplianceJourneyStripProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStage, setPickerStage] = useState<Stage | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  // Fetch the company's products so we can deep-link into product-scoped stages.
  const { products } = useCompanyProducts(companyId || "", { enabled: !!companyId });
  const activeProducts = useMemo(
    () => (products || []).filter((p: any) => !p.is_archived),
    [products]
  );

  const handleStageClick = (stage: Stage) => {
    if (stage.scope === "company") {
      if (companyName && stage.buildCompanyHref) {
        navigate(stage.buildCompanyHref(companyName));
      }
      return;
    }
    // product-scoped
    if (activeProducts.length === 1 && stage.buildProductHref) {
      navigate(stage.buildProductHref(activeProducts[0].id));
      return;
    }
    if (activeProducts.length === 0) {
      // No products yet — send to the company products page so they can create one.
      if (companyName) {
        navigate(`/app/company/${encodeURIComponent(companyName)}/portfolio?view=cards`);
      }
      return;
    }
    // Multiple products — open picker
    setPickerStage(stage);
    setPickerOpen(true);
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: COLOR_MAP.gold.hex }}
            aria-hidden
          />
          <h2 className="text-sm font-semibold text-foreground">
            The Compliance Journey
          </h2>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            · Foundation → Design → Risk → Evidence → Dossier
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground"
            onClick={() => setHelpOpen(true)}
            aria-label="How to read this"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="relative px-4 py-4">
          <div
            className="absolute left-6 right-6 top-1/2 h-px -translate-y-1/2"
            style={{
              background: `repeating-linear-gradient(to right, ${COLOR_MAP.gold.hex} 0 6px, transparent 6px 12px)`,
              opacity: 0.4,
            }}
            aria-hidden
          />
          <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STAGES.map((stage) => {
              const Icon = stage.icon;
              const c = COLOR_MAP[stage.color];
              const isProductScoped = stage.scope === "product";
              const needsPicker =
                isProductScoped && activeProducts.length > 1;
              const noProducts =
                isProductScoped && activeProducts.length === 0;
              return (
                <button
                  key={stage.id}
                  onClick={() => handleStageClick(stage)}
                  className={cn(
                    "group text-left rounded-md border bg-card px-3 py-3",
                    "hover:shadow-md transition-all hover:-translate-y-0.5",
                    "focus:outline-none focus:ring-2"
                  )}
                  style={{ borderColor: c.ring }}
                  aria-label={`${stage.title} — ${stage.standard}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-md"
                      style={{ background: c.soft, color: c.hex }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className="text-[10px] font-mono tracking-wider"
                      style={{ color: c.hex }}
                    >
                      {stage.number}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div
                      className="text-sm font-semibold"
                      style={{ color: c.hex }}
                    >
                      {stage.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {stage.standard}
                    </div>
                    <div className="text-xs text-foreground/70 mt-1.5 leading-snug">
                      {stage.caption}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground">
                    {noProducts
                      ? "Add a product →"
                      : needsPicker
                      ? "Choose product →"
                      : "Open →"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Help dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>How XYREG Works — The Compliance Journey</DialogTitle>
            <DialogDescription>
              Five stages, in order. Each one builds the evidence the next one
              needs.
            </DialogDescription>
          </DialogHeader>
          <ComplianceJourneyContent />
        </DialogContent>
      </Dialog>

      {/* Product picker dialog (only shown when company has 2+ products) */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Open {pickerStage?.title} for which device?
            </DialogTitle>
            <DialogDescription>
              {pickerStage?.standard} applies per device. Pick one to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {activeProducts.map((p: any) => (
              <button
                key={p.id}
                onClick={() => {
                  if (pickerStage?.buildProductHref) {
                    navigate(pickerStage.buildProductHref(p.id));
                  }
                  setPickerOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-border hover:bg-accent text-left"
              >
                <span className="text-sm font-medium">{p.name}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ComplianceJourneyStrip;
