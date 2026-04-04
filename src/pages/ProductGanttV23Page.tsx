import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowLeft } from "lucide-react";
import { useProductDetails } from "@/hooks/useProductDetails";
import { GanttChartV23 } from "@/components/gantt-chart/GanttChart";
import { DEFAULT_ZOOM_LEVEL, zoomLevels } from "@/components/gantt-chart/config/ganttChartConfig";
import { ProductType, detectProductType } from "@/utils/productTypeDetection";
import { useTranslation } from "@/hooks/useTranslation";

export default function ProductGanttV23Page() {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { lang } = useTranslation();
    const [currentZoomLevel, setCurrentZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);

    // Fetch product details
    const {
        data: product,
        isLoading: productLoading,
    } = useProductDetails(productId);

    // Detect product type
    const productType = useMemo((): ProductType | null => {
        if (!product) return null;
        
        // Prefer explicit project type if provided on the product
        const hasLegacyProjectType =
            Array.isArray((product as any).project_types) &&
            (product as any).project_types.some(
                (t: string) => (t || "").toLowerCase() === "legacy product"
            );

        if (hasLegacyProjectType) {
            return "legacy_product";
        }

        return detectProductType(product);
    }, [product]);

    const handleZoomIn = () => {
        if (currentZoomLevel < zoomLevels.length - 1) {
            setCurrentZoomLevel((prev) => prev + 1);
        }
    };

    const handleZoomOut = () => {
        if (currentZoomLevel > 0) {
            setCurrentZoomLevel((prev) => prev - 1);
        }
    };

    const handleResetZoom = () => {
        setCurrentZoomLevel(DEFAULT_ZOOM_LEVEL);
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex-1">
                <div className="">
                    {productId && (
                        <GanttChartV23
                            productId={productId}
                            currentZoomLevel={currentZoomLevel}
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                            onResetZoom={handleResetZoom}
                            title={`${product?.name || 'Product'} ${lang('gantt.timeline')}`}
                            productType={productType}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

