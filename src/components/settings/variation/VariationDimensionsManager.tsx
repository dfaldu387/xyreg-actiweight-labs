import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useVariationDimensions } from "@/hooks/useVariationDimensions";
import { ChevronDown, Edit2, Check, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Props { companyId: string; }

export function VariationDimensionsManager({ companyId }: Props) {
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const { dimensions, optionsByDimension, loading, createDimension, updateDimension, deleteDimension, createOption, deleteOption } = useVariationDimensions(companyId);
  const [newDim, setNewDim] = useState("");
  const [newOptionByDim, setNewOptionByDim] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState(() => searchParams.get('returnTo') !== 'variants');
  const [editingDimension, setEditingDimension] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  return (
    <Card id="variation-dimensions">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{lang('settings.variation.title')}</CardTitle>
          <CardDescription>
            {lang('settings.variation.description')}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={collapsed ? lang('settings.variation.expand') : lang('settings.variation.collapse')}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((v) => !v)}
          className={collapsed ? "rotate-180 transition-transform" : "transition-transform"}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{lang('settings.variation.addDimension')}</Label>
            <div className="flex gap-2">
              <Input placeholder={lang('settings.variation.dimensionPlaceholder')} value={newDim} onChange={e => setNewDim(e.target.value)} />
              <Button onClick={() => { if (newDim.trim()) { createDimension(newDim.trim()); setNewDim(""); } }} disabled={!newDim.trim() || loading}>
                {lang('common.add')}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            {dimensions.map(dim => (
              <div key={dim.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {editingDimension === dim.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="flex-1"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              updateDimension(dim.id, editingName.trim());
                              setEditingDimension(null);
                            } else if (e.key === 'Escape') {
                              setEditingDimension(null);
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            updateDimension(dim.id, editingName.trim());
                            setEditingDimension(null);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingDimension(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium flex-1">{dim.name}</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingDimension(dim.id);
                            setEditingName(dim.name);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => deleteDimension(dim.id)}>{lang('common.delete')}</Button>
                </div>
                <div className="mt-4 space-y-2">
                  <Label>{lang('settings.variation.addOption')}</Label>
                  <div className="flex gap-2">
                    <Input placeholder={lang('settings.variation.optionPlaceholder')} value={newOptionByDim[dim.id] || ""} onChange={e => setNewOptionByDim(prev => ({ ...prev, [dim.id]: e.target.value }))} />
                    <Button size="sm" onClick={() => { const v = (newOptionByDim[dim.id] || "").trim(); if (v) { createOption(dim.id, v); setNewOptionByDim(prev => ({ ...prev, [dim.id]: "" })); } }}>{lang('common.add')}</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(optionsByDimension[dim.id] || []).map(opt => (
                      <div key={opt.id} className="px-2 py-1 rounded border text-sm flex items-center gap-2">
                        <span>{opt.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => deleteOption(opt.id)}>{lang('settings.variation.remove')}</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {!dimensions.length && (
              <p className="text-sm text-muted-foreground">{lang('settings.variation.noDimensions')}</p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
