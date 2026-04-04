import React, { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { Badge } from "@/components/ui/badge";
import { Info, FileX, Clock, ShieldAlert, CircleCheck, Package, Zap, TrendingUp } from "lucide-react";
import { getStatusColor } from "@/utils/statusUtils";
import { detectProductType, getProductTypeLabel } from "@/utils/productTypeDetection";
import { sanitizeImageArray } from "@/utils/imageDataUtils";
import { formatDeviceClassLabel } from "@/utils/deviceClassUtils";
// import "./style.css";
interface ProductGridProps {
    products: any[];
    getProductCardBg: (status: string) => string;
}

export function ProductAgList({ products, getProductCardBg }: ProductGridProps) {
    const navigate = useNavigate();
    const [gridApi, setGridApi] = useState(null);

    // Thumbnail Cell Renderer
    const ThumbnailCellRenderer = useCallback((props: any) => {
        const product = props.data;
        const selectedImage = localStorage.getItem(`selectedImage_${product.id}`);
        const imageUrls = sanitizeImageArray(product.image);
        const urlParts = imageUrls[0]?.split(',');
        const primaryImage = selectedImage || (imageUrls.length > 0 ? decodeURIComponent(urlParts[0]) : undefined);

        return (
            <div className="flex items-center justify-center h-full p-2">
                {primaryImage ? (
                    <img
                        src={primaryImage}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-200 hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/40x40?text=N/A";
                        }}
                    />
                ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-200 shadow-sm">
                        <Package className="h-5 w-5 text-gray-500" />
                    </div>
                )}
            </div>
        );
    }, []);

    // Status Cell Renderer
    const StatusCellRenderer = useCallback((props: any) => {
        const status = props.value;
        const getStatusConfig = (status: string) => {
            switch (status?.toLowerCase()) {
                case 'active':
                    return {
                        color: 'bg-emerald-500',
                        textColor: 'text-emerald-700',
                        bgColor: 'bg-emerald-50',
                        icon: <Zap className="w-3 h-3" />
                    };
                case 'concept':
                    return {
                        color: 'bg-blue-500',
                        textColor: 'text-blue-700',
                        bgColor: 'bg-blue-50',
                        icon: <TrendingUp className="w-3 h-3" />
                    };
                case 'pending':
                    return {
                        color: 'bg-amber-500',
                        textColor: 'text-amber-700',
                        bgColor: 'bg-amber-50',
                        icon: <Clock className="w-3 h-3" />
                    };
                case 'completed':
                    return {
                        color: 'bg-green-600',
                        textColor: 'text-green-700',
                        bgColor: 'bg-green-50',
                        icon: <CircleCheck className="w-3 h-3" />
                    };
                case 'cancelled':
                    return {
                        color: 'bg-red-500',
                        textColor: 'text-red-700',
                        bgColor: 'bg-red-50',
                        icon: <FileX className="w-3 h-3" />
                    };
                default:
                    return {
                        color: 'bg-gray-500',
                        textColor: 'text-gray-700',
                        bgColor: 'bg-gray-50',
                        icon: <Info className="w-3 h-3" />
                    };
            }
        };

        const config = getStatusConfig(status);

        return (
            <div className="flex items-center gap-2 px-3 py-2">
                <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
                <span className={`text-sm font-medium ${config.textColor}`}>
                    {status}
                </span>
            </div>
        );
    }, []);

    // Product Type Cell Renderer
    const ProductTypeCellRenderer = useCallback((props: any) => {
        const product = props.data;
        const productType = detectProductType(product);
        const productTypeLabel = getProductTypeLabel(productType);

        const getTypeConfig = (type: string) => {
            switch (type) {
                case 'new_product':
                    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300';
                case 'existing_product':
                    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300';
                case 'line_extension':
                    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300';
                default:
                    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300';
            }
        };

        return (
            <div className="flex items-center justify-center px-2">
                <span className={getTypeConfig(productType)}>
                    {productTypeLabel}
                </span>
            </div>
        );
    }, []);

    // Progress Cell Renderer
    const ProgressCellRenderer = useCallback((props: any) => {
        const progress = props.value || 0;

        const getProgressColor = (progress: number) => {
            if (progress < 25) return 'bg-red-500';
            if (progress < 50) return 'bg-orange-500';
            if (progress < 75) return 'bg-yellow-500';
            return 'bg-green-500';
        };

        const getProgressBg = (progress: number) => {
            if (progress < 25) return 'bg-red-100';
            if (progress < 50) return 'bg-orange-100';
            if (progress < 75) return 'bg-yellow-100';
            return 'bg-green-100';
        };

        return (
            <div className="flex items-center gap-3 px-3 py-2 w-full">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressColor(progress)}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getProgressBg(progress)}`}>
                    {progress}%
                </span>
            </div>
        );
    }, []);

    // Phase Cell Renderer
    const PhaseCellRenderer = useCallback((props: any) => {
        const phase = props.value;
        const getPhaseConfig = (phase: string) => {
            switch (phase?.toLowerCase()) {
                case 'concept':
                    return 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20';
                case 'development':
                    return 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20';
                case 'testing':
                    return 'bg-orange-100 text-orange-800 ring-1 ring-orange-600/20';
                case 'production':
                    return 'bg-green-100 text-green-800 ring-1 ring-green-600/20';
                case 'unknown':
                    return 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20';
                default:
                    return 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-600/20';
            }
        };

        return (
            <div className="flex items-center justify-center px-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getPhaseConfig(phase)}`}>
                    {phase}
                </span>
            </div>
        );
    }, []);

    // Class Cell Renderer
    const ClassCellRenderer = useCallback((props: any) => {
        if (!props.value) {
            return (
                <div className="flex items-center justify-center text-gray-400 text-sm">
                    <span>—</span>
                </div>
            );
        }

        const getClassConfig = (classValue: string) => {
            const num = parseInt(classValue) || 1;
            if (num === 1) return 'bg-green-100 text-green-700 ring-1 ring-green-600/20';
            if (num === 2) return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20';
            if (num === 3) return 'bg-red-100 text-red-700 ring-1 ring-red-600/20';
            return 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20';
        };

        return (
            <div className="flex items-center justify-center px-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getClassConfig(props.value)}`}>
                    {formatDeviceClassLabel(props.value)}
                </span>
            </div>
        );
    }, []);

    // Target Date Cell Renderer
    const TargetDateCellRenderer = useCallback((props: any) => {
        if (!props.value) {
            return (
                <div className="flex items-center justify-center text-gray-400 text-sm">
                    <span>Not set</span>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center px-2">
                <span className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded border">
                    {props.value}
                </span>
            </div>
        );
    }, []);

    // Product Name Cell Renderer
    const ProductNameCellRenderer = useCallback((props: any) => {
        return (
            <div className="flex items-center px-3 py-2">
                <span className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                    {props.value}
                </span>
            </div>
        );
    }, []);

    // Platform Cell Renderer
    const PlatformCellRenderer = useCallback((props: any) => {
        if (!props.value) {
            return (
                <div className="flex items-center justify-center text-gray-400 text-sm">
                    <span>—</span>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center px-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 ring-1 ring-indigo-600/20">
                    {props.value}
                </span>
            </div>
        );
    }, []);

    // Alerts Cell Renderer
    const AlertsCellRenderer = useCallback((props: any) => {
        const product = props.data;
        const alerts = [];

        if (product.documents && Array.isArray(product.documents)) {
            if (product.documents.some(doc => doc.status === "Overdue")) {
                alerts.push({ icon: FileX, label: "Overdue documents", color: "text-red-500" });
            }
        }

        if (product.audits && Array.isArray(product.audits)) {
            if (product.audits.some(audit => audit.status === "Unscheduled")) {
                alerts.push({ icon: Clock, label: "Unscheduled audit", color: "text-amber-500" });
            }
        }

        if (product.certifications && Array.isArray(product.certifications)) {
            if (product.certifications.some(cert => cert.status === "Expiring")) {
                alerts.push({ icon: ShieldAlert, label: "Expiring certification", color: "text-amber-500" });
            }
        }

        if (alerts.length === 0) {
            return (
                <div className="flex items-center justify-center">
                    <CircleCheck className="h-4 w-4 text-green-500" />
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center gap-1">
                {alerts.slice(0, 2).map((alert, idx) => (
                    <div key={idx} title={alert.label} className="hover:scale-110 transition-transform">
                        <alert.icon className={`h-4 w-4 ${alert.color}`} />
                    </div>
                ))}
                {alerts.length > 2 && (
                    <span className="text-xs text-gray-500 font-medium">+{alerts.length - 2}</span>
                )}
            </div>
        );
    }, []);

    // Column Definitions
    const columnDefs = useMemo(() => [
        {
            headerName: "",
            field: "image",
            cellRenderer: ThumbnailCellRenderer,
            width: 60,
            minWidth: 60,
            maxWidth: 60,
            sortable: false,
            filter: false,
            resizable: false,
            suppressMenu: true,
            pinned: 'left' as const
        },
        {
            headerName: "Product Name",
            field: "name",
            cellRenderer: ProductNameCellRenderer,
            width: 200,
            minWidth: 150,
            sortable: true,
            filter: false,
            pinned: 'left' as const
        },
        {
            headerName: "Status",
            field: "status",
            cellRenderer: StatusCellRenderer,
            width: 120,
            sortable: true,
            filter: false
        },
        {
            headerName: "Type",
            field: "productType",
            cellRenderer: ProductTypeCellRenderer,
            width: 160,
            sortable: true,
            filter: false
        },
        {
            headerName: "Phase",
            field: "phase",
            cellRenderer: PhaseCellRenderer,
            width: 120,
            sortable: true,
            filter: false
        },
        {
            headerName: "Class",
            field: "class",
            cellRenderer: ClassCellRenderer,
            width: 90,
            sortable: true,
            filter: false
        },
        {
            headerName: "Progress",
            field: "progress",
            cellRenderer: ProgressCellRenderer,
            width: 150,
            sortable: true,
            filter: false
        },
        {
            headerName: "Target Date",
            field: "targetDate",
            cellRenderer: TargetDateCellRenderer,
            width: 130,
            sortable: true,
            filter: false
        },
        {
            headerName: "Platform",
            field: "product_platform",
            cellRenderer: PlatformCellRenderer,
            width: 130,
            sortable: true,
            filter: false
        },
        {
            headerName: "Alerts",
            field: "alerts",
            cellRenderer: AlertsCellRenderer,
            width: 80,
            sortable: false,
            filter: false,
            suppressMenu: true
        }
    ], [
        ThumbnailCellRenderer,
        StatusCellRenderer,
        ProductTypeCellRenderer,
        ProgressCellRenderer,
        PhaseCellRenderer,
        ClassCellRenderer,
        TargetDateCellRenderer,
        ProductNameCellRenderer,
        PlatformCellRenderer,
        AlertsCellRenderer
    ]);

    // Process products data for AG Grid
    const rowData = useMemo(() => {
        const processedData = products.map(product => ({
            ...product,
            productType: detectProductType(product)
        }));
        
        return processedData;
    }, [products]);

    // Grid Options
    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true,
        filter: false,
        floatingFilter: false,
        menuTabs: ['generalMenuTab' as const],
    }), []);

    // Row click handler
    const onRowClicked = useCallback((event: any) => {
        const product = event.data;
        navigate(`/app/product/${product.id}/device-information`);
    }, [navigate]);

    // Grid ready handler
    const onGridReady = useCallback((params: any) => {    
        setGridApi(params.api);
        
        // Auto-size columns to fit content
        setTimeout(() => {
            const rowCount = params.api.getDisplayedRowCount();
            params.api.sizeColumnsToFit();
        }, 100);
    }, []);

    // Get row style based on product type
    const getRowStyle = useCallback((params) => {
        if (!params.data) return {};

        const product = params.data;
        const productType = detectProductType(product);

        const styles = {
            new_product: { borderLeft: '3px solid #3b82f6' },
            existing_product: { borderLeft: '3px solid #10b981' },
            line_extension: { borderLeft: '3px solid #f59e0b' },
            default: { borderLeft: '3px solid #6b7280' }
        };

        return styles[productType] || styles.default;
    }, []);

    return (
        <div className="w-full bg-white">
            {/* Header */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Product Management Dashboard</h2>
                <p className="text-sm text-gray-600">
                    Showing {products.length} products • Click on any row to view details
                </p>
            </div>

            {/* AG Grid Container */}
            <div className="ag-theme-quartz shadow-lg rounded-lg overflow-hidden border border-gray-200" style={{ height: '650px', width: '100%' }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    animateRows={true}
                    rowSelection="single"
                    onRowClicked={onRowClicked}
                    onGridReady={onGridReady}
                    pagination={true}
                    paginationPageSize={25}
                    paginationPageSizeSelector={[10, 25, 50, 100]}
                    suppressRowClickSelection={false}
                    rowHeight={56}
                    headerHeight={48}
                    suppressRowHoverHighlight={false}
                    getRowStyle={getRowStyle}
                    rowClass="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    suppressColumnVirtualisation={false}
                    suppressRowVirtualisation={false}
                    enableRangeSelection={true}
                    enableCellTextSelection={true}
                    sideBar={{
                        toolPanels: [
                            {
                                id: 'columns',
                                labelDefault: 'Columns',
                                labelKey: 'columns',
                                iconKey: 'columns',
                                toolPanel: 'agColumnsToolPanel',
                            },
                            {
                                id: 'filters',
                                labelDefault: 'Filters',
                                labelKey: 'filters',
                                iconKey: 'filter',
                                toolPanel: 'agFiltersToolPanel',
                            }
                        ],
                        defaultToolPanel: 'columns',
                        hiddenByDefault: true
                    }}
                />
            </div>

            {/* Custom styling */}
            <style>{`
        .ag-theme-quartz {
          --ag-foreground-color: #374151;
          --ag-background-color: #ffffff;
          --ag-header-foreground-color: #1f2937;
          --ag-header-background-color: #f9fafb;
          --ag-odd-row-background-color: #ffffff;
          --ag-even-row-background-color: #f8fafc;
          --ag-row-hover-color: #f0f9ff;
          --ag-selected-row-background-color: #dbeafe;
          --ag-border-color: #e5e7eb;
          --ag-row-border-color: #f3f4f6;
          --ag-header-height: 48px;
          --ag-font-size: 14px;
          --ag-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .ag-theme-quartz .ag-header {
          border-bottom: 2px solid #e5e7eb;
          background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%);
        }

        .ag-theme-quartz .ag-header-cell {
          border-right: 1px solid #e5e7eb;
        }

        .ag-theme-quartz .ag-header-cell-label {
          padding-left: 12px;
          padding-right: 12px;
        }

        .ag-theme-quartz .ag-header-cell-text {
          font-weight: 600;
          color: #374151;
          font-size: 13px;
          letter-spacing: 0.025em;
          text-transform: uppercase;
        }

        .ag-theme-quartz .ag-row {
          border-bottom: 1px solid #f3f4f6;
        }

        .ag-theme-quartz .ag-cell {
          border-right: 1px solid #f9fafb;
          padding-left: 0;
          padding-right: 0;
        }

        .ag-theme-quartz .ag-pinned-left-header,
        .ag-theme-quartz .ag-pinned-left-cols-container {
          border-right: 2px solid #e5e7eb;
          background: #fefefe;
        }

        .ag-theme-quartz .ag-paging-panel {
          border-top: 2px solid #e5e7eb;
          background: #f9fafb;
          padding: 16px;
        }

        .ag-theme-quartz .ag-paging-button {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 12px;
          margin: 0 2px;
          transition: all 0.15s ease;
          color: #374151;
          font-weight: 500;
        }

        .ag-theme-quartz .ag-paging-button:hover:not(.ag-disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .ag-theme-quartz .ag-paging-button.ag-selected {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .ag-theme-quartz .ag-menu {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .ag-theme-quartz .ag-popup {
          border-radius: 8px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
      `}</style>
        </div>
    );
}