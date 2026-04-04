import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Cpu, 
  Building2, 
  Check, 
  Target, 
  Lightbulb,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tier = "genesis" | "core" | "enterprise";

interface TierWhyContent {
  headline: string;
  forWho: string;
  problem: string;
  solution: string;
  features: string[];
}

const tierWhyContent: Record<Tier, TierWhyContent> = {
  genesis: {
    headline: "Validation & Visibility",
    forWho: "Pre-Seed Founders",
    problem: "You have a great idea but no way to validate it or get in front of investors. Building a credible business case from scratch is time-consuming and investors expect structured, data-backed proposals.",
    solution: "Genesis gives you a structured framework to build your MedTech business case. Complete your Venture Blueprint, get an Invest-Ready Viability Score, and share a live pitch link with potential investors.",
    features: [
      "Venture Blueprint Builder",
      "Invest-Ready Viability Score",
      "Live Pitch Link (Shareable)",
      "Competitor & Market Analysis",
      "Optional: AI Booster (500 credits for €49)",
      "Earn credits by inviting founders"
    ]
  },
  core: {
    headline: "Execution Engine",
    forWho: "Funded Startups",
    problem: "Regulatory documentation is eating up your runway and slowing your path to market. Your team spends weeks on compliance paperwork instead of building your device.",
    solution: "Helix OS automates 50%+ of your compliance documentation with AI-driven generation. Go from requirements to ISO 13485 compliant Technical Files in minutes, not months.",
    features: [
      "Full Technical File Export (DHF/DMR)",
      "1 Active Device (ISO 13485 Compliant)",
      "3 Active Module Slots",
      "500 AI Credits / month"
    ]
  },
  enterprise: {
    headline: "Portfolio Command",
    forWho: "Scale-ups & VPs of Regulatory",
    problem: "Managing compliance across multiple devices and teams creates silos, duplicated effort, and audit risk. You need visibility across your entire product portfolio.",
    solution: "Enterprise gives you centralized portfolio oversight with unlimited scale, SSO integration, volume discounts, and dedicated support to keep your multi-device operation running smoothly.",
    features: [
      "Unlimited Module Slots",
      "5+ Included Devices",
      "Portfolio Dashboard & Analytics",
      "SSO & Priority SLA"
    ]
  }
};

const tierStyles: Record<Tier, { icon: React.ReactNode; color: string; accentColor: string; borderColor: string }> = {
  genesis: {
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-teal-500/30 to-teal-600/20",
    accentColor: "text-teal-400",
    borderColor: "border-teal-500/50"
  },
  core: {
    icon: <Cpu className="w-6 h-6" />,
    color: "from-cyan-500/30 to-cyan-600/20",
    accentColor: "text-cyan-400",
    borderColor: "border-cyan-500/50"
  },
  enterprise: {
    icon: <Building2 className="w-6 h-6" />,
    color: "from-amber-500/30 to-amber-600/20",
    accentColor: "text-amber-400",
    borderColor: "border-amber-500/50"
  }
};

interface TierWhyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: Tier | null;
  onSelectTier?: (tier: Tier) => void;
}

const TierWhyModal = ({ isOpen, onClose, tier, onSelectTier }: TierWhyModalProps) => {
  if (!tier) return null;

  const content = tierWhyContent[tier];
  const style = tierStyles[tier];

  const handleSelectTier = () => {
    if (onSelectTier) {
      onSelectTier(tier);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
              style.color
            )}>
              <span className={style.accentColor}>{style.icon}</span>
            </div>
            <div>
              <DialogTitle className={cn("text-xl font-bold", style.accentColor)}>
                {content.headline}
              </DialogTitle>
              <div className="flex items-center gap-1.5 mt-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-400">For: {content.forWho}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* The Problem */}
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-red-400" />
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">The Problem</p>
            </div>
            <p className="text-sm text-slate-300">{content.problem}</p>
          </div>

          {/* The Solution */}
          <div className={cn("p-3 rounded-lg bg-gradient-to-br border", style.color, style.borderColor)}>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className={cn("w-4 h-4", style.accentColor)} />
              <p className={cn("text-xs font-semibold uppercase tracking-wide", style.accentColor)}>The Solution</p>
            </div>
            <p className="text-sm text-slate-200">{content.solution}</p>
          </div>

          {/* Key Features */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">What You Get</p>
            <div className="grid grid-cols-2 gap-2">
              {content.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60">
                  <Check className={cn("w-3.5 h-3.5 flex-shrink-0", style.accentColor)} />
                  <span className="text-xs text-slate-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Button 
            onClick={handleSelectTier}
            className={cn(
              "w-full mt-2",
              tier === "genesis" && "bg-teal-600 hover:bg-teal-700",
              tier === "core" && "bg-cyan-600 hover:bg-cyan-700",
              tier === "enterprise" && "bg-amber-600 hover:bg-amber-700"
            )}
          >
            {tier === "genesis" && "Start Building Your Case"}
            {tier === "core" && "Choose Helix OS"}
            {tier === "enterprise" && "Contact Sales"}
          </Button>
        </div>

        <DialogDescription className="sr-only">
          Detailed explanation of why you should choose the {tier} tier
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default TierWhyModal;
