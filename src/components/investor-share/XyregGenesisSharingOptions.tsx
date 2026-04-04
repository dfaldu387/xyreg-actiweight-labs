import React from 'react';
import { Send, Globe, Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function XyregGenesisSharingOptions() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">How to Share</h2>
        <p className="text-sm text-muted-foreground">
          Once your checklist is complete, you have two ways to connect with investors
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Active Sharing */}
        <Card className="border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Send className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-700 dark:text-indigo-400">Direct Sharing</h3>
                <Badge variant="secondary" className="text-xs mt-0.5">Always Available</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Send your unique link directly to investors you already know. Control access with optional password protection and expiration dates.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span>Password protection available</span>
            </div>
          </CardContent>
        </Card>

        {/* Passive Discovery */}
        <Card className="border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Globe className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">Marketplace Discovery</h3>
                <Badge variant="outline" className="text-xs mt-0.5 border-emerald-300">Optional</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Opt-in to list on our Deal Flow Marketplace. Verified investors can discover your device and request to view your full business case.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Enable in settings to be discovered</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
