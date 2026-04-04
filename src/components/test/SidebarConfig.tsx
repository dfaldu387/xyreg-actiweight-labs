import React from 'react';
import {
  BarChart3,
  LayoutDashboard,
  Building2,
  GanttChart,
  CheckCircle,
  FileText,
  ClipboardCheck,
  List,
  Calendar,
  Stethoscope,
  Settings,
  CreditCard,
  Users,
  MessageSquare,
  ArrowLeft,
  Plus,
  Search,
  Package,
  CheckSquare,
  Lightbulb,
  Briefcase,
  Target,
  MapPin,
  User,
  Archive,
  Eye,
  Shield,
  Building,
  Timer,
  FileCheck,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  FileBarChart,
  Activity,
  ClipboardList,
  Microscope,
  Globe,
  Zap,
  Database,
  Layers,
  PieChart,
  BarChart,
  LineChart,
  Monitor,
  Smartphone,
  Tablet,
  Cpu,
  HardDrive,
  Network,
  Server,
  Cloud,
  Lock,
  Key,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Download,
  Upload,
  Share,
  Copy,
  ExternalLink,
  Home,
  Menu,
  Grid,
  Layout,
  Sidebar,
  Maximize,
  Minimize,
  RotateCcw,
  Save,
  Send,
  Mail,
  Phone,
  Video,
  Camera,
  Image,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Laptop,
  Printer,
  Calculator,
  Bell,
  BellOff,
  BookOpen,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bookmark,
  Tag,
  Tags,
  Filter,
  SortAsc,
  SortDesc,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  MoreVertical,
  PlusCircle,
  MinusCircle,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Info,
  HelpCircle,
  AlertTriangle,
  FileWarning,
  X,
  Check,
  Minus,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Octagon,
  Pentagon,
  Diamond,
  Workflow,
  Files,
  QrCode,
  Package2,
  Map,
  Link2,
  TrendingDown,
  Factory,
  Contact,
  Crosshair,
  FileCog,
  Handshake,
  GitBranch
} from 'lucide-react';

export type DomainColor = 'gold' | 'blue' | 'green' | 'purple' | undefined;

export const DOMAIN_COLOR_CLASSES: Record<string, { border: string; icon: string; iconActive: string; bg: string; bgSolid: string; textSolid: string; ring: string }> = {
  gold:   { border: 'border-l-[#D4AF37]',  icon: 'text-[#D4AF37]',  iconActive: 'text-[#B8960E]',  bg: 'bg-[#D4AF37]/10', bgSolid: 'bg-[#D4AF37]', textSolid: 'text-white', ring: 'ring-[#D4AF37]' },
  blue:   { border: 'border-l-[#3B82F6]',  icon: 'text-[#3B82F6]',  iconActive: 'text-[#2563EB]',  bg: 'bg-[#3B82F6]/10', bgSolid: 'bg-[#3B82F6]', textSolid: 'text-white', ring: 'ring-[#3B82F6]' },
  green:  { border: 'border-l-[#10B981]',  icon: 'text-[#10B981]',  iconActive: 'text-[#059669]',  bg: 'bg-[#10B981]/10', bgSolid: 'bg-[#10B981]', textSolid: 'text-white', ring: 'ring-[#10B981]' },
  purple: { border: 'border-l-[#8B5CF6]',  icon: 'text-[#8B5CF6]',  iconActive: 'text-[#7C3AED]',  bg: 'bg-[#8B5CF6]/10', bgSolid: 'bg-[#8B5CF6]', textSolid: 'text-white', ring: 'ring-[#8B5CF6]' },
};

export interface MenuItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  badge?: string;
  disabled?: boolean;
  hidden?: boolean;
  companyAdminOnly?: boolean;
  onClick?: () => void;
  route?: string;
  upcoming?: boolean;
  domainColor?: DomainColor;
}

export interface ModuleConfig {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  menuItems: MenuItem[];
  headerTitle: string;
  route?: string; // Optional route path for module navigation
  showBackButton?: boolean;
  backButtonText?: string;
  showAddButton?: boolean;
  addButtonText?: string;
  showSearchButton?: boolean;
  searchButtonText?: string;
  showProductSelector?: boolean; // Show product selector for quick device access
  hiddenForNonReviewers?: boolean; // Hide module for non-authorized users
  hidden?: boolean; // Internal modules (e.g., profile) that should not render in L1 but remain routable/allowed
}

export interface SidebarConfig {
  modules: ModuleConfig[];
  companySettingsModule: ModuleConfig;
  userProfileModule: ModuleConfig;
  defaultActiveModule?: string;
  enableCollapse?: boolean;
  enableTooltips?: boolean;
  enableBadges?: boolean;
  enableAnimations?: boolean;
  customStyles?: {
    l1Background?: string;
    l2Background?: string;
    primaryColor?: string;
    accentColor?: string;
    textColor?: string;
    borderColor?: string;
  };
}

// Default configuration with all REAL routes from App.tsx
// Shared user profile module config (used in both modules list for access control and dedicated render slot)
const userProfileModuleConfig: ModuleConfig = {
  id: 'user-profile',
  icon: <User className="w-6 h-6" />,
  label: 'User Profile',
  description: 'Profile management, preferences, and logout',
  headerTitle: 'User Profile',
  menuItems: [
    {
      id: 'profile',
      name: 'Profile',
      icon: <User className="w-5 h-5" />,
      route: '/app/profile'
    },
    {
      id: 'logout',
      name: 'Log out',
      icon: <LogOut className="w-5 h-5" />
      // onClick will be injected by configureSidebarWithAuth helper
    }
  ]
};

