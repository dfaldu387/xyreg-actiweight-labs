import React from 'react';
import { Tag, Activity, Clock, Building, Calendar, ImageIcon, Rocket, Shield } from 'lucide-react';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductUDI } from '@/hooks/useProductUDI';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="font-medium text-muted-foreground">{label}:</span>
      <span className="truncate">{value || "Not specified"}</span>
    </div>
  );
}

interface FloatingDeviceCardProps {
  productId: string;
  x: number;
  y: number;
}

export function FloatingDeviceCard({ productId, x, y }: FloatingDeviceCardProps) {
  const { data: product } = useProductDetails(productId);
  const { displayBasicUdiDi } = useProductUDI(productId);
  const { data: companyInfo } = useCompanyInfo(product?.company_id);
  const nb = companyInfo?.notifiedBody;
  const formattedNbNumber = nb?.nb_number ? `NB ${String(nb.nb_number).padStart(4, '0')}` : null;
  const companyNotifiedBodyDisplay = nb
    ? `${nb.name}${formattedNbNumber ? ` (${formattedNbNumber})` : ''}`
    : null;

  const imageUrl = product?.image ||
    (Array.isArray((product as any)?.images) ? (product as any).images[0]?.url || (product as any).images[0] : null);

  if (!product) return null;

  return (
    <div
      className="absolute z-[9999] w-[560px] p-4 rounded-lg border bg-popover text-popover-foreground shadow-lg"
      style={{ left: x + 16, top: y - 20 }}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-md bg-muted overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Two-column info grid */}
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-6">
          {/* Column 1 */}
          <div className="space-y-1.5">
            <div className="font-semibold text-foreground text-sm truncate">{product.name}</div>
            <InfoRow icon={Tag} label="Model" value={product.model_reference || product.model_version} />
            <InfoRow icon={Activity} label="Basic UDI-DI" value={displayBasicUdiDi} />
            <InfoRow icon={Tag} label="Category" value={product.device_category} />
            <InfoRow icon={Shield} label="Classification" value={(() => {
              const raw = (product as any).eudamed_risk_class || (product as any).class;
              if (!raw) return null;
              const map: Record<string, string> = { 'class-i': 'Class I', 'class_i': 'Class I', 'class-ii': 'Class II', 'class_ii': 'Class II', 'class-iia': 'Class IIa', 'class-2a': 'Class IIa', 'class_iia': 'Class IIa', 'class-iib': 'Class IIb', 'class-2b': 'Class IIb', 'class_iib': 'Class IIb', 'class-iii': 'Class III', 'class_iii': 'Class III' };
              return map[raw] || raw;
            })()} />
          </div>

          {/* Column 2 */}
          <div className="space-y-1.5 pt-5">
            <InfoRow icon={Clock} label="Conformity Route" value={product.conformity_assessment_route || product.conformity_route} />
            <InfoRow icon={Building} label="Notified Body" value={companyNotifiedBodyDisplay || product.notified_body} />
            <InfoRow icon={Calendar} label="Design Freeze" value={product.design_freeze_date ? new Date(product.design_freeze_date).toLocaleDateString() : null} />
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
      </div>
    </div>
  );
}
