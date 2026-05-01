import React from "react";
import {
  Building2,
  PenTool,
  ShieldAlert,
  FlaskConical,
  FileCheck2,
} from "lucide-react";

export type StageColor = "green" | "blue" | "purple" | "gold";

export interface JourneyStage {
  id: string;
  number: string;
  title: string;
  standard: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
  color: StageColor;
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "foundation",
    number: "01",
    title: "Foundation",
    standard: "ISO 13485",
    caption: "Set up the QMS your device will live inside.",
    icon: Building2,
    color: "green",
  },
  {
    id: "design",
    number: "02",
    title: "Design",
    standard: "IEC 62304 · 62366",
    caption: "Define inputs, outputs and design controls.",
    icon: PenTool,
    color: "blue",
  },
  {
    id: "risk",
    number: "03",
    title: "Risk",
    standard: "ISO 14971",
    caption: "Identify hazards, estimate and control risk.",
    icon: ShieldAlert,
    color: "purple",
  },
  {
    id: "evidence",
    number: "04",
    title: "Evidence",
    standard: "V&V protocols",
    caption: "Verify and validate against requirements.",
    icon: FlaskConical,
    color: "blue",
  },
  {
    id: "dossier",
    number: "05",
    title: "Dossier",
    standard: "MDR / IVDR",
    caption: "Compile the technical file for submission.",
    icon: FileCheck2,
    color: "purple",
  },
];

export const STAGE_COLOR_MAP: Record<
  StageColor,
  { hex: string; soft: string; ring: string; label: string }
> = {
  green: { hex: "#1F8A4C", soft: "rgba(31,138,76,0.08)", ring: "rgba(31,138,76,0.35)", label: "Quality" },
  blue: { hex: "#2E5BFF", soft: "rgba(46,91,255,0.08)", ring: "rgba(46,91,255,0.35)", label: "Engineering" },
  purple: { hex: "#6B3FA0", soft: "rgba(107,63,160,0.08)", ring: "rgba(107,63,160,0.35)", label: "Regulatory" },
  gold: { hex: "#C9A227", soft: "rgba(201,162,39,0.08)", ring: "rgba(201,162,39,0.35)", label: "Strategy" },
};

/**
 * Shared content body for the XYREG Compliance Journey.
 * Rendered both inside the Mission Control strip's dialog and the Help & Guide drawer.
 */
export function ComplianceJourneyContent() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        XYREG organises the work of getting a medical device to market into{" "}
        <strong>five stages</strong>. Each stage builds the evidence the next one
        needs. Foundation is company-wide; the rest apply per device.
      </p>

      <div className="rounded-md border border-border bg-muted/30 p-2">
        <img
          src="/help/xyreg-compliance-journey.png"
          alt="XYREG compliance journey: Foundation, Design, Risk, Evidence, Dossier"
          className="w-full h-auto rounded"
          loading="lazy"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {JOURNEY_STAGES.map((s) => {
          const c = STAGE_COLOR_MAP[s.color];
          const Icon = s.icon;
          return (
            <div key={s.id} className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded"
                  style={{ background: c.soft, color: c.hex }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-mono" style={{ color: c.hex }}>
                  {s.number}
                </span>
                <span className="font-semibold" style={{ color: c.hex }}>
                  {s.title}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {s.standard}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                {s.caption}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Where to find this:</strong> the
        Compliance Journey strip sits at the top of every Mission Control
        dashboard. Click any stage card to jump straight into that part of XYREG.
      </div>
    </div>
  );
}

export default ComplianceJourneyContent;