export const defaultSidebarConfig: SidebarConfig = {
  modules: [
    // {
    //   id: 'home',
    //   icon: <Home className="w-6 h-6" />,
    //   label: 'Home',
    //   description: 'Main dashboard and overview',
    //   headerTitle: 'Home Dashboard',
    //   menuItems: [
    //     {
    //       id: 'dashboard',
    //       name: 'Dashboard',
    //       icon: <BarChart3 className="w-5 h-5" />,
    //       route: '/app/dashboard'
    //     },
    //     {
    //       id: 'overview',
    //       name: 'Overview',
    //       icon: <Eye className="w-5 h-5" />,
    //       route: '/app/overview'
    //     }
    //   ]
    // },
    {
      id: 'mission-control',
      icon: <Monitor className="w-6 h-6" />,
      label: 'Mission Control',
      description: 'Central command and control center',
      route: '/app/company/:companyName/mission-control',
      headerTitle: 'Mission Control',
      menuItems: [
        {
          id: 'mission-control-main',
          name: 'Mission Control',
          icon: <Monitor className="w-5 h-5" />,
          route: '/app/company/:companyName/mission-control'
        },
        {
          id: 'clients',
          name: 'Client Compass',
          icon: <Users className="w-5 h-5" />,
          route: '/app/clients'
        },
        // Marketplace Preview - only for company admins to preview their listing
        {
          id: 'marketplace-preview',
          name: 'Investor Marketplace',
          icon: <Briefcase className="w-5 h-5" />,
          route: '/app/company/:companyName/marketplace-preview',
          companyAdminOnly: true
        },
      ]
    },
    {
      id: 'portfolio',
      icon: <Building2 className="w-6 h-6" />,
      label: 'Company',
      description: '10,000-foot view for portfolio managers and executives',
      headerTitle: 'Company Dashboard',
      menuItems: [
        // ── Gold: Strategy & Portfolio ──
        {
          id: 'company-dashboard',
          name: 'Dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
          route: '/app/company/:companyName',
          domainColor: 'gold'
        },
        {
          id: 'commercial',
          name: 'Commercial Intelligence',
          icon: <TrendingUp className="w-5 h-5" />,
          domainColor: 'gold',
          children: [
            { id: 'company-strategic-blueprint', name: 'Strategic Blueprint', icon: <Map className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=strategic-blueprint' },
            { id: 'company-business-canvas', name: 'Business Canvas', icon: <Layers className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=business-canvas' },
            { id: 'company-feasibility', name: 'Portfolio Business Cases', icon: <ClipboardCheck className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=feasibility-studies' },
            { id: 'company-market-analysis', name: 'Market Analysis', icon: <BarChart3 className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=market-analysis' },
            { id: 'company-commercial-performance', name: 'Commercial Performance', icon: <TrendingUp className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=commercial-performance' },
            { id: 'commercial-variance-analysis', name: 'Variance Analysis', icon: <TrendingDown className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=variance-analysis' },
            { id: 'company-pricing-strategy', name: 'Pricing Strategy', icon: <DollarSign className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=pricing-strategy' },
            { id: 'company-reimbursement-strategy', name: 'Global Reimbursement Strategy', icon: <Globe className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=reimbursement-strategy' },
            { id: 'company-market-access', name: 'Global Market Access', icon: <Globe className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=market-access' },
            { id: 'commercial-investors', name: 'Investors', icon: <Database className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=investors' },
            { id: 'commercial-funding-grants', name: 'Funding & Grants', icon: <Briefcase className="w-4 h-4" />, route: '/app/company/:companyName/commercial?tab=funding-grants' },
          ]
        },
        {
          id: 'company-products',
          name: 'Portfolio Management',
          icon: <Package className="w-5 h-5" />,
          route: '/app/company/:companyName/portfolio-landing?tab=budget',
          domainColor: 'gold',
          children: [
            { id: 'portfolio-views', name: 'Portfolio Views', icon: <Layers className="w-4 h-4" />, route: '/app/company/:companyName/portfolio-landing?tab=portfolio' },
            { id: 'company-budget', name: 'Budget Dashboard', icon: <DollarSign className="w-4 h-4" />, route: '/app/company/:companyName/portfolio-landing?tab=budget' },
            { id: 'company-variance-analysis', name: 'Variance Analysis', icon: <TrendingDown className="w-4 h-4" />, route: '/app/company/:companyName/portfolio-landing?tab=variance-analysis' },
            { id: 'company-investors', name: 'Investors', icon: <Database className="w-4 h-4" />, route: '/app/company/:companyName/portfolio-landing?tab=investors' },
            { id: 'company-risk-map', name: 'Portfolio Risk Map', icon: <AlertTriangle className="w-4 h-4" />, route: '/app/company/:companyName/portfolio-landing?tab=risk-map' },
          ]
        },
        // ── Blue: Operations & Planning ──
        {
          id: 'company-milestones',
          name: 'Enterprise Roadmap',
          icon: <GanttChart className="w-5 h-5" />,
          route: '/app/company/:companyName/milestones',
          domainColor: 'blue'
        },
        {
          id: 'operations',
          name: 'Operations',
          icon: <Factory className="w-5 h-5" />,
          domainColor: 'blue',
          children: [
            { id: 'company-suppliers', name: 'Suppliers', icon: <Building className="w-4 h-4" />, route: '/app/company/:companyName/suppliers' },
            { id: 'company-infrastructure', name: 'Infrastructure', icon: <Building className="w-4 h-4" />, route: '/app/company/:companyName/infrastructure' },
            { id: 'company-calibration', name: 'Calibration Schedule', icon: <ClipboardList className="w-4 h-4" />, route: '/app/company/:companyName/calibration-schedule' }
          ]
        },
        {
          id: 'company-hr',
          name: 'Human Resources',
          icon: <BookOpen className="w-5 h-5" />,
          domainColor: 'blue',
          children: [
            { id: 'company-training', name: 'Training Management', icon: <BookOpen className="w-4 h-4" />, route: '/app/company/:companyName/training' }
          ]
        },
        // ── Green: Quality & Governance (QMS) ──
        {
          id: 'quality-governance',
          name: 'Quality Governance',
          icon: <FileWarning className="w-5 h-5" />,
          route: '/app/company/:companyName/management-review',
          domainColor: 'green',
          children: [
            { id: 'company-management-review', name: 'Management Review', icon: <FileBarChart className="w-4 h-4" />, route: '/app/company/:companyName/management-review' },
            { id: 'company-nonconformity', name: 'NC Trends', icon: <FileWarning className="w-4 h-4" />, route: '/app/company/:companyName/nonconformity' },
            { id: 'company-capa', name: 'CAPA Trends', icon: <AlertTriangle className="w-4 h-4" />, route: '/app/company/:companyName/capa' },
            { id: 'company-change-control', name: 'Global Change Control', icon: <FileCheck className="w-4 h-4" />, route: '/app/company/:companyName/change-control' },
            { id: 'company-design-review', name: 'Design Review', icon: <ClipboardCheck className="w-4 h-4" />, route: '/app/company/:companyName/design-review' },
          ]
        },
        {
          id: 'company-pms',
          name: 'Global Vigilance & PMS',
          icon: <Eye className="w-5 h-5" />,
          route: '/app/company/:companyName/post-market-surveillance',
          domainColor: 'green'
        },
        {
          id: 'audit-log',
          name: 'Audit Log',
          icon: <FileBarChart className="w-5 h-5" />,
          route: '/app/company/:companyName/audit-log',
          domainColor: 'green'
        },
        // ── Purple: Regulatory & Compliance ──
        {
          id: 'enterprise-compliance',
          name: 'Enterprise Compliance',
          icon: <CheckCircle className="w-5 h-5" />,
          domainColor: 'purple',
          children: [
            { id: 'company-quality-manual', name: 'Global Quality Manual', icon: <FileText className="w-4 h-4" />, route: '/app/company/:companyName/quality-manual' },
            { id: 'company-documents', name: 'QMS Document Control', icon: <FileText className="w-4 h-4" />, route: '/app/company/:companyName/documents' },
            { id: 'company-gap-analysis', name: 'Gap Analysis', icon: <ClipboardCheck className="w-4 h-4" />, route: '/app/company/:companyName/gap-analysis' },
            { id: 'company-activities', name: 'Compliance Activities', icon: <Activity className="w-4 h-4" />, route: '/app/company/:companyName/activities' },
            { id: 'company-audits', name: 'Audits', icon: <ClipboardList className="w-4 h-4" />, route: '/app/company/:companyName/audits' },
            { id: 'ip-management', name: 'IP Management', icon: <Lightbulb className="w-4 h-4" />, route: '/app/company/:companyName/ip-portfolio' },
          ]
        },
        
      ]
    },
    {
      id: 'products',
      icon: <Package className="w-6 h-6" />,
      label: 'Device',
      description: '1,000-foot view for device managers and engineers',
      headerTitle: 'Device',
      showBackButton: true,
      backButtonText: 'Back to all devices',
      showAddButton: true,
      addButtonText: 'Add Device',
      showSearchButton: true,
      searchButtonText: 'Search Devices...',
      menuItems: [
        {
          id: 'dashboard',
          name: 'Device Dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
          route: '/app/product/:id',
          domainColor: 'gold'
        },
        {
          id: 'strategic-growth',
          name: 'Business Case',
          icon: <Briefcase className="w-5 h-5" />,
          domainColor: 'gold',
          children: [
            { id: 'xyreg-genesis', name: 'XyReg Genesis', icon: <Crosshair className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=genesis' },
            { id: 'venture-blueprint', name: 'Venture Blueprint', icon: <Map className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=venture-blueprint' },
            { id: 'business-canvas', name: 'Business Canvas', icon: <Layers className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=business-canvas' },
            { id: 'team-profile', name: 'Team', icon: <Users className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=team-profile' },
            { id: 'market-analysis', name: 'Market Analysis', icon: <BarChart3 className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=market-analysis' },
            { id: 'gtm-strategy', name: 'GTM', icon: <TrendingUp className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=gtm-strategy' },
            { id: 'use-of-proceeds', name: 'Use of Proceeds', icon: <DollarSign className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=use-of-proceeds' },
            { id: 'rnpv', name: 'rNPV Analysis', icon: <Calculator className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=rnpv' },
            { id: 'reimbursement', name: 'Reimbursement', icon: <DollarSign className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=reimbursement' },
            { id: 'pricing', name: 'Pricing Strategy', icon: <DollarSign className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=pricing-strategy' },
            { id: 'exit-strategy', name: 'Strategic Horizon', icon: <Target className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=exit-strategy' },
            { id: 'ip-strategy', name: 'IP Strategy', icon: <Lightbulb className="w-4 h-4" />, route: '/app/product/:id/business-case?tab=ip-strategy' },
          ]
        },
        {
          id: 'device-definition',
          name: 'Device Definition',
          icon: <FileText className="w-5 h-5" />,
          domainColor: 'blue',
          children: [
            { id: 'overview', name: 'Overview', icon: <Info className="w-4 h-4" />, route: '/app/product/:id/device-information?tab=overview' },
            { id: 'general', name: 'General', icon: <Settings className="w-4 h-4" />, route: '/app/product/:id/device-information?tab=basics' },
            { id: 'purpose', name: 'Intended Purpose', icon: <Target className="w-4 h-4" />, route: '/app/product/:id/device-information?tab=purpose' },
            { id: 'markets-tab', name: 'Market & Regulatory', icon: <Globe className="w-4 h-4" />, route: '/app/product/:id/device-information?tab=markets-regulatory' },
            { id: 'identification', name: 'Identification', icon: <QrCode className="w-4 h-4" />, route: '/app/product/:id/device-information?tab=identification' },
            { id: 'bundles', name: 'Bundles', icon: <Package2 className="w-4 h-4" />, route: '/app/product/:id/device-information?tab=bundles' },
            { id: 'variants', name: 'Variants', icon: <GitBranch className="w-4 h-4" />, route: '/app/product/:id/device-information?tab=variants' }
          ]
        },
        {
          id: 'bom',
          name: 'Bill of Materials',
          icon: <Package className="w-5 h-5" />,
          route: '/app/product/:id/bom',
          domainColor: 'blue'
        },
        {
          id: 'design-risk-controls',
          name: 'Design & Risk Controls',
          icon: <Shield className="w-5 h-5" />,
          domainColor: 'blue',
          children: [
            { id: 'requirements', name: 'Requirements', icon: <FileText className="w-4 h-4" />, route: '/app/product/:id/design-risk-controls?tab=requirement-specifications' },
            { id: 'architecture', name: 'Architecture', icon: <Network className="w-4 h-4" />, route: '/app/product/:id/design-risk-controls?tab=system-architecture' },
            { id: 'risk-mgmt', name: 'Risk Management', icon: <AlertTriangle className="w-4 h-4" />, route: '/app/product/:id/design-risk-controls?tab=risk-management' },
            { id: 'vv', name: 'Verification & Validation', icon: <ClipboardCheck className="w-4 h-4" />, route: '/app/product/:id/design-risk-controls?tab=verification-validation' },
            { id: 'usability-engineering', name: 'Usability Engineering', icon: <FileCog className="w-4 h-4" />, route: '/app/product/:id/design-risk-controls?tab=usability-engineering&subTab=use-specification' },
            { id: 'traceability', name: 'Traceability', icon: <Link2 className="w-4 h-4" />, route: '/app/product/:id/design-risk-controls?tab=traceability' },
          ]
        },
        {
          id: 'milestones',
          name: 'Development Lifecycle',
          icon: <GanttChart className="w-5 h-5" />,
          route: '/app/product/:id/milestones',
          domainColor: 'blue'
        },
        {
          id: 'device-operations',
          name: 'Operations',
          icon: <Factory className="w-5 h-5" />,
          domainColor: 'blue',
          children: [
            { id: 'supply-chain', name: 'Supply Chain', icon: <Package className="w-4 h-4" />, route: '/app/product/:id/operations/manufacturing?tab=supply-chain' },
            { id: 'incoming-inspection', name: 'Incoming Inspection', icon: <ClipboardCheck className="w-4 h-4" />, route: '/app/product/:id/operations/manufacturing?tab=incoming-inspection' },
            
            { id: 'production', name: 'Production', icon: <Settings className="w-4 h-4" />, route: '/app/product/:id/operations/manufacturing?tab=production' },
            { id: 'sterilization-cleanliness', name: 'Sterilization & Cleanliness', icon: <Settings className="w-4 h-4" />, route: '/app/product/:id/operations/manufacturing?tab=sterilization-cleanliness' },
            { id: 'preservation-handling', name: 'Preservation & Handling', icon: <Package className="w-4 h-4" />, route: '/app/product/:id/operations/manufacturing?tab=preservation-handling' },
            { id: 'installation-servicing', name: 'Installation & Servicing', icon: <Settings className="w-4 h-4" />, route: '/app/product/:id/operations/manufacturing?tab=installation-servicing' },
            { id: 'customer-property', name: 'Customer Property', icon: <Settings className="w-4 h-4" />, route: '/app/product/:id/operations/manufacturing?tab=customer-property' },
          ]
        },
        {
          id: 'clinical-trials',
          name: 'Clinical Trials',
          icon: <Microscope className="w-5 h-5" />,
          route: '/app/product/:id/clinical-trials',
          domainColor: 'blue'
        },
        {
          id: 'quality-governance',
          name: 'Quality Governance',
          icon: <FileWarning className="w-5 h-5" />,
          domainColor: 'green',
          children: [
            { id: 'audits', name: 'Audits', icon: <ClipboardList className="w-4 h-4" />, route: '/app/product/:id/audits' },
            { id: 'nonconformity', name: 'Nonconformity', icon: <FileWarning className="w-4 h-4" />, route: '/app/product/:id/nonconformity' },
            { id: 'product-capa', name: 'CAPA', icon: <AlertTriangle className="w-4 h-4" />, route: '/app/product/:id/capa' },
            { id: 'product-change-control', name: 'Change Control', icon: <FileCheck className="w-4 h-4" />, route: '/app/product/:id/change-control' },
            { id: 'design-review', name: 'Design Review', icon: <ClipboardCheck className="w-4 h-4" />, route: '/app/product/:id/design-review' },
            { id: 'user-access', name: 'User Access', icon: <UserCheck className="w-4 h-4" />, route: '/app/product/:id/user-access' },
          ]
        },
        {
          id: 'device-audit-log',
          name: 'Audit Log',
          icon: <FileBarChart className="w-5 h-5" />,
          route: '/app/product/:id/audit-log',
          domainColor: 'green'
        },
        {
          id: 'compliance-instances',
          name: 'Regulatory & Submissions',
          icon: <CheckCircle className="w-5 h-5" />,
          domainColor: 'purple',
          children: [
            { id: 'gap-analysis', name: 'Gap Analysis', icon: <ClipboardCheck className="w-4 h-4" />, route: '/app/product/:id/gap-analysis' },
            { id: 'activities', name: 'Activities', icon: <Activity className="w-4 h-4" />, route: '/app/product/:id/activities' },
            { id: 'documents', name: 'Technical Documentation', icon: <FileText className="w-4 h-4" />, route: '/app/product/:id/documents' },
            { id: 'technical-file', name: 'Technical File', icon: <FileText className="w-4 h-4" />, route: '/app/product/:id/technical-file' },
            { id: 'pms', name: 'Post-Market Surveillance', icon: <Eye className="w-4 h-4" />, route: '/app/product/:id/post-market-surveillance' },
          ]
        }
      ]
    },
    {
      id: 'draft-studio',
      icon: <FileText className="w-6 h-6" />,
      label: 'Document Studio',
      description: 'Document creation and management workspace',
      headerTitle: 'Document Studio',
      // showAddButton: true,
      menuItems: [
        {
          id: 'document-studio',
          name: 'Document Studio',
          icon: <FileText className="w-5 h-5" />,
          route: '/app/company/:companyName/document-studio'
        },
        // {
        //   id: 'product-selection',
        //   name: 'Product Selection',
        //   icon: <Target className="w-5 h-5" />,
        //   route: '/app/document-studio/product-selection'
        // },
        // {
        //   id: 'templates',
        //   name: 'Templates',
        //   icon: <FileCheck className="w-5 h-5" />,
        //   route: '/app/document-studio/templates'
        // },
        // {
        //   id: 'document-composer',
        //   name: 'Document Composer',
        //   icon: <Edit className="w-5 h-5" />,
        //   route: '/app/document-composer'
        // },
        // {
        //   id: 'company-document-studio',
        //   name: 'Company Document Studio',
        //   icon: <Building className="w-5 h-5" />,
        //   route: '/app/company/:companyName/document-studio'
        // },
        // {
        //   id: 'company-document-composer',
        //   name: 'Company Document Composer',
        //   icon: <Edit className="w-5 h-5" />,
        //   route: '/app/company/:companyName/document-composer'
        // }
      ]
    },
    // Communications module removed — now lives inside Mission Control CommunicationHub
    {
      id: 'review',
      icon: <Eye className="w-6 h-6" />,
      label: 'Review',
      description: 'Review and approval workflows',
      headerTitle: 'Review System',
      hiddenForNonReviewers: true, // Only show for reviewers
      menuItems: [
        // {
        //   id: 'review-redirect',
        //   name: 'Review Redirect',
        //   icon: <ArrowRight className="w-5 h-5" />,
        //   route: '/app/review'
        // },
        {
          id: 'review-panel',
          name: 'Review Panel',
          icon: <Eye className="w-5 h-5" />,
          route: '/app/review-panel'
        },
        // {
        //   id: 'reviewer-products',
        //   name: 'Reviewer Products',
        //   icon: <Package className="w-5 h-5" />,
        //   route: '/app/review-panel/products'
        // },
        // {
        //   id: 'reviewer-product-details',
        //   name: 'Reviewer Product Details',
        //   icon: <FileText className="w-5 h-5" />,
        //   route: '/app/review-panel/products/:productId'
        // },
        // {
        //   id: 'expert-matching',
        //   name: 'Expert Matching',
        //   icon: <Users className="w-5 h-5" />,
        //   route: '/app/expert-matching'
        // }
      ]
    },
    // Investor module - shown only to investor users
    {
      id: 'investor',
      icon: <Briefcase className="w-6 h-6" />,
      label: 'Investor',
      description: 'Investor portfolio and deal flow',
      headerTitle: 'Investor Portal',
      menuItems: [
        // {
        //   id: 'investor-portfolio',
        //   name: 'My Portfolio',
        //   icon: <BarChart3 className="w-5 h-5" />,
        //   route: '/investor/dashboard'
        // },
        {
          id: 'investor-deal-flow',
          name: 'Deal Flow',
          icon: <Briefcase className="w-5 h-5" />,
          route: '/investor/deal-flow'
        }
      ]
    },
    // Genesis module - for Genesis plan users to see devices and access Genesis
    {
      id: 'genesis',
      icon: <Crosshair className="w-6 h-6" />,
      label: 'Genesis',
      description: 'Business case builder for your devices',
      headerTitle: 'XyReg Genesis',
      showBackButton: false,
      showAddButton: true,
      addButtonText: 'Add Device',
      showSearchButton: true,
      searchButtonText: 'Search Devices...',
      menuItems: [] // Devices will be dynamically populated from company products
    },
    // {
    //   id: 'suppliers',
    //   icon: <Building className="w-6 h-6" />,
    //   label: 'Suppliers',
    //   description: 'Supplier management and evaluation',
    //   headerTitle: 'Supplier Management',
    //   menuItems: [
    //     {
    //       id: 'suppliers',
    //       name: 'Suppliers',
    //       icon: <Building className="w-5 h-5" />,
    //       route: '/app/company/:companyName/suppliers'
    //     },
    //     {
    //       id: 'supplier-detail',
    //       name: 'Supplier Detail',
    //       icon: <Eye className="w-5 h-5" />,
    //       route: '/app/company/:companyName/suppliers/:supplierId'
    //     },
    //     {
    //       id: 'edit-supplier',
    //       name: 'Edit Supplier',
    //       icon: <Edit className="w-5 h-5" />,
    //       route: '/app/company/:companyName/suppliers/:supplierId/edit'
    //     },
    //     {
    //       id: 'company-suppliers',
    //       name: 'Company Suppliers',
    //       icon: <Building className="w-5 h-5" />,
    //       route: '/app/company/:companyName/suppliers'
    //     },
    //     {
    //       id: 'company-supplier-detail',
    //       name: 'Company Supplier Detail',
    //       icon: <Eye className="w-5 h-5" />,
    //       route: '/app/company/:companyName/suppliers/:supplierId'
    //     },
    //     {
    //       id: 'edit-company-supplier',
    //       name: 'Edit Company Supplier',
    //       icon: <Edit className="w-5 h-5" />,
    //       route: '/app/company/:companyName/suppliers/:supplierId/edit'
    //     }
    //   ]
    // },
    {
      id: 'general',
      icon: <Grid className="w-6 h-6" />,
      label: 'General',
      description: 'General application features',
      headerTitle: 'General Features',
      menuItems: [
        {
          id: 'clients',
          name: 'Clients',
          icon: <Users className="w-5 h-5" />,
          route: '/app/clients'
        },
        // {
        //   id: 'permissions',
        //   name: 'Permissions',
        //   icon: <Shield className="w-5 h-5" />,
        //   route: '/app/permissions'
        // },
        // {
        //   id: 'archives',
        //   name: 'Archives',
        //   icon: <Archive className="w-5 h-5" />,
        //   route: '/app/archives'
        // },
        {
          id: 'billing',
          name: 'Billing',
          icon: <CreditCard className="w-5 h-5" />,
          route: '/app/company/:companyName/pricing'
        }
      ]
    },
    // Hidden entry to allow access control logic to treat profile as a first-class module
    {
      ...userProfileModuleConfig,
      hidden: true
    }
  ],
  companySettingsModule: {
    id: 'company-settings',
    icon: <Settings className="w-6 h-6" />,
    label: 'Company Settings',
    description: 'Company management and settings',
    headerTitle: 'Company Settings',
    menuItems: [
      {
        id: 'lifecycle-phases',
        name: 'Lifecycle Phases',
        icon: <Workflow className="w-5 h-5" />,
        route: '/app/company/:companyName/settings?tab=lifecycle-phases'
      },
      {
        id: 'compliance-instances',
        name: 'Compliance Instances',
        icon: <ClipboardCheck className="w-5 h-5" />,
        route: '/app/company/:companyName/settings?tab=compliance-instances'
      },
      {
        id: 'clinical-trials',
        name: 'Clinical Trials',
        icon: <Microscope className="w-5 h-5" />,
        route: '/app/company/:companyName/settings?tab=clinical-trials'
      },
      {
        id: 'users',
        name: 'Users',
        icon: <Users className="w-5 h-5" />,
        route: '/app/company/:companyName/settings?tab=users'
      },
      {
        id: 'stakeholders',
        name: 'Stakeholders',
        icon: <Contact className="w-5 h-5" />,
        route: '/app/company/:companyName/settings?tab=stakeholders'
      },
      {
        id: 'reviewers',
        name: 'Reviewers',
        icon: <UserCheck className="w-5 h-5" />,
        route: '/app/company/:companyName/settings?tab=reviewers'
      },
      {
        id: 'general',
        name: 'General',
        icon: <Settings className="w-5 h-5" />,
        route: '/app/company/:companyName/settings?tab=general'
      }
    ]
  },
  userProfileModule: userProfileModuleConfig,
  defaultActiveModule: 'home',
  enableCollapse: true,
  enableTooltips: true,
  enableBadges: true,
  enableAnimations: true,
  customStyles: {
    l1Background: 'bg-sidebar-background',
    l2Background: 'bg-sidebar-background',
    primaryColor: 'bg-sidebar-primary',
    accentColor: 'bg-sidebar-accent',
    textColor: 'text-sidebar-foreground',
    borderColor: 'border-sidebar-border'
  }
};

// Helper functions for dynamic configuration
export const createDynamicRoute = (baseRoute: string, companyName?: string, productId?: string): string => {
  let route = baseRoute;

  if (companyName && route.includes(':companyName')) {
    route = route.replace(':companyName', encodeURIComponent(companyName));
  }

  if (productId && route.includes(':id')) {
    route = route.replace(':id', productId);
  }

  // Preserve query parameters (everything after ?)
  const queryParams = baseRoute.split('?')[1];
  if (queryParams && !route.includes('?')) {
    route = `${route}?${queryParams}`;
  }

  return route;
};

// Helper function to get current module based on route
export const getCurrentModuleFromRoute = (pathname: string): string | null => {
  // Check genesis route first (for Genesis plan users)
  if (pathname === '/app/genesis' || pathname.includes('/app/genesis') || pathname.includes('/genesis')) return 'genesis';

  // Check investor routes first
  if (pathname.includes('/investor/dashboard') || pathname.includes('/investor/deal-flow')) return 'investor';

  // Check review routes first before checking /company/ routes to avoid conflicts
  if (pathname.includes('/profile')) return 'user-profile';
  if (pathname === '/app/review' || pathname.match(/\/app\/review\/?$/)) return 'review';
  if (pathname.includes('/review')) return 'review';

  // Check company settings routes before general company routes to avoid conflicts
  if (pathname.includes('/company/') && pathname.includes('/settings')) return 'company-settings';
  if (pathname.includes('/permissions')) return 'company-settings';
  if (pathname.includes('/role-access-control')) return 'company-settings';

  // portfolio-landing should be detected as 'portfolio' module to show Company Dashboard menu
  if (pathname.includes('/portfolio-landing')) return 'portfolio';

  if (pathname.includes('/mission-control')) return 'mission-control';
  if (pathname.includes('/marketplace-preview')) return 'mission-control'; // Must be before /company/ check
  if (pathname.includes('/document-studio') || pathname.includes('/document-composer')) return 'draft-studio';
  if (pathname.includes('/communications')) return 'mission-control';
  if (pathname.includes('/bundle/')) return 'portfolio'; // Bundle routes belong to products module
  if (pathname.includes('/product/')) return 'products';
  // if (pathname.includes('/supplier')) return 'suppliers'; // Commented out - suppliers is part of portfolio module
  if (pathname.includes('/company/') && !pathname.includes('/product/')) return 'portfolio';
  if (pathname.includes('/clients')) return 'mission-control';
  if (pathname.includes('/archives')) return 'portfolio';
  if (pathname.includes('/profile')) return 'portfolio';
  if (pathname.includes('/product-family/') || pathname.includes('/device-family/')) return 'products';
  return 'home';
};

export const createModuleConfig = (
  id: string,
  icon: React.ReactNode,
  label: string,
  description: string,
  menuItems: MenuItem[],
  headerTitle: string,
  route?: string,
  options?: Partial<ModuleConfig>
): ModuleConfig => ({
  id,
  route,
  icon,
  label,
  description,
  menuItems,
  headerTitle,
  ...options
});

export const createMenuItem = (
  id: string,
  name: string,
  route?: string,
  options?: Partial<MenuItem>
): MenuItem => ({
  id,
  name,
  ...options
});

export const createSidebarConfig = (
  modules: ModuleConfig[],
  userProfileModule: ModuleConfig,
  options?: Partial<SidebarConfig>
): SidebarConfig => ({
  modules,
  userProfileModule,
  ...defaultSidebarConfig,
  ...options
});

// Helper function to inject signOut handler into the sidebar config
export const configureSidebarWithAuth = (
  config: SidebarConfig,
  signOutHandler: () => Promise<void>
): SidebarConfig => {
  const updatedUserProfileModule = {
    ...config.userProfileModule,
    menuItems: config.userProfileModule.menuItems.map(item => {
      if (item.id === 'logout') {
        return {
          ...item,
          onClick: signOutHandler
        };
      }
      return item;
    })
  };

  return {
    ...config,
    userProfileModule: updatedUserProfileModule
  };
};

// Menu item ID to translation key mapping
const menuItemTranslationKeys: Record<string, string> = {
  'mission-control-main': 'sidebar.menuItems.missionControlMain',
  'clients': 'sidebar.menuItems.clientCompass',
  'company-dashboard': 'sidebar.menuItems.dashboard',
  'commercial': 'sidebar.menuItems.commercialIntelligence',
  'company-strategic-blueprint': 'sidebar.menuItems.strategicBlueprint',
  'company-business-canvas': 'sidebar.menuItems.businessCanvas',
  'company-feasibility': 'sidebar.menuItems.feasibilityStudies',
  'company-market-analysis': 'sidebar.menuItems.marketAnalysis',
  'company-commercial-performance': 'sidebar.menuItems.commercialPerformance',
  'company-variance-analysis': 'sidebar.menuItems.varianceAnalysis',
  'company-pricing-strategy': 'sidebar.menuItems.pricingStrategy',
  'company-investors': 'sidebar.menuItems.investors',
  'ip-management': 'sidebar.menuItems.ipManagement',
  'company-products': 'sidebar.menuItems.portfolioManagement',
  'company-milestones': 'sidebar.menuItems.enterpriseRoadmap',
  'compliance-instances': 'sidebar.menuItems.complianceInstances',
  'company-documents': 'sidebar.menuItems.documents',
  'company-gap-analysis': 'sidebar.menuItems.gapAnalysis',
  'company-activities': 'sidebar.menuItems.activities',
  'company-audits': 'sidebar.menuItems.audits',
  'operations': 'sidebar.menuItems.operations',
  'company-budget': 'sidebar.menuItems.budgetDashboard',
  'company-suppliers': 'sidebar.menuItems.suppliers',
  'company-pms': 'sidebar.menuItems.postMarketSurveillance',
  'company-training': 'sidebar.menuItems.training',
  
  'audit-log': 'sidebar.menuItems.auditLog',
  'device-audit-log': 'sidebar.menuItems.auditLog',
  'dashboard': 'sidebar.menuItems.deviceDashboard',
  'strategic-growth': 'sidebar.menuItems.businessCase',
  'venture-blueprint': 'sidebar.menuItems.ventureBlueprint',
  'market-analysis': 'sidebar.menuItems.marketAnalysis',
  'reimbursement': 'sidebar.menuItems.reimbursement',
  'pricing': 'sidebar.menuItems.pricingStrategy',
  'rnpv': 'sidebar.menuItems.rnpvAnalysis',
  'xyreg-genesis': 'sidebar.menuItems.xyregGenesis',
  'device-definition': 'sidebar.menuItems.deviceDefinition',
  'overview': 'sidebar.menuItems.overview',
  'purpose': 'sidebar.menuItems.intendedPurpose',
  'general': 'sidebar.menuItems.general',
  'identification': 'sidebar.menuItems.identification',
  'regulatory': 'sidebar.menuItems.regulatory',
  'markets-tab': 'sidebar.menuItems.targetMarkets',
  'bundles': 'sidebar.menuItems.bundles',
  'design-risk-controls': 'sidebar.menuItems.designRiskControls',
  'requirements': 'sidebar.menuItems.requirements',
  'architecture': 'sidebar.menuItems.architecture',
  'risk-mgmt': 'sidebar.menuItems.riskManagement',
  'vv': 'sidebar.menuItems.verificationValidation',
  'traceability': 'sidebar.menuItems.traceability',
  'clinical-trials': 'sidebar.menuItems.clinicalTrials',
  'milestones': 'sidebar.menuItems.milestones',
  'design-review': 'sidebar.menuItems.designReview',
  'company-design-review': 'sidebar.menuItems.designReview',
  'documents': 'sidebar.menuItems.technicalDocumentation',
  'gap-analysis': 'sidebar.menuItems.gapAnalysis',
  'technical-file': 'sidebar.menuItems.technicalFile',
  'activities': 'sidebar.menuItems.activities',
  'audits': 'sidebar.menuItems.audits',
  'pms': 'sidebar.menuItems.postMarketSurveillance',
  'device-operations': 'sidebar.menuItems.operations',
  'supply-chain': 'sidebar.menuItems.supplyChain',
  'manufacturing': 'sidebar.menuItems.manufacturing',
  'production': 'sidebar.menuItems.production',
  'incoming-inspection': 'sidebar.menuItems.incomingInspection',
  'user-access': 'sidebar.menuItems.userAccess',
  'document-studio': 'sidebar.menuItems.documentStudio',
  'review-panel': 'sidebar.menuItems.reviewPanel',
  'billing': 'sidebar.menuItems.billing',
  'lifecycle-phases': 'sidebar.menuItems.lifecyclePhases',
  'templates': 'sidebar.menuItems.templates',
  'users': 'sidebar.menuItems.users',
  'stakeholders': 'sidebar.menuItems.stakeholders',
  'reviewers': 'sidebar.menuItems.reviewers',
  'training': 'sidebar.menuItems.training',
  'profile': 'sidebar.menuItems.profile',
  'logout': 'sidebar.menuItems.logOut',
  'marketplace-preview': 'sidebar.menuItems.marketplacePreview',
};

// Module ID to translation key mapping
const moduleTranslationKeys: Record<string, { label: string; description: string }> = {
  'mission-control': { label: 'sidebar.modules.missionControl', description: 'sidebar.modules.missionControlDesc' },
  'portfolio': { label: 'sidebar.modules.portfolio', description: 'sidebar.modules.portfolioDesc' },
  'products': { label: 'sidebar.modules.products', description: 'sidebar.modules.productsDesc' },
  'draft-studio': { label: 'sidebar.modules.draftStudio', description: 'sidebar.modules.draftStudioDesc' },
  'review': { label: 'sidebar.modules.review', description: 'sidebar.modules.reviewDesc' },
  'general': { label: 'sidebar.modules.general', description: 'sidebar.modules.generalDesc' },
  'company-settings': { label: 'sidebar.modules.companySettings', description: 'sidebar.modules.companySettingsDesc' },
  'user-profile': { label: 'sidebar.modules.userProfile', description: 'sidebar.modules.userProfileDesc' },
};

// Helper function to get translation key for a menu item
export const getMenuItemTranslationKey = (itemId: string): string | null => {
  return menuItemTranslationKeys[itemId] || null;
};

// Helper function to get translation keys for a module
export const getModuleTranslationKeys = (moduleId: string): { label: string; description: string } | null => {
  return moduleTranslationKeys[moduleId] || null;
};

// Helper function to translate a menu item name
export const translateMenuItem = (item: MenuItem, lang: (key: string) => string): MenuItem => {
  const translationKey = menuItemTranslationKeys[item.id];
  const translatedName = translationKey ? lang(translationKey) : item.name;

  return {
    ...item,
    name: translatedName !== translationKey ? translatedName : item.name,
    children: item.children?.map(child => translateMenuItem(child, lang)),
  };
};

// Helper function to translate a module config
export const translateModuleConfig = (module: ModuleConfig, lang: (key: string) => string): ModuleConfig => {
  const moduleKeys = moduleTranslationKeys[module.id];
  const translatedLabel = moduleKeys ? lang(moduleKeys.label) : module.label;
  const translatedDescription = moduleKeys ? lang(moduleKeys.description) : module.description;

  return {
    ...module,
    label: translatedLabel !== moduleKeys?.label ? translatedLabel : module.label,
    description: translatedDescription !== moduleKeys?.description ? translatedDescription : module.description,
    menuItems: module.menuItems.map(item => translateMenuItem(item, lang)),
  };
};

// Helper function to translate the entire sidebar config
export const translateSidebarConfig = (config: SidebarConfig, lang: (key: string) => string): SidebarConfig => {
  return {
    ...config,
    modules: config.modules.map(module => translateModuleConfig(module, lang)),
    companySettingsModule: translateModuleConfig(config.companySettingsModule, lang),
    userProfileModule: translateModuleConfig(config.userProfileModule, lang),
  };
};

/**
 * Shared role-based module filter used by L1PrimaryModuleBar and NavigationSearchDialog.
 * Any changes here are automatically reflected in both the sidebar and the search dialog.
 */
export const filterModulesByRole = (
  modules: ModuleConfig[],
  role: string,
  isInvestor: boolean
): ModuleConfig[] => {
  return modules.filter(module => {
    if (module.hidden) return false;
    if (module.id === 'general' || module.id === 'genesis') return false;

    // Investor users see ONLY the investor module + mission-control
    if (isInvestor) {
      return module.id === 'investor' || module.id === 'mission-control';
    }
    if (module.id === 'investor') return false;

    // Authors can ONLY see the review module
    if (role === 'author') return module.id === 'review';

    // Viewers see only review module
    if (role === 'viewer') return module.id === 'review';

    // Editors see specific modules including products (Devices)
    if (role === 'editor') {
      const editorAllowed = ['home', 'review', 'mission-control', 'portfolio', 'products'];
      return editorAllowed.includes(module.id);
    }

    // Admin and other roles see all modules except review module
    if (module.hiddenForNonReviewers && role !== 'viewer') return false;
    return true;
  });
};