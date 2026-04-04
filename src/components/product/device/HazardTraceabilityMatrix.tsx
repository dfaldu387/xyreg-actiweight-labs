import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, Edit, X, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Hazard {
  id?: string;
  hazard_id: string;
  hazard_description: string;
  potential_harm: string;
  severity: string;
  probability: string;
  risk_level: string;
  risk_controls: string[];
  verification_methods: string[];
  residual_risk_level: string;
  risk_acceptability: string;
  risk_benefit_analysis: string;
}

interface HazardTraceabilityMatrixProps {
  productId: string;
  companyId: string;
}

const severityOptions = ["Negligible", "Minor", "Serious", "Critical", "Catastrophic"];
const probabilityOptions = ["Improbable", "Remote", "Occasional", "Probable", "Frequent"];
const riskLevelOptions = ["Low", "Medium", "High", "Very High"];
const acceptabilityOptions = ["Acceptable", "Not Acceptable", "ALARP"];

export function HazardTraceabilityMatrix({ productId, companyId }: HazardTraceabilityMatrixProps) {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newHazard, setNewHazard] = useState<Partial<Hazard>>({
    hazard_id: '',
    hazard_description: '',
    potential_harm: '',
    severity: 'Minor',
    probability: 'Remote',
    risk_level: 'Low',
    risk_controls: [],
    verification_methods: [],
    residual_risk_level: 'Low',
    risk_acceptability: 'Acceptable',
    risk_benefit_analysis: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Load hazards on component mount
  useEffect(() => {
    loadHazards();
  }, [productId]);

  const loadHazards = async () => {
    try {
      setIsLoading(true);
      
      // For now, we'll use localStorage as a temporary storage solution
      // until the database table is created
      const storedHazards = localStorage.getItem(`hazards_${productId}`);
      if (storedHazards) {
        setHazards(JSON.parse(storedHazards));
      }
      
      // TODO: Replace with actual Supabase query once table is created
      // const { data, error } = await supabase
      //   .from('product_hazards')
      //   .select('*')
      //   .eq('product_id', productId)
      //   .order('hazard_id');
      
      // if (error) {
      //   console.error('Error loading hazards:', error);
      //   toast.error('Failed to load hazards');
      //   return;
      // }
      
      // setHazards(data || []);
    } catch (error) {
      console.error('Error loading hazards:', error);
      toast.error('Failed to load hazards');
    } finally {
      setIsLoading(false);
    }
  };

  const saveHazards = (updatedHazards: Hazard[]) => {
    // Temporary localStorage save
    localStorage.setItem(`hazards_${productId}`, JSON.stringify(updatedHazards));
    setHazards(updatedHazards);
  };

  const handleAddHazard = async () => {
    if (!newHazard.hazard_id || !newHazard.hazard_description) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const hazardToAdd: Hazard = {
        id: Date.now().toString(), // Temporary ID
        hazard_id: newHazard.hazard_id || '',
        hazard_description: newHazard.hazard_description || '',
        potential_harm: newHazard.potential_harm || '',
        severity: newHazard.severity || 'Minor',
        probability: newHazard.probability || 'Remote',
        risk_level: newHazard.risk_level || 'Low',
        risk_controls: newHazard.risk_controls || [],
        verification_methods: newHazard.verification_methods || [],
        residual_risk_level: newHazard.residual_risk_level || 'Low',
        risk_acceptability: newHazard.risk_acceptability || 'Acceptable',
        risk_benefit_analysis: newHazard.risk_benefit_analysis || ''
      };

      const updatedHazards = [...hazards, hazardToAdd];
      saveHazards(updatedHazards);
      
      // Reset form
      setNewHazard({
        hazard_id: '',
        hazard_description: '',
        potential_harm: '',
        severity: 'Minor',
        probability: 'Remote',
        risk_level: 'Low',
        risk_controls: [],
        verification_methods: [],
        residual_risk_level: 'Low',
        risk_acceptability: 'Acceptable',
        risk_benefit_analysis: ''
      });
      setShowAddForm(false);
      toast.success('Hazard added successfully');
    } catch (error) {
      console.error('Error adding hazard:', error);
      toast.error('Failed to add hazard');
    }
  };

  const handleUpdateHazard = async (id: string, updates: Partial<Hazard>) => {
    try {
      const updatedHazards = hazards.map(hazard => 
        hazard.id === id ? { ...hazard, ...updates } : hazard
      );
      saveHazards(updatedHazards);
      setEditingId(null);
      toast.success('Hazard updated successfully');
    } catch (error) {
      console.error('Error updating hazard:', error);
      toast.error('Failed to update hazard');
    }
  };

  const handleDeleteHazard = async (id: string) => {
    try {
      const updatedHazards = hazards.filter(hazard => hazard.id !== id);
      saveHazards(updatedHazards);
      toast.success('Hazard deleted successfully');
    } catch (error) {
      console.error('Error deleting hazard:', error);
      toast.error('Failed to delete hazard');
    }
  };

  const getRiskLevelBadgeColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'very high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAcceptabilityBadgeColor = (acceptability: string) => {
    switch (acceptability.toLowerCase()) {
      case 'acceptable': return 'bg-green-100 text-green-800';
      case 'alarp': return 'bg-yellow-100 text-yellow-800';
      case 'not acceptable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading hazards...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hazard Analysis & Risk Evaluation</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage identified hazards, associated risks, and control measures
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Hazard
        </Button>
      </div>

      {/* Add New Hazard Form */}
      {showAddForm && (
        <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Add New Hazard</h4>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Hazard ID *</label>
              <Input
                value={newHazard.hazard_id || ''}
                onChange={(e) => setNewHazard(prev => ({ ...prev, hazard_id: e.target.value }))}
                placeholder="e.g., H001"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Severity</label>
              <Select 
                value={newHazard.severity || 'Minor'} 
                onValueChange={(value) => setNewHazard(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Hazard Description *</label>
              <Textarea
                value={newHazard.hazard_description || ''}
                onChange={(e) => setNewHazard(prev => ({ ...prev, hazard_description: e.target.value }))}
                placeholder="Describe the identified hazard..."
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Potential Harm</label>
              <Textarea
                value={newHazard.potential_harm || ''}
                onChange={(e) => setNewHazard(prev => ({ ...prev, potential_harm: e.target.value }))}
                placeholder="Describe potential harm that could result..."
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleAddHazard}>
              <Check className="h-4 w-4 mr-2" />
              Add Hazard
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Hazards Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Hazard ID</TableHead>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead className="min-w-[150px]">Potential Harm</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead className="min-w-[150px]">Risk Controls</TableHead>
                <TableHead>Residual Risk</TableHead>
                <TableHead>Acceptability</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hazards.map((hazard) => (
                <TableRow key={hazard.id}>
                  <TableCell className="font-medium">{hazard.hazard_id}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={hazard.hazard_description}>
                      {hazard.hazard_description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[150px] truncate" title={hazard.potential_harm}>
                      {hazard.potential_harm || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{hazard.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{hazard.probability}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRiskLevelBadgeColor(hazard.risk_level)}>
                      {hazard.risk_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[150px] truncate">
                      {hazard.risk_controls.length > 0 ? hazard.risk_controls.join(', ') : 'No controls defined'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRiskLevelBadgeColor(hazard.residual_risk_level)}>
                      {hazard.residual_risk_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getAcceptabilityBadgeColor(hazard.risk_acceptability)}>
                      {hazard.risk_acceptability}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingId(hazard.id || null)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => hazard.id && handleDeleteHazard(hazard.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {hazards.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hazards identified yet. Click "Add Hazard" to start your risk analysis.</p>
        </div>
      )}

      {/* Summary Stats */}
      {hazards.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold">{hazards.length}</div>
            <div className="text-sm text-muted-foreground">Total Hazards</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {hazards.filter(h => h.risk_level === 'High' || h.risk_level === 'Very High').length}
            </div>
            <div className="text-sm text-muted-foreground">High Risk</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {hazards.filter(h => h.risk_level === 'Medium').length}
            </div>
            <div className="text-sm text-muted-foreground">Medium Risk</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {hazards.filter(h => h.risk_acceptability === 'Not Acceptable').length}
            </div>
            <div className="text-sm text-muted-foreground">Not Acceptable</div>
          </div>
        </div>
      )}
    </div>
  );
}