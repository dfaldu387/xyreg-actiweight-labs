import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  Lightbulb, 
  Target, 
  Users, 
  Package, 
  Barcode,
  Shield,
  Globe,
  Layers,
  FileText,
  Camera,
  HardDrive,
  GitBranch,
  ClipboardList,
  Activity,
  Stethoscope,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

// Reusable components for help content
const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="font-semibold text-sm flex items-center gap-2">
      {title}
    </h4>
    {children}
  </div>
);

const TipCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-2">
    <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
);

const GenesisBadge: React.FC = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700 whitespace-nowrap">
    ✦ Needed for Genesis
  </span>
);

const InfoCard: React.FC<{ title: string; description: string; icon?: React.ReactNode; showGenesisBadge?: boolean }> = ({ title, description, icon, showGenesisBadge }) => (
  <div className="p-3 bg-muted/50 rounded-lg border">
    <div className="flex items-start gap-2">
      {icon && <div className="text-primary mt-0.5">{icon}</div>}
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h5 className="font-medium text-sm">{title}</h5>
          {showGenesisBadge && <GenesisBadge />}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

const RegulatoryBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
    <AlertTriangle className="h-3 w-3 mr-1" />
    {children}
  </span>
);

const InvestorBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
    <Target className="h-3 w-3 mr-1" />
    {children}
  </span>
);

const WarningCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
);

// ============ OVERVIEW TAB ============
export const DeviceOverviewHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'helpDevice.overview';
  return (
  <div className="space-y-6">
    <p className="text-muted-foreground">{lang(`${k}.description`)}</p>

    <HelpSection title={lang(`${k}.whatYoullSee`)}>
      <div className="space-y-2">
        <InfoCard
          title={lang(`${k}.completionProgress`)}
          description={lang(`${k}.completionProgressDesc`)}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <InfoCard
          title={lang(`${k}.deviceSummaryCard`)}
          description={lang(`${k}.deviceSummaryCardDesc`)}
          icon={<Package className="h-4 w-4" />}
        />
        <InfoCard
          title={lang(`${k}.quickActions`)}
          description={lang(`${k}.quickActionsDesc`)}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ PURPOSE TAB ============
export const DevicePurposeHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      The Purpose tab captures the regulatory-critical information about what your device does and who it serves. This information directly impacts device classification and labeling.
    </p>
    
    <div className="flex gap-2 flex-wrap">
      <RegulatoryBadge>Regulatory Critical</RegulatoryBadge>
      <InvestorBadge>Investor Facing</InvestorBadge>
    </div>

    <HelpSection title="Key Fields">
      <div className="space-y-2">
        <InfoCard 
          title="Intended Use / Intended Purpose"
          description="The official statement of what the device is FOR. This is the single most important regulatory text - it drives device classification, labeling requirements, and clinical evidence needs."
          icon={<Target className="h-4 w-4" />}
          showGenesisBadge
        />
        <InfoCard 
          title="Patient Population"
          description="Who will benefit from the device? Define age ranges, conditions, inclusion/exclusion criteria. Be specific - 'adults with sleep apnea' is better than 'patients'."
          icon={<Users className="h-4 w-4" />}
          showGenesisBadge
        />
        <InfoCard 
          title="Intended Users"
          description="Who will operate the device? Healthcare professionals, trained technicians, patients themselves, or caregivers? This affects training requirements and labeling."
          icon={<Users className="h-4 w-4" />}
        />
        <InfoCard 
          title="Clinical Benefits"
          description="What measurable outcomes does the device improve? Link to clinical evidence. Be specific and evidence-based."
          icon={<Stethoscope className="h-4 w-4" />}
          showGenesisBadge
        />
        <InfoCard 
          title="Duration of Use"
          description="How long is the device used? Single-use, short-term (<30 days), or long-term (>30 days)? This affects classification in many jurisdictions."
          icon={<Activity className="h-4 w-4" />}
        />
        <InfoCard 
          title="Contraindications"
          description="When should the device NOT be used? List conditions, patient populations, or situations where use is unsafe or inappropriate."
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <TipCard>
      The Intended Use statement appears on your device labeling, regulatory submissions, and investor materials. Write it for both regulatory precision AND non-technical clarity.
    </TipCard>
  </div>
);

// ============ GENERAL TAB - DEVICE ID SUB-TAB ============
export const DeviceGeneralDeviceIdHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      The Device ID section captures the core identifiers that uniquely identify your device in regulatory databases and commercial systems.
    </p>

    <HelpSection title="Identifier Fields">
      <div className="space-y-2">
        <InfoCard 
          title="Device Name"
          description="Official regulatory name of the medical device. This appears on all regulatory submissions and must be consistent across markets."
          icon={<Package className="h-4 w-4" />}
          showGenesisBadge
        />
        <InfoCard 
          title="Trade Name"
          description="Commercial/marketing name used for sales and promotion. Can differ from the regulatory device name."
          icon={<Package className="h-4 w-4" />}
        />
        <InfoCard 
          title="UDI-DI (Unique Device Identifier)"
          description="The unique identifier assigned to your device model. Required for EUDAMED registration and FDA submissions."
          icon={<Barcode className="h-4 w-4" />}
        />
        <InfoCard 
          title="Basic UDI-DI"
          description="The family-level identifier that groups related device variants. All variants share the same Basic UDI-DI."
          icon={<Barcode className="h-4 w-4" />}
        />
        <InfoCard 
          title="Device Category"
          description="Classification category (e.g., Active Medical Device, Implantable, IVD) that determines applicable regulations."
          icon={<Layers className="h-4 w-4" />}
        />
        <InfoCard 
          title="Model/Reference Number"
          description="Your internal model or catalog number used for inventory and ordering."
          icon={<FileText className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <TipCard>
      Keep device naming consistent across all regulatory filings. Changes to the Device Name may require updating multiple submissions and databases.
    </TipCard>
  </div>
);

// ============ GENERAL TAB - CLASSIFICATION SUB-TAB ============
export const DeviceGeneralClassificationHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      Device classification is the foundation of your regulatory strategy. It determines the documentation burden, audit requirements, clinical evidence needs, and time-to-market for each geography.
    </p>
    
    <RegulatoryBadge>Regulatory Critical</RegulatoryBadge>

    <HelpSection title="What Classification Means">
      <div className="text-sm text-muted-foreground space-y-2">
        <p>Classification assigns a <strong>risk level</strong> to your device based on factors like invasiveness, duration of use, and whether it affects vital organs. Higher-risk classes face:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>More extensive documentation requirements</li>
          <li>Third-party (Notified Body / FDA) review</li>
          <li>Clinical evidence expectations</li>
          <li>Ongoing surveillance obligations</li>
        </ul>
      </div>
    </HelpSection>

    <HelpSection title="Documentation Consequences">
      <div className="space-y-2">
        <InfoCard 
          title="Class I (Low Risk)"
          description="Self-declaration of conformity. Technical Documentation required, but no Notified Body audit. Lighter clinical evidence (literature-based often sufficient)."
          icon={<FileText className="h-4 w-4" />}
        />
        <InfoCard 
          title="Class IIa / IIb (Medium Risk)"
          description="Notified Body certification required. Full Technical Documentation + Quality Management System (ISO 13485). Clinical evaluation with adequate evidence. Design Dossier review for IIb."
          icon={<FileText className="h-4 w-4" />}
        />
        <InfoCard 
          title="Class III (High Risk)"
          description="Full Notified Body scrutiny including design examination. Extensive clinical data often required (clinical investigations). Annual audits and post-market clinical follow-up (PMCF)."
          icon={<FileText className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <HelpSection title="Audit & Certification Impact">
      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>Class I:</strong> No Notified Body audit required (except Is/Im/Ir special cases). Self-certify with DoC.</p>
        <p><strong>Class IIa:</strong> Notified Body reviews Technical Documentation. QMS certification audit. Surveillance audits every 1-3 years.</p>
        <p><strong>Class IIb/III:</strong> Full design dossier examination. On-site QMS audits. Unannounced audits possible. Annual surveillance mandatory.</p>
      </div>
    </HelpSection>

    <HelpSection title="Market-Specific Classification">
      <div className="space-y-2">
        <InfoCard 
          title="EU MDR (Europe)"
          description="Class I, Is, Im, Ir, IIa, IIb, III. Rules in Annex VIII. Higher classes require Notified Body. EUDAMED registration mandatory."
          icon={<Globe className="h-4 w-4" />}
        />
        <InfoCard 
          title="US FDA"
          description="Class I (exempt/510k), Class II (510k/De Novo), Class III (PMA). Based on product codes and predicate devices. Establishment registration required."
          icon={<Globe className="h-4 w-4" />}
        />
        <InfoCard 
          title="Health Canada"
          description="Class I-IV system. Class I: Establishment License only. Class II-IV: Device License required. Higher classes need more evidence."
          icon={<Globe className="h-4 w-4" />}
        />
        <InfoCard 
          title="TGA Australia"
          description="Class I, Is, Im, IIa, IIb, III, AIMD. Accepts CE/FDA evidence via mutual recognition. ARTG listing required."
          icon={<Globe className="h-4 w-4" />}
        />
        <InfoCard 
          title="UK MHRA"
          description="Post-Brexit UKCA marking. Similar to EU MDR classes. UK Approved Bodies for certification. MHRA registration required."
          icon={<Globe className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <HelpSection title="Classification Factors">
      <div className="text-sm text-muted-foreground space-y-1">
        <p>• <strong>Duration:</strong> Transient (&lt;60 min), Short-term (≤30 days), Long-term (&gt;30 days)</p>
        <p>• <strong>Invasiveness:</strong> Non-invasive → Body orifice → Surgically invasive → Implantable</p>
        <p>• <strong>Body system:</strong> CNS, cardiovascular, and vital organs increase class</p>
        <p>• <strong>Active devices:</strong> Energy delivery, diagnostics, software all have specific rules</p>
        <p>• <strong>Special cases:</strong> Sterile (Is), Measuring (Im), Reusable surgical (Ir)</p>
      </div>
    </HelpSection>

    <WarningCard>
      Incorrect classification can lead to regulatory rejection, product recalls, or legal liability. When in doubt, assume the higher class and consult regulatory experts.
    </WarningCard>

    <TipCard>
      Use the Classification Assistant in each market's regulatory card. It walks you through the decision tree to determine your device class accurately.
    </TipCard>
  </div>
);

// ============ GENERAL TAB - TECHNICAL SPECS SUB-TAB ============
export const DeviceGeneralTechSpecsHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      Define your device's system architecture and key technical characteristics. This determines regulatory requirements and stakeholder questions.
    </p>

    <HelpSection title="System Architecture">
      <div className="space-y-2">
        <InfoCard 
          title="No Software Used (Pure Hardware)"
          description="Device has no software components. Examples: implants, passive instruments, surgical tools. Follow traditional hardware-focused regulatory pathways."
          icon={<Package className="h-4 w-4" />}
          showGenesisBadge
        />
        <InfoCard 
          title="SiMD (Software in a Medical Device)"
          description="Device contains embedded software as a component. Examples: pacemaker firmware, MRI control GUI, infusion pump. Software is validated as part of the hardware system (IEC 62304, IEC 62443)."
          icon={<Activity className="h-4 w-4" />}
          showGenesisBadge
        />
        <InfoCard 
          title="SaMD (Software as a Medical Device)"
          description="Software IS the medical device. Examples: AI diagnostics, dosing calculators, clinical decision support. IT is the gatekeeper - focus on data security (SOC2, HIPAA), platform compatibility, and cybersecurity (IEC 81001-5-1)."
          icon={<Layers className="h-4 w-4" />}
          showGenesisBadge
        />
      </div>
    </HelpSection>

    <HelpSection title="Key Technology Characteristics">
      <div className="space-y-2">
        <InfoCard 
          title="Device Characteristics"
          description="Indicate if your device has measuring function, is reusable, incorporates medicinal substances, contains human/animal material, is custom-made, is single-use, or is an accessory."
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <InfoCard 
          title="Sterility Requirements"
          description="Define if device is non-sterile, delivered sterile, or can be sterilized/re-sterilized by the user."
          icon={<Shield className="h-4 w-4" />}
        />
        <InfoCard 
          title="Power Source"
          description="Battery-powered, mains-powered, or passive (no power). Affects electrical safety testing requirements."
          icon={<Activity className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <TipCard>
      System Architecture selection drives downstream regulatory requirements. SiMD and SaMD devices require additional software lifecycle documentation and cybersecurity considerations.
    </TipCard>
  </div>
);

// ============ GENERAL TAB - DEFINITION SUB-TAB ============
export const DeviceGeneralDefinitionHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      The Definition section captures what your device IS - its physical form, components, and technology. This complements the Purpose tab which describes what the device is FOR.
    </p>
    
    <InvestorBadge>Investor Facing</InvestorBadge>

    <HelpSection title="Key Fields">
      <div className="space-y-2">
        <InfoCard 
          title="Device Description"
          description="Physical form, key components, technology, dimensions. Write for both technical and non-technical audiences - this appears on investor materials."
          icon={<Package className="h-4 w-4" />}
          showGenesisBadge
        />
        <InfoCard 
          title="Key Features"
          description="Differentiating capabilities and technical specifications that set your device apart from competitors."
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <InfoCard 
          title="Device Components"
          description="List of parts, accessories, and consumables included with or required for the device."
          icon={<Layers className="h-4 w-4" />}
        />
        <InfoCard 
          title="Key Technology"
          description="Core technology principles, innovations, and scientific basis for device operation."
          icon={<Activity className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <TipCard>
      Device Description is investor-facing - it appears on your Business Connect page. Write it clearly for non-technical audiences while maintaining technical accuracy.
    </TipCard>
  </div>
);

// ============ GENERAL TAB - MEDIA SUB-TAB ============
export const DeviceGeneralMediaHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      Upload images, diagrams, and videos of your device for regulatory submissions, investor presentations, and internal documentation.
    </p>
    
    <InvestorBadge>Investor Facing</InvestorBadge>

    <HelpSection title="Recommended Media">
      <div className="space-y-2">
        <InfoCard 
          title="Product Photos"
          description="High-resolution images showing the device from multiple angles. Include scale references where helpful."
          icon={<Camera className="h-4 w-4" />}
        />
        <InfoCard 
          title="Technical Diagrams"
          description="Labeled diagrams showing key components, interfaces, and internal architecture."
          icon={<FileText className="h-4 w-4" />}
        />
        <InfoCard 
          title="Usage Images"
          description="Photos or illustrations showing the device in use, proper handling, and application context."
          icon={<Users className="h-4 w-4" />}
        />
        <InfoCard 
          title="Packaging Images"
          description="Photos of primary packaging, labeling, and included accessories."
          icon={<Package className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <TipCard>
      Media uploaded here can appear on your investor presentation. Use professional, high-quality images that clearly communicate your device's value.
    </TipCard>
  </div>
);

// ============ GENERAL TAB - STORAGE SUB-TAB ============
export const DeviceGeneralStorageHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      Manage files and documents related to this specific device, including design files, test reports, and supporting documentation.
    </p>

    <HelpSection title="Document Types">
      <div className="space-y-2">
        <InfoCard 
          title="Design Files"
          description="CAD drawings, specifications, and technical drawings for manufacturing and quality records."
          icon={<FileText className="h-4 w-4" />}
        />
        <InfoCard 
          title="Test Reports"
          description="Verification and validation test results, biocompatibility reports, and performance data."
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <InfoCard 
          title="Labeling"
          description="IFU drafts, label artwork, and packaging specifications."
          icon={<FileText className="h-4 w-4" />}
        />
        <InfoCard 
          title="Supporting Documents"
          description="Literature reviews, clinical data, and reference materials."
          icon={<FileText className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <TipCard>
      Organize files with clear naming conventions. These documents may be referenced in regulatory submissions and audit trails.
    </TipCard>
  </div>
);

// ============ GENERAL TAB - VARIANTS SUB-TAB ============
export const DeviceGeneralVariantsHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      Manage device variants - different configurations, sizes, or versions that share the same Basic UDI-DI family.
    </p>

    <HelpSection title="Variant Management">
      <div className="space-y-2">
        <InfoCard 
          title="What is a Variant?"
          description="A variant is a device configuration that differs in size, color, length, or other characteristics but shares the same intended purpose and core design."
          icon={<GitBranch className="h-4 w-4" />}
        />
        <InfoCard 
          title="Shared Properties"
          description="Variants typically share: intended use, risk classification, design principles, and manufacturing processes."
          icon={<Layers className="h-4 w-4" />}
        />
        <InfoCard 
          title="Unique Properties"
          description="Each variant has its own: UDI-DI, model number, specific dimensions, and potentially different packaging."
          icon={<Barcode className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <HelpSection title="Examples of Variants">
      <div className="text-sm text-muted-foreground space-y-1">
        <p>• Different cable lengths (1m, 2m, 3m)</p>
        <p>• Different sizes (S, M, L, XL)</p>
        <p>• Different colors for patient preference</p>
        <p>• Regional packaging variations</p>
      </div>
    </HelpSection>

    <TipCard>
      All variants in a family should be covered by the same Technical Documentation and CE Certificate if they share the same risk profile.
    </TipCard>
  </div>
);

// ============ MARKETS TAB ============
export const DeviceMarketsHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      Configure target markets for your device. Each market has different regulatory requirements, classification systems, and market authorization pathways.
    </p>

    <HelpSection title="Market Configuration">
      <div className="space-y-2">
        <InfoCard 
          title="Target Markets"
          description="Select which geographic markets you plan to sell your device in. Each selection activates market-specific regulatory tracking."
          icon={<Globe className="h-4 w-4" />}
        />
        <InfoCard 
          title="Market-Specific Classification"
          description="Each market may classify your device differently. EU uses Class I-III, FDA uses Class I-III with different criteria."
          icon={<Shield className="h-4 w-4" />}
        />
        <InfoCard 
          title="Authorization Status"
          description="Track authorization status per market: Planned, In Progress, Authorized, or Not Applicable."
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <HelpSection title="Major Markets">
      <div className="text-sm text-muted-foreground space-y-1">
        <p>• <strong>EU (MDR):</strong> CE marking via self-declaration or Notified Body</p>
        <p>• <strong>USA (FDA):</strong> 510(k), De Novo, or PMA pathway</p>
        <p>• <strong>Canada:</strong> Health Canada MDEL/MDL licensing</p>
        <p>• <strong>Australia:</strong> TGA registration and listing</p>
        <p>• <strong>UK:</strong> UKCA marking post-Brexit</p>
      </div>
    </HelpSection>

    <TipCard>
      Start with your primary market, then expand. Each additional market adds regulatory complexity and cost - prioritize based on commercial strategy.
    </TipCard>
  </div>
);

// ============ BUNDLES TAB ============
export const DeviceBundlesHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      View and manage product bundles that include this device. Bundles group multiple devices or accessories for commercial or regulatory purposes.
    </p>

    <HelpSection title="Bundle Types">
      <div className="space-y-2">
        <InfoCard 
          title="Commercial Bundles"
          description="Grouped products sold together as a kit or system for commercial convenience and pricing strategy."
          icon={<Package className="h-4 w-4" />}
        />
        <InfoCard 
          title="System Bundles"
          description="Devices that function together as a medical device system and may be regulated as a single unit."
          icon={<Layers className="h-4 w-4" />}
        />
        <InfoCard 
          title="Procedure Packs"
          description="Sterile procedure packs combining multiple devices for specific clinical procedures."
          icon={<ClipboardList className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <TipCard>
      Bundles containing devices from different risk classes may need to be classified based on the highest-risk device in the bundle.
    </TipCard>
  </div>
);

// ============ AUDIT LOG TAB ============
export const DeviceAuditLogHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      The Audit Log provides a complete history of changes made to this device record, supporting QMS traceability requirements.
    </p>
    
    <RegulatoryBadge>QMS Required</RegulatoryBadge>

    <HelpSection title="What's Tracked">
      <div className="space-y-2">
        <InfoCard 
          title="Field Changes"
          description="Every modification to device data fields, including the previous and new values."
          icon={<FileText className="h-4 w-4" />}
        />
        <InfoCard 
          title="User Attribution"
          description="Who made each change and when, supporting accountability and traceability."
          icon={<Users className="h-4 w-4" />}
        />
        <InfoCard 
          title="Document Versions"
          description="Upload, update, and deletion of associated documents and files."
          icon={<FileText className="h-4 w-4" />}
        />
        <InfoCard 
          title="Status Changes"
          description="Changes to regulatory status, lifecycle phase, and approval states."
          icon={<Activity className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <TipCard>
      Audit logs are essential for regulatory audits and quality system compliance. They demonstrate change control and traceability per ISO 13485.
    </TipCard>
  </div>
);

// ============ GENERAL TAB (OVERVIEW) ============
export const DeviceGeneralHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      The General tab contains comprehensive device information organized across multiple sub-sections: Device ID, Classification, Technical Specs, Definition, Media, Storage, and Variants.
    </p>

    <HelpSection title="Sub-Sections">
      <div className="space-y-2">
        <InfoCard 
          title="Device ID"
          description="Core identifiers: device name, trade name, UDI-DI, Basic UDI-DI, and model numbers."
          icon={<Barcode className="h-4 w-4" />}
        />
        <InfoCard 
          title="Classification"
          description="Device risk classification per market, EMDN/GMDN codes, and regulatory category."
          icon={<Shield className="h-4 w-4" />}
        />
        <InfoCard 
          title="Technical Specs"
          description="Physical dimensions, performance characteristics, and engineering specifications."
          icon={<Activity className="h-4 w-4" />}
        />
        <InfoCard 
          title="Definition"
          description="Device description, key features, components, and technology - investor-facing content."
          icon={<Package className="h-4 w-4" />}
        />
        <InfoCard 
          title="Media"
          description="Product images, diagrams, and videos for regulatory and commercial use."
          icon={<Camera className="h-4 w-4" />}
        />
        <InfoCard 
          title="Storage"
          description="File management for device-specific documents and supporting materials."
          icon={<HardDrive className="h-4 w-4" />}
        />
        <InfoCard 
          title="Variants"
          description="Manage device variants that share the same Basic UDI-DI family."
          icon={<GitBranch className="h-4 w-4" />}
        />
      </div>
    </HelpSection>

    <TipCard>
      Click on each sub-tab above to see context-specific help for that section.
    </TipCard>
  </div>
);
