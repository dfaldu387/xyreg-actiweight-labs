import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PasswordExpirationService } from "@/services/passwordExpirationService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Lock,
  Mail,
  CreditCard,
  Calendar,
  Download,
  Crown,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
  Sparkles,
  Package,
  Users,
  Brain,
  Layers,
  HardDrive,
  BarChart3,
  RotateCcw,
  ArrowUpCircle,
  Plus,
  Minus,
  ShoppingCart,
  Settings,
  Shield,
  Search,
  ClipboardList,
  Cpu,
  GraduationCap,
  Scale,
  Briefcase,
  ChevronRight,
  Check,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { StripeService } from "@/services/stripeService";
import { cn } from "@/lib/utils";
import { newPricingService, NewPricingPlan, NewPricingCompanyPlan } from "@/services/newPricingService";

interface SubscriptionData {
  id: string;
  subscription_id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

interface InvoiceData {
  id: string;
  invoice_id: string;
  amount_paid: number;
  currency: string;
  status: string;
  invoice_url: string;
  hosted_invoice_url: string;
  paid_at: string;
  created_at: string;
}

interface UsageData {
  devices: { used: number; limit: number };
  teamMembers: { used: number; limit: number };
  aiCredits: { used: number; limit: number };
  moduleSlots: { used: number; limit: number };
  storage: { used: number; limit: number }; // in MB
  documents: { used: number; limit: number };
}

interface PaymentMethodData {
  id: string;
  brand: string; // visa, mastercard, amex, etc.
  last4: string;
  exp_month: number;
  exp_year: number;
  funding: string; // credit, debit, prepaid
}

// Plan limits configuration
const PLAN_LIMITS: Record<string, Partial<UsageData>> = {
  genesis: {
    devices: { used: 0, limit: 1 },
    teamMembers: { used: 0, limit: 999 }, // Unlimited
    aiCredits: { used: 0, limit: 0 }, // Pay as you go
    moduleSlots: { used: 0, limit: 0 },
    storage: { used: 0, limit: 500 },
    documents: { used: 0, limit: 50 },
  },
  core: {
    devices: { used: 0, limit: 1 },
    teamMembers: { used: 0, limit: 999 }, // Unlimited
    aiCredits: { used: 0, limit: 500 },
    moduleSlots: { used: 0, limit: 3 },
    storage: { used: 0, limit: 5000 },
    documents: { used: 0, limit: 999 }, // Unlimited
  },
  enterprise: {
    devices: { used: 0, limit: 999 }, // Unlimited
    teamMembers: { used: 0, limit: 999 }, // Unlimited
    aiCredits: { used: 0, limit: 999 }, // Unlimited
    moduleSlots: { used: 0, limit: 999 }, // Unlimited
    storage: { used: 0, limit: 999999 }, // Unlimited
    documents: { used: 0, limit: 999 }, // Unlimited
  },
};

// Add-on pricing configuration
const ADD_ON_PRICING = {
  extraDevice: { price: 150, name: "Extra Device", description: "Add another device to your subscription" },
  extraModule: { price: 100, name: "Extra Module Slot", description: "Unlock an additional module slot" },
  aiBooster: { price: 50, credits: 1000, name: "AI Booster Pack", description: "1,000 additional AI credits" },
  genesisAiBooster: { price: 49, credits: 500, name: "Genesis AI Pack", description: "500 AI credits for Genesis users" },
};

// Available modules configuration
const AVAILABLE_MODULES = [
  { id: "ai-requirements", name: "AI Requirements Engineer", icon: Brain, description: "Text-to-Spec generation with AI", category: "builder" },
  { id: "ai-risk", name: "AI Risk Manager", icon: Shield, description: "Hazard Analysis & FMEA tables", category: "builder" },
  { id: "product-management", name: "Product Management", icon: Settings, description: "BOM, Versions, UDI management", category: "builder" },
  { id: "predicate-finder", name: "Predicate Finder", icon: Search, description: "Competitor 510(k) scraping", category: "builder" },
  { id: "clinical-eval", name: "Clinical Eval Writer", icon: FileText, description: "Literature review drafting", category: "builder" },
  { id: "labeling-ifu", name: "Labeling & IFU Gen", icon: ClipboardList, description: "Draft manuals and labels", category: "builder" },
  { id: "software-lifecycle", name: "Software Lifecycle", icon: Cpu, description: "IEC 62304 for SaMD", category: "builder" },
  { id: "usability", name: "Usability Engineering", icon: Users, description: "IEC 62366 protocols", category: "builder" },
  { id: "training", name: "Training Manager", icon: GraduationCap, description: "Competency tracking", category: "guardian" },
  { id: "supplier", name: "Supplier Management", icon: Briefcase, description: "Vendor qualification", category: "guardian" },
  { id: "capa", name: "CAPA Manager", icon: AlertTriangle, description: "Corrective actions", category: "guardian" },
  { id: "audit", name: "Audit Manager", icon: Scale, description: "Internal & external audits", category: "guardian" },
];

// Plan comparison data
const PLAN_TIERS = [
  {
    id: "genesis",
    name: "Genesis",
    subtitle: "The Founder Sandbox",
    price: 0,
    priceLabel: "Free",
    icon: Sparkles,
    color: "teal",
    features: ["1 Device", "Business case tools", "Investor sharing", "Community support"],
  },
  {
    id: "core",
    name: "Helix OS (Beta)",
    subtitle: "Build. Operate. Monitor.",
    price: 499,
    priceLabel: null,
    icon: Zap,
    color: "cyan",
    features: ["1 Device (expandable)", "3 Module slots", "500 AI credits/mo", "Full QMS tools", "Priority support"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "The Scale Platform",
    price: null,
    priceLabel: "Custom",
    icon: Crown,
    color: "amber",
    features: ["Unlimited devices", "Unlimited modules", "Custom AI allocation", "Dedicated support", "SSO & API access"],
  },
];

export default function ProfilePage() {
  const { lang } = useTranslation();
  const { user } = useAuth();
  const { companyName } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab from URL, default to "profile"
  const activeTab = searchParams.get("tab") || "profile";

  // Update URL when tab changes
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  const [isLoading, setIsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodData | null>(null);
  const [paymentMethodLoading, setPaymentMethodLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);

  // New pricing system state
  const [newPricingPlan, setNewPricingPlan] = useState<(NewPricingCompanyPlan & { plan: NewPricingPlan }) | null>(null);

  // Add-ons state
  const [addOnCart, setAddOnCart] = useState<{
    extraDevices: number;
    extraModules: number;
    aiBoosterPacks: number;
  }>({ extraDevices: 0, extraModules: 0, aiBoosterPacks: 0 });
  const [addOnPurchaseLoading, setAddOnPurchaseLoading] = useState(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);

  // Purchased add-ons (from database)
  const [purchasedAddOns, setPurchasedAddOns] = useState<{
    extraDevices: number;
    extraModules: number;
    aiCredits: number;
  }>({ extraDevices: 0, extraModules: 0, aiCredits: 0 });

  const [initialProfileData, setInitialProfileData] = useState({
    firstName: user?.user_metadata.first_name || "",
    lastName: user?.user_metadata.last_name || "",
    email: user?.email || "",
    role: user?.user_metadata.role || "",
  });

  const [profileData, setProfileData] = useState({
    firstName: user?.user_metadata.first_name || "",
    lastName: user?.user_metadata.last_name || "",
    email: user?.email || "",
    role: user?.user_metadata.role || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasChanges =
    profileData.firstName !== initialProfileData.firstName ||
    profileData.lastName !== initialProfileData.lastName;

  // Fetch company ID
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!user) return;

      try {
        if (companyName) {
          const { data: company } = await supabase
            .from("companies")
            .select("id")
            .eq("name", companyName)
            .single();

          if (company) {
            setCompanyId(company.id);
          }
        } else {
          const { data: access } = await supabase
            .from("user_company_access")
            .select("company_id")
            .eq("user_id", user.id)
            .eq("is_primary", true)
            .single();

          if (access) {
            setCompanyId(access.company_id);
          }
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      }
    };

    fetchCompanyId();
  }, [user, companyName]);

  // Fetch subscription data function (extracted for reuse)
  const fetchSubscriptionData = async (showLoading = true) => {
    if (!user) return;

    if (showLoading) {
      setSubscriptionLoading(true);
    }
    try {
      // Fetch subscription - only get active or trialing subscriptions
      const { data: subData, error: subError } = await supabase
        .from("stripe_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error("Error fetching subscription data:", subError);
      }

      // Set subscription to the data or null if no active subscription
      setSubscription(subData || null);

      // Also check new pricing system if we have a companyId
      if (companyId) {
        try {
          const newPlan = await newPricingService.getCompanyPlan(companyId);
          setNewPricingPlan(newPlan);
          console.log('[ProfilePage] New pricing plan:', newPlan);
        } catch (newPlanError) {
          console.error("Error fetching new pricing plan:", newPlanError);
        }
      }

      // Fetch invoices - by user_id OR company_id so all company members can see billing
      let invoiceQuery = supabase
        .from("stripe_invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (companyId) {
        invoiceQuery = invoiceQuery.or(`user_id.eq.${user.id},company_id.eq.${companyId}`);
      } else {
        invoiceQuery = invoiceQuery.eq("user_id", user.id);
      }

      const { data: invData, error: invError } = await invoiceQuery;

      if (invData && !invError) {
        // Deduplicate invoices (in case same invoice matched both user_id and company_id)
        const uniqueInvoices = invData.filter((inv, idx, self) =>
          idx === self.findIndex(i => i.invoice_id === inv.invoice_id)
        );
        setInvoices(uniqueInvoices);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      if (showLoading) {
        setSubscriptionLoading(false);
      }
    }
  };

  // Fetch subscription and invoices on mount
  useEffect(() => {
    fetchSubscriptionData();
  }, [user, companyId]);

  // Fetch purchased add-ons from checkout sessions
  useEffect(() => {
    const fetchPurchasedAddOns = async () => {
      if (!user) return;

      try {
        // Fetch all checkout sessions to calculate total purchased add-ons
        const { data: sessions, error } = await supabase
          .from("stripe_checkout_sessions")
          .select("metadata")
          .eq("user_id", user.id)
          .not("metadata", "is", null);

        if (error) {
          console.error("Error fetching checkout sessions:", error);
          return;
        }

        if (sessions && sessions.length > 0) {
          let totalDevices = 0;
          let totalModules = 0;
          let totalAiCredits = 0;

          sessions.forEach((session: any) => {
            const metadata = session.metadata;
            if (metadata) {
              // Sum up all purchased add-ons
              totalDevices += parseInt(metadata.extraDevices) || 0;
              totalModules += parseInt(metadata.extraModules) || 0;
              // AI booster packs give 500 or 1000 credits each
              const aiPacks = parseInt(metadata.aiBoosterPacks) || 0;
              const creditsPerPack = metadata.tier === "genesis" ? 500 : 1000;
              totalAiCredits += aiPacks * creditsPerPack;
            }
          });

          setPurchasedAddOns({
            extraDevices: totalDevices,
            extraModules: totalModules,
            aiCredits: totalAiCredits,
          });
        }
      } catch (error) {
        console.error("Error fetching purchased add-ons:", error);
      }
    };

    fetchPurchasedAddOns();
  }, [user]);

  // Fetch usage data
  useEffect(() => {
    const fetchUsageData = async () => {
      if (!user || !companyId) return;

      try {
        // Get current plan - first check new pricing, then fallback
        let planKey = "genesis";
        if (newPricingPlan?.plan) {
          const npName = newPricingPlan.plan.name?.toLowerCase() || "genesis";
          planKey = npName === "core" || npName === "helix" ? "core" :
            npName === "enterprise" ? "enterprise" : "genesis";
        } else if (subscription?.plan_name) {
          const planName = subscription.plan_name.toLowerCase();
          planKey = planName.includes("core") || planName.includes("helix") ? "core" :
            planName.includes("enterprise") ? "enterprise" : "genesis";
        } else {
          const userPlan = (user?.user_metadata as Record<string, unknown>)?.selectedPlan?.toString().toLowerCase() || "genesis";
          planKey = userPlan.includes("core") || userPlan.includes("helix") ? "core" :
            userPlan.includes("enterprise") ? "enterprise" : "genesis";
        }

        const planLimits = PLAN_LIMITS[planKey];

        // Fetch devices/products count
        const { count: devicesCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId);

        // Fetch team members count
        const { count: teamCount } = await supabase
          .from("user_company_access")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId);

        // Fetch documents count
        const { count: docsCount } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId);

        // Fetch AI credits used (if ai_credits table exists)
        let aiCreditsUsed = 0;
        // ai_credits table may not exist yet, skip query for now

        setUsage({
          devices: {
            used: devicesCount || 0,
            limit: (planLimits?.devices?.limit || 1) + purchasedAddOns.extraDevices
          },
          teamMembers: {
            used: teamCount || 0,
            limit: planLimits?.teamMembers?.limit || 999
          },
          aiCredits: {
            used: aiCreditsUsed,
            limit: (planLimits?.aiCredits?.limit || 0) + purchasedAddOns.aiCredits
          },
          moduleSlots: {
            used: activeModules.length, // Track active modules
            limit: (planLimits?.moduleSlots?.limit || 0) + purchasedAddOns.extraModules
          },
          storage: {
            used: 0, // Would need to calculate from file sizes
            limit: planLimits?.storage?.limit || 500
          },
          documents: {
            used: docsCount || 0,
            limit: planLimits?.documents?.limit || 50
          },
        });
      } catch (error) {
        console.error("Error fetching usage data:", error);
      }
    };

    fetchUsageData();
  }, [user, companyId, subscription, newPricingPlan, purchasedAddOns, activeModules]);

  // Fetch payment method from Stripe
  useEffect(() => {
    const fetchPaymentMethod = async () => {
      if (!user) return;

      setPaymentMethodLoading(true);
      try {
        // Get customer_id from checkout session
        const { data: checkoutSession } = await supabase
          .from("stripe_checkout_sessions")
          .select("customer_id")
          .eq("user_id", user.id)
          .not("customer_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (checkoutSession?.customer_id) {
          // Fetch payment method from Stripe via edge function
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data, error } = await supabase.functions.invoke("get-payment-method", {
              body: { customerId: checkoutSession.customer_id },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (!error && data?.paymentMethod) {
              setPaymentMethod(data.paymentMethod);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching payment method:", error);
      } finally {
        setPaymentMethodLoading(false);
      }
    };

    fetchPaymentMethod();
  }, [user]);

  const fetchUserCompanyAccess = async (user: any) => {
    const { data: userCompanyAccess, error: userCompanyAccessError } =
      await supabase
        .from("user_company_access")
        .select("*")
        .eq("user_id", user?.id)
        .single();
    if (userCompanyAccessError) {
      console.error(
        "Error fetching user company access:",
        userCompanyAccessError
      );
    }
    if (userCompanyAccess) {
      setProfileData({ ...profileData, role: userCompanyAccess.access_level });
    }
  };

  useEffect(() => {
    if (user?.user_metadata) {
      const loaded = {
        firstName: user.user_metadata.first_name || "",
        lastName: user.user_metadata.last_name || "",
        email: user.email || "",
        role: user.user_metadata.role || "",
      };
      setProfileData(loaded);
      setInitialProfileData(loaded);
      fetchUserCompanyAccess(user);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
        },
      });

      if (error) throw error;

      toast.success(lang("profile.profileUpdatedSuccess"));
      window.location.reload();
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || lang("profile.profileUpdateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(lang("profile.passwordsDoNotMatch"));
      return;
    }

    const pw = passwordData.newPassword;
    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
      toast.error("Password must be at least 8 characters with uppercase, lowercase, number, and special character.");
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
        data: { requires_password_change: false },
      });

      if (error) throw error;

      // Record password change for expiration tracking
      if (user?.id) {
        await PasswordExpirationService.recordPasswordChange(user.id, 'manual');
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success(lang("profile.passwordUpdatedSuccess"));
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(error.message || lang("profile.passwordUpdateFailed"));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      // Find the Stripe subscription ID from multiple sources
      let stripeSubId = subscription?.subscription_id || null;

      // Fallback: check user_subscriptions for current user
      if (!stripeSubId && user) {
        const { data: userSub } = await supabase
          .from("user_subscriptions")
          .select("stripe_subscription_id")
          .eq("user_id", user.id)
          .not("stripe_subscription_id", "is", null)
          .maybeSingle();
        stripeSubId = userSub?.stripe_subscription_id || null;
      }

      // Fallback: check new_pricing_company_plans metadata
      if (!stripeSubId && newPricingPlan?.metadata) {
        const meta = newPricingPlan.metadata as Record<string, any>;
        stripeSubId = meta.stripe_subscription_id || null;
      }

      // Fallback: check user_subscriptions for any company member
      if (!stripeSubId && companyId) {
        const { data: companyMembers } = await supabase
          .from("user_company_access")
          .select("user_id")
          .eq("company_id", companyId);

        if (companyMembers) {
          for (const member of companyMembers) {
            const { data: memberSub } = await supabase
              .from("user_subscriptions")
              .select("stripe_subscription_id")
              .eq("user_id", member.user_id)
              .not("stripe_subscription_id", "is", null)
              .maybeSingle();
            if (memberSub?.stripe_subscription_id) {
              stripeSubId = memberSub.stripe_subscription_id;
              break;
            }
          }
        }
      }

      // Cancel Stripe subscription if found
      if (stripeSubId) {
        await StripeService.cancelSubscription(stripeSubId);
        setSubscription((prev) =>
          prev ? { ...prev, status: "canceled", cancel_at_period_end: true } : null
        );
      }

      // Cancel new pricing plan if exists
      if (newPricingPlan?.id && companyId) {
        const { error: updateError } = await supabase
          .from("new_pricing_company_plans")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", newPricingPlan.id);

        if (updateError) throw new Error(updateError.message);

        setNewPricingPlan((prev) =>
          prev ? { ...prev, status: "cancelled" } : null
        );
      }

      toast.success("Subscription cancelled successfully");
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.subscription_id) return;

    setReactivateLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase.functions.invoke("reactivate-subscription", {
          body: { subscriptionId: subscription.subscription_id },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw new Error(error.message);

        // Handle different response cases
        if (data.requires_new_plan) {
          toast.info("Your previous plan is no longer available. Please select a new plan.");
          navigate("/pricing");
          return;
        }

        if (data.requires_payment_method) {
          toast.info("Please add a payment method to reactivate your subscription.");
          handleManagePaymentMethod();
          return;
        }

        if (data.success) {
          toast.success("Subscription reactivated successfully! Your plan will continue.");

          // Update local state with new subscription data
          setSubscription((prev) =>
            prev ? {
              ...prev,
              subscription_id: data.subscription?.id || prev.subscription_id,
              cancel_at_period_end: false,
              status: data.subscription?.status || "active"
            } : null
          );
        }
      }
    } catch (error: any) {
      console.error("Error reactivating subscription:", error);
      toast.error(error.message || "Failed to reactivate subscription");
    } finally {
      setReactivateLoading(false);
    }
  };

  const handleUpgradePlan = () => {
    navigate("/pricing");
  };

  // Get current plan tier
  const getCurrentPlanTier = () => {
    // First check new pricing system — use it even if cancelled (to show correct plan info)
    if (newPricingPlan?.plan) {
      const planName = newPricingPlan.plan.name?.toLowerCase() || "genesis";
      if (planName === "core" || planName === "helix") return "core";
      if (planName === "enterprise") return "enterprise";
      if (planName === "genesis") return "genesis";
    }

    // Fall back to stripe subscription
    if (subscription) {
      // Check subscription status - cancelled/inactive means Genesis
      if (subscription.status === "canceled" || subscription.status === "cancelled") {
        return "genesis";
      }

      const planName = subscription.plan_name?.toLowerCase() || "genesis";
      if (planName.includes("core") || planName.includes("helix")) return "core";
      if (planName.includes("enterprise")) return "enterprise";
      return "genesis";
    }

    // Default to Genesis (free) plan
    return "genesis";
  };

  // Get current plan name for display
  const getCurrentPlanName = () => {
    // First check new pricing system
    if (newPricingPlan?.plan) {
      return newPricingPlan.plan.display_name || newPricingPlan.plan.name || "Genesis";
    }

    // Fall back to stripe subscription
    const tier = getCurrentPlanTier();
    if (tier === "genesis") return "Genesis";
    if (tier === "core") return subscription?.plan_name || "Helix OS";
    if (tier === "enterprise") return subscription?.plan_name || "Enterprise";
    return "Genesis";
  };

  // Calculate add-on cart total
  const calculateAddOnTotal = () => {
    const currentTier = getCurrentPlanTier();
    const devicePrice = ADD_ON_PRICING.extraDevice.price;
    const modulePrice = ADD_ON_PRICING.extraModule.price;
    const aiPrice = currentTier === "genesis" ? ADD_ON_PRICING.genesisAiBooster.price : ADD_ON_PRICING.aiBooster.price;

    return (
      addOnCart.extraDevices * devicePrice +
      addOnCart.extraModules * modulePrice +
      addOnCart.aiBoosterPacks * aiPrice
    );
  };

  // Handle add-on quantity change
  const handleAddOnQuantityChange = (type: "extraDevices" | "extraModules" | "aiBoosterPacks", delta: number) => {
    setAddOnCart(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }));
  };

  // Handle add-on purchase
  const handleAddOnPurchase = async () => {
    if (calculateAddOnTotal() === 0) {
      toast.error("Please select at least one add-on");
      return;
    }

    setAddOnPurchaseLoading(true);
    try {
      const currentTier = getCurrentPlanTier();
      const totalPrice = calculateAddOnTotal();

      // Create checkout for add-ons only (no base plan)
      await StripeService.handlePlanPurchase({
        planId: `${currentTier}_addons_only`,
        name: `${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Add-ons`,
        price: `€${totalPrice}`,
        tier: currentTier,
        extraDevices: addOnCart.extraDevices,
        extraModules: addOnCart.extraModules,
        aiBoosterPacks: addOnCart.aiBoosterPacks,
        // Don't pass stripePriceId - we only want add-ons, not the base plan
      }, companyId || undefined);

      // Reset cart after purchase
      setAddOnCart({ extraDevices: 0, extraModules: 0, aiBoosterPacks: 0 });
    } catch (error: any) {
      console.error("Error purchasing add-ons:", error);
      toast.error(error.message || "Failed to process add-on purchase");
    } finally {
      setAddOnPurchaseLoading(false);
    }
  };

  // Handle module toggle
  const handleModuleToggle = (moduleId: string) => {
    const currentTier = getCurrentPlanTier();
    const baseSlots = PLAN_LIMITS[currentTier]?.moduleSlots?.limit || 0;
    // Include purchased add-ons in the max slots calculation
    const maxSlots = baseSlots + purchasedAddOns.extraModules;

    if (activeModules.includes(moduleId)) {
      setActiveModules(prev => prev.filter(id => id !== moduleId));
    } else {
      if (activeModules.length >= maxSlots && maxSlots !== 999) {
        toast.error(`You've reached your module slot limit (${maxSlots}). Purchase more slots or upgrade your plan.`);
        return;
      }
      setActiveModules(prev => [...prev, moduleId]);
    }
  };

  // Handle plan change
  const handleChangePlan = async (planId: string) => {
    if (planId === "enterprise") {
      navigate("/pricing?tier=enterprise");
      return;
    }

    const plan = PLAN_TIERS.find(p => p.id === planId);
    if (!plan) return;

    try {
      if (plan.price === 0) {
        // Downgrade to free plan (Genesis)
        setDowngradeLoading(true);

        // Try to cancel subscription in Stripe if exists
        if (subscription?.subscription_id) {
          try {
            await StripeService.cancelSubscription(subscription.subscription_id);
          } catch (cancelError: any) {
            // Subscription might not exist in Stripe - that's OK for downgrade
            console.warn("Stripe cancellation failed (may already be cancelled):", cancelError);
          }
        }

        // Always update local database to mark subscription as cancelled
        if (subscription?.id) {
          const { error: updateError } = await supabase
            .from("stripe_subscriptions")
            .update({
              status: "canceled",
              cancel_at_period_end: true,
              canceled_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);

          if (updateError) {
            console.error("Error updating subscription in database:", updateError);
          }
        }

        // Clear local subscription state immediately to update UI
        setSubscription(null);
        setDowngradeLoading(false);

        toast.success("Successfully switched to Genesis plan!");
      } else {
        // Upgrade to paid plan
        await StripeService.handlePlanPurchase({
          planId: planId === "core" ? "core_os_base" : planId,
          name: plan.name,
          price: `€${plan.price}`,
          stripePriceId: planId === "core" ? import.meta.env.VITE_STRIPE_PRICE_CORE_BASE : undefined,
          tier: planId as "genesis" | "core" | "enterprise",
        }, companyId || undefined);
      }
    } catch (error: any) {
      console.error("Error changing plan:", error);
      setDowngradeLoading(false);
      toast.error(error.message || "Failed to change plan");
    }
  };

  const handleManagePaymentMethod = async () => {
    // Open Stripe Customer Portal to manage payment methods
    try {
      if (!companyId) {
        toast.error("No company found. Please try again.");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { companyId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!error && data?.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("No billing account found. Please contact support.");
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast.error("Failed to open billing portal. Please try again.");
    }
  };

  // Get card brand display info
  const getCardBrandInfo = (brand: string) => {
    const brands: Record<string, { name: string; color: string; bgColor: string }> = {
      visa: { name: "Visa", color: "text-blue-600", bgColor: "bg-blue-50" },
      mastercard: { name: "Mastercard", color: "text-orange-600", bgColor: "bg-orange-50" },
      amex: { name: "American Express", color: "text-blue-500", bgColor: "bg-blue-50" },
      discover: { name: "Discover", color: "text-orange-500", bgColor: "bg-orange-50" },
      diners: { name: "Diners Club", color: "text-blue-700", bgColor: "bg-blue-50" },
      jcb: { name: "JCB", color: "text-green-600", bgColor: "bg-green-50" },
      unionpay: { name: "UnionPay", color: "text-red-600", bgColor: "bg-red-50" },
    };
    return brands[brand?.toLowerCase()] || { name: brand || "Card", color: "text-gray-600", bgColor: "bg-gray-50" };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "eur") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      active: { color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="h-3 w-3" /> },
      trialing: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Clock className="h-3 w-3" /> },
      trial: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Clock className="h-3 w-3" /> },
      canceled: { color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
      cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
      expired: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: <AlertTriangle className="h-3 w-3" /> },
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="h-3 w-3" /> },
      past_due: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <AlertTriangle className="h-3 w-3" /> },
      paid: { color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", icon: null };

    return (
      <Badge className={cn("flex items-center gap-1 capitalize", config.color)}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getPlanIcon = (planName: string) => {
    const plan = planName?.toLowerCase() || "";
    if (plan.includes("genesis")) return <Sparkles className="h-5 w-5 text-teal-500" />;
    if (plan.includes("core")) return <Zap className="h-5 w-5 text-cyan-500" />;
    if (plan.includes("enterprise")) return <Crown className="h-5 w-5 text-amber-500" />;
    return <CreditCard className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-tour="user-profile">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{lang("profile.title")}</h1>
          <p className="text-muted-foreground">{lang("profile.subtitle")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Plan & Billing
          </TabsTrigger>
          <TabsTrigger value="addons" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Add-ons
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>

        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {lang("profile.personalInformation")}
              </CardTitle>
              <CardDescription>
                {lang("profile.personalInformationDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{lang("profile.firstName")}</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          firstName: e.target.value,
                        })
                      }
                      placeholder={lang("profile.firstNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{lang("profile.lastName")}</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          lastName: e.target.value,
                        })
                      }
                      placeholder={lang("profile.lastNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{lang("profile.role")}</Label>
                    <Input
                      id="role"
                      value={profileData.role}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{lang("profile.email")}</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {lang("profile.emailCannotBeChanged")}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading || !hasChanges}>
                    {isLoading ? lang("profile.updating") : lang("profile.updateProfile")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Password Change Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {lang("profile.security")}
              </CardTitle>
              <CardDescription>{lang("profile.securityDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{lang("profile.newPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder={lang("profile.newPasswordPlaceholder")}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordData.newPassword.length > 0 && (() => {
                    const pw = passwordData.newPassword;
                    const rules = [
                      { label: "At least 8 characters", met: pw.length >= 8 },
                      { label: "Uppercase letter (A-Z)", met: /[A-Z]/.test(pw) },
                      { label: "Lowercase letter (a-z)", met: /[a-z]/.test(pw) },
                      { label: "Number (0-9)", met: /[0-9]/.test(pw) },
                      { label: "Special character (!@#$...)", met: /[^A-Za-z0-9]/.test(pw) },
                    ];
                    const metCount = rules.filter(r => r.met).length;
                    const strengthPercent = (metCount / rules.length) * 100;
                    const strengthColor = strengthPercent <= 40 ? "bg-red-500" : strengthPercent <= 80 ? "bg-yellow-500" : "bg-green-500";
                    const strengthLabel = strengthPercent <= 40 ? "Weak" : strengthPercent <= 80 ? "Medium" : "Strong";

                    return (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Password strength</span>
                          <span className={cn(
                            "font-medium",
                            strengthPercent <= 40 ? "text-red-500" : strengthPercent <= 80 ? "text-yellow-600" : "text-green-600"
                          )}>{strengthLabel}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-300", strengthColor)}
                            style={{ width: `${strengthPercent}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-1 mt-1">
                          {rules.map((rule) => (
                            <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                              {rule.met ? (
                                <Check className="h-3 w-3 text-green-600 shrink-0" />
                              ) : (
                                <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                              <span className={rule.met ? "text-green-600" : "text-muted-foreground"}>
                                {rule.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {lang("profile.confirmNewPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder={lang("profile.confirmNewPasswordPlaceholder")}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs mt-1">
                      {passwordData.newPassword === passwordData.confirmPassword ? (
                        <>
                          <Check className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span className="text-red-500">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      passwordLoading ||
                      passwordData.newPassword !== passwordData.confirmPassword ||
                      passwordData.newPassword.length < 8 ||
                      !/[A-Z]/.test(passwordData.newPassword) ||
                      !/[a-z]/.test(passwordData.newPassword) ||
                      !/[0-9]/.test(passwordData.newPassword) ||
                      !/[^A-Za-z0-9]/.test(passwordData.newPassword)
                    }
                  >
                    {passwordLoading
                      ? lang("profile.updating")
                      : lang("profile.changePassword")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan & Billing Tab */}
        <TabsContent value="plan" className="space-y-6">
          {subscriptionLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Current Plan Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getPlanIcon(getCurrentPlanName())}
                        Current Plan
                      </CardTitle>
                      <CardDescription>
                        Manage your subscription and billing
                      </CardDescription>
                    </div>
                    {getStatusBadge(newPricingPlan?.status || (getCurrentPlanTier() === "genesis" ? "active" : (subscription?.status || "active")))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Plan Details Grid - Show for both subscription and Genesis users */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Crown className="h-4 w-4" />
                        Plan Name
                      </div>
                      <p className="text-xl font-semibold">
                        {getCurrentPlanName()}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        {getCurrentPlanTier() !== "genesis" ? "Next Billing Date" : "Plan Type"}
                      </div>
                      <p className="text-xl font-semibold">
                        {getCurrentPlanTier() !== "genesis"
                          ? (newPricingPlan?.expires_at
                              ? formatDate(newPricingPlan.expires_at)
                              : subscription?.current_period_end
                                ? formatDate(subscription.current_period_end)
                                : newPricingPlan?.status === "trial" && newPricingPlan?.trial_ends_at
                                  ? formatDate(newPricingPlan.trial_ends_at)
                                  : "Active Subscription")
                          : "Free"}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        {getCurrentPlanTier() !== "genesis" ? "Billing Period Started" : "Member Since"}
                      </div>
                      <p className="text-xl font-semibold">
                        {getCurrentPlanTier() !== "genesis"
                          ? (newPricingPlan?.started_at
                              ? formatDate(newPricingPlan.started_at)
                              : subscription?.current_period_start
                                ? formatDate(subscription.current_period_start)
                                : formatDate(user?.created_at || ""))
                          : formatDate(user?.created_at || "")}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <RefreshCw className="h-4 w-4" />
                        {getCurrentPlanTier() !== "genesis" ? "Auto-Renewal" : "Status"}
                      </div>
                      <p className="text-xl font-semibold">
                        {getCurrentPlanTier() !== "genesis"
                          ? (subscription?.cancel_at_period_end || newPricingPlan?.status === "cancelled" ? "Disabled" : "Enabled")
                          : "Active"}
                      </p>
                    </div>
                  </div>

                  {/* Cancellation Warning with Reactivate Options - Only show for paid plans */}
                  {getCurrentPlanTier() !== "genesis" && subscription?.cancel_at_period_end && (
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            Subscription Ending
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                            Your {subscription.plan_name} subscription will end on{" "}
                            {formatDate(subscription.current_period_end)}. After this date,
                            you'll be downgraded to the free Genesis plan.
                          </p>

                          {/* Reactivate Options */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              size="sm"
                              onClick={handleReactivateSubscription}
                              disabled={reactivateLoading}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              {reactivateLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Reactivating...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Keep My {subscription.plan_name}
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleUpgradePlan}
                              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                            >
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              Switch to Different Plan
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6">
                  {getCurrentPlanTier() !== "genesis" && (
                    (subscription?.status === "active" || (newPricingPlan?.status === "active" || newPricingPlan?.status === "trial"))
                  ) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel your {getCurrentPlanName()} subscription?
                            {subscription?.current_period_end
                              ? ` You'll continue to have access until ${formatDate(subscription.current_period_end)}, after which you'll be downgraded to the free plan.`
                              : " You'll be downgraded to the free Genesis plan."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancelSubscription}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={cancelLoading}
                          >
                            {cancelLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              "Yes, Cancel"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardFooter>
              </Card>

              {/* Payment Method Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Manage your billing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentMethodLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : paymentMethod ? (
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                      <div className="flex items-center gap-4">
                        {/* Card Brand Icon */}
                        <div className={cn(
                          "w-14 h-10 rounded-md flex items-center justify-center",
                          getCardBrandInfo(paymentMethod.brand).bgColor
                        )}>
                          <span className={cn(
                            "font-bold text-sm",
                            getCardBrandInfo(paymentMethod.brand).color
                          )}>
                            {getCardBrandInfo(paymentMethod.brand).name.slice(0, 4).toUpperCase()}
                          </span>
                        </div>

                        {/* Card Details */}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {getCardBrandInfo(paymentMethod.brand).name}
                            </p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {paymentMethod.funding}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            •••• •••• •••• {paymentMethod.last4}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires {paymentMethod.exp_month.toString().padStart(2, '0')}/{paymentMethod.exp_year}
                          </p>
                        </div>
                      </div>

                      {/* Update Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManagePaymentMethod}
                      >
                        Update
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="text-muted-foreground mb-3">
                        No payment method on file
                      </p>
                      {(subscription || newPricingPlan) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleManagePaymentMethod}
                        >
                          Add Payment Method
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Plan Options Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    Plan Options
                  </CardTitle>
                  <CardDescription>
                    Compare plans and upgrade or downgrade your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLAN_TIERS.map((plan) => {
                      const isCurrentPlan = getCurrentPlanTier() === plan.id;
                      const currentTierIndex = PLAN_TIERS.findIndex(p => p.id === getCurrentPlanTier());
                      const planTierIndex = PLAN_TIERS.findIndex(p => p.id === plan.id);
                      const isDowngrade = planTierIndex < currentTierIndex;
                      const isUpgrade = planTierIndex > currentTierIndex;
                      const PlanIcon = plan.icon;
                      const colorClasses = {
                        teal: "border-teal-300 bg-teal-50 dark:bg-teal-900/20",
                        cyan: "border-cyan-300 bg-cyan-50 dark:bg-cyan-900/20",
                        amber: "border-amber-300 bg-amber-50 dark:bg-amber-900/20",
                      };

                      return (
                        <div
                          key={plan.id}
                          className={cn(
                            "p-4 rounded-lg border-2 relative",
                            isCurrentPlan ? colorClasses[plan.color as keyof typeof colorClasses] : "border-slate-200 dark:border-slate-700",
                            (plan as any).popular && !isCurrentPlan && "ring-2 ring-cyan-500"
                          )}
                        >
                          {(plan as any).popular && !isCurrentPlan && (
                            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-cyan-500">Launching in Q1</Badge>
                          )}
                          {isCurrentPlan && (
                            <Badge className="absolute -top-2 right-2 bg-green-500">Current</Badge>
                          )}

                          <div className="text-center mb-4 pt-2">
                            <div className={cn(
                              "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center",
                              `bg-${plan.color}-100 dark:bg-${plan.color}-900`
                            )}>
                              <PlanIcon className={`h-6 w-6 text-${plan.color}-600`} />
                            </div>
                            <h3 className="font-bold text-lg">{plan.name}</h3>
                            <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                            <div className="mt-2">
                              {plan.priceLabel ? (
                                <span className="text-2xl font-bold">{plan.priceLabel}</span>
                              ) : (
                                <>
                                  <span className="text-2xl font-bold">€{plan.price}</span>
                                  <span className="text-muted-foreground">/mo</span>
                                </>
                              )}
                            </div>
                          </div>

                          <ul className="space-y-2 mb-4">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>

                          <Button
                            variant={isCurrentPlan ? "outline" : isDowngrade ? "destructive" : "default"}
                            className={cn("w-full", isDowngrade && !isCurrentPlan && "bg-orange-500 hover:bg-orange-600")}
                            disabled={isCurrentPlan || (isDowngrade && downgradeLoading)}
                            onClick={() => handleChangePlan(plan.id)}
                          >
                            {isCurrentPlan ? (
                              "Current Plan"
                            ) : plan.price === null ? (
                              "Contact Sales"
                            ) : isDowngrade ? (
                              downgradeLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Downgrading...
                                </>
                              ) : (
                                "Downgrade"
                              )
                            ) : (
                              "Become a Pilot"
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Invoice History Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoice History
                  </CardTitle>
                  <CardDescription>
                    View and download your past invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <div className="space-y-3">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {formatCurrency(invoice.amount_paid, invoice.currency)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(invoice.paid_at || invoice.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(invoice.status)}
                            {invoice.invoice_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(invoice.invoice_url, "_blank")}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            )}
                            {invoice.hosted_invoice_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(invoice.hosted_invoice_url, "_blank")
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-muted-foreground">
                        No invoices yet. Your invoices will appear here after your first
                        payment.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Usage Tab with Accordion */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage Overview
              </CardTitle>
              <CardDescription>
                View your resource usage across devices, AI credits, and modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="devices" className="w-full">
                {/* Devices Accordion */}
                <AccordionItem value="devices">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold">Devices</h4>
                        <p className="text-sm text-muted-foreground">
                          {usage?.devices.used || 0} / {(usage?.devices.limit || 1) + addOnCart.extraDevices} slots used
                        </p>
                      </div>
                      {purchasedAddOns.extraDevices > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 ml-2">
                          +{purchasedAddOns.extraDevices} purchased
                        </Badge>
                      )}
                      {addOnCart.extraDevices > 0 && (
                        <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 ml-2">
                          +{addOnCart.extraDevices} in cart
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      <Progress
                        value={((usage?.devices.used || 0) / ((usage?.devices.limit || 1) + addOnCart.extraDevices)) * 100}
                        className="h-3 mb-2"
                      />
                      <p className="text-sm text-muted-foreground">
                        Active products in your company
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* AI Credits Accordion */}
                <AccordionItem value="aiCredits">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold">AI Credits</h4>
                        <p className="text-sm text-muted-foreground">
                          {usage?.aiCredits.used || 0} / {(usage?.aiCredits.limit || 0) + addOnCart.aiBoosterPacks * (getCurrentPlanTier() === "genesis" ? 500 : 1000)} credits used
                        </p>
                      </div>
                      {purchasedAddOns.aiCredits > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 ml-2">
                          +{purchasedAddOns.aiCredits} purchased
                        </Badge>
                      )}
                      {addOnCart.aiBoosterPacks > 0 && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 ml-2">
                          +{addOnCart.aiBoosterPacks * (getCurrentPlanTier() === "genesis" ? 500 : 1000)} in cart
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      <Progress
                        value={((usage?.aiCredits.used || 0) / ((usage?.aiCredits.limit || 1) + addOnCart.aiBoosterPacks * (getCurrentPlanTier() === "genesis" ? 500 : 1000))) * 100}
                        className="h-3 mb-2"
                      />
                      <p className="text-sm text-muted-foreground">
                        Credits for AI document generation
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Module Slots Accordion */}
                <AccordionItem value="modules">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold">Module Slots</h4>
                        <p className="text-sm text-muted-foreground">
                          {activeModules.length} / {(usage?.moduleSlots?.limit || 3) + addOnCart.extraModules} slots used
                        </p>
                      </div>
                      {purchasedAddOns.extraModules > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 ml-2">
                          +{purchasedAddOns.extraModules} purchased
                        </Badge>
                      )}
                      {addOnCart.extraModules > 0 && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 ml-2">
                          +{addOnCart.extraModules} in cart
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      {getCurrentPlanTier() === "genesis" ? (
                        <div className="text-center py-4">
                          <Lock className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                          <p className="text-muted-foreground mb-2">
                            Upgrade to Helix OS to unlock modules
                          </p>
                          <Button size="sm" onClick={handleUpgradePlan}>
                            <ArrowUpCircle className="h-4 w-4 mr-2" />
                            Upgrade
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Progress
                            value={(activeModules.length / ((usage?.moduleSlots?.limit || 3) + addOnCart.extraModules)) * 100}
                            className="h-3 mb-2"
                          />
                          <p className="text-sm text-muted-foreground mb-4">
                            Active compliance modules
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {AVAILABLE_MODULES.map((module) => {
                              const ModuleIcon = module.icon;
                              const isActive = activeModules.includes(module.id);
                              return (
                                <div
                                  key={module.id}
                                  className={cn(
                                    "p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3",
                                    isActive
                                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                  )}
                                  onClick={() => handleModuleToggle(module.id)}
                                >
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                    isActive
                                      ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  )}>
                                    <ModuleIcon className="h-4 w-4" />
                                  </div>
                                  <span className={cn(
                                    "text-sm font-medium flex-1",
                                    isActive && "text-green-700 dark:text-green-300"
                                  )}>
                                    {module.name}
                                  </span>
                                  {isActive && (
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add-ons Tab */}
        <TabsContent value="addons" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                One-click purchases for common add-ons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quick AI Credits */}
                <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200">AI Credits</h4>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        {getCurrentPlanTier() === "genesis" ? "500 credits" : "1,000 credits"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      €{getCurrentPlanTier() === "genesis" ? ADD_ON_PRICING.genesisAiBooster.price : ADD_ON_PRICING.aiBooster.price}
                    </span>
                    <Button size="sm" onClick={() => handleAddOnQuantityChange("aiBoosterPacks", 1)} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                {/* Quick Extra Device - Core only */}
                {getCurrentPlanTier() !== "genesis" && (
                  <div className="p-4 rounded-lg border bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-cyan-800 dark:text-cyan-200">Extra Device</h4>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400">Add another device</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-cyan-700 dark:text-cyan-300">€{ADD_ON_PRICING.extraDevice.price}/mo</span>
                      <Button
                        size="sm"
                        onClick={() => handleAddOnQuantityChange("extraDevices", 1)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quick Extra Module - Core only */}
                {getCurrentPlanTier() !== "genesis" && (
                  <div className="p-4 rounded-lg border bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200">Module Slot</h4>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Unlock new modules</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-amber-700 dark:text-amber-300">€{ADD_ON_PRICING.extraModule.price}/mo</span>
                      <Button
                        size="sm"
                        onClick={() => handleAddOnQuantityChange("extraModules", 1)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                )}

                {/* Genesis Upgrade Prompt */}
                {getCurrentPlanTier() === "genesis" && (
                  <div className="p-4 rounded-lg border bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800 col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
                        <ArrowUpCircle className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-cyan-800 dark:text-cyan-200">Upgrade to Helix OS</h4>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400">
                          Get extra devices, modules, and more AI credits
                        </p>
                      </div>
                      <Button onClick={handleUpgradePlan} className="bg-cyan-600 hover:bg-cyan-700">
                        Upgrade Now
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add-on Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Configure Add-ons
              </CardTitle>
              <CardDescription>
                Customize your subscription with additional resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Extra Devices */}
              {getCurrentPlanTier() !== "genesis" && (
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                      <Package className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{ADD_ON_PRICING.extraDevice.name}</h4>
                      <p className="text-sm text-muted-foreground">{ADD_ON_PRICING.extraDevice.description}</p>
                      <p className="text-sm font-medium text-cyan-600">€{ADD_ON_PRICING.extraDevice.price}/month each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAddOnQuantityChange("extraDevices", -1)}
                      disabled={addOnCart.extraDevices === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold text-lg">{addOnCart.extraDevices}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAddOnQuantityChange("extraDevices", 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Extra Module Slots */}
              {getCurrentPlanTier() !== "genesis" && (
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                      <Layers className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{ADD_ON_PRICING.extraModule.name}</h4>
                      <p className="text-sm text-muted-foreground">{ADD_ON_PRICING.extraModule.description}</p>
                      <p className="text-sm font-medium text-amber-600">€{ADD_ON_PRICING.extraModule.price}/month each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAddOnQuantityChange("extraModules", -1)}
                      disabled={addOnCart.extraModules === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold text-lg">{addOnCart.extraModules}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAddOnQuantityChange("extraModules", 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* AI Booster Packs */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      {getCurrentPlanTier() === "genesis" ? ADD_ON_PRICING.genesisAiBooster.name : ADD_ON_PRICING.aiBooster.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {getCurrentPlanTier() === "genesis" ? ADD_ON_PRICING.genesisAiBooster.description : ADD_ON_PRICING.aiBooster.description}
                    </p>
                    <p className="text-sm font-medium text-purple-600">
                      €{getCurrentPlanTier() === "genesis" ? ADD_ON_PRICING.genesisAiBooster.price : ADD_ON_PRICING.aiBooster.price} per pack
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAddOnQuantityChange("aiBoosterPacks", -1)}
                    disabled={addOnCart.aiBoosterPacks === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-lg">{addOnCart.aiBoosterPacks}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAddOnQuantityChange("aiBoosterPacks", 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>

            {/* Cart Summary */}
            {calculateAddOnTotal() > 0 && (
              <CardFooter className="border-t pt-6">
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-primary">€{calculateAddOnTotal()}</span>
                  </div>
                  <Button
                    onClick={handleAddOnPurchase}
                    disabled={addOnPurchaseLoading}
                    className="w-full"
                    size="lg"
                  >
                    {addOnPurchaseLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Purchase Add-ons
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
