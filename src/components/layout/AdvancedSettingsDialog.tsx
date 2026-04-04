import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAdvancedSettings } from '@/context/AdvancedSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

export function AdvancedSettingsDialog() {
  const [open, setOpen] = useState(false);
  const { showLockedMenus, setShowLockedMenus } = useAdvancedSettings();
  const { lang } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          {lang('appLayout.advanced')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{lang('appLayout.advancedSettings')}</DialogTitle>
          <DialogDescription>
            {lang('appLayout.advancedSettingsDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Show Locked Menus Toggle */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="show-locked-menus" className="text-sm font-medium">
                {lang('appLayout.showLockedMenuItems')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {lang('appLayout.showLockedMenuItemsDescription')}
              </p>
            </div>
            <Switch
              id="show-locked-menus"
              checked={showLockedMenus}
              onCheckedChange={setShowLockedMenus}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
