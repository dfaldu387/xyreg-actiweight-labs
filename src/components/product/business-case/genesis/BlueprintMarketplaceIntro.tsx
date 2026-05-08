import React from 'react';
import { Store, FileCheck, Eye, Share2 } from 'lucide-react';

/**
 * Investor Marketplace + 3-step "how it works" intro for Venture Blueprint.
 * Trimmed copy of XyregGenesisWelcome — only the marketplace banner and the
 * Complete Checklist / Configure Visibility / Share Your Way cards.
 */
export function BlueprintMarketplaceIntro() {
  return (
    <div className="space-y-4">
      {/* Investor Marketplace banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-5 border border-emerald-200 dark:border-emerald-800/50">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center flex-shrink-0">
            <Store className="h-5 w-5 text-emerald-700 dark:text-emerald-200" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
              Investor Marketplace
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Host your B-case on our marketplace for free. Get feedback and connect directly with verified investors.
            </p>
          </div>
        </div>
      </div>

      {/* 3-step grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-200">1</div>
            <FileCheck className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-1 text-blue-800 dark:text-blue-200">Complete Checklist</h3>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Click each step to fill in the required fields shown in the sidebar
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-200">2</div>
            <Eye className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="font-semibold mb-1 text-emerald-800 dark:text-emerald-200">Configure Visibility</h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Control exactly what investors can see in your presentation
          </p>
        </div>

        <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-4 border border-violet-200 dark:border-violet-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center text-sm font-bold text-violet-700 dark:text-violet-200">3</div>
            <Share2 className="h-5 w-5 text-violet-600" />
          </div>
          <h3 className="font-semibold mb-1 text-violet-800 dark:text-violet-200">Share Your Way</h3>
          <p className="text-sm text-violet-600 dark:text-violet-400">
            Send a direct link or list on the marketplace for discovery
          </p>
        </div>
      </div>
    </div>
  );
}