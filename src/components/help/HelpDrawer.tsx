import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  isCompliance?: boolean;
}

export function HelpDrawer({ open, onOpenChange, title, content, isCompliance }: HelpDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent direction="right" className="focus:outline-none">
        <DrawerHeader className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <DrawerTitle className="text-lg font-semibold truncate">{title}</DrawerTitle>
            {isCompliance && (
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1 shrink-0">
                <Shield className="h-3 w-3" />
                Compliance
              </Badge>
            )}
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          <MarkdownRenderer content={content} />
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
