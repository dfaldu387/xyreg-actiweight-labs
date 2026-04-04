import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, RocketIcon, BeakerIcon, XCircleIcon } from "lucide-react";
import { LaunchStatus } from '@/services/productLifecycleService';
import { toast } from 'sonner';

interface LaunchStatusManagerProps {
  currentStatus: LaunchStatus;
  actualLaunchDate?: string | null;
  onUpdateStatus: (status: LaunchStatus, launchDate?: string) => Promise<boolean>;
  productName: string;
}

export function LaunchStatusManager({ 
  currentStatus, 
  actualLaunchDate, 
  onUpdateStatus, 
  productName 
}: LaunchStatusManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LaunchStatus>(currentStatus);
  const [launchDate, setLaunchDate] = useState(actualLaunchDate || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusInfo = (status: LaunchStatus) => {
    switch (status) {
      case 'pre_launch':
        return {
          label: 'Pre-Launch',
          description: 'Uses rNPV analysis for financial planning',
          icon: BeakerIcon,
          variant: 'secondary' as const,
          color: 'text-blue-600'
        };
      case 'launched':
        return {
          label: 'Launched',
          description: 'Uses commercial tracking for performance analysis',
          icon: RocketIcon,
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'discontinued':
        return {
          label: 'Discontinued',
          description: 'Product no longer in active development or sales',
          icon: XCircleIcon,
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
    }
  };

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      const success = await onUpdateStatus(
        selectedStatus, 
        selectedStatus === 'launched' ? launchDate || undefined : undefined
      );
      
      if (success) {
        toast.success(`Device status updated to ${getStatusInfo(selectedStatus).label}`);
        setIsDialogOpen(false);
      } else {
        toast.error('Failed to update device status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update device status');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusInfo = getStatusInfo(currentStatus);
  const CurrentIcon = currentStatusInfo.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CurrentIcon className={`h-5 w-5 ${currentStatusInfo.color}`} />
          Launch Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant={currentStatusInfo.variant}>
              {currentStatusInfo.label}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStatusInfo.description}
            </p>
            {actualLaunchDate && currentStatus === 'launched' && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <CalendarIcon className="h-3 w-3" />
                Launched: {new Date(actualLaunchDate).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Launch Status</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Launch Status</Label>
                  <Select value={selectedStatus} onValueChange={(value: LaunchStatus) => setSelectedStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre_launch">
                        <div className="flex items-center gap-2">
                          <BeakerIcon className="h-4 w-4 text-blue-600" />
                          <div>
                            <div>Pre-Launch</div>
                            <div className="text-xs text-muted-foreground">Uses rNPV analysis</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="launched">
                        <div className="flex items-center gap-2">
                          <RocketIcon className="h-4 w-4 text-green-600" />
                          <div>
                            <div>Launched</div>
                            <div className="text-xs text-muted-foreground">Uses commercial tracking</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="discontinued">
                        <div className="flex items-center gap-2">
                          <XCircleIcon className="h-4 w-4 text-red-600" />
                          <div>
                            <div>Discontinued</div>
                            <div className="text-xs text-muted-foreground">No longer active</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedStatus === 'launched' && (
                  <div>
                    <Label htmlFor="launchDate">Launch Date (Optional)</Label>
                    <Input
                      id="launchDate"
                      type="date"
                      value={launchDate}
                      onChange={(e) => setLaunchDate(e.target.value)}
                      placeholder="Select launch date"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If not specified, today's date will be used
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleStatusUpdate}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <strong>Analysis Type:</strong> {currentStatus === 'pre_launch' ? 'rNPV Analysis' : 
            currentStatus === 'launched' ? 'Commercial Performance Tracking' : 'No Active Analysis'}
        </div>
      </CardContent>
    </Card>
  );
}