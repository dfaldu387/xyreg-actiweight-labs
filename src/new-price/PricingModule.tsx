import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ContactFormModal from "./ContactFormModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StripeService, STRIPE_PRICES } from "@/services/stripeService";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Shield,
  GraduationCap,
  Barcode,
  Scale,
  Search,
  Brain,
  ShieldAlert,
  Info,
  Check,
  Sparkles,
  FileText,
  Settings,
  ClipboardList,
  AlertTriangle,
  Eye,
  Briefcase,
  TrendingUp,
  Lock,
  Cpu,
  Building2,
  Zap,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  Gift,
  Copy,
  Target,
  Lightbulb,
  Handshake,
  FolderLock,
  Package,
  AlertCircle,
  Layers,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============= PRICING CONFIGURATION =============
// All prices easily configurable here

type Tier = "genesis" | "core" | "enterprise" | "investor";

interface TierData {
  name: string;
  subtitle: string;
  description: string;
  monthlyPrice: number | null;
  priceLabel: string | null;
  includedDevices: number;
  includedAICredits: number;
  extraDeviceCost: number;
  aiBoosterCost: number;
  aiBoosterCredits: number;
  color: string;
  borderColor: string;
  accentColor: string;
  icon: React.ReactNode;
}

interface ModuleData {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  tooltip: string;
  bucket: "builder" | "guardian" | "strategist";
  aiIntensity: "high" | "standard" | "low";
  pack: "base" | "quality-ops" | "clinical-pms" | "specialist"; // Which pack this module belongs to
  price?: number; // Individual a la carte price (undefined = included in Helix OS)
}

// Power Pack definitions
interface PowerPack {
  id: "build" | "ops" | "monitor";
  name: string;
  price: number;
  description: string;
  features: string[];
  color: string;
  accentColor: string;
  borderColor: string;
}

const PRICING = {
  core: {
    base: 499,
    buildPack: 349,           // R&D Layer
    opsPack: 349,             // Quality Layer
    monitorPack: 349,         // Post-Market Layer
    packDiscountPercent: 10,  // 10% discount per pack selected
    // Specialist Modules
    predicateFinder: 99,
    ipPatent: 149,
    xyregCortex: 249,
    extraDevice: 150,
    aiBooster: 50,
    aiBoosterCredits: 1000,
    includedDevices: 1,
  },
  genesis: {
    aiBooster: 49,           // €49 for Genesis AI pack (more expensive than Core)
    aiBoosterCredits: 500,   // 500 credits per Genesis pack
    referralCredits: 150,    // Credits earned per qualified referral
    referralExpiryDays: 60,  // Referral credits expire in 60 days
    maxReferrals: 10,        // Max referrals per user
  },
  enterprise: {
    volumeDeviceDiscount: 50, // Devices 10+ cost €50/mo instead of €150
    volumeThreshold: 10,
  },
  investor: {
    kpiWatchtower: 199,      // per company per month
    dueDiligenceRoom: 99,    // per room per month
  },
  // AI Credit consumption by intensity level
  aiCredits: {
    high: {
      creditsPerAction: 50,
      label: "Full Document Generation",
      examples: ["Risk Analysis (FMEA)", "Requirements Spec", "Clinical Eval Draft", "Patent FTO Analysis"]
    },
    standard: {
      creditsPerAction: 15,
      label: "AI-Assisted Actions",
      examples: ["Label Generation", "IFU Section", "Change Impact Analysis", "Supplier Scoring"]
    },
    low: {
      creditsPerAction: 5,
      label: "Smart Suggestions",
      examples: ["BOM Validation", "Training Quiz", "Template Auto-fill", "Task Recommendations"]
    }
  }
};

// Power Packs configuration
const powerPacks: PowerPack[] = [
  {
    id: "build",
    name: "Build Pack",
    price: PRICING.core.buildPack,
    description: "AI-powered R&D acceleration.",
    features: [
      "AI Requirements & Specs",
      "AI Risk Manager (FMEA)",
      "Software Lifecycle (IEC 62304)",
      "Usability Engineering (IEC 62366)",
      "Labeling & IFU Generator",
      "e-Sign Workflows",
      "BOM & UDI Manager"
    ],
    color: "from-green-500/20 to-green-600/10",
    accentColor: "text-green-400",
    borderColor: "border-green-400",
  },
  {
    id: "ops",
    name: "Ops Pack",
    price: PRICING.core.opsPack,
    description: "Audit defense & supply chain.",
    features: [
      "Supplier Management (ASL)",
      "CAPA & Root Cause Analysis",
      "Non-Conformance (NCR)",
      "Training Tracker (LMS)",
      "Audit Management",
      "Change Control"
    ],
    color: "from-blue-500/20 to-blue-600/10",
    accentColor: "text-blue-400",
    borderColor: "border-blue-400",
  },
  {
    id: "monitor",
    name: "Monitor Pack",
    price: PRICING.core.monitorPack,
    description: "Surveillance & clinical data.",
    features: [
      "PMS & Vigilance Reporting",
      "Clinical Eval Writer (CER)",
      "Complaint Handling",
      "Feedback & Surveys"
    ],
    color: "from-orange-500/20 to-orange-600/10",
    accentColor: "text-orange-400",
    borderColor: "border-orange-400",
  },
];

interface TierDataExtended extends TierData {
  shortDescription: string;
}

const tiers: Record<Tier, TierDataExtended> = {
  genesis: {
    name: "GENESIS",
    subtitle: "The Founder Sandbox",
    description: "Build your business case and prove viability. Share with investors. Get funded.",
    shortDescription: "Get discovered by investors",
    monthlyPrice: 149,
    priceLabel: "€149*",
    includedDevices: 0,
    includedAICredits: 0,
    extraDeviceCost: 0,
    aiBoosterCost: 0,
    aiBoosterCredits: 0,
    color: "from-teal-500/20 to-teal-600/10",
    borderColor: "border-teal-400",
    accentColor: "text-teal-400",
    icon: <Sparkles className="w-5 h-5" />,
  },
  core: {
    name: "HELIX OS",
    subtitle: "Build. Operate. Monitor.",
    description: "Execute your project and get certified. Full design controls & risk management.",
    shortDescription: "Cut documentation time by 50%",
    monthlyPrice: PRICING.core.base,
    priceLabel: null,
    includedDevices: PRICING.core.includedDevices,
    includedAICredits: 0, // Not used in new model
    extraDeviceCost: PRICING.core.extraDevice,
    aiBoosterCost: PRICING.core.aiBooster,
    aiBoosterCredits: PRICING.core.aiBoosterCredits,
    color: "from-cyan-500/20 to-cyan-600/10",
    borderColor: "border-cyan-400",
    accentColor: "text-cyan-400",
    icon: <Cpu className="w-5 h-5" />,
  },
  enterprise: {
    name: "ENTERPRISE",
    subtitle: "The Scale Platform",
    description: "Manage a portfolio of devices. Volume discounts. Custom integrations.",
    shortDescription: "Unify multi-device oversight",
    monthlyPrice: null,
    priceLabel: "Custom",
    includedDevices: 0,
    includedAICredits: 0,
    extraDeviceCost: 0,
    aiBoosterCost: 0,
    aiBoosterCredits: 0,
    color: "from-amber-500/20 to-amber-600/10",
    borderColor: "border-amber-400",
    accentColor: "text-amber-400",
    icon: <Building2 className="w-5 h-5" />,
  },
  investor: {
    name: "INVESTOR",
    subtitle: "For VCs, Angels & Incubators",
    description: "Source vetted startups and sponsor their compliance journey.",
    shortDescription: "+ Portfolio Monitoring Packages",
    monthlyPrice: null,
    priceLabel: "Free Sourcing",
    includedDevices: 0,
    includedAICredits: 0,
    extraDeviceCost: 0,
    aiBoosterCost: 0,
    aiBoosterCredits: 0,
    color: "from-violet-500/20 to-violet-600/10",
    borderColor: "border-violet-400",
    accentColor: "text-violet-400",
    icon: <Handshake className="w-5 h-5" />,
  },
};

// Module Catalog - organized by bucket and pack
const modules: ModuleData[] = [
  // ============= BASE PACK (Build): R&D & Engineering =============
  // ============= BUILD PACK: R&D Acceleration =============
  {
    id: "ai-requirements",
    name: "AI Requirements Engineer",
    icon: <Brain className="w-4 h-4" />,
    description: "Text-to-Spec generation with AI",
    features: ["User Needs Generation", "Requirement Specs", "Traceability Matrix"],
    tooltip: "Leverage AI to generate comprehensive user needs, design requirements, and system specifications with automatic traceability linking.",
    bucket: "builder",
    aiIntensity: "high",
    pack: "base",
    price: 149,
  },
  {
    id: "ai-risk",
    name: "AI Risk Manager",
    icon: <ShieldAlert className="w-4 h-4" />,
    description: "Hazard Analysis & FMEA tables",
    features: ["Hazard Identification", "Risk Estimation", "Mitigation Suggestions"],
    tooltip: "AI-powered risk management compliant with ISO 14971, including automated hazard identification, risk estimation, and mitigation recommendations.",
    bucket: "builder",
    aiIntensity: "high",
    pack: "base",
    price: 149,
  },
  {
    id: "software-lifecycle",
    name: "Software Lifecycle",
    icon: <Cpu className="w-4 h-4" />,
    description: "IEC 62304 for SaMD",
    features: ["Unit Testing", "Bug Tracking", "Software BOM"],
    tooltip: "Complete software development lifecycle management for IEC 62304 compliance.",
    bucket: "builder",
    aiIntensity: "standard",
    pack: "base",
    price: 99,
  },
  {
    id: "usability",
    name: "Usability Engineering",
    icon: <Users className="w-4 h-4" />,
    description: "IEC 62366 protocols",
    features: ["Formative Testing", "Summative Testing", "Use Error Analysis"],
    tooltip: "Human factors engineering and usability testing management for IEC 62366 compliance.",
    bucket: "builder",
    aiIntensity: "standard",
    pack: "base",
    price: 99,
  },
  {
    id: "labeling-ifu",
    name: "Labeling & IFU Gen",
    icon: <ClipboardList className="w-4 h-4" />,
    description: "Draft manuals and labels",
    features: ["Label Generation", "IFU Drafting", "Symbol Library"],
    tooltip: "Generate compliant device labels and Instructions for Use with AI assistance.",
    bucket: "builder",
    aiIntensity: "standard",
    pack: "base",
    price: 99,
  },
  // ============= OPS PACK: Quality Operations =============
  {
    id: "supplier-management",
    name: "Supplier Management",
    icon: <Briefcase className="w-4 h-4" />,
    description: "Audits, scoring, certificates",
    features: ["Vendor Qualification", "Performance Scoring", "Certificate Tracking"],
    tooltip: "Complete supplier management with automated questionnaires, performance monitoring, and audit scheduling.",
    bucket: "guardian",
    aiIntensity: "standard",
    pack: "quality-ops",
    price: 99,
  },
  {
    id: "capa-ncr",
    name: "CAPA & NCR",
    icon: <AlertTriangle className="w-4 h-4" />,
    description: "Root cause workflows",
    features: ["Root Cause Analysis", "CAPA Tracking", "Effectiveness Review"],
    tooltip: "Corrective and preventive action management with structured root cause analysis workflows.",
    bucket: "guardian",
    aiIntensity: "standard",
    pack: "quality-ops",
    price: 99,
  },
  {
    id: "training",
    name: "Training Tracker",
    icon: <GraduationCap className="w-4 h-4" />,
    description: "Employee competency matrix",
    features: ["Training Records", "Quiz Generation", "Competency Tracking"],
    tooltip: "Comprehensive employee training management with competency tracking and certification management.",
    bucket: "guardian",
    aiIntensity: "low",
    pack: "quality-ops",
    price: 99,
  },
  {
    id: "audit-management",
    name: "Audit Management",
    icon: <ClipboardList className="w-4 h-4" />,
    description: "Internal/External audit planning",
    features: ["Audit Scheduling", "Finding Tracking", "Audit Reports"],
    tooltip: "Plan and execute internal and external audits with structured finding management.",
    bucket: "guardian",
    aiIntensity: "low",
    pack: "quality-ops",
    price: 99,
  },
  // ============= MONITOR PACK: Surveillance =============
  {
    id: "pms-vigilance",
    name: "PMS & Vigilance",
    icon: <Eye className="w-4 h-4" />,
    description: "Auto-scan FDA/EUDAMED",
    features: ["Complaint Monitoring", "Adverse Event Tracking", "Database Scanning"],
    tooltip: "Continuous post-market surveillance with automated scanning of regulatory databases for complaints and adverse events.",
    bucket: "guardian",
    aiIntensity: "high",
    pack: "clinical-pms",
    price: 149,
  },
  {
    id: "clinical-eval",
    name: "Clinical Eval Writer",
    icon: <FileText className="w-4 h-4" />,
    description: "Literature review drafting",
    features: ["Literature Search", "CER Drafting", "Clinical Data Analysis"],
    tooltip: "AI-assisted clinical evaluation report writing with automated literature search and evidence synthesis.",
    bucket: "builder",
    aiIntensity: "high",
    pack: "clinical-pms",
    price: 149,
  },
  {
    id: "feedback-complaints",
    name: "Feedback & Complaints",
    icon: <AlertCircle className="w-4 h-4" />,
    description: "Customer complaint handling",
    features: ["Complaint Intake", "Trending Analysis", "Resolution Tracking"],
    tooltip: "Centralized system for tracking customer feedback and complaints with trending analysis.",
    bucket: "guardian",
    aiIntensity: "standard",
    pack: "clinical-pms",
    price: 99,
  },
  // ============= STRATEGIST (Available with all packs) =============
  {
    id: "predicate-finder",
    name: "Predicate Finder",
    icon: <Search className="w-4 h-4" />,
    description: "Competitor 510(k) scraping",
    features: ["FDA Database Search", "Similarity Analysis", "Predicate Reports"],
    tooltip: "AI-powered search through FDA databases to identify suitable predicate devices for 510(k) submissions with similarity scoring.",
    bucket: "strategist",
    aiIntensity: "high",
    pack: "specialist",
  },
  {
    id: "ip-patent",
    name: "IP & Patent Management",
    icon: <Lock className="w-4 h-4" />,
    description: "Freedom to Operate analysis",
    features: ["Patent Portfolio", "Filing Deadlines", "FTO Analysis"],
    tooltip: "Track your patent portfolio, manage filing deadlines, and analyze freedom to operate with AI-powered conflict detection.",
    bucket: "strategist",
    aiIntensity: "high",
    pack: "specialist",
  },
  {
    id: "pricing-reimbursement",
    name: "Pricing & Reimbursement",
    icon: <TrendingUp className="w-4 h-4" />,
    description: "CPT/DRG code analyzer",
    features: ["Code Analysis", "ASP Modeling", "Coverage Decisions"],
    tooltip: "Analyze insurance coverage, CPT/DRG codes, and model average selling prices for your device.",
    bucket: "strategist",
    aiIntensity: "standard",
    pack: "quality-ops",
    price: 99,
  },
  {
    id: "market-access",
    name: "Market Access & Strategy",
    icon: <TrendingUp className="w-4 h-4" />,
    description: "Competitor analysis updates",
    features: ["Market Sizing", "Competitor Tracking", "Strategy Reports"],
    tooltip: "Stay updated on market dynamics with automated competitor analysis and market sizing.",
    bucket: "strategist",
    aiIntensity: "standard",
    pack: "clinical-pms",
    price: 99,
  },
  {
    id: "xyreg-cortex",
    name: "Xyreg Cortex AI",
    icon: <Zap className="w-4 h-4" />,
    description: "Secure RAG document analysis",
    features: ["Document Q&A", "Cross-Reference Analysis", "Regulatory Intelligence", "Context-Aware Generation"],
    tooltip: "Enterprise-grade RAG (Retrieval-Augmented Generation) for secure document analysis. Ask questions across your entire document library with full audit trail.",
    bucket: "strategist",
    aiIntensity: "high",
    pack: "specialist",
    price: 249,
  },
];

// Genesis Features - Full List for Paid Subscribers
const genesisFeatures = [
  // Phase 1: Opportunity & Definition
  { name: "Identify Clinical or User Need", description: "Define unmet clinical need and who is affected", phase: "Opportunity & Definition" },
  { name: "Competitor Analysis", description: "Current solutions and your differentiation", phase: "Opportunity & Definition" },
  { name: "Market Sizing", description: "TAM, SAM, and target market analysis", phase: "Opportunity & Definition" },
  { name: "Define Core Solution Concept", description: "Proposed solution and core technology brief", phase: "Opportunity & Definition" },
  { name: "Profile User", description: "Target patient population and intended operators", phase: "Opportunity & Definition" },
  { name: "Profile Economic Buyer", description: "Market-specific buyer characteristics", phase: "Opportunity & Definition" },
  // Phase 2: Feasibility & Planning
  { name: "Articulate Value Proposition", description: "Measurable benefit with quantified improvements", phase: "Feasibility & Planning" },
  { name: "Regulatory & Compliance Assessment", description: "Device classification and applicable standards", phase: "Feasibility & Planning" },
  { name: "Reimbursement & Market Access", description: "Coding pathway and payer engagement plan", phase: "Feasibility & Planning" },
  { name: "Technical Feasibility & Risk Assessment", description: "Technical challenges and preliminary hazard analysis", phase: "Feasibility & Planning" },
  { name: "Clinical Evidence Strategy", description: "Validation plan, study design, evidence requirements", phase: "Feasibility & Planning" },
  { name: "High-Level Project & Resource Plan", description: "Major phases, budget estimate, team size, timeline", phase: "Feasibility & Planning" },
  { name: "Funding & Use of Proceeds", description: "Capital requirements and fund allocation plan", phase: "Feasibility & Planning" },
  { name: "Team Composition", description: "Key roles, current team, and hiring priorities", phase: "Feasibility & Planning" },
  // Phase 3: Market Readiness
  { name: "Go-to-Market Strategy", description: "Pricing, sales channels, marketing, support plan", phase: "Market Readiness" },
  { name: "Manufacturing & Supply Chain", description: "Supplier selection, production strategy, logistics", phase: "Market Readiness" },
  // Dashboards & Tools
  { name: "Viability Score Dashboard", description: "Investment readiness score calculated from your data", phase: "Tools" },
  { name: "Pitch Builder", description: "Auto-generate shareable investor deck", phase: "Tools" },
];

const genesisRestrictions = [
  "No Technical File Export (DHF/DMR)",
  "No Active Compliance Modules",
  "AI Credits via Purchase or Referrals Only",
];

// Xyreg Core Base Features (always included)
const xyregCoreFeatures = [
  "Genesis Plan (included)",
  "Document Control (DMS)",
  "Design Traceability Matrix",
  "Task Management",
  "Product Management",
  "Unlimited Users"
];

// Props interface for registration flow integration
interface PricingModuleProps {
  isRegistrationFlow?: boolean;
  onPlanSelect?: (plan: {
    tier: string;
    powerPacks: string[];
    monthlyPrice: number;
    isGrowthSuite?: boolean;
    extraDevices?: number;
    aiBoosterPacks?: number;
    selectedModules?: string[];
    specialistModules?: {
      predicateFinder?: boolean;
      ipPatent?: boolean;
    };
    couponCode?: string;
  }) => void;
  initialSelectedPlan?: { tier: string | null; powerPacks: string[]; monthlyPrice: number } | null;
}

const PricingModule = ({ isRegistrationFlow = false, onPlanSelect, initialSelectedPlan }: PricingModuleProps) => {
  const [selectedTier, setSelectedTier] = useState<Tier>((initialSelectedPlan?.tier as Tier) || (isRegistrationFlow ? "genesis" : "core"));
  const [activeDevices, setActiveDevices] = useState(1);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [aiBoosterPacks, setAiBoosterPacks] = useState(0);
  const [genesisAiPack, setGenesisAiPack] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [selectedSponsorshipPackage, setSelectedSponsorshipPackage] = useState<string | null>(null);
  const [kpiWatchtowerEnabled, setKpiWatchtowerEnabled] = useState(false);
  const [dueDiligenceRoomsEnabled, setDueDiligenceRoomsEnabled] = useState(false);
  // Specialist modules state
  const [predicateFinderEnabled, setPredicateFinderEnabled] = useState(false);
  const [ipPatentEnabled, setIpPatentEnabled] = useState(false);
  const [xyregCortexEnabled, setXyregCortexEnabled] = useState(false);
  // Individual module selection state (a la carte)
  const [selectedIndividualModules, setSelectedIndividualModules] = useState<string[]>([]);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Coupon code state (PILOT1000 = flat €1,000/mo)
  const PILOT_COUPON = "PILOT1000";
  const PILOT_PRICE = 1000;
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Enterprise coupon state (DAVID1000 = flat €1,000/mo)
  const ENTERPRISE_COUPON = "DAVID1000";
  const ENTERPRISE_COUPON_PRICE = 1000;
  const [enterpriseCouponCode, setEnterpriseCouponCode] = useState("");
  const [enterpriseCouponApplied, setEnterpriseCouponApplied] = useState(false);
  const [enterpriseCouponError, setEnterpriseCouponError] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const companyId = user?.user_metadata?.lastSelectedCompany || user?.user_metadata?.activeCompany;
  const navigate = useNavigate();

  // State for investor counters
  const [kpiCompanyCount, setKpiCompanyCount] = useState(1);
  const [ddRoomCount, setDdRoomCount] = useState(1);

  // Sponsorship packages for Investor tier with concrete pricing (includes KPI & DD rooms)
  const sponsorshipPackages = [
    { id: "starter", name: "Starter Pack", licenses: "5", description: "5 HELIX OS Licenses", price: "€1,999", period: "/mo", value: 1999, includedKpi: 5, includedDdRooms: 2 },
    { id: "growth", name: "Growth Pack", licenses: "10", description: "10 HELIX OS Licenses", price: "€3,499", period: "/mo", value: 3499, includedKpi: 10, includedDdRooms: 5 },
    { id: "portfolio", name: "Portfolio Pack", licenses: "25+", description: "Custom volume pricing", price: "Custom", period: "", value: 0, includedKpi: -1, includedDdRooms: -1 }, // -1 = unlimited
  ];

  // Tier explanation content
  const tierWhyContent: Record<Tier, { headline: string; forWho: string; problem: string; solution: string; features: { name: string; isFree: boolean }[] }> = {
    genesis: {
      headline: "Validation & Visibility",
      forWho: "Pre-Seed Founders",
      problem: "You have a great idea but no way to validate it or get in front of investors. Building a credible business case from scratch is time-consuming and investors expect structured, data-backed proposals.",
      solution: "Genesis gives you a structured framework to build your MedTech business case. Complete your Venture Blueprint, get an Invest-Ready Viability Score, and share a live pitch link with potential investors.",
      features: [
        { name: "Venture Blueprint Builder", isFree: true },
        { name: "Invest-Ready Viability Score", isFree: true },
        { name: "Live Pitch Link (Shareable)", isFree: true },
        { name: "Competitor & Market Analysis", isFree: true },
        { name: "AI Booster (500 credits for €49)", isFree: false },
        { name: "Earn credits by inviting founders", isFree: true }
      ]
    },
    core: {
      headline: "Execution Engine",
      forWho: "Funded Startups",
      problem: "Regulatory documentation is eating up your runway and slowing your path to market. Your team spends weeks on compliance paperwork instead of building your device.",
      solution: "HELIX OS automates 50%+ of your compliance documentation with AI-driven generation. Go from requirements to ISO 13485 compliant Technical Files in minutes, not months.",
      features: [
        { name: "Full Technical File Export (DHF/DMR)", isFree: true },
        { name: "1 Active Device (ISO 13485 Compliant)", isFree: true },
        { name: "Build Modules (Design, Risk, Requirements)", isFree: true },
        { name: "500 AI Credits / month", isFree: true }
      ]
    },
    enterprise: {
      headline: "Portfolio Command",
      forWho: "Scale-ups & VPs of Regulatory",
      problem: "Managing compliance across multiple devices and teams creates silos, duplicated effort, and audit risk. You need visibility across your entire product portfolio.",
      solution: "Enterprise gives you centralized portfolio oversight with unlimited scale, SSO integration, volume discounts, and dedicated support to keep your multi-device operation running smoothly.",
      features: [
        { name: "All Power Packs Included", isFree: true },
        { name: "5+ Included Devices", isFree: true },
        { name: "Portfolio Dashboard & Analytics", isFree: true },
        { name: "SSO & Priority SLA", isFree: true }
      ]
    },
    investor: {
      headline: "Sourcing & Oversight",
      forWho: "VCs, Angels & Incubators",
      problem: "Finding compliant, investment-ready MedTech startups is like searching for needles in haystacks. Due diligence on regulatory readiness is time-consuming and inconsistent.",
      solution: "Xyreg's Investor Marketplace surfaces pre-vetted founders with standardized viability scores. Sponsor their compliance journey and monitor portfolio health in real-time.",
      features: [
        { name: "Deal Flow Marketplace", isFree: true },
        { name: "Viability Scores", isFree: true },
        { name: "Request Introductions", isFree: true },
        { name: "Portfolio Sponsorships", isFree: false },
        { name: "Due Diligence Data Rooms", isFree: false },
        { name: "Live KPI Watchtower", isFree: false }
      ]
    }
  };

  const tierData = tiers[selectedTier];
  const isGenesis = selectedTier === "genesis";
  const isEnterprise = selectedTier === "enterprise";
  const isCore = selectedTier === "core";
  const isInvestor = selectedTier === "investor";

  // Genesis pricing
  const genesisOneTimeCost = genesisAiPack ? PRICING.genesis.aiBooster : 0;

  // Calculate HELIX OS pricing with stacking discount
  const baseCost = PRICING.core.base;
  const extraDevices = Math.max(0, activeDevices - PRICING.core.includedDevices);
  const devicesCost = extraDevices * PRICING.core.extraDevice;

  // Count how many packs are selected for stacking discount
  const packCount = selectedPacks.length;
  const discountPercent = packCount * PRICING.core.packDiscountPercent; // 10% per pack

  // Check if all 3 packs are selected (for display purposes)
  const allPacksSelected = selectedPacks.includes("build") &&
    selectedPacks.includes("ops") &&
    selectedPacks.includes("monitor");

  // Calculate raw pack costs first
  const rawPacksCost = selectedPacks.reduce((sum, packId) => {
    if (packId === "build") return sum + PRICING.core.buildPack;
    if (packId === "ops") return sum + PRICING.core.opsPack;
    if (packId === "monitor") return sum + PRICING.core.monitorPack;
    return sum;
  }, 0);

  // Apply stacking discount: 10% per pack selected
  const packDiscount = Math.round(rawPacksCost * discountPercent / 100);
  const packsCost = rawPacksCost - packDiscount;

  // Specialist modules cost
  const specialistCost =
    (predicateFinderEnabled ? PRICING.core.predicateFinder : 0) +
    (ipPatentEnabled ? PRICING.core.ipPatent : 0) +
    (xyregCortexEnabled ? PRICING.core.xyregCortex : 0);

  // Check if a pack is active (moved up for use in calculations)
  const isPackActive = (packId: string) => selectedPacks.includes(packId);

  // Individual module cost (a la carte - only for modules NOT covered by selected packs)
  const individualModulesCost = selectedIndividualModules.reduce((sum, moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module || !module.price) return sum;
    // Don't charge if pack already covers this module
    const packMapping: Record<string, string> = {
      "base": "build",
      "quality-ops": "ops",
      "clinical-pms": "monitor"
    };
    const requiredPack = packMapping[module.pack];
    if (requiredPack && isPackActive(requiredPack)) return sum;
    return sum + module.price;
  }, 0);

  const boosterCost = aiBoosterPacks * PRICING.core.aiBooster;

  const monthlyTotal = isCore
    ? baseCost + packsCost + specialistCost + individualModulesCost + devicesCost
    : 0;

  const oneTimeCost = boosterCost;

  // Calculate savings based on stacking discount
  const packSavings = packDiscount;

  // Pack selection toggle
  const togglePack = (packId: string) => {
    setSelectedPacks((prev) =>
      prev.includes(packId)
        ? prev.filter((id) => id !== packId)
        : [...prev, packId]
    );
  };

  // Individual module selection toggle
  const toggleIndividualModule = (moduleId: string) => {
    setSelectedIndividualModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Check if individual module is selected or covered by pack
  const isModuleActive = (module: ModuleData) => {
    const packMapping: Record<string, string> = {
      "base": "build",
      "quality-ops": "ops",
      "clinical-pms": "monitor"
    };
    const requiredPack = packMapping[module.pack];
    if (requiredPack && isPackActive(requiredPack)) return true;
    return selectedIndividualModules.includes(module.id);
  };

  // Get modules by pack
  const buildPackModules = modules.filter(m => m.pack === "base");
  const opsPackModules = modules.filter(m => m.pack === "quality-ops");
  const monitorPackModules = modules.filter(m => m.pack === "clinical-pms");

  const getBucketLabel = (bucket: string) => {
    switch (bucket) {
      case "builder": return "R&D & Engineering";
      case "guardian": return "QA & Regulatory";
      case "strategist": return "Business & IP";
      default: return bucket;
    }
  };

  const getAIIntensityBadge = (intensity: string) => {
    switch (intensity) {
      case "high":
        return <span className="text-[8px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded font-medium">High AI</span>;
      case "standard":
        return <span className="text-[8px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded font-medium">Standard</span>;
      case "low":
        return <span className="text-[8px] bg-slate-500/30 text-slate-300 px-1.5 py-0.5 rounded font-medium">Low AI</span>;
      default:
        return null;
    }
  };

  // Render module card for display (non-interactive)
  const renderModuleDisplay = (module: ModuleData, isActive: boolean, packColor: string) => {
    return (
      <TooltipProvider key={module.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "p-2.5 rounded-lg transition-all border",
                isActive
                  ? `bg-${packColor}-500/10 border-${packColor}-500/30`
                  : "bg-slate-700/30 border-slate-600/30 opacity-60"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {isActive && <Check className={`w-3 h-3 text-${packColor}-400 flex-shrink-0`} />}
                    {!isActive && <Lock className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                    <span className={isActive ? `text-${packColor}-400` : "text-slate-400"}>
                      {module.icon}
                    </span>
                    <p className={cn(
                      "font-semibold text-xs",
                      isActive ? "text-white" : "text-slate-400"
                    )}>
                      {module.name}
                    </p>
                    {getAIIntensityBadge(module.aiIntensity)}
                  </div>
                  <p className={cn(
                    "text-[10px] mb-1.5",
                    isActive ? "text-slate-200" : "text-slate-500"
                  )}>{module.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {module.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-medium",
                          isActive
                            ? `bg-${packColor}-500/20 text-${packColor}-200`
                            : "bg-slate-700 text-slate-500"
                        )}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs z-50">
            <p className="text-sm">{module.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <section id="pricing" className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16 sm:py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Stage-Based Pricing
          </h2>
          <p className="text-slate-300 max-w-3xl mx-auto text-lg">
            Pay for your stage, not per seat. <span className="text-cyan-400 font-semibold">Unlimited users</span> on all plans.
          </p>
        </div>

        {/* 4-Column Layout */}
        <div className="grid lg:grid-cols-4 gap-4 lg:gap-6 items-stretch">

          {/* COLUMN 1 - Tier Selection */}
          <div className="space-y-3 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Choose Your Plan
              </h3>
            </div>

            {(["genesis", "core", "enterprise"] as Tier[]).map((tierKey) => {
              const tier = tiers[tierKey];
              const isSelected = selectedTier === tierKey;

              return (
                <Card
                  key={tierKey}
                  onClick={() => {
                    // Always return to overview when clicking a stage card
                    setShowPlanDetails(false);

                    // Only reset selections if switching to a different stage
                    if (tierKey !== selectedTier) {
                      setSelectedTier(tierKey);
                      setSelectedPacks([]);
                      setPredicateFinderEnabled(false);
                      setIpPatentEnabled(false);
                      setActiveDevices(tierKey === "core" ? 1 : 0);
                      setAiBoosterPacks(0);
                      setGenesisAiPack(false);
                    }
                  }}
                  className={cn(
                    "relative cursor-pointer transition-all duration-300 p-4 border-2 bg-slate-950/90 hover:bg-slate-950 backdrop-blur-sm",
                    isSelected
                      ? `${tier.borderColor} shadow-lg shadow-black/30`
                      : "border-slate-700/60"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                          tier.color
                        )}>
                          <span className={tier.accentColor}>{tier.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">
                            {tier.name}
                          </h4>
                          <p className="text-[10px] text-slate-300">{tier.subtitle}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={cn("text-xl font-bold", tier.accentColor)}>
                        {tier.priceLabel || `€${tier.monthlyPrice?.toLocaleString()}`}
                      </span>
                      {tier.monthlyPrice !== null && tier.monthlyPrice > 0 && (
                        <span className="text-slate-100 text-xs">/mo</span>
                      )}
                    </div>
                  </div>

                  {/* Short description */}
                  <div className="pt-2 border-t border-slate-500/50">
                    <p className="text-[10px] text-slate-300">{tier.shortDescription}</p>
                    {tierKey === "genesis" && (
                      <p className="text-[9px] text-teal-400/70 mt-1">Free forever for first 500 signups</p>
                    )}
                    {tierKey === "core" && (
                      <p className="text-[9px] text-cyan-400/70 mt-1">Looking for pilot customers</p>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className={cn("absolute top-2 right-2 w-2 h-2 rounded-full",
                      tierKey === "genesis" ? "bg-teal-400" :
                        tierKey === "core" ? "bg-cyan-400" :
                          tierKey === "enterprise" ? "bg-amber-400" :
                            "bg-violet-400"
                    )} />
                  )}
                </Card>
              );
            })}

            {/* Divider between Startup and Investor tiers */}
            <div className="py-1">
              <div className="h-px bg-slate-600/50" />
            </div>

            {/* Investor tier card */}
            {(() => {
              const tierKey = "investor" as Tier;
              const tier = tiers[tierKey];
              const isSelected = selectedTier === tierKey;

              return (
                <Card
                  key={tierKey}
                  onClick={() => {
                    setShowPlanDetails(false);
                    if (tierKey !== selectedTier) {
                      setSelectedTier(tierKey);
                      setSelectedPacks([]);
                      setPredicateFinderEnabled(false);
                      setIpPatentEnabled(false);
                      setActiveDevices(0);
                      setAiBoosterPacks(0);
                      setGenesisAiPack(false);
                    }
                  }}
                  className={cn(
                    "relative cursor-pointer transition-all duration-300 p-4 border-2 bg-slate-950/90 hover:bg-slate-950 backdrop-blur-sm",
                    isSelected
                      ? `${tier.borderColor} shadow-lg shadow-black/30`
                      : "border-slate-700/60"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                          tier.color
                        )}>
                          <span className={tier.accentColor}>{tier.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">
                            {tier.name}
                          </h4>
                          <p className="text-[10px] text-slate-300">{tier.subtitle}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={cn("text-xl font-bold", tier.accentColor)}>
                        {tier.priceLabel || `€${tier.monthlyPrice?.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-500/50">
                    <p className="text-[10px] text-slate-300">{tier.shortDescription}</p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-400" />
                  )}
                </Card>
              );
            })()}

            {/* Unlimited Users - At the bottom of Column 1 */}
            <div className="mt-auto pt-3">
              <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-300 font-medium">Unlimited Users on All Plans</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNS 2-4 - Dynamic Content Based on Selection */}
          {!showPlanDetails ? (
            /* ========== WHY THIS PLAN VIEW ========== */
            <div className="lg:col-span-3 animate-fade-in">
              <Card className="bg-slate-800/90 border-slate-600/60 backdrop-blur-sm p-6 shadow-sm h-full flex flex-col">
                {/* Header with badge */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                    tierData.color
                  )}>
                    <span className={tierData.accentColor}>{tierData.icon}</span>
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-bold", tierData.accentColor)}>
                      {tierWhyContent[selectedTier].headline}
                    </h3>
                    <p className="text-xs text-slate-300">
                      For {tierWhyContent[selectedTier].forWho}
                    </p>
                  </div>
                </div>

                {/* Problem / Solution */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-xs font-semibold text-red-400 mb-2">The Problem</p>
                    <p className="text-sm text-slate-200">{tierWhyContent[selectedTier].problem}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <p className="text-xs font-semibold text-emerald-400 mb-2">The Solution</p>
                    <p className="text-sm text-slate-200">{tierWhyContent[selectedTier].solution}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white mb-3">Key Features:</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {tierWhyContent[selectedTier].features.map((feature, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg text-sm",
                          feature.isFree
                            ? "bg-slate-700/50"
                            : "bg-purple-500/10 border border-purple-500/30"
                        )}
                      >
                        {feature.isFree ? (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        )}
                        <span className={feature.isFree ? "text-slate-100" : "text-purple-200"}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => setShowPlanDetails(true)}
                  className={cn(
                    "w-full font-semibold py-5 text-sm shadow-lg mt-6",
                    selectedTier === "genesis"
                      ? "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-teal-500/20"
                      : selectedTier === "enterprise"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20"
                        : selectedTier === "investor"
                          ? "bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-violet-500/20"
                          : "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-cyan-500/20"
                  )}
                >
                  See Plan Details <ChevronRight className="w-4 h-4 ml-1 inline" />
                </Button>
              </Card>
            </div>
          ) : (
            /* ========== PLAN DETAILS VIEW (Configuration, Modules, Investment) ========== */
            <div className="lg:col-span-3 grid lg:grid-cols-3 gap-4 lg:gap-6 items-stretch animate-fade-in">
              {/* COLUMN 2 - Configuration */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    {isGenesis ? "Investment Readiness" : isEnterprise ? "Enterprise Features" : isInvestor ? "Sponsorship Packages" : "Configuration"}
                  </h3>
                </div>

                <Card className="bg-slate-800/90 border-slate-600/60 backdrop-blur-sm p-4 shadow-sm">
                  {/* Genesis Content */}
                  {isGenesis && (
                    <div className="space-y-4">
                      {/* Included Free Section */}
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-medium mb-2">Included Free</p>
                        <p className="text-[10px] text-slate-400 mb-3">Venture Blueprint (Starter) — Core ideation & feasibility tools</p>
                        <ScrollArea className="h-56 pr-2">
                          <div className="space-y-4">
                            {/* Group by phase */}
                            {["Opportunity & Definition", "Feasibility & Planning", "Market Readiness", "Tools"].map((phase) => {
                              const phaseFeatures = genesisFeatures.filter(f => f.phase === phase);
                              if (phaseFeatures.length === 0) return null;
                              return (
                                <div key={phase}>
                                  <p className="text-[10px] font-semibold text-teal-400 uppercase tracking-wide mb-2">{phase}</p>
                                  <div className="space-y-1.5">
                                    {phaseFeatures.map((feature, idx) => (
                                      <div key={idx} className="flex items-start gap-2">
                                        <Check className="w-3 h-3 text-teal-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-[11px] text-white font-medium">{feature.name}</p>
                                          <p className="text-[9px] text-slate-400">{feature.description}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Optional Add-on Section */}
                      <div>
                        <p className="text-[10px] text-purple-300 uppercase tracking-wider font-medium mb-2">Optional Add-on</p>
                        <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/40">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              id="genesis-ai-pack"
                              checked={genesisAiPack}
                              onCheckedChange={(checked) => setGenesisAiPack(checked === true)}
                              className="mt-0.5 border-purple-400 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                            />
                            <div className="flex-1">
                              <label htmlFor="genesis-ai-pack" className="text-xs font-semibold text-purple-300 cursor-pointer">
                                AI Booster Pack (+€{PRICING.genesis.aiBooster})
                              </label>
                              <p className="text-[10px] text-purple-200 mt-0.5">
                                {PRICING.genesis.aiBoosterCredits} AI credits for document generation
                              </p>
                              <p className="text-[9px] text-purple-300/70 mt-0.5">
                                Credits expire 60 days after purchase
                              </p>
                              <p className="text-[9px] text-purple-300/60 mt-1.5 italic">
                                <Gift className="w-3 h-3 inline mr-1" />
                                No budget? Invite founders → earn 150 credits each
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Restrictions */}
                      <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/40">
                        <p className="text-[10px] font-semibold text-amber-300 mb-2">Restrictions:</p>
                        {genesisRestrictions.map((restriction, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[10px] text-amber-200">
                            <Lock className="w-3 h-3" />
                            <span>{restriction}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/40">
                        <p className="text-[10px] text-cyan-300">
                          <Zap className="w-3 h-3 inline mr-1" />
                          Ready to build? Unlock the <span className="font-semibold">complete Venture Blueprint</span> in HELIX OS.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* HELIX OS Configuration */}
                  {isCore && (
                    <div className="space-y-4">
                      {/* Xyreg Core - Always Included */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <p className="text-xs font-semibold text-white">Xyreg Core</p>
                          <span className="text-[10px] text-cyan-400 font-medium">€499/mo</span>
                        </div>
                        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                          <p className="text-[9px] text-cyan-300 mb-2">The compliant digital backbone.</p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {xyregCoreFeatures.map((item) => (
                              <div key={item} className="flex items-center gap-1.5 text-[10px]">
                                <Check className="w-3 h-3 text-cyan-400" />
                                <span className="text-slate-100">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Add-on Packs */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <p className="text-xs font-semibold text-white">Add-on Packs</p>
                        </div>

                        {/* Build Pack */}
                        <div
                          onClick={() => togglePack("build")}
                          className={cn(
                            "p-3 rounded-lg mb-2 cursor-pointer transition-all border",
                            isPackActive("build")
                              ? "bg-green-500/20 border-green-400/60"
                              : "bg-slate-700/40 border-slate-600/40 hover:border-green-400/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isPackActive("build")}
                                className="border-green-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                              />
                              <div>
                                <p className="text-xs text-white font-medium">Build Pack</p>
                                <p className="text-[9px] text-slate-300">AI-powered R&D acceleration.</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-400">+€{PRICING.core.buildPack}/mo</p>
                            </div>
                          </div>
                        </div>

                        {/* Ops Pack */}
                        <div
                          onClick={() => togglePack("ops")}
                          className={cn(
                            "p-3 rounded-lg mb-2 cursor-pointer transition-all border",
                            isPackActive("ops")
                              ? "bg-blue-500/20 border-blue-400/60"
                              : "bg-slate-700/40 border-slate-600/40 hover:border-blue-400/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isPackActive("ops")}
                                className="border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                              <div>
                                <p className="text-xs text-white font-medium">Ops Pack</p>
                                <p className="text-[9px] text-slate-300">Audit defense & supply chain.</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-blue-400">+€{PRICING.core.opsPack}/mo</p>
                            </div>
                          </div>
                        </div>

                        {/* Monitor Pack */}
                        <div
                          onClick={() => togglePack("monitor")}
                          className={cn(
                            "p-3 rounded-lg mb-3 cursor-pointer transition-all border",
                            isPackActive("monitor")
                              ? "bg-orange-500/20 border-orange-400/60"
                              : "bg-slate-700/40 border-slate-600/40 hover:border-orange-400/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isPackActive("monitor")}
                                className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                              />
                              <div>
                                <p className="text-xs text-white font-medium">Monitor Pack</p>
                                <p className="text-[9px] text-slate-300">Surveillance & clinical data.</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-orange-400">+€{PRICING.core.monitorPack}/mo</p>
                            </div>
                          </div>
                        </div>

                        {/* Stacking Discount Banner */}
                        {selectedPacks.length > 0 && (
                          <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 border border-emerald-400/60">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <div>
                                  <p className="text-xs text-white font-medium">Stacking Discount</p>
                                  <p className="text-[9px] text-emerald-300">{selectedPacks.length} {selectedPacks.length > 1 ? 'packs' : 'pack'} → {selectedPacks.length * PRICING.core.packDiscountPercent}% off</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-emerald-400">-€{packDiscount}/mo</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Specialist Modules */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-purple-400" />
                          <p className="text-xs font-semibold text-white">Specialist Modules</p>
                        </div>

                        {/* Predicate Finder */}
                        <div
                          onClick={() => setPredicateFinderEnabled(!predicateFinderEnabled)}
                          className={cn(
                            "p-3 rounded-lg mb-2 cursor-pointer transition-all border",
                            predicateFinderEnabled
                              ? "bg-purple-500/20 border-purple-400/60"
                              : "bg-slate-700/40 border-slate-600/40 hover:border-purple-400/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={predicateFinderEnabled}
                                className="border-purple-400 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                              />
                              <div>
                                <p className="text-xs text-white font-medium">Predicate Finder (AI Scraper)</p>
                                <p className="text-[9px] text-slate-300">FDA 510(k) database search</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-purple-400">€{PRICING.core.predicateFinder}/mo</p>
                            </div>
                          </div>
                        </div>

                        {/* IP & Patent FTO */}
                        <div
                          onClick={() => setIpPatentEnabled(!ipPatentEnabled)}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all border",
                            ipPatentEnabled
                              ? "bg-purple-500/20 border-purple-400/60"
                              : "bg-slate-700/40 border-slate-600/40 hover:border-purple-400/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={ipPatentEnabled}
                                className="border-purple-400 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                              />
                              <div>
                                <p className="text-xs text-white font-medium">IP & Patent Freedom to Operate</p>
                                <p className="text-[9px] text-slate-300">FTO analysis & patent tracking</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-purple-400">€{PRICING.core.ipPatent}/mo</p>
                            </div>
                          </div>
                        </div>

                        {/* Xyreg Cortex (AI) */}
                        <div
                          onClick={() => setXyregCortexEnabled(!xyregCortexEnabled)}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all border",
                            xyregCortexEnabled
                              ? "bg-purple-500/20 border-purple-400/60"
                              : "bg-slate-700/40 border-slate-600/40 hover:border-purple-400/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={xyregCortexEnabled}
                                className="border-purple-400 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                              />
                              <div>
                                <p className="text-xs text-white font-medium flex items-center gap-1.5">
                                  Xyreg Cortex AI
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300 font-semibold">High AI</span>
                                </p>
                                <p className="text-[9px] text-slate-300">Secure RAG document analysis</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-purple-400">€{PRICING.core.xyregCortex}/mo</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Device Counter */}
                      <div className="p-3 rounded-lg bg-slate-700/60 border border-slate-500/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-xs text-white">Active Devices</p>
                            <p className="text-[10px] text-slate-300">1 included, +€{PRICING.core.extraDevice}/extra</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveDevices(Math.max(1, activeDevices - 1)); }}
                              className="w-6 h-6 rounded bg-slate-600 text-white text-sm hover:bg-slate-500 flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold text-white w-6 text-center">{activeDevices}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveDevices(activeDevices + 1); }}
                              className="w-6 h-6 rounded bg-slate-600 text-white text-sm hover:bg-slate-500 flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enterprise Content */}
                  {isEnterprise && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-white mb-3">Enterprise-Grade Features:</p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-white font-medium">All Power Packs Included</p>
                              <p className="text-[10px] text-slate-300">Build + Quality Ops + Clinical & PMS</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-white font-medium">Volume Discounts</p>
                              <p className="text-[10px] text-slate-300">Devices 10+ at €{PRICING.enterprise.volumeDeviceDiscount}/mo</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-white font-medium">SSO & Custom Integrations</p>
                              <p className="text-[10px] text-slate-300">Enterprise security & APIs</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-white font-medium">Dedicated Support</p>
                              <p className="text-[10px] text-slate-300">Named account manager</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-center">
                        <p className="text-sm font-semibold text-amber-300">Contact us for custom pricing</p>
                        <p className="text-[10px] text-amber-200">Based on device count and requirements</p>
                      </div>
                    </div>
                  )}

                  {/* Investor Content */}
                  {isInvestor && (
                    <div className="space-y-4">
                      {/* Free Access Section */}
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-medium mb-2">Free Access</p>
                        <div className="space-y-1.5">
                          {[
                            { name: "Deal Flow Marketplace", description: "Browse vetted startups" },
                            { name: "Viability Scores", description: "Investment-ready metrics" },
                            { name: "Request Introductions", description: "Connect with founders" }
                          ].map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[11px] text-white font-medium">{feature.name}</p>
                                <p className="text-[9px] text-slate-400">{feature.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sponsorship Packages */}
                      <div>
                        <p className="text-[10px] text-violet-300 uppercase tracking-wider font-medium mb-2">Sponsorship Packages</p>
                        <p className="text-[9px] text-slate-400 mb-2">Fund HELIX OS licenses for startups in your portfolio</p>
                        <div className="space-y-2">
                          {sponsorshipPackages.map((pkg) => (
                            <div
                              key={pkg.id}
                              onClick={() => setSelectedSponsorshipPackage(selectedSponsorshipPackage === pkg.id ? null : pkg.id)}
                              className={cn(
                                "p-3 rounded-lg cursor-pointer transition-all border",
                                selectedSponsorshipPackage === pkg.id
                                  ? "bg-violet-500/20 border-violet-400"
                                  : "bg-slate-700/40 border-slate-600/40 hover:border-violet-400/40"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={selectedSponsorshipPackage === pkg.id}
                                    className="border-violet-400 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                                  />
                                  <div>
                                    <p className="text-xs text-white font-medium">{pkg.name}</p>
                                    <p className="text-[9px] text-slate-300">{pkg.description}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-violet-400">{pkg.price}{pkg.period}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Standalone Add-ons */}
                      <div>
                        <p className="text-[10px] text-violet-300 uppercase tracking-wider font-medium mb-2">Standalone Add-ons</p>

                        {/* KPI Watchtower */}
                        <div
                          onClick={() => setKpiWatchtowerEnabled(!kpiWatchtowerEnabled)}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all border mb-2",
                            kpiWatchtowerEnabled
                              ? "bg-violet-500/20 border-violet-400"
                              : "bg-slate-700/40 border-slate-600/40 hover:border-violet-400/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={kpiWatchtowerEnabled}
                                className="border-violet-400 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                              />
                              <div>
                                <p className="text-xs text-white font-medium">Live KPI Watchtower</p>
                                <p className="text-[9px] text-slate-300">Real-time portfolio metrics</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-violet-400">€{PRICING.investor.kpiWatchtower}/co/mo</p>
                          </div>
                          {kpiWatchtowerEnabled && !selectedSponsorshipPackage && (
                            <div className="mt-2 pt-2 border-t border-slate-600/50 flex items-center justify-between">
                              <span className="text-[10px] text-slate-300">Number of companies</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setKpiCompanyCount(Math.max(1, kpiCompanyCount - 1)); }}
                                  className="w-5 h-5 rounded bg-slate-600 hover:bg-slate-500 flex items-center justify-center"
                                >
                                  <Minus className="w-3 h-3 text-white" />
                                </button>
                                <span className="text-white font-mono text-sm w-6 text-center">{kpiCompanyCount}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setKpiCompanyCount(kpiCompanyCount + 1); }}
                                  className="w-5 h-5 rounded bg-slate-600 hover:bg-slate-500 flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Due Diligence Rooms */}
                        <div
                          onClick={() => setDueDiligenceRoomsEnabled(!dueDiligenceRoomsEnabled)}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all border",
                            dueDiligenceRoomsEnabled
                              ? "bg-violet-500/20 border-violet-400"
                              : "bg-slate-700/40 border-slate-600/40 hover:border-violet-400/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={dueDiligenceRoomsEnabled}
                                className="border-violet-400 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                              />
                              <div>
                                <p className="text-xs text-white font-medium">Due Diligence Data Rooms</p>
                                <p className="text-[9px] text-slate-300">Secure document sharing</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-violet-400">€{PRICING.investor.dueDiligenceRoom}/room/mo</p>
                          </div>
                          {dueDiligenceRoomsEnabled && !selectedSponsorshipPackage && (
                            <div className="mt-2 pt-2 border-t border-slate-600/50 flex items-center justify-between">
                              <span className="text-[10px] text-slate-300">Number of rooms</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDdRoomCount(Math.max(1, ddRoomCount - 1)); }}
                                  className="w-5 h-5 rounded bg-slate-600 hover:bg-slate-500 flex items-center justify-center"
                                >
                                  <Minus className="w-3 h-3 text-white" />
                                </button>
                                <span className="text-white font-mono text-sm w-6 text-center">{ddRoomCount}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDdRoomCount(ddRoomCount + 1); }}
                                  className="w-5 h-5 rounded bg-slate-600 hover:bg-slate-500 flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* COLUMN 3 - Module Catalog / Pack Contents */}
              <div className="flex flex-col">
                <Card className="bg-slate-800/90 border-slate-600/60 backdrop-blur-sm p-0 shadow-sm overflow-hidden flex-1 flex flex-col">
                  {/* Fixed title header */}
                  <div className="flex items-center justify-between gap-2 p-3 border-b border-slate-600/50 bg-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        {isCore ? "Lifecycle Modules" : "Module Catalog"}
                      </h3>
                    </div>
                  </div>

                  {isGenesis || isEnterprise ? (
                    <div className="p-4">
                      <div className="p-4 rounded-lg bg-slate-700/40 border border-slate-600/40 text-center">
                        <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-300 font-medium">
                          {isGenesis ? "Modules require HELIX OS" : "All modules included"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isGenesis
                            ? "Upgrade to HELIX OS to unlock the module catalog"
                            : "Enterprise includes all Power Packs"
                          }
                        </p>
                      </div>
                    </div>
                  ) : isInvestor ? (
                    /* Investor Module View */
                    (selectedSponsorshipPackage || kpiWatchtowerEnabled) ? (
                      <div className="p-3">
                        <div className="px-3 py-2 mb-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                          <p className="text-[10px] text-violet-300 font-medium">
                            <Handshake className="w-3 h-3 inline mr-1" />
                            Modules Included for Sponsored Startups
                          </p>
                        </div>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {modules.map((module) => (
                              <div key={module.id} className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                <div className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-violet-400 flex-shrink-0" />
                                  <span className="text-violet-300">{module.icon}</span>
                                  <p className="text-xs text-white font-medium">{module.name}</p>
                                  {getAIIntensityBadge(module.aiIntensity)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="p-4 flex-1 flex items-center justify-center">
                        <div className="p-4 rounded-lg bg-slate-700/40 border border-slate-600/40 text-center">
                          <Package className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-300 font-medium">
                            Select a Sponsorship Package
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Choose a package to see modules included
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    /* HELIX OS - Pack-based module display */
                    <Tabs defaultValue="build" className="w-full flex-1 flex flex-col">
                      <TabsList className="w-full bg-slate-900/50 rounded-none border-b border-slate-600/50 h-auto p-0">
                        <TabsTrigger
                          value="build"
                          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-green-400 data-[state=active]:bg-transparent data-[state=active]:text-white text-white/70 text-[10px] py-2"
                        >
                          Build (+€349)
                        </TabsTrigger>
                        <TabsTrigger
                          value="operate"
                          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-400 data-[state=active]:bg-transparent data-[state=active]:text-white text-white/70 text-[10px] py-2"
                        >
                          Operate (+€349)
                        </TabsTrigger>
                        <TabsTrigger
                          value="monitor"
                          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-400 data-[state=active]:bg-transparent data-[state=active]:text-white text-white/70 text-[10px] py-2"
                        >
                          Monitor (+€249)
                        </TabsTrigger>
                      </TabsList>

                      <ScrollArea className="flex-1 min-h-[280px]">
                        {/* Build Pack */}
                        <TabsContent value="build" className="p-2 m-0 space-y-2">
                          <div className={cn(
                            "px-2 py-1.5 border rounded mb-2",
                            isPackActive("build")
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-slate-700/40 border-slate-600/30"
                          )}>
                            <p className={cn(
                              "text-[10px] font-medium",
                              isPackActive("build") ? "text-green-300" : "text-slate-400"
                            )}>
                              {isPackActive("build")
                                ? <><Check className="w-3 h-3 inline mr-1" />Build Pack Active - All modules included</>
                                : <>Select pack or buy modules individually</>
                              }
                            </p>
                          </div>
                          {buildPackModules.map((module) => {
                            const isActive = isModuleActive(module);
                            const isFromPack = isPackActive("build");
                            const isIndividual = selectedIndividualModules.includes(module.id);
                            return (
                              <div
                                key={module.id}
                                onClick={() => !isFromPack && module.price && toggleIndividualModule(module.id)}
                                className={cn(
                                  "p-2.5 rounded-lg border transition-all",
                                  isActive
                                    ? "bg-green-500/10 border-green-500/30"
                                    : "bg-slate-700/30 border-slate-600/30 hover:border-green-400/40 cursor-pointer"
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  {isActive
                                    ? <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                                    : <Checkbox
                                      checked={isIndividual}
                                      className="border-slate-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 mt-0.5"
                                    />
                                  }
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={isActive ? "text-green-400" : "text-slate-400"}>
                                          {module.icon}
                                        </span>
                                        <p className={cn(
                                          "text-xs font-medium",
                                          isActive ? "text-white" : "text-slate-400"
                                        )}>{module.name}</p>
                                        {getAIIntensityBadge(module.aiIntensity)}
                                      </div>
                                      {module.price && !isFromPack && (
                                        <span className={cn(
                                          "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                                          isIndividual
                                            ? "bg-green-500/30 text-green-300"
                                            : "bg-slate-600/50 text-slate-300"
                                        )}>
                                          €{module.price}/mo
                                        </span>
                                      )}
                                      {isFromPack && (
                                        <span className="text-[9px] text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded">
                                          Included
                                        </span>
                                      )}
                                    </div>
                                    <p className={cn(
                                      "text-[10px] mt-1",
                                      isActive ? "text-slate-200" : "text-slate-500"
                                    )}>{module.description}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </TabsContent>

                        {/* Operate (Ops Pack) */}
                        <TabsContent value="operate" className="p-2 m-0 space-y-2">
                          <div className={cn(
                            "px-2 py-1.5 border rounded mb-2",
                            isPackActive("ops")
                              ? "bg-blue-500/10 border-blue-500/30"
                              : "bg-slate-700/40 border-slate-600/30"
                          )}>
                            <p className={cn(
                              "text-[10px] font-medium",
                              isPackActive("ops") ? "text-blue-300" : "text-slate-400"
                            )}>
                              {isPackActive("ops")
                                ? <><Check className="w-3 h-3 inline mr-1" />Ops Pack Active - All modules included</>
                                : <>Select pack or buy modules individually</>
                              }
                            </p>
                          </div>
                          {opsPackModules.map((module) => {
                            const isActive = isModuleActive(module);
                            const isFromPack = isPackActive("ops");
                            const isIndividual = selectedIndividualModules.includes(module.id);
                            return (
                              <div
                                key={module.id}
                                onClick={() => !isFromPack && module.price && toggleIndividualModule(module.id)}
                                className={cn(
                                  "p-2.5 rounded-lg border transition-all",
                                  isActive
                                    ? "bg-blue-500/10 border-blue-500/30"
                                    : "bg-slate-700/30 border-slate-600/30 hover:border-blue-400/40 cursor-pointer"
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  {isActive
                                    ? <Check className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                                    : <Checkbox
                                      checked={isIndividual}
                                      className="border-slate-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 mt-0.5"
                                    />
                                  }
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={isActive ? "text-blue-400" : "text-slate-400"}>
                                          {module.icon}
                                        </span>
                                        <p className={cn(
                                          "text-xs font-medium",
                                          isActive ? "text-white" : "text-slate-400"
                                        )}>{module.name}</p>
                                        {getAIIntensityBadge(module.aiIntensity)}
                                      </div>
                                      {module.price && !isFromPack && (
                                        <span className={cn(
                                          "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                                          isIndividual
                                            ? "bg-blue-500/30 text-blue-300"
                                            : "bg-slate-600/50 text-slate-300"
                                        )}>
                                          €{module.price}/mo
                                        </span>
                                      )}
                                      {isFromPack && (
                                        <span className="text-[9px] text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">
                                          Included
                                        </span>
                                      )}
                                    </div>
                                    <p className={cn(
                                      "text-[10px] mt-1",
                                      isActive ? "text-slate-200" : "text-slate-500"
                                    )}>{module.description}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </TabsContent>

                        {/* Monitor Pack */}
                        <TabsContent value="monitor" className="p-2 m-0 space-y-2">
                          <div className={cn(
                            "px-2 py-1.5 border rounded mb-2",
                            isPackActive("monitor")
                              ? "bg-orange-500/10 border-orange-500/30"
                              : "bg-slate-700/40 border-slate-600/30"
                          )}>
                            <p className={cn(
                              "text-[10px] font-medium",
                              isPackActive("monitor") ? "text-orange-300" : "text-slate-400"
                            )}>
                              {isPackActive("monitor")
                                ? <><Check className="w-3 h-3 inline mr-1" />Monitor Pack Active - All modules included</>
                                : <>Select pack or buy modules individually</>
                              }
                            </p>
                          </div>
                          {monitorPackModules.map((module) => {
                            const isActive = isModuleActive(module);
                            const isFromPack = isPackActive("monitor");
                            const isIndividual = selectedIndividualModules.includes(module.id);
                            return (
                              <div
                                key={module.id}
                                onClick={() => !isFromPack && module.price && toggleIndividualModule(module.id)}
                                className={cn(
                                  "p-2.5 rounded-lg border transition-all",
                                  isActive
                                    ? "bg-orange-500/10 border-orange-500/30"
                                    : "bg-slate-700/30 border-slate-600/30 hover:border-orange-400/40 cursor-pointer"
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  {isActive
                                    ? <Check className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
                                    : <Checkbox
                                      checked={isIndividual}
                                      className="border-slate-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 mt-0.5"
                                    />
                                  }
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={isActive ? "text-orange-400" : "text-slate-400"}>
                                          {module.icon}
                                        </span>
                                        <p className={cn(
                                          "text-xs font-medium",
                                          isActive ? "text-white" : "text-slate-400"
                                        )}>{module.name}</p>
                                        {getAIIntensityBadge(module.aiIntensity)}
                                      </div>
                                      {module.price && !isFromPack && (
                                        <span className={cn(
                                          "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                                          isIndividual
                                            ? "bg-orange-500/30 text-orange-300"
                                            : "bg-slate-600/50 text-slate-300"
                                        )}>
                                          €{module.price}/mo
                                        </span>
                                      )}
                                      {isFromPack && (
                                        <span className="text-[9px] text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded">
                                          Included
                                        </span>
                                      )}
                                    </div>
                                    <p className={cn(
                                      "text-[10px] mt-1",
                                      isActive ? "text-slate-200" : "text-slate-500"
                                    )}>{module.description}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </TabsContent>
                      </ScrollArea>
                    </Tabs>
                  )}
                </Card>
              </div>

              {/* COLUMN 4 - Your Investment */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Your Investment
                  </h3>
                </div>

                <Card className="bg-slate-800/90 border-slate-600/60 backdrop-blur-sm p-4 shadow-sm">
                  <div className="space-y-3">
                    {/* Back to Overview Link */}
                    <button
                      onClick={() => setShowPlanDetails(false)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors mb-2"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Back to Overview
                    </button>

                    {/* Monthly Total */}
                    <div className="text-center py-3 border-b border-slate-600/50">
                      <p className="text-xs text-slate-200 mb-1">{isInvestor ? "Sourcing Access" : "Monthly Total"}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        {isInvestor ? (
                          <span className="text-2xl font-bold text-violet-400">
                            Free
                          </span>
                        ) : isEnterprise ? (
                          enterpriseCouponApplied ? (
                            <>
                              <span className="text-lg font-bold text-slate-500 line-through mr-2">
                                Custom
                              </span>
                              <span className="text-3xl font-bold text-emerald-400">
                                €{ENTERPRISE_COUPON_PRICE.toLocaleString()}
                              </span>
                              <span className="text-slate-200 text-sm">/mo</span>
                            </>
                          ) : (
                            <span className="text-2xl font-bold text-amber-400">
                              Custom
                            </span>
                          )
                        ) : couponApplied ? (
                          <>
                            <span className="text-lg font-bold text-slate-500 line-through mr-2">
                              €{monthlyTotal.toLocaleString()}
                            </span>
                            <span className="text-3xl font-bold text-emerald-400">
                              €{PILOT_PRICE.toLocaleString()}
                            </span>
                            <span className="text-slate-200 text-sm">/mo</span>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl font-bold text-white">
                              €{monthlyTotal.toLocaleString()}
                            </span>
                            <span className="text-slate-200 text-sm">/mo</span>
                          </>
                        )}
                      </div>
                      {isInvestor && (
                        <p className="text-[10px] text-violet-300 mt-1">+ Sponsorship packages available</p>
                      )}
                      {(oneTimeCost > 0 || genesisOneTimeCost > 0) && !isInvestor && (
                        <div className="mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                          <p className="text-[10px] text-purple-300">
                            + €{(isGenesis ? genesisOneTimeCost : oneTimeCost).toLocaleString()} for AI booster pack{!isGenesis && aiBoosterPacks > 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Breakdown */}
                    {!isEnterprise && !isInvestor && (
                      <div className="space-y-1.5 text-xs">
                        {/* Base tier */}
                        <div className="flex justify-between">
                          <span className="text-slate-100">{tierData.name} Base</span>
                          <span className={tierData.accentColor}>
                            {tierData.priceLabel || `€${tierData.monthlyPrice?.toLocaleString()}/mo`}
                          </span>
                        </div>

                        {/* Genesis breakdown */}
                        {isGenesis && (
                          <div className="pt-2 mt-2 border-t border-slate-600/50 space-y-1">
                            <p className="text-[10px] text-teal-300">
                              ✓ Full Venture Blueprint access
                            </p>
                            <p className="text-[10px] text-teal-300">
                              ✓ Shareable investor links
                            </p>
                            {genesisAiPack && (
                              <div className="flex justify-between pt-1">
                                <span className="text-[10px] text-purple-300">AI Booster Pack</span>
                                <span className="text-[10px] text-purple-300">€{PRICING.genesis.aiBooster}</span>
                              </div>
                            )}
                            <p className="text-[10px] text-teal-300">
                              ✓ Referral program access
                            </p>
                          </div>
                        )}

                        {/* HELIX OS breakdown */}
                        {isCore && (
                          <>
                            {/* Included items */}
                            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-600/30">
                              Includes: Xyreg Core features, 1 device
                            </div>

                            {/* Pack costs */}
                            {selectedPacks.includes("build") && (
                              <div className="flex justify-between">
                                <span className="text-slate-100">+ Build Pack</span>
                                <span className="text-green-400">€{PRICING.core.buildPack}/mo</span>
                              </div>
                            )}
                            {selectedPacks.includes("ops") && (
                              <div className="flex justify-between">
                                <span className="text-slate-100">+ Ops Pack</span>
                                <span className="text-blue-400">€{PRICING.core.opsPack}/mo</span>
                              </div>
                            )}
                            {selectedPacks.includes("monitor") && (
                              <div className="flex justify-between">
                                <span className="text-slate-100">+ Monitor Pack</span>
                                <span className="text-orange-400">€{PRICING.core.monitorPack}/mo</span>
                              </div>
                            )}

                            {/* Stacking Discount */}
                            {packCount > 0 && (
                              <div className="flex justify-between text-emerald-400">
                                <span>Stacking Discount ({discountPercent}%)</span>
                                <span>-€{packSavings}/mo</span>
                              </div>
                            )}

                            {/* Individual a la carte modules */}
                            {selectedIndividualModules.length > 0 && (
                              <div className="pt-1">
                                {selectedIndividualModules.map((moduleId) => {
                                  const module = modules.find(m => m.id === moduleId);
                                  if (!module || !module.price) return null;
                                  // Skip if covered by a pack
                                  const packMapping: Record<string, string> = {
                                    "base": "build",
                                    "quality-ops": "ops",
                                    "clinical-pms": "monitor"
                                  };
                                  const requiredPack = packMapping[module.pack];
                                  if (requiredPack && isPackActive(requiredPack)) return null;
                                  return (
                                    <div key={moduleId} className="flex justify-between">
                                      <span className="text-slate-100">+ {module.name}</span>
                                      <span className="text-cyan-400">€{module.price}/mo</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Specialist modules */}
                            {predicateFinderEnabled && (
                              <div className="flex justify-between">
                                <span className="text-slate-100">+ Predicate Finder</span>
                                <span className="text-purple-400">€{PRICING.core.predicateFinder}/mo</span>
                              </div>
                            )}
                            {ipPatentEnabled && (
                              <div className="flex justify-between">
                                <span className="text-slate-100">+ IP & Patent FTO</span>
                                <span className="text-purple-400">€{PRICING.core.ipPatent}/mo</span>
                              </div>
                            )}
                            {xyregCortexEnabled && (
                              <div className="flex justify-between">
                                <span className="text-slate-100">+ Xyreg Cortex</span>
                                <span className="text-purple-400">€{PRICING.core.xyregCortex}/mo</span>
                              </div>
                            )}

                            {/* Extra devices */}
                            {extraDevices > 0 && (
                              <div className="flex justify-between">
                                <span className="text-slate-100">+{extraDevices} Extra Device{extraDevices > 1 ? 's' : ''}</span>
                                <span className="text-cyan-300">€{devicesCost}/mo</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Enterprise contact note */}
                    {isEnterprise && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                        <p className="text-xs text-amber-300">
                          Pricing based on device volume and requirements
                        </p>
                      </div>
                    )}

                    {/* Investor breakdown */}
                    {isInvestor && (() => {
                      const selectedPkg = sponsorshipPackages.find(p => p.id === selectedSponsorshipPackage);
                      const packageCost = selectedPkg?.value || 0;
                      const includedKpi = selectedPkg?.includedKpi || 0;
                      const includedDdRooms = selectedPkg?.includedDdRooms || 0;
                      const isKpiUnlimited = includedKpi === -1;
                      const isDdUnlimited = includedDdRooms === -1;

                      let extraKpiCost = 0;
                      let extraDdCost = 0;

                      if (!selectedSponsorshipPackage) {
                        if (kpiWatchtowerEnabled) {
                          extraKpiCost = kpiCompanyCount * PRICING.investor.kpiWatchtower;
                        }
                        if (dueDiligenceRoomsEnabled) {
                          extraDdCost = ddRoomCount * PRICING.investor.dueDiligenceRoom;
                        }
                      }

                      const totalCost = packageCost + extraKpiCost + extraDdCost;
                      const isCustom = selectedSponsorshipPackage === "portfolio";

                      return (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-100">Sourcing Access</span>
                            <span className="text-violet-400">Free</span>
                          </div>

                          <div className="pt-2 mt-2 border-t border-slate-600/50 space-y-1">
                            <p className="text-[10px] text-violet-300">✓ Deal Flow Marketplace</p>
                            <p className="text-[10px] text-violet-300">✓ Viability Scores</p>
                            <p className="text-[10px] text-violet-300">✓ Request Introductions</p>
                          </div>

                          {(selectedSponsorshipPackage || kpiWatchtowerEnabled || dueDiligenceRoomsEnabled) && (
                            <div className="pt-2 mt-2 border-t border-slate-600/50">
                              <p className="text-[10px] text-violet-300 mb-2">Selected Add-ons:</p>
                              <div className="space-y-1.5">
                                {selectedSponsorshipPackage && (
                                  <>
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-white">✓ {selectedPkg?.name}</span>
                                      <span className="text-emerald-400 font-mono">{selectedPkg?.price}{selectedPkg?.period}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 pl-3 space-y-0.5">
                                      <p>• {isKpiUnlimited ? '∞' : includedKpi} KPI slots included</p>
                                      <p>• {isDdUnlimited ? '∞' : includedDdRooms} DD rooms included</p>
                                    </div>
                                  </>
                                )}
                                {!selectedSponsorshipPackage && kpiWatchtowerEnabled && (
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-white">✓ KPI Watchtower ({kpiCompanyCount}×)</span>
                                    <span className="text-emerald-400 font-mono">€{extraKpiCost.toLocaleString()}/mo</span>
                                  </div>
                                )}
                                {!selectedSponsorshipPackage && dueDiligenceRoomsEnabled && (
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-white">✓ DD Rooms ({ddRoomCount}×)</span>
                                    <span className="text-emerald-400 font-mono">€{extraDdCost.toLocaleString()}/mo</span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-600/50">
                                {isCustom ? (
                                  <div className="p-2 rounded bg-violet-500/20 border border-violet-500/40 text-center">
                                    <p className="text-[10px] text-violet-300 font-medium">Contact Sales for Portfolio Pricing</p>
                                  </div>
                                ) : totalCost > 0 ? (
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-200 font-medium">Monthly Total</span>
                                    <span className="text-emerald-400 font-mono font-semibold text-sm">€{totalCost.toLocaleString()}</span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}

                          {!selectedSponsorshipPackage && !kpiWatchtowerEnabled && !dueDiligenceRoomsEnabled && (
                            <div className="pt-2 mt-2 border-t border-slate-600/50">
                              <p className="text-[10px] text-slate-400 mb-1">Optional Add-ons:</p>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-slate-200">○ Sponsorship Packages</span>
                                  <span className="text-slate-400">from €1,999/mo</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-slate-200">○ KPI Watchtower</span>
                                  <span className="text-slate-400">€199/co/mo</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-slate-200">○ Due Diligence Rooms</span>
                                  <span className="text-slate-400">€99/room/mo</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Coupon Code */}
                    {(isCore || isEnterprise) && (
                      <div className="pt-2 border-t border-slate-600/50">
                        <p className="text-[10px] text-slate-400 mb-1.5 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Have a coupon code?
                        </p>
                        <div className="flex gap-1.5">
                          <Input
                            value={isEnterprise ? enterpriseCouponCode : couponCode}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              if (isEnterprise) {
                                setEnterpriseCouponCode(val);
                                setEnterpriseCouponError("");
                                if (val.trim() === ENTERPRISE_COUPON) {
                                  setEnterpriseCouponApplied(true);
                                } else {
                                  setEnterpriseCouponApplied(false);
                                }
                              } else {
                                setCouponCode(val);
                                setCouponError("");
                                if (val.trim() === PILOT_COUPON) {
                                  setCouponApplied(true);
                                } else {
                                  setCouponApplied(false);
                                }
                              }
                            }}
                            placeholder="Enter code"
                            className="h-7 text-xs bg-white border-slate-300 text-black placeholder:text-slate-400"
                          />
                          <Button
                            size="sm"
                            variant={(isEnterprise ? enterpriseCouponApplied : couponApplied) ? "outline" : "secondary"}
                            className="h-7 text-xs px-2 shrink-0"
                            onClick={() => {
                              if (isEnterprise) {
                                if (enterpriseCouponApplied) {
                                  setEnterpriseCouponApplied(false);
                                  setEnterpriseCouponCode("");
                                  setEnterpriseCouponError("");
                                } else if (enterpriseCouponCode.trim() === ENTERPRISE_COUPON) {
                                  setEnterpriseCouponApplied(true);
                                  setEnterpriseCouponError("");
                                } else if (enterpriseCouponCode.trim()) {
                                  setEnterpriseCouponError("Invalid coupon code");
                                }
                              } else {
                                if (couponApplied) {
                                  setCouponApplied(false);
                                  setCouponCode("");
                                  setCouponError("");
                                } else if (couponCode.trim() === PILOT_COUPON) {
                                  setCouponApplied(true);
                                  setCouponError("");
                                } else if (couponCode.trim()) {
                                  setCouponError("Invalid coupon code");
                                }
                              }
                            }}
                          >
                            {(isEnterprise ? enterpriseCouponApplied : couponApplied) ? "Remove" : "Apply"}
                          </Button>
                        </div>
                        {(isEnterprise ? enterpriseCouponError : couponError) && (
                          <p className="text-[10px] text-red-400 mt-1">{isEnterprise ? enterpriseCouponError : couponError}</p>
                        )}
                        {(isEnterprise ? enterpriseCouponApplied : couponApplied) && (
                          <div className="mt-1.5 p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                            <p className="text-[10px] text-emerald-400 font-medium">
                              ✓ {isEnterprise ? ENTERPRISE_COUPON : PILOT_COUPON} applied — €{(isEnterprise ? ENTERPRISE_COUPON_PRICE : PILOT_PRICE).toLocaleString()}/mo flat rate
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button
                      onClick={async () => {
                        if (isRegistrationFlow && onPlanSelect) {
                          // In registration flow, proceed with selected plan (including all add-ons)
                          onPlanSelect({
                            tier: selectedTier,
                            powerPacks: selectedPacks,
                            monthlyPrice: isCore ? (couponApplied ? PILOT_PRICE : monthlyTotal) : (isGenesis ? genesisOneTimeCost : 0),
                            couponCode: couponApplied ? PILOT_COUPON : undefined,
                            // Add-on details
                            isGrowthSuite: allPacksSelected,
                            extraDevices: activeDevices > 1 ? activeDevices - 1 : 0,
                            aiBoosterPacks: aiBoosterPacks,
                            selectedModules: selectedIndividualModules,
                            specialistModules: {
                              predicateFinder: predicateFinderEnabled,
                              ipPatent: ipPatentEnabled,
                            },
                          });
                        } else if (isCore || isEnterprise) {
                          // For Helix OS / Enterprise - go directly to Stripe checkout
                          if (!user) {
                            toast({
                              title: "Login Required",
                              description: "Please log in to start your trial.",
                              variant: "destructive",
                            });
                            return;
                          }

                          setIsCheckoutLoading(true);
                          
                          try {
                            if (isEnterprise) {
                              if (enterpriseCouponApplied) {
                                // Coupon applied — go to Stripe checkout with flat rate
                                await StripeService.handlePlanPurchase({
                                  planId: 'enterprise',
                                  name: `Enterprise (${ENTERPRISE_COUPON})`,
                                  price: `€${ENTERPRISE_COUPON_PRICE}`,
                                }, companyId || undefined);
                              } else {
                                // No coupon — show contact form dialog
                                setIsCheckoutLoading(false);
                                setIsContactOpen(true);
                                return;
                              }
                            } else if (couponApplied) {
                              // Coupon applied — send single flat €1,000 line item (no tier, no add-ons)
                              console.log('[PricingModule] COUPON PATH — sending €1,000 flat rate');
                              await StripeService.handlePlanPurchase({
                                planId: 'core',
                                name: 'Helix OS (PILOT1000)',
                                price: `€${PILOT_PRICE}`,
                              }, companyId || undefined);
                            } else {
                              await StripeService.handlePlanPurchase({
                                planId: 'core',
                                name: 'Helix OS',
                                price: `€${monthlyTotal}`,
                                stripePriceId: STRIPE_PRICES.CORE_BASE,
                                tier: 'core',
                                extraDevices: activeDevices > 1 ? activeDevices - 1 : 0,
                                aiBoosterPacks: aiBoosterPacks,
                                // Power Packs
                                selectedPacks: selectedPacks,
                                isGrowthSuite: allPacksSelected,
                                // Individual modules (à la carte)
                                selectedModules: selectedIndividualModules,
                                // Specialist modules
                                specialistModules: {
                                  predicateFinder: predicateFinderEnabled,
                                  ipPatent: ipPatentEnabled,
                                },
                              }, companyId || undefined);
                            }
                          } catch (error: any) {
                            console.error('Checkout error:', error);
                            toast({
                              title: "Checkout Error",
                              description: error.message || "Failed to start checkout. Please try again.",
                              variant: "destructive",
                            });
                          } finally {
                            setIsCheckoutLoading(false);
                          }
                        } else {
                          // For Genesis, Enterprise, Investor - show contact form
                          setIsContactOpen(true);
                        }
                      }}
                      disabled={isCheckoutLoading}
                      className={cn(
                        "w-full font-semibold py-5 text-sm shadow-lg",
                        isGenesis
                          ? "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-teal-500/20"
                          : isEnterprise
                            ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20"
                            : isInvestor
                              ? "bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-violet-500/20"
                              : "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-cyan-500/20"
                      )}
                    >
                      {isCheckoutLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : isRegistrationFlow
                        ? (isGenesis ? "Continue with Genesis" : isEnterprise ? "Continue with Enterprise" : isInvestor ? "Continue as Investor" : "Continue with this Plan")
                        : (isGenesis ? "Start Free" : isEnterprise ? (enterpriseCouponApplied ? `Pay €${ENTERPRISE_COUPON_PRICE}/mo` : "Contact Sales") : isInvestor ? "Join Network" : couponApplied ? `Pay €${PILOT_PRICE}/mo` : "Start Trial")
                      }
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Scenario Walkthroughs - Updated for Pack-based pricing */}
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/30 border-slate-600/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-sm text-white">Stage 1: R&D</h4>
            </div>
            <p className="text-xs text-slate-300 mb-2">Pre-market, building your device.</p>
            <p className="text-[10px] text-slate-400 mb-2">
              <span className="text-cyan-400">HELIX OS €499/mo</span> — Build modules included:
            </p>
            <p className="text-[10px] text-slate-300">
              • Design Controls • Risk Management • Requirements
            </p>
            <p className="text-[10px] text-emerald-400 mt-2">
              "We need to document our design to get funded."
            </p>
          </Card>
          <Card className="bg-slate-800/30 border-slate-600/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <h4 className="font-semibold text-sm text-white">Stage 2: Audit Prep</h4>
            </div>
            <p className="text-xs text-slate-300 mb-2">Manufacturing & ISO 13485 certification.</p>
            <p className="text-[10px] text-slate-400 mb-2">
              <span className="text-cyan-400">HELIX OS</span> + <span className="text-blue-400">Quality Ops Pack</span>
            </p>
            <p className="text-[10px] text-slate-300">
              €499 + €249 = <span className="text-emerald-400 font-semibold">€748/mo</span>
            </p>
            <p className="text-[10px] text-emerald-400 mt-2">
              "We're hiring a Quality Manager and need to pass our ISO audit."
            </p>
          </Card>
          <Card className="bg-slate-800/30 border-slate-600/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="font-semibold text-sm text-white">Stage 3: Market Launch</h4>
            </div>
            <p className="text-xs text-slate-300 mb-2">Commercial, tracking complaints & clinical data.</p>
            <p className="text-[10px] text-slate-400 mb-2">
              <span className="text-cyan-400">Scale-Up Bundle</span> — All packs included
            </p>
            <p className="text-[10px] text-slate-300">
              <span className="text-emerald-400 font-semibold">€899/mo</span> <span className="text-slate-400">(save €100)</span>
            </p>
            <p className="text-[10px] text-emerald-400 mt-2">
              "We're selling, so we need to track complaints and clinical data."
            </p>
          </Card>
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        tier={selectedTier}
      />

    </section>
  );
};

export default PricingModule;
