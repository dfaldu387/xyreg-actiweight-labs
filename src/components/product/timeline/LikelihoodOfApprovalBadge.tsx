
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit3 } from "lucide-react";

interface LikelihoodOfApprovalBadgeProps {
  likelihood: number;
  onUpdate?: (newLikelihood: number) => void;
  editable?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function LikelihoodOfApprovalBadge({ 
  likelihood = 100, 
  onUpdate, 
  editable = false,
  size = 'default'
}: LikelihoodOfApprovalBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(likelihood.toString());

  const getVariant = (value: number) => {
    if (value >= 90) return 'default'; // Green-ish
    if (value >= 70) return 'secondary'; // Yellow-ish
    return 'destructive'; // Red
  };

  const getBgColor = (value: number) => {
    if (value >= 90) return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (value >= 70) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    return 'bg-red-100 text-red-800 hover:bg-red-200';
  };

  const handleSave = () => {
    const numValue = Math.max(0, Math.min(100, parseFloat(editValue) || 0));
    setEditValue(numValue.toString());
    onUpdate?.(numValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(likelihood.toString());
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing && editable) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min="0"
          max="100"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-16 h-6 text-xs px-2"
          autoFocus
        />
        <span className="text-xs">%</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-6 w-6 p-0"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Badge
      className={`${getBgColor(likelihood)} cursor-pointer flex items-center gap-1 ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 
        size === 'lg' ? 'text-sm px-3 py-1' : 
        'text-xs px-2 py-1'
      }`}
      onClick={() => editable && setIsEditing(true)}
    >
      <span>LoS: {likelihood}%</span>
      {editable && <Edit3 className="h-3 w-3 ml-1" />}
    </Badge>
  );
}
