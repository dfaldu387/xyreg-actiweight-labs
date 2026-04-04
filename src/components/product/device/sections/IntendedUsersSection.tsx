
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserInstructions {
  how_to_use?: string;
  charging?: string;
  maintenance?: string;
}

interface IntendedUsersSectionProps {
  intendedUsers?: string[];
  clinicalBenefits?: string[];
  userInstructions?: UserInstructions;
  onIntendedUsersChange?: (value: string[]) => void;
  onClinicalBenefitsChange?: (value: string[]) => void;
  onUserInstructionsChange?: (value: UserInstructions) => void;
  isLoading?: boolean;
  progress?: number;
}

export function IntendedUsersSection({
  intendedUsers = [],
  clinicalBenefits = [],
  userInstructions = {},
  onIntendedUsersChange,
  onClinicalBenefitsChange,
  onUserInstructionsChange,
  isLoading = false,
  progress = 0
}: IntendedUsersSectionProps) {
  // Local state for new items
  const [newUser, setNewUser] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  
  // Handle adding new user
  const handleAddUser = () => {
    if (!newUser.trim() || !onIntendedUsersChange) return;
    
    if (intendedUsers.includes(newUser.trim())) {
      setNewUser('');
      return;
    }
    
    onIntendedUsersChange([...intendedUsers, newUser.trim()]);
    setNewUser('');
  };
  
  // Handle removing user
  const handleRemoveUser = (index: number) => {
    if (!onIntendedUsersChange) return;
    
    const updated = [...intendedUsers];
    updated.splice(index, 1);
    onIntendedUsersChange(updated);
  };
  
  // Handle adding new clinical benefit
  const handleAddBenefit = () => {
    if (!newBenefit.trim() || !onClinicalBenefitsChange) return;
    
    if (clinicalBenefits.includes(newBenefit.trim())) {
      setNewBenefit('');
      return;
    }
    
    onClinicalBenefitsChange([...clinicalBenefits, newBenefit.trim()]);
    setNewBenefit('');
  };
  
  // Handle removing clinical benefit
  const handleRemoveBenefit = (index: number) => {
    if (!onClinicalBenefitsChange) return;
    
    const updated = [...clinicalBenefits];
    updated.splice(index, 1);
    onClinicalBenefitsChange(updated);
  };
  
  // Handle user instruction changes
  const handleInstructionChange = (key: keyof UserInstructions, value: string) => {
    if (!onUserInstructionsChange) return;
    
    onUserInstructionsChange({
      ...userInstructions,
      [key]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>7. Intended Users & Clinical Benefits</CardTitle>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 7.1 Intended Users */}
        <div>
          <h3 className="text-base font-semibold mb-3">7.1 Target User Groups</h3>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {intendedUsers.map((user, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-2">
                  {user}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveUser(index)}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                placeholder="e.g., Healthcare Professionals, Patients"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUser();
                  }
                }}
              />
              <Button 
                onClick={handleAddUser} 
                disabled={!newUser.trim() || isLoading}
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* 7.2 Clinical Benefits */}
        <div>
          <h3 className="text-base font-semibold mb-3">7.2 Clinical Benefits</h3>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {clinicalBenefits.map((benefit, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-2">
                  {benefit}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveBenefit(index)}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                placeholder="e.g., Reduces recovery time, Improves detection accuracy"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBenefit();
                  }
                }}
              />
              <Button 
                onClick={handleAddBenefit} 
                disabled={!newBenefit.trim() || isLoading}
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* 7.3 User Instructions */}
        <div>
          <h3 className="text-base font-semibold mb-3">7.3 User Instructions</h3>
          <Tabs defaultValue="how_to_use">
            <TabsList className="mb-4">
              <TabsTrigger value="how_to_use">How To Use</TabsTrigger>
              <TabsTrigger value="charging">Charging</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="how_to_use">
              <div className="space-y-2">
                <Label htmlFor="how-to-use">How To Use Instructions</Label>
                <textarea
                  id="how-to-use"
                  value={userInstructions.how_to_use || ''}
                  onChange={(e) => handleInstructionChange('how_to_use', e.target.value)}
                  placeholder="Provide step-by-step instructions on how to use the device"
                  className="w-full p-3 border rounded-md"
                  rows={4}
                  disabled={isLoading}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="charging">
              <div className="space-y-2">
                <Label htmlFor="charging">Charging Instructions</Label>
                <textarea
                  id="charging"
                  value={userInstructions.charging || ''}
                  onChange={(e) => handleInstructionChange('charging', e.target.value)}
                  placeholder="Provide information about charging the device (if applicable)"
                  className="w-full p-3 border rounded-md"
                  rows={4}
                  disabled={isLoading}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="maintenance">
              <div className="space-y-2">
                <Label htmlFor="maintenance">Maintenance Instructions</Label>
                <textarea
                  id="maintenance"
                  value={userInstructions.maintenance || ''}
                  onChange={(e) => handleInstructionChange('maintenance', e.target.value)}
                  placeholder="Provide information about maintaining the device"
                  className="w-full p-3 border rounded-md"
                  rows={4}
                  disabled={isLoading}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Section Progress */}
        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between items-center text-sm">
              <span>Section completion:</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-green-500 h-1.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
