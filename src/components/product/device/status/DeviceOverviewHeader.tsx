import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from '@/types/client';
import { Tag, Activity, Clipboard, Clock, Building, Calendar, ImageIcon, Rocket, Shield, GitBranch } from "lucide-react";
import { useProductUDI } from '@/hooks/useProductUDI';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSuggestedConformityRoute } from '@/utils/conformityRouteUtils';
import { normalizeRiskClass } from '@/utils/normalizeRiskClass';

interface DeviceOverviewHeaderProps {
  product: Product;
  currentPhase?: string;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <span className="font-medium text-muted-foreground">{label}:</span>
      <span className="truncate">{value || "Not specified"}</span>
    </div>
  );
}

export function DeviceOverviewHeader({ product, currentPhase }: DeviceOverviewHeaderProps) {
  // Use the Single Source of Truth for UDI data from UDI Management
  const { displayUdiDi, displayBasicUdiDi, variantCount } = useProductUDI(product.id);

  // Family membership detection
  const isVariant = !!(product as any).parent_product_id && (product as any).parent_relationship_type === 'variant';
  const parentProductId = (product as any).parent_product_id as string | null;
  const belongsToFamily = !!(product as any).basic_udi_di || isVariant;

  // Fetch parent name for variants
  const { data: parentProduct } = useQuery({
    queryKey: ['parent-product-name', parentProductId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name')
        .eq('id', parentProductId!)
        .maybeSingle();
      return data;
    },
    enabled: !!parentProductId && isVariant,
    staleTime: 60_000,
  });

  // Count family members for devices with family
  const { data: familyMemberCount } = useQuery({
    queryKey: ['family-member-count', product.id],
    queryFn: async () => {
      const basicUdi = (product as any).basic_udi_di;
      if (!basicUdi) return 0;
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('basic_udi_di', basicUdi)
        .neq('id', product.id);
      return count || 0;
    },
    enabled: belongsToFamily,
    staleTime: 60_000,
  });

  // Notified Body: check market JSONB first, then company-level, then product-level
  const { data: companyInfo } = useCompanyInfo(product.company_id);
  const nb = companyInfo?.notifiedBody;
  const formattedNbNumber = nb?.nb_number ? `NB ${String(nb.nb_number).padStart(4, '0')}` : null;
  const companyNotifiedBodyDisplay = nb 
    ? `${nb.name}${formattedNbNumber ? ` (${formattedNbNumber})` : ''}`
    : null;

  // Extract NB from EU market in markets JSONB
  const marketNotifiedBodyDisplay = (() => {
    const markets = (product as any).markets;
    if (!Array.isArray(markets)) return null;
    const euMarket = markets.find((m: any) => m.code === 'EU');
    if (!euMarket?.notifiedBody) return null;
    const mnb = euMarket.notifiedBody;
    if (typeof mnb === 'string') return mnb;
    const nbNum = mnb.nb_number ? `NB ${String(mnb.nb_number).padStart(4, '0')}` : null;
    return mnb.name ? `${mnb.name}${nbNum ? ` (${nbNum})` : ''}` : null;
  })();

  // Determine if product is launched
  const isLaunched = !!(product as any).actual_launch_date;
  
  // Get primary image - check both 'image' and 'images' properties
  const imageUrl = product.image || 
    (Array.isArray((product as any).images) ? (product as any).images[0]?.url || (product as any).images[0] : null);

  return (
    <Card className="border bg-card">
      <CardContent className="p-4">
        {/* Main Content: Image + Info Grid */}
        <div className="grid grid-cols-[140px_1fr_1fr] gap-4">
          {/* Device Thumbnail */}
          <div className="aspect-square rounded-lg bg-muted overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Column 1 */}
          <div className="space-y-1.5">
            <div className="font-semibold text-foreground truncate">{product.name}</div>
            {belongsToFamily && (
              <Link to={parentProduct ? `/app/product/${parentProduct.id}` : '#'}>
                <Badge variant="outline" className="w-fit gap-1 border-accent-foreground/30 bg-accent/50 text-accent-foreground text-xs hover:bg-accent cursor-pointer">
                  <GitBranch className="h-3 w-3" />
                  Family{parentProduct ? ` · ${parentProduct.name}` : ''}{familyMemberCount ? ` · ${familyMemberCount} member${familyMemberCount > 1 ? 's' : ''}` : ''}
                </Badge>
              </Link>
            )}
            <InfoRow icon={Tag} label="Model" value={product.model_reference || product.model_version} />
            {/* Basic UDI-DI from UDI Management (Single Source of Truth) */}
            <InfoRow icon={Activity} label="Basic UDI-DI" value={displayBasicUdiDi || (variantCount === 0 ? null : `${variantCount} members`)} />
            <InfoRow icon={Tag} label="Device Category" value={product.device_category} />
            <InfoRow icon={Shield} label="Classification" value={(() => {
              const raw = (product as any).eudamed_risk_class || (product as any).class;
              if (!raw) return null;
              const map: Record<string, string> = { 'class-i': 'Class I', 'class_i': 'Class I', 'class-ii': 'Class II', 'class_ii': 'Class II', 'class-iia': 'Class IIa', 'class-2a': 'Class IIa', 'class_iia': 'Class IIa', 'class-iib': 'Class IIb', 'class-2b': 'Class IIb', 'class_iib': 'Class IIb', 'class-iii': 'Class III', 'class_iii': 'Class III' };
              return map[raw] || raw;
            })()} />
          </div>

          {/* Column 2 */}
          <div className="space-y-1.5 pt-6">
            <InfoRow icon={Clock} label="Conformity Route" value={product.conformity_assessment_route || product.conformity_route || (() => {
              const raw = (product as any).eudamed_risk_class || (product as any).class;
              if (!raw) return null;
              const normalized = normalizeRiskClass(raw);
              return normalized ? getSuggestedConformityRoute(normalized) : null;
            })()} />
            <InfoRow icon={Building} label="Notified Body" value={companyNotifiedBodyDisplay || marketNotifiedBodyDisplay || product.notified_body} />
            <InfoRow icon={Calendar} label="Design Freeze" value={product.design_freeze_date ? new Date(product.design_freeze_date).toLocaleDateString() : (isLaunched ? 'N/A' : null)} />
            <InfoRow 
              icon={Rocket} 
              label={(product as any).actual_launch_date ? "Launch Date" : "Est. Launch Date"} 
              value={
                (product as any).actual_launch_date 
                  ? new Date((product as any).actual_launch_date).toLocaleDateString()
                  : (product as any).projected_launch_date
                    ? new Date((product as any).projected_launch_date).toLocaleDateString()
                    : null
              } 
            />
          </div>
        </div>

        {/* Intended Purpose - Aligned with title column */}
        {product.intended_use && (
          <div className="mt-3 pt-2 border-t">
            <div className="flex items-start gap-2 text-sm ml-[156px]">
              <Clipboard className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-muted-foreground">Intended Purpose:</span>
              <span className="line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.intended_use }} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
