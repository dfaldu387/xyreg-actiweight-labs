import React from 'react';
import {
  Crosshair, FileCheck, Eye, Share2, CheckCircle,
  Cpu, FlaskConical, AlertTriangle, LayoutGrid, Flag, Users, Shield, Scale,
  Store, Gift, Clock, Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

export function XyregGenesisWelcome() {
  const { lang } = useTranslation();
  const k = 'genesis.welcome';

  return (
    <div className="rounded-xl bg-background border-2 border-amber-400 dark:border-amber-500 p-8">
      {/* Header with logo and Beta badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
          <Crosshair className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">XyReg Genesis</h1>
            <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-xs">Beta</Badge>
          </div>
          <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">{lang(`${k}.tagline`)}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{lang(`${k}.launchDate`)}</span>
        </div>
      </div>

      {/* Value proposition */}
      <p className="text-base text-muted-foreground mb-3 max-w-2xl">{lang(`${k}.valueProp`)}</p>

      {/* Key benefit callout */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <CheckCircle className="h-4 w-4 text-emerald-500" />
        <span className="text-muted-foreground">{lang(`${k}.keyBenefit`)}</span>
      </div>

      {/* Investor Marketplace Feature Card */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-5 border border-emerald-200 dark:border-emerald-800/50 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center flex-shrink-0">
            <Store className="h-5 w-5 text-emerald-700 dark:text-emerald-200" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">{lang(`${k}.marketplace`)}</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{lang(`${k}.marketplaceDesc`)}</p>
          </div>
        </div>
      </div>

      {/* How it works - 3 steps */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-200">1</div>
            <FileCheck className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-1 text-blue-800 dark:text-blue-200">{lang(`${k}.step1Title`)}</h3>
          <p className="text-sm text-blue-600 dark:text-blue-400">{lang(`${k}.step1Desc`)}</p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-200">2</div>
            <Eye className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="font-semibold mb-1 text-emerald-800 dark:text-emerald-200">{lang(`${k}.step2Title`)}</h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{lang(`${k}.step2Desc`)}</p>
        </div>

        <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-4 border border-violet-200 dark:border-violet-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center text-sm font-bold text-violet-700 dark:text-violet-200">3</div>
            <Share2 className="h-5 w-5 text-violet-600" />
          </div>
          <h3 className="font-semibold mb-1 text-violet-800 dark:text-violet-200">{lang(`${k}.step3Title`)}</h3>
          <p className="text-sm text-violet-600 dark:text-violet-400">{lang(`${k}.step3Desc`)}</p>
        </div>
      </div>

      {/* Lifetime Offer Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30 rounded-lg p-5 border border-amber-300 dark:border-amber-700/50 mb-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-300 dark:bg-amber-700 flex items-center justify-center flex-shrink-0">
            <Gift className="h-5 w-5 text-amber-800 dark:text-amber-100" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">{lang(`${k}.freeForLife`)}</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">{lang(`${k}.freeForLifeDesc`)}</p>
          </div>
        </div>
      </div>

      {/* Active User Policy Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50 mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <span className="font-medium">{lang(`${k}.useItOrLoseIt`)}</span> {lang(`${k}.useItOrLoseItDesc`)}
          </p>
        </div>
      </div>

      {/* Powered by HELIX OS section */}
      <div className="pt-6 border-t border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{lang(`${k}.poweredBy`)}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-2 max-w-2xl">{lang(`${k}.helixDesc1`)}</p>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          <span className="font-medium text-foreground">{lang(`${k}.helixLaunch`)}</span> {lang(`${k}.helixDesc2`)}
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: Cpu, labelKey: `${k}.moduleDeviceInfo`, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
            { icon: FlaskConical, labelKey: `${k}.moduleClinical`, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/50' },
            { icon: AlertTriangle, labelKey: `${k}.moduleRisk`, color: 'text-red-600 bg-red-50 dark:bg-red-950/50' },
            { icon: LayoutGrid, labelKey: `${k}.moduleBusinessCase`, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
            { icon: Flag, labelKey: `${k}.moduleMilestones`, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' },
            { icon: Users, labelKey: `${k}.moduleTeam`, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50' },
            { icon: Shield, labelKey: `${k}.moduleIP`, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50' },
            { icon: Scale, labelKey: `${k}.moduleRegulatory`, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
          ].map((module) => (
            <div
              key={module.labelKey}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${module.color}`}
            >
              <module.icon className="h-3.5 w-3.5" />
              {lang(module.labelKey)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
