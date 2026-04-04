// Free plan constants - Business Connect (Investors plan)
export const FREE_PLAN_PRODUCT_ID = "prod_TEJVFZOptDTedI";
export const FREE_PLAN_PRICE_ID = "price_1SHqsIPWQwH62VVmfATB7NEe";

export const SUBSCRIPTION_PLANS = {
  business_connect: {
    name: "Business Connect",
    price_id: FREE_PLAN_PRICE_ID,
    product_id: FREE_PLAN_PRODUCT_ID,
    price: 0,
    features: [
      "1 Company Workspace",
      "Up to 1 User",
      "1 New Product",
      "User Roles (Admin, Editor, Viewer)",
      "Custom Lifecycle Phases",
      "Product Dashboard & KPI Overview",
      "Unlimited Document Management",
      "1 Gap Analysis Framework (MDR Annex I)",
      "Up to 3 Audit Templates"
    ]
  },
  starter: {
    name: "Starter",
    price_id: "price_1SGL3RPWQwH62VVmPh2OkbuL",
    product_id: "prod_TCkYqOai1Z4KLZ",
    price: 29,
    features: [
      "Up to 5 products",
      "Basic document management",
      "Email support",
      "30-day free trial"
    ]
  },
  professional: {
    name: "Professional",
    price_id: "price_1SGL3lPWQwH62VVmQwQosBaC",
    product_id: "prod_TCkYOHKTrItTzT",
    price: 99,
    features: [
      "Unlimited products",
      "Advanced compliance tools",
      "Priority support",
      "30-day free trial"
    ]
  },
  enterprise: {
    name: "Enterprise",
    price_id: "price_1SGL4NPWQwH62VVmT3oveGWQ",
    product_id: "prod_TCkZxsavnrL4oH",
    price: 299,
    features: [
      "Everything in Professional",
      "Dedicated support",
      "Custom integrations",
      "30-day free trial"
    ]
  }
} as const;

export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

export interface SubscriptionStatus {
  subscribed: boolean;
  product_id?: string;
  subscription_end?: string;
  trial_end?: string;
  status?: string;
}

export function getPlanByProductId(productId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.product_id === productId) {
      return key as PlanKey;
    }
  }
  return null;
}
