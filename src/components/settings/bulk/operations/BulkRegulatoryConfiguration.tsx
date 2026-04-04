import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HierarchicalNode } from "@/services/hierarchicalBulkService";
import { LIFECYCLE_PHASES } from "@/types/audit";

interface BulkRegulatoryConfigurationProps {
  selectedNodes: HierarchicalNode[];
  onExecute: (regulatoryData: any) => void;
  isExecuting: boolean;
}

export function BulkRegulatoryConfiguration({ 
  selectedNodes, 
  onExecute, 
  isExecuting 
}: BulkRegulatoryConfigurationProps) {
  const [regulatoryStatus, setRegulatoryStatus] = useState('');
  const [fdaCode, setFdaCode] = useState('');
  const [ceMarking, setCeMarking] = useState('');
  const [lifecyclePhase, setLifecyclePhase] = useState('');
  
  const handleExecute = () => {
    const regulatoryData = {
      status: regulatoryStatus,
      fdaCode,
      ceMarking,
      lifecyclePhase
    };
    onExecute(regulatoryData);
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold">Configure Regulatory Status</h3>
        <p className="text-sm text-muted-foreground">
          Set regulatory information for {selectedNodes.length} selected items.
        </p>
      </div>
      
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="regulatory-status">Regulatory Status</Label>
          <Select value={regulatoryStatus} onValueChange={setRegulatoryStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select regulatory status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="In Development">In Development</SelectItem>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Registered">Registered</SelectItem>
              <SelectItem value="Market Ready">Market Ready</SelectItem>
              <SelectItem value="Discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lifecycle-phase">Lifecycle Phase</Label>
          <Select value={lifecyclePhase} onValueChange={setLifecyclePhase}>
            <SelectTrigger>
              <SelectValue placeholder="Select lifecycle phase" />
            </SelectTrigger>
            <SelectContent>
              {LIFECYCLE_PHASES.map((phase) => (
                <SelectItem key={phase} value={phase}>
                  {phase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fda-code">FDA Product Code</Label>
          <Input
            id="fda-code"
            value={fdaCode}
            onChange={(e) => setFdaCode(e.target.value)}
            placeholder="e.g., EHA, LRQ"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ce-marking">CE Marking Status</Label>
          <Select value={ceMarking} onValueChange={setCeMarking}>
            <SelectTrigger>
              <SelectValue placeholder="Select CE status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not Required">Not Required</SelectItem>
              <SelectItem value="In Process">In Process</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button
        onClick={handleExecute}
        disabled={isExecuting || (!regulatoryStatus && !lifecyclePhase && !fdaCode && !ceMarking)}
        className="w-full"
      >
        {isExecuting ? 'Applying...' : `Apply to ${selectedNodes.length} Items`}
      </Button>
    </div>
  );
}