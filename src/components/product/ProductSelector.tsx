
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useSimpleClients } from "@/hooks/useSimpleClients";
import { UserCheck, UserX } from "lucide-react";
import { useDevMode } from "@/context/DevModeContext";
import { useTemplateSettings } from "@/hooks/useTemplateSettings";
import { HierarchicalProductSelector } from "./HierarchicalProductSelector";

// Add Company type if missing
interface Company {
  id: string;
  name: string;
}

interface ProductSelectorProps {
  currentProductId?: string;
  companyId?: string;
}

export function ProductSelector({ currentProductId, companyId }: ProductSelectorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDevMode, getCompanyInternalStatus } = useDevMode();
  const { clients, isLoading } = useSimpleClients();
  
  // Get hierarchy setting from template settings if companyId is provided
  const { settings } = useTemplateSettings(companyId || '');
  const shouldUseHierarchy = companyId && settings.product_selector_display_hierarchy;
  
  // Get all products from all companies from the database
  const allProducts = clients.flatMap(client => 
    (client.productList || []).map(product => ({
      id: product.id,
      name: product.name,
      company_id: client.id,
      company_name: client.name
    }))
  );

  // Determine the current section (documents, gap-analysis, audits)
  const getSection = (path: string) => {
    if (path.includes('/documents')) return 'documents';
    if (path.includes('/gap-analysis')) return 'gap-analysis';
    if (path.includes('/audits')) return 'audits';
    return '';
  };
  
  const currentSection = getSection(location.pathname);

  const handleProductChange = (value: string) => {
    if (!value) return;
    
    // Find the product to verify it exists
    const product = allProducts.find(p => p.id === value);
    
    if (!product) {
      toast.error("Product not found");
      return;
    }
    
    // If we're already in a specific section, navigate to that section for the new product
    if (currentSection) {
      navigate(`/app/product/${value}/${currentSection}`);
    } else {
      // Navigate to device information page instead of the product dashboard
      navigate(`/app/product/${value}/device-information`);
    }
  };

  // Use hierarchical selector if setting is enabled
  if (shouldUseHierarchy) {
    return (
      <HierarchicalProductSelector
        currentProductId={currentProductId}
        onProductChange={handleProductChange}
        isLoading={isLoading}
      />
    );
  }

  // Default flat selector
  if (isLoading) {
    return (
      <div className="w-[200px]">
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading products..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="w-[200px]">
      <Select
        value={currentProductId}
        onValueChange={handleProductChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select product" />
        </SelectTrigger>
        <SelectContent>
          {allProducts.map((product) => {
            // Check if user is internal for this product's company
            const isInternalForCompany = isDevMode && process.env.NODE_ENV === 'development'
              ? getCompanyInternalStatus(product.company_id)
              : null;
              
            return (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{product.name}</span>
                  {isDevMode && process.env.NODE_ENV === 'development' && isInternalForCompany !== null && (
                    isInternalForCompany 
                      ? <UserCheck className="h-3 w-3 ml-2 text-green-600" /> 
                      : <UserX className="h-3 w-3 ml-2 text-amber-600" />
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
