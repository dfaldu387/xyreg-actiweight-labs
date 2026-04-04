import React, { useState } from 'react';
import { L1PrimaryModuleBar } from '@/components/test/L1PrimaryModuleBar';
import { L2ContextualBar } from '@/components/test/L2ContextualBar';
import { defaultSidebarConfig, SidebarConfig } from '@/components/test/SidebarConfig';

export default function TestSidebarPage() {
  const [activeModule, setActiveModule] = useState<string | null>(defaultSidebarConfig.defaultActiveModule || null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId);
    // Reset product selection when switching modules
    if (moduleId !== 'products') {
      setSelectedProduct(null);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
  };

  const handleBackToProducts = () => {
    setSelectedProduct(null);
  };

  const getModuleDescription = (moduleId: string): string => {
    const descriptions: Record<string, string> = {
      'portfolio': 'The 10,000-foot view for portfolio managers and executives to see the health of the entire company, all products, and company-level compliance.',
      'products': 'The 1,000-foot view for product managers and engineers. This is the new "home base" for managing individual products and drilling into specific product details.',
      'draft-studio': 'A distinct, top-level workspace for creating and managing documentation drafts, separate from live product data.',
      'company-settings': 'A single, dedicated area for administrators to manage users, permissions, and workspace configurations.',
      'user-profile': 'Standard user profile management, preferences, and logout functionality.'
    };
    return descriptions[moduleId] || '';
  };

  return (
    <div className="flex h-screen bg-gray-50">
          {/* L1 Primary Module Bar */}
          <L1PrimaryModuleBar
            activeModule={activeModule}
            onModuleSelect={handleModuleSelect}
            config={defaultSidebarConfig}
          />

          {/* L2 Contextual Bar */}
          <L2ContextualBar
            activeModule={activeModule}
            selectedProduct={selectedProduct}
            onProductSelect={handleProductSelect}
            onBackToProducts={handleBackToProducts}
            config={defaultSidebarConfig}
          />

      {/* Main Content Area (L3) */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Dynamic Sidebar with Routing
              </h1>
              <p className="text-gray-600 mb-8">
                This demonstrates a dynamic two-tier sidebar system with real application routes:
                <br />
                • <strong>L1 (Primary Module Bar):</strong> Icon-only bar with Home, Mission Control, Portfolio, Products, and more
                <br />
                • <strong>L2 (Contextual Bar):</strong> Dynamic menu with expandable items and navigation
                <br />
                • <strong>L3 (Main Content):</strong> Your workspace with real application routes
              </p>
          
          {activeModule ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Active Module: {activeModule.charAt(0).toUpperCase() + activeModule.slice(1).replace('-', ' ')}
              </h2>
              <p className="text-gray-600 mb-4">
                {getModuleDescription(activeModule)}
              </p>
              
              {activeModule === 'products' && selectedProduct && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Selected Product: {selectedProduct.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <p className="text-blue-600 text-sm">
                    You are now in the product-specific context. The L2 sidebar shows the deep menu for this product only.
                    You can work within this product's sections, then switch to Portfolio to check company-wide data,
                    and return here to continue exactly where you left off.
                  </p>
                </div>
              )}
              
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">Features:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Real Application Routes:</strong> All menu items navigate to actual application pages</li>
                      <li>• <strong>Expandable Menus:</strong> Nested menu structures with proper hierarchy</li>
                      <li>• <strong>Dynamic Navigation:</strong> Context-aware menus that change based on selected module</li>
                      <li>• <strong>Product Context:</strong> Product-specific menus with back navigation</li>
                      <li>• <strong>Responsive Design:</strong> Collapsible L2 sidebar for better space utilization</li>
                      <li>• <strong>Tooltips:</strong> Hover tooltips for better user experience</li>
                    </ul>
                  </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Select a Module
              </h2>
              <p className="text-gray-600">
                Click on any icon in the L1 Primary Module Bar to see the contextual navigation appear in the L2 sidebar.
                All menu items are connected to real application routes and will navigate to the corresponding pages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
