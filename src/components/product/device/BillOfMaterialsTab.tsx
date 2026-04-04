import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  id: string;
  componentRole: string;
  materialName: string;
  specification: string;
  patientContact: 'Direct Contact' | 'Indirect Contact' | 'No Contact';
  notes?: string;
}

interface BillOfMaterialsTabProps {
  materials: Material[];
  onMaterialsChange: (materials: Material[]) => void;
  isLoading?: boolean;
}

export function BillOfMaterialsTab({ 
  materials = [], 
  onMaterialsChange, 
  isLoading = false 
}: BillOfMaterialsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<Material, 'id'>>({
    componentRole: '',
    materialName: '',
    specification: '',
    patientContact: 'No Contact',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      componentRole: '',
      materialName: '',
      specification: '',
      patientContact: 'No Contact',
      notes: ''
    });
    setEditingIndex(null);
  };

  const handleAddOrUpdateMaterial = () => {
    if (!formData.componentRole.trim() || !formData.materialName.trim()) {
      toast.error('Component Role and Material Name are required');
      return;
    }

    const newMaterial: Material = {
      ...formData,
      id: editingIndex !== null ? materials[editingIndex].id : Date.now().toString()
    };

    let updatedMaterials: Material[];
    if (editingIndex !== null) {
      updatedMaterials = [...materials];
      updatedMaterials[editingIndex] = newMaterial;
      toast.success('Material updated successfully');
    } else {
      updatedMaterials = [...materials, newMaterial];
      toast.success('Material added successfully');
    }

    onMaterialsChange(updatedMaterials);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEditMaterial = (index: number) => {
    const material = materials[index];
    setFormData({
      componentRole: material.componentRole,
      materialName: material.materialName,
      specification: material.specification,
      patientContact: material.patientContact,
      notes: material.notes || ''
    });
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = materials.filter((_, i) => i !== index);
    onMaterialsChange(updatedMaterials);
    toast.success('Material removed successfully');
  };

  const handleExportToSheets = () => {
    // Create CSV content
    const headers = ['Component Role', 'Material Name', 'Specification / Grade', 'Patient Contact', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...materials.map(material => [
        `"${material.componentRole}"`,
        `"${material.materialName}"`,
        `"${material.specification}"`,
        `"${material.patientContact}"`,
        `"${material.notes || ''}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'bill_of_materials.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast.success('Bill of Materials exported successfully');
  };

  const getPatientContactBadgeVariant = (contact: string) => {
    switch (contact) {
      case 'Direct Contact':
        return 'destructive';
      case 'Indirect Contact':
        return 'secondary';
      case 'No Contact':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Bill of Materials</CardTitle>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              List every material used to build your device. This is critical for your Design Controls, 
              Risk Management (especially for biocompatibility under ISO 10993), and regulatory submissions.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium text-foreground mb-2">Why is this important?</p>
              <p>
                Regulators need to know the exact composition of your device to assess its safety. 
                Be as specific as possible.
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium text-foreground mb-2">What should I include?</p>
              <p>
                Add every single material, from the main housing and internal electronics to the 
                adhesives and coatings.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Device Materials</CardTitle>
            <div className="flex gap-2">
              {materials.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToSheets}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export to Sheets
                </Button>
              )}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingIndex !== null ? 'Edit Material' : 'Add New Material'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="componentRole">Component Role *</Label>
                        <Input
                          id="componentRole"
                          placeholder="e.g., Outer Casing"
                          value={formData.componentRole}
                          onChange={(e) => setFormData(prev => ({ ...prev, componentRole: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="materialName">Material Name *</Label>
                        <Input
                          id="materialName"
                          placeholder="e.g., Polycarbonate"
                          value={formData.materialName}
                          onChange={(e) => setFormData(prev => ({ ...prev, materialName: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="specification">Specification / Grade</Label>
                      <Input
                        id="specification"
                        placeholder="e.g., Makrolon® 2458, Medical Grade"
                        value={formData.specification}
                        onChange={(e) => setFormData(prev => ({ ...prev, specification: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="patientContact">Patient Contact</Label>
                      <Select 
                        value={formData.patientContact} 
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, patientContact: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Direct Contact">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Direct Contact</span>
                              <span className="text-xs text-muted-foreground">
                                Material directly touches patient's body (catheter, implant, skin electrode)
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Indirect Contact">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Indirect Contact</span>
                              <span className="text-xs text-muted-foreground">
                                Material contacts fluid/gas delivered to patient (tubing, syringe interior)
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="No Contact">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">No Contact</span>
                              <span className="text-xs text-muted-foreground">
                                No patient contact (internal screws, PCB, housing internals)
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional material notes..."
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddOrUpdateMaterial}>
                      {editingIndex !== null ? 'Update' : 'Add'} Material
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p className="mb-4">No materials added yet.</p>
              <p className="text-sm">Click "Add Material" to start building your bill of materials.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                <div className="col-span-3">Component Role</div>
                <div className="col-span-3">Material Name</div>
                <div className="col-span-3">Specification / Grade</div>
                <div className="col-span-2">Patient Contact</div>
                <div className="col-span-1">Actions</div>
              </div>
              
              {/* Material Rows */}
              {materials.map((material, index) => (
                <div key={material.id} className="grid grid-cols-12 gap-4 p-3 bg-muted/20 rounded-lg">
                  <div className="col-span-3 font-medium">{material.componentRole}</div>
                  <div className="col-span-3">{material.materialName}</div>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {material.specification || 'Not specified'}
                  </div>
                  <div className="col-span-2">
                    <Badge variant={getPatientContactBadgeVariant(material.patientContact)}>
                      {material.patientContact}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMaterial(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMaterial(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {material.notes && (
                    <div className="col-span-12 text-sm text-muted-foreground mt-2 pl-4 border-l-2 border-muted">
                      <span className="font-medium">Notes: </span>
                      {material.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}