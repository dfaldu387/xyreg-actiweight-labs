import { useEffect, useState } from "react";
import { Lightbulb, AlertCircle } from "lucide-react";
import { getDeviceClassGuidance, extractDeviceClass } from "@/utils/clinicalEvidenceGuidance";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface EvidenceGuidanceBannerProps {
  productId: string;
}

export function EvidenceGuidanceBanner({ productId }: EvidenceGuidanceBannerProps) {
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch product data directly from database to ensure fresh data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('markets, class, eudamed_risk_class, key_technology_characteristics, key_features')
          .eq('id', productId)
          .single();

        if (error) {
          console.error('[EvidenceGuidanceBanner] Error fetching product:', error);
          setIsLoading(false);
          return;
        }

        setProduct(data);
      } catch (err) {
        console.error('[EvidenceGuidanceBanner] Exception:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (isLoading) return null;

  const deviceClass = extractDeviceClass(product);

  const guidance = getDeviceClassGuidance(deviceClass);

  // No classification yet - show prompt to complete it
  if (!deviceClass || !guidance) {
    return (
      <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Device classification not set
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Complete device classification to see clinical evidence recommendations tailored to your device risk level.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/30"
              onClick={() => navigate(`/app/product/${productId}/device-information?tab=regulatory`)}
            >
              Go to Classification
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show guidance based on device class
  const bgColor = {
    'low': 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800',
    'medium': 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
    'high': 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800',
    'very-high': 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
  }[guidance.riskLevel];

  const iconColor = {
    'low': 'text-emerald-600 dark:text-emerald-400',
    'medium': 'text-blue-600 dark:text-blue-400',
    'high': 'text-orange-600 dark:text-orange-400',
    'very-high': 'text-red-600 dark:text-red-400',
  }[guidance.riskLevel];

  const textColor = {
    'low': 'text-emerald-800 dark:text-emerald-200',
    'medium': 'text-blue-800 dark:text-blue-200',
    'high': 'text-orange-800 dark:text-orange-200',
    'very-high': 'text-red-800 dark:text-red-200',
  }[guidance.riskLevel];

  const bulletColor = {
    'low': 'text-emerald-700 dark:text-emerald-300',
    'medium': 'text-blue-700 dark:text-blue-300',
    'high': 'text-orange-700 dark:text-orange-300',
    'very-high': 'text-red-700 dark:text-red-300',
  }[guidance.riskLevel];

  return (
    <div className={`mb-6 p-4 rounded-lg border ${bgColor}`}>
      <div className="flex items-start gap-3">
        <Lightbulb className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
        <div>
          <p className={`text-sm font-medium ${textColor}`}>
            {guidance.title}
          </p>
          <ul className={`text-sm ${bulletColor} mt-2 space-y-1`}>
            {guidance.bullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
