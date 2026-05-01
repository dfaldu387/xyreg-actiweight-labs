import * as React from 'react';
import { Sparkles, Wand2, ShieldCheck, Download, ArrowUpFromLine, Share, MoreHorizontal, GitBranch, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface LiveEditorHeaderActionsConfig {
  aiAutoFillEnabled?: boolean;
  onOpenAutoFill?: () => void;
  onValidate?: () => void;
  onDownload?: () => void;
  onPushToDeviceFields?: () => void;
  onShare?: () => void;
  onSaveVersion?: () => void;
  onShowVersions?: () => void;
  hideVersioning?: boolean;
}

/**
 * Action icons originally rendered in LiveEditor's secondary header.
 * Lifted into the DocumentDraftDrawer top header so the drawer has a single,
 * compact header row instead of two stacked rows.
 */
export function LiveEditorHeaderActions(props: LiveEditorHeaderActionsConfig) {
  const {
    aiAutoFillEnabled,
    onOpenAutoFill,
    onValidate,
    onDownload,
    onPushToDeviceFields,
    onShare,
    onSaveVersion,
    onShowVersions,
    hideVersioning,
  } = props;

  const [aiMenuOpen, setAiMenuOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-1.5">
      <TooltipProvider>
        {aiAutoFillEnabled && onOpenAutoFill && (
          <DropdownMenu open={aiMenuOpen} onOpenChange={setAiMenuOpen} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-amber-300 text-amber-400 hover:bg-amber-50 hover:text-amber-500 h-8 w-8"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setAiMenuOpen(false);
                  onOpenAutoFill();
                }}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Auto-Fill Sections
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onValidate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onValidate}
                className="border-blue-300 text-blue-400 hover:bg-blue-50 hover:text-blue-500 h-8 w-8"
              >
                <ShieldCheck className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>AI Validate</TooltipContent>
          </Tooltip>
        )}
        {onDownload && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onDownload} className="h-8 w-8">
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export</TooltipContent>
          </Tooltip>
        )}
        {onPushToDeviceFields && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onPushToDeviceFields}
                className="border-green-300 text-green-400 hover:text-green-500 hover:bg-green-50 h-8 w-8"
              >
                <ArrowUpFromLine className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Push to Device Fields</TooltipContent>
          </Tooltip>
        )}
        {hideVersioning && onShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onShare} className="h-8 w-8">
                <Share className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
      {!hideVersioning && (onSaveVersion || onShowVersions || onShare) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onSaveVersion && (
              <DropdownMenuItem onClick={onSaveVersion}>
                <GitBranch className="w-4 h-4 mr-2" />
                Save Version
              </DropdownMenuItem>
            )}
            {onShowVersions && (
              <DropdownMenuItem onClick={onShowVersions}>
                <History className="w-4 h-4 mr-2" />
                View Versions
              </DropdownMenuItem>
            )}
            {onShare && (
              <DropdownMenuItem onClick={onShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}