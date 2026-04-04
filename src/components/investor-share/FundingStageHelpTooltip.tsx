import { useState } from 'react';
import { HelpCircle, ExternalLink, GraduationCap } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fundingStageInfo, getAllFundingStages } from '@/data/fundingStageHelp';
import { FundingStageEducationModal } from './FundingStageEducationModal';

export function FundingStageHelpTooltip() {
  const [open, setOpen] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const stages = getAllFundingStages();

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            aria-label="Help with funding stages"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-96 p-0 z-[9999]"
          side="right"
          align="start"
          sideOffset={8}
        >
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Funding Stages Explained</h4>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MedTech-specific guidance for each funding stage
            </p>
          </div>
          
          <ScrollArea className="h-[320px]">
            <div className="p-2 space-y-1">
              {stages.map((stage) => (
                <div 
                  key={stage.key}
                  className="p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{stage.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stage.typicalAmount}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {stage.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stage.investorTypes.slice(0, 2).map((investor) => (
                      <Badge 
                        key={investor} 
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0"
                      >
                        {investor}
                      </Badge>
                    ))}
                    {stage.investorTypes.length > 2 && (
                      <Badge 
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0"
                      >
                        +{stage.investorTypes.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t bg-muted/30">
            <Button
              variant="link"
              size="sm"
              className="w-full text-primary"
              onClick={() => {
                setOpen(false);
                setShowEducationModal(true);
              }}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Learn More About MedTech Funding
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <FundingStageEducationModal 
        open={showEducationModal} 
        onOpenChange={setShowEducationModal} 
      />
    </>
  );
}
