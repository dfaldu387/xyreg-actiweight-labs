import React from 'react';
import { ClipboardList, AlertTriangle, Settings, Clock, Shield, CheckCircle2 } from 'lucide-react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="font-semibold text-sm">{title}</h4>
    <div className="text-sm text-muted-foreground space-y-2">{children}</div>
  </div>
);

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
    {label}
  </span>
);

const Lifecycle: React.FC = () => (
  <div className="p-3 bg-muted/40 rounded-lg border text-xs">
    <p className="font-medium mb-2">CCR Lifecycle</p>
    <p className="font-mono">
      Draft → Under Review → Approved → Implemented → Verified → Closed
    </p>
    <p className="text-muted-foreground mt-2">
      A CCR can also be Rejected from Under Review, or returned to Draft. Once Approved or beyond, the impact assessment is locked — substantive changes need a new CCR.
    </p>
  </div>
);

const Standards: React.FC = () => (
  <div className="flex flex-wrap gap-2">
    <Badge label="ISO 13485 §7.3.9" />
    <Badge label="ISO 13485 §4.2.4" />
    <Badge label="ISO 13485 §4.2.5" />
    <Badge label="21 CFR 820.30(i)" />
    <Badge label="21 CFR 820.40" />
  </div>
);

export const CCRDetailDetailsHelp: React.FC = () => (
  <div className="space-y-5">
    <Standards />
    <p className="text-sm text-muted-foreground flex items-start gap-2">
      <ClipboardList className="h-4 w-4 mt-0.5 shrink-0" />
      A Change Control Request (CCR) controls any change to a product, process, document, supplier, software item or label. The Details tab is the cover sheet plus the three approval gates required to move the CCR forward.
    </p>
    <Lifecycle />
    <Section title="Workflow actions (top right of page)">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Draft</strong>: Submit for Review · Delete (drafts only).</li>
        <li><strong>Under Review</strong>: tick the three approval tiles, then Approve CCR. Reject or Return to Draft are also available.</li>
        <li><strong>Approved</strong>: Mark Implemented once the change has been executed.</li>
        <li><strong>Implemented</strong>: Mark Verified once verification evidence is on file.</li>
        <li><strong>Verified</strong>: Close CCR to finalise the record.</li>
      </ul>
    </Section>
    <Section title="Three approval gates">
      <p>Every CCR must be signed off by Technical, Quality and Regulatory before it can be Approved. Click a tile (while in Under Review) to record or revoke your approval. The timestamp is captured for the audit trail.</p>
    </Section>
    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-xs flex gap-2">
      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
      <span>State transitions write an immutable entry to the History tab — including who acted, when, and the reason you provide in the confirmation dialog.</span>
    </div>
  </div>
);

export const CCRDetailImpactHelp: React.FC = () => (
  <div className="space-y-5">
    <Standards />
    <p className="text-sm text-muted-foreground flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      The Impact Assessment quantifies what this change touches before it can be approved. It must be filled in while the CCR is in Draft or Under Review.
    </p>
    <Section title="Fields to capture">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Risk Impact</strong> — None / Low / Medium / High. Drives downstream risk file updates.</li>
        <li><strong>Regulatory Impact</strong> — Yes/No, plus a description of which submissions or notifications are triggered (e.g. notified body change notification, FDA Special 510(k)).</li>
        <li><strong>Cost Impact</strong> — estimated cost in USD.</li>
        <li><strong>Implementation Plan</strong> and <strong>Verification Plan</strong> — required to complete the Implemented and Verified transitions later.</li>
      </ul>
    </Section>
    <Section title="Automated impact analysis">
      <p>If the CCR was created against a baselined object (a requirement, hazard, BOM item, etc.), the impact panel walks the digital thread and lists every downstream item, risk control and baseline that is affected. Use this to scope your verification plan.</p>
    </Section>
    <Section title="When a CCR is required">
      <p className="mb-2">Per ISO 13485 §7.3.9 and 21 CFR 820.30(i), raise a CCR <strong>before</strong> implementing any change that affects:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Design outputs</strong> — drawings, specifications, software builds, labelling or IFU after design inputs are baselined.</li>
        <li><strong>Risk file</strong> — new hazard, hazardous situation, control measure, or change to severity / probability estimates.</li>
        <li><strong>BOM / components</strong> — supplier swap, material change, critical component substitution or revision bump.</li>
        <li><strong>Manufacturing process</strong> — process parameters, equipment, validated software, work instructions or in-process controls.</li>
        <li><strong>Suppliers</strong> — new critical supplier, change of manufacturing site, or change to a supplier's process that affects the device.</li>
        <li><strong>Quality system documents</strong> — SOP, work instruction or form revisions that change a controlled procedure.</li>
        <li><strong>Regulatory status</strong> — anything that may trigger a notified body notification, FDA Special / Traditional 510(k), or update to the technical file.</li>
        <li><strong>Post-market findings</strong> — corrective action from a complaint, CAPA, audit non-conformity, or field safety corrective action.</li>
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Typos, formatting fixes and editorial-only updates to draft (un-baselined) documents do not require a CCR — use normal document revision instead.</p>
    </Section>
    <div className="p-3 bg-muted/40 border rounded-lg text-xs">
      <p>Locked once the CCR reaches <strong>Approved</strong> — this is intentional. Substantive post-approval changes require a new CCR (ISO 13485 §7.3.9).</p>
    </div>
  </div>
);

export const CCRDetailImplementationHelp: React.FC = () => (
  <div className="space-y-5">
    <Standards />
    <p className="text-sm text-muted-foreground flex items-start gap-2">
      <Settings className="h-4 w-4 mt-0.5 shrink-0" />
      The Implementation tab tracks the actual execution of the change against the plan you committed to during impact assessment.
    </p>
    <Section title="What to record here">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Implementation Plan</strong> — the agreed steps to execute the change (set on the Impact tab).</li>
        <li><strong>Implementation Notes</strong> — what actually happened, including any deviations from plan.</li>
        <li><strong>Verification Plan</strong> — how effectiveness will be confirmed.</li>
        <li><strong>Verification Evidence</strong> — links to test reports, signed records, audit results.</li>
      </ul>
    </Section>
    <Section title="Transitions driven from this tab">
      <p>Once the change is executed, use <strong>Mark Implemented</strong> in the header. After verification evidence is on file, use <strong>Mark Verified</strong>, then <strong>Close CCR</strong>.</p>
    </Section>
  </div>
);

export const CCRDetailHistoryHelp: React.FC = () => (
  <div className="space-y-5">
    <Standards />
    <p className="text-sm text-muted-foreground flex items-start gap-2">
      <Clock className="h-4 w-4 mt-0.5 shrink-0" />
      The History tab is the immutable audit trail of every state change on this CCR — required by ISO 13485 §4.2.5 (control of records).
    </p>
    <Section title="What's recorded">
      <ul className="list-disc pl-5 space-y-1">
        <li>From-state and to-state of every transition.</li>
        <li>Who performed the transition (user identity).</li>
        <li>Timestamp (UTC).</li>
        <li>The reason text you entered in the confirmation dialog.</li>
      </ul>
    </Section>
    <div className="p-3 bg-muted/40 border rounded-lg text-xs flex gap-2">
      <Shield className="h-4 w-4 shrink-0 mt-0.5" />
      <span>History entries cannot be edited or deleted from the UI. Even deleting a Draft CCR captures the deletion reason for traceability.</span>
    </div>
  </div>
);

// Generic fallback (used if tab is unknown)
export const CCRDetailHelp = CCRDetailDetailsHelp;