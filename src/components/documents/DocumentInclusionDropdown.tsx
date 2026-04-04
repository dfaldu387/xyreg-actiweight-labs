
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Check } from "lucide-react";
import { INCLUSION_OPTIONS, InclusionRule } from "@/types/documentInclusion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DocumentInclusionDropdownProps {
  currentRule: InclusionRule;
  onRuleChange: (rule: InclusionRule) => void;
  disabled?: boolean;
}

export function DocumentInclusionDropdown({ 
  currentRule, 
  onRuleChange, 
  disabled = false 
}: DocumentInclusionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getCurrentOptionLabel = () => {
    const option = INCLUSION_OPTIONS.find(opt => 
      opt.value === currentRule.type || 
      (currentRule.type === 'class_based' && opt.value.startsWith('class_')) ||
      (currentRule.type === 'market_based' && opt.value.includes('_market'))
    );
    return option?.label || 'Custom';
  };

  const handleOptionSelect = (value: string) => {
    let newRule: InclusionRule;
    
    switch (value) {
      case 'always_include':
        newRule = { type: 'always_include' };
        break;
      case 'not_included':
        newRule = { type: 'not_included' };
        break;
      case 'class_i':
        newRule = { type: 'class_based', conditions: { deviceClasses: ['I'] } };
        break;
      case 'class_iia':
        newRule = { type: 'class_based', conditions: { deviceClasses: ['IIa'] } };
        break;
      case 'class_iib':
        newRule = { type: 'class_based', conditions: { deviceClasses: ['IIb'] } };
        break;
      case 'class_iii':
        newRule = { type: 'class_based', conditions: { deviceClasses: ['III'] } };
        break;
      case 'class_ii_plus':
        newRule = { type: 'class_based', conditions: { deviceClasses: ['IIa', 'IIb', 'III'] } };
        break;
      case 'eu_market':
        newRule = { type: 'market_based', conditions: { markets: ['EU'] } };
        break;
      case 'us_market':
        newRule = { type: 'market_based', conditions: { markets: ['US'] } };
        break;
      default:
        newRule = { type: 'custom_conditions' };
    }
    
    onRuleChange(newRule);
    setIsOpen(false);
  };

  const getStatusColor = () => {
    switch (currentRule.type) {
      case 'always_include': return 'bg-green-100 text-green-800';
      case 'not_included': return 'bg-red-100 text-red-800';
      case 'class_based': return 'bg-blue-100 text-blue-800';
      case 'market_based': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Select value={currentRule.type} onValueChange={handleOptionSelect} disabled={disabled}>
              <SelectTrigger className="w-48">
                <div className="flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  <span className="text-xs">{getCurrentOptionLabel()}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {INCLUSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {currentRule.type === option.value && <Check className="h-3 w-3" />}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Badge className={`text-xs ${getStatusColor()}`}>
              {currentRule.type === 'always_include' ? 'Active' : 
               currentRule.type === 'not_included' ? 'Excluded' : 
               'Conditional'}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Control when this document is included in products</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
