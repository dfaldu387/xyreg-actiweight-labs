import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Edit3, 
  Trash2, 
  GripVertical, 
  Check, 
  ChevronsUpDown,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Department {
  id: string;
  name: string;
  departmentHead?: string;
  departmentHeadName?: string;
  keyResponsibilities: string;
  position: number;
}

interface CompanyUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface DepartmentCardProps {
  department: Department;
  index: number;
  users: CompanyUser[];
  onUpdate: (id: string, field: keyof Department, value: string) => void;
  onDelete: (id: string) => void;
  dragHandleProps: any;
}

const SUGGESTED_DEPARTMENTS = [
  "Quality Assurance",
  "Research & Development", 
  "Regulatory Affairs",
  "Manufacturing",
  "Clinical Affairs",
  "Product Development",
  "Quality Control",
  "Post Market Surveillance",
  "Design & Development",
  "Risk Management",
  "Supplier Management",
  "Validation",
  "Verification",
  "Documentation Control",
  "Training & Competence",
  "Management Review",
  "Corrective & Preventive Actions (CAPA)",
  "Customer Service",
  "Sales & Marketing",
  "Finance & Administration"
];

const CARD_COLORS = [
  'from-blue-500 to-blue-600',
  'from-green-500 to-green-600', 
  'from-purple-500 to-purple-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600',
  'from-red-500 to-red-600',
  'from-yellow-500 to-yellow-600',
  'from-cyan-500 to-cyan-600'
];

export function DepartmentCard({ 
  department, 
  index, 
  users, 
  onUpdate, 
  onDelete, 
  dragHandleProps 
}: DepartmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  
  const cardColor = CARD_COLORS[index % CARD_COLORS.length];

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg border-0 bg-gradient-to-r ${cardColor} text-white cursor-pointer`} onClick={handleCardClick}>
      <div className={`bg-gradient-to-r ${cardColor} h-full`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div {...dragHandleProps} onClick={stopPropagation}>
              <GripVertical className="h-5 w-5 text-white/70 hover:text-white cursor-grab" />
            </div>
            
            <Building2 className="h-5 w-5" />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {department.name || 'Untitled Department'}
                </h3>
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                  Dept {index + 1}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-white/90">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{department.departmentHeadName || 'No head assigned'}</span>
                </div>
                {department.keyResponsibilities && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="truncate max-w-48">
                      {department.keyResponsibilities.slice(0, 50)}
                      {department.keyResponsibilities.length > 50 ? '...' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2" onClick={stopPropagation}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(department.id)}
                className="text-white/70 hover:text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </div>
    </Card>
  );
}