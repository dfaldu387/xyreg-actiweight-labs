import React from 'react';
import { Shield, ListChecks, ArrowRight, Info } from 'lucide-react';
import { HELIX_NODE_CONFIGS } from '@/config/helixNodeConfig';
import { getNodeProcessDefault } from '@/data/nodeProcessDefaults';

interface FoundationNodeHelpProps {
  nodeId: string;
}

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="space-y-2">
    <h4 className="font-semibold text-sm flex items-center gap-2">
      {icon}
      {title}
    </h4>
    {children}
  </div>
);

/**
 * Generic, data-driven help renderer for any QMS Foundation node
 * (e.g. Design Control, Management Responsibility, Risk Management).
 *
 * Sourced from HELIX_NODE_CONFIGS + nodeProcessDefaults so help stays
 * in sync with the drawer content authored elsewhere.
 */
export const FoundationNodeHelp: React.FC<FoundationNodeHelpProps> = ({ nodeId }) => {
  const config = HELIX_NODE_CONFIGS.find((c) => c.id === nodeId);
  const defaults = getNodeProcessDefault(nodeId);

  if (!config) {
    return (
      <div className="text-sm text-muted-foreground">
        No help available for this foundation node.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">{config.label}</h3>
        <p className="text-sm text-muted-foreground">
          {defaults?.helpText ?? config.description}
        </p>
      </div>

      <Section title="ISO 13485 Clause Reference" icon={<Shield className="h-4 w-4 text-primary" />}>
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-mono">Clause {config.isoClause}</span>
          {config.qmsrClause && config.qmsrClause !== config.isoClause && (
            <span className="ml-2 text-xs text-muted-foreground">
              (21 CFR 820 / QMSR: {config.qmsrClause})
            </span>
          )}
        </div>
      </Section>

      <Section title="How to read this panel" icon={<Info className="h-4 w-4 text-primary" />}>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>
            <strong className="text-foreground">Internal Process</strong> — the SOPs, procedures
            and standing rules that define how this area of the QMS works at your company.
          </li>
          <li>
            <strong className="text-foreground">Workflow Activity</strong> — live items currently
            moving through the process (records, drafts, reviews) at this point in time.
          </li>
          <li>
            <strong className="text-foreground">Status & risk</strong> — derived from the freshness
            of records, pending approvals and any flagged issues for this node.
          </li>
        </ul>
      </Section>

      {defaults && (
        <>
          <Section title="Purpose" icon={<ListChecks className="h-4 w-4 text-primary" />}>
            <p className="text-sm text-muted-foreground">{defaults.purpose}</p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Inputs">
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                {defaults.inputs.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Section>
            <Section title="Outputs">
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                {defaults.outputs.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Section>
          </div>

          <Section title="Typical process steps" icon={<ArrowRight className="h-4 w-4 text-primary" />}>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal pl-5">
              {defaults.steps.map((s) => (
                <li key={s.step}>{s.description}</li>
              ))}
            </ol>
          </Section>
        </>
      )}
    </div>
  );
};

export default FoundationNodeHelp;