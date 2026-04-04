import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clipboard, Target, Users, AlertTriangle, Heart, BookOpen } from "lucide-react";
import { Loader2 } from "lucide-react";

interface IntendedUseClaimsTabProps {
  intendedUse?: string;
  intendedPurposeData?: {
    indications?: string;
    contraindications?: string;
    warnings?: string;
    precautions?: string;
  };
  clinicalBenefits?: string[];
  intendedUsers?: string[];
  userInstructions?: {
    howToUse?: string;
    charging?: string;
    maintenance?: string;
  };
  isLoading?: boolean;
  onIntendedUseChange?: (value: string) => void;
  onIntendedPurposeDataChange?: (data: any) => void;
  onClinicalBenefitsChange?: (benefits: string[]) => void;
  onIntendedUsersChange?: (users: string[]) => void;
  onUserInstructionsChange?: (instructions: any) => void;
}

export function IntendedUseClaimsTab({
  intendedUse = "",
  intendedPurposeData = {},
  clinicalBenefits = [],
  intendedUsers = [],
  userInstructions = {},
  isLoading = false,
  onIntendedUseChange,
  onIntendedPurposeDataChange,
  onClinicalBenefitsChange,
  onIntendedUsersChange,
  onUserInstructionsChange
}: IntendedUseClaimsTabProps) {

  const handleIntendedPurposeChange = (field: string, value: string) => {
    const updatedData = {
      ...intendedPurposeData,
      [field]: value
    };
    onIntendedPurposeDataChange?.(updatedData);
  };

  const handleUserInstructionsChange = (field: string, value: string) => {
    const updatedInstructions = {
      ...userInstructions,
      [field]: value
    };
    onUserInstructionsChange?.(updatedInstructions);
  };

  return (
    <div className="space-y-6">
      {/* Intended Use Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Intended Use Statement
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            Primary intended use and purpose of the medical device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="intended-use">Description of Intended Use</Label>
            <Textarea
              id="intended-use"
              value={intendedUse}
              onChange={(e) => onIntendedUseChange?.(e.target.value)}
              placeholder="Describe the intended use and purpose of this medical device..."
              className="min-h-[120px]"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Provide a clear and comprehensive description of what the device is intended to be used for.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Clinical Information
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            Detailed clinical indications, contraindications, and safety information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="indications">Indications for Use</Label>
            <Textarea
              id="indications"
              value={intendedPurposeData.indications || ""}
              onChange={(e) => handleIntendedPurposeChange('indications', e.target.value)}
              placeholder="Describe the specific medical conditions or situations where this device is indicated..."
              className="min-h-[100px]"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraindications" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Contraindications
            </Label>
            <Textarea
              id="contraindications"
              value={intendedPurposeData.contraindications || ""}
              onChange={(e) => handleIntendedPurposeChange('contraindications', e.target.value)}
              placeholder="List conditions or situations where this device should not be used..."
              className="min-h-[100px]"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warnings">Warnings</Label>
              <Textarea
                id="warnings"
                value={intendedPurposeData.warnings || ""}
                onChange={(e) => handleIntendedPurposeChange('warnings', e.target.value)}
                placeholder="Important warnings for users..."
                className="min-h-[80px]"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precautions">Precautions</Label>
              <Textarea
                id="precautions"
                value={intendedPurposeData.precautions || ""}
                onChange={(e) => handleIntendedPurposeChange('precautions', e.target.value)}
                placeholder="Safety precautions to be observed..."
                className="min-h-[80px]"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Benefits & Intended Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Clinical Benefits
            </CardTitle>
            <CardDescription>
              Expected clinical outcomes and benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clinicalBenefits.length > 0 ? (
              <div className="space-y-2">
                {clinicalBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <Heart className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-sm text-green-800">{benefit}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No clinical benefits specified</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Intended Users
            </CardTitle>
            <CardDescription>
              Target user groups and qualifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {intendedUsers.length > 0 ? (
              <div className="space-y-2">
                {intendedUsers.map((user, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-blue-600" />
                    <span className="text-sm">{user}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No intended users specified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            User Instructions
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            Instructions for proper use, maintenance, and care
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="how-to-use">How to Use</Label>
            <Textarea
              id="how-to-use"
              value={userInstructions.howToUse || ""}
              onChange={(e) => handleUserInstructionsChange('howToUse', e.target.value)}
              placeholder="Provide step-by-step instructions for using the device..."
              className="min-h-[100px]"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="charging">Charging Instructions</Label>
              <Textarea
                id="charging"
                value={userInstructions.charging || ""}
                onChange={(e) => handleUserInstructionsChange('charging', e.target.value)}
                placeholder="Instructions for charging the device..."
                className="min-h-[80px]"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance">Maintenance & Care</Label>
              <Textarea
                id="maintenance"
                value={userInstructions.maintenance || ""}
                onChange={(e) => handleUserInstructionsChange('maintenance', e.target.value)}
                placeholder="Instructions for maintaining and caring for the device..."
                className="min-h-[80px]"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}