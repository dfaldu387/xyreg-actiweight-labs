import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotifiedBody, NotifiedBodyScope } from "@/types/notifiedBody";
import { parseNotifiedBodyNumber } from "@/utils/notifiedBodyUtils";
import { addManualNotifiedBody } from "@/services/notifiedBodyService";
import { toast } from "sonner";

interface ManualNotifiedBodyFormProps {
  onSubmit: (notifiedBody: NotifiedBody) => void;
  onCancel: () => void;
}

export function ManualNotifiedBodyForm({ onSubmit, onCancel }: ManualNotifiedBodyFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    nb_number: "",
    address: "",
    contactNumber: "",
    email: "",
    website: "",
    country: "",
  });

  const [scope, setScope] = useState<NotifiedBodyScope>({
    mdr: false,
    ivdr: false,
    highRiskActiveImplantables: false,
    highRiskImplantsNonActive: false,
    medicalSoftware: false,
    sterilizationMethods: false,
    drugDeviceCombinations: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
    }

    if (!formData.nb_number.trim()) {
      newErrors.nb_number = "NB number is required";
    } else {
      const nbNumber = parseNotifiedBodyNumber(formData.nb_number);
      if (isNaN(nbNumber) || nbNumber < 1 || nbNumber > 9999) {
        newErrors.nb_number = "NB number must be between 1 and 9999";
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleScopeChange = (field: keyof NotifiedBodyScope, checked: boolean) => {
    setScope(prev => ({ ...prev, [field]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const manualNotifiedBody = await addManualNotifiedBody({
        name: formData.name.trim(),
        nb_number: parseNotifiedBodyNumber(formData.nb_number),
        address: formData.address.trim(),
        contactNumber: formData.contactNumber.trim(),
        email: formData.email.trim(),
        website: formData.website.trim() || undefined,
        country: formData.country.trim(),
        scope
      });

      toast.success("Custom Notified Body added successfully");
      onSubmit(manualNotifiedBody);
    } catch (error) {
      console.error('Error adding manual notified body:', error);
      toast.error("Failed to add custom Notified Body");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add Custom Notified Body</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter the details of your Notified Body if it's not found in our official EU database.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., TÜV SÜD Product Service GmbH"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nb_number">NB Number *</Label>
              <Input
                id="nb_number"
                value={formData.nb_number}
                onChange={(e) => handleInputChange("nb_number", e.target.value)}
                placeholder="e.g., 44 or 0044"
                className={errors.nb_number ? "border-red-500" : ""}
              />
              {errors.nb_number && <p className="text-sm text-red-500">{errors.nb_number}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Full address including street, city, and postal code"
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="e.g., Germany"
                className={errors.country ? "border-red-500" : ""}
              />
              {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number *</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                placeholder="e.g., +49 89 5791-0"
                className={errors.contactNumber ? "border-red-500" : ""}
              />
              {errors.contactNumber && <p className="text-sm text-red-500">{errors.contactNumber}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="e.g., info@tuvsud.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="e.g., https://www.tuvsud.com"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Authorization Scope</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mdr"
                  checked={scope.mdr}
                  onCheckedChange={(checked) => handleScopeChange("mdr", !!checked)}
                />
                <Label htmlFor="mdr">MDR</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ivdr"
                  checked={scope.ivdr}
                  onCheckedChange={(checked) => handleScopeChange("ivdr", !!checked)}
                />
                <Label htmlFor="ivdr">IVDR</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="highRiskActiveImplantables"
                  checked={scope.highRiskActiveImplantables}
                  onCheckedChange={(checked) => handleScopeChange("highRiskActiveImplantables", !!checked)}
                />
                <Label htmlFor="highRiskActiveImplantables">High Risk Active Implantables</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="highRiskImplantsNonActive"
                  checked={scope.highRiskImplantsNonActive}
                  onCheckedChange={(checked) => handleScopeChange("highRiskImplantsNonActive", !!checked)}
                />
                <Label htmlFor="highRiskImplantsNonActive">High Risk Non-Active Implants</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="medicalSoftware"
                  checked={scope.medicalSoftware}
                  onCheckedChange={(checked) => handleScopeChange("medicalSoftware", !!checked)}
                />
                <Label htmlFor="medicalSoftware">Medical Software</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sterilizationMethods"
                  checked={scope.sterilizationMethods}
                  onCheckedChange={(checked) => handleScopeChange("sterilizationMethods", !!checked)}
                />
                <Label htmlFor="sterilizationMethods">Sterilization Methods</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="drugDeviceCombinations"
                  checked={scope.drugDeviceCombinations}
                  onCheckedChange={(checked) => handleScopeChange("drugDeviceCombinations", !!checked)}
                />
                <Label htmlFor="drugDeviceCombinations">Drug-Device Combinations</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Notified Body"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
