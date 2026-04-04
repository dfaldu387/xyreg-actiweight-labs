import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Plus, Minus, RotateCcw } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  roles: string[];
  expanded?: boolean;
  x?: number;
  y?: number;
}

interface Node {
  id: string;
  name: string;
  type: 'department' | 'role';
  parentId?: string;
  expanded?: boolean;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
}

interface InteractiveMindMapProps {
  departments: Department[];
  className?: string;
  onDepartmentClick?: (departmentId: string) => void;
  onRoleSelect?: (role: string, department: string) => void;
}

const MEDICAL_DEVICE_DEPARTMENTS = [
  {
    id: 'executive',
    name: 'Executive Leadership',
    roles: [
      'CEO',
      'COO', 
      'CFO',
      'CTO',
      'Chief Medical Officer',
      'Head of Quality & Regulatory Affairs'
    ]
  },
  {
    id: 'rd',
    name: 'Research & Development',
    roles: [
      'R&D Director',
      'Mechanical Engineer',
      'Electrical Engineer', 
      'Software Engineer (Embedded)',
      'Biomedical Scientist',
      'Prototype Technician',
      'Design Assurance Engineer',
      'Industrial Designer'
    ]
  },
  {
    id: 'qa-ra',
    name: 'Quality & Regulatory Affairs',
    roles: [
      'VP Quality & Regulatory Affairs',
      'Quality Manager',
      'Quality Engineer (Design Assurance)',
      'Quality Engineer (Manufacturing)',
      'Incoming QA Inspector',
      'Regulatory Affairs Manager',
      'Regulatory Submissions Specialist',
      'Post-Market Surveillance Specialist',
      'Vigilance Officer',
      'CAPA Coordinator',
      'Document Control Specialist'
    ]
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Operations',
    roles: [
      'VP Operations',
      'Manufacturing Manager',
      'Production Supervisor',
      'Assembly Line Operator',
      'Quality Control Technician',
      'Process Engineer',
      'Supply Chain Manager',
      'Purchasing Agent',
      'Logistics Coordinator',
      'Inventory Control Specialist'
    ]
  },
  {
    id: 'clinical',
    name: 'Clinical Affairs',
    roles: [
      'Clinical Director',
      'Clinical Project Manager',
      'Clinical Research Associate (CRA)',
      'Biostatistician',
      'Medical Writer'
    ]
  },
  {
    id: 'sales-marketing',
    name: 'Sales & Marketing',
    roles: [
      'VP Sales & Marketing',
      'Sales Director',
      'Regional Sales Manager',
      'Sales Representative',
      'Marketing Manager',
      'Product Manager',
      'Marketing Communications Specialist'
    ]
  },
  {
    id: 'customer-support',
    name: 'Customer Service & Support',
    roles: [
      'Customer Service Manager',
      'Customer Service Representative',
      'Technical Support Specialist',
      'Field Service Engineer'
    ]
  },
  {
    id: 'hr',
    name: 'Human Resources',
    roles: [
      'HR Director',
      'HR Generalist',
      'Talent Acquisition Specialist'
    ]
  },
  {
    id: 'finance',
    name: 'Finance & Accounting',
    roles: [
      'Controller',
      'Accountant',
      'Accounts Payable/Receivable Specialist'
    ]
  },
  {
    id: 'legal',
    name: 'Legal',
    roles: [
      'General Counsel',
      'Intellectual Property Lawyer'
    ]
  },
  {
    id: 'it',
    name: 'IT (Information Technology)',
    roles: [
      'IT Manager',
      'Systems Administrator',
      'Cybersecurity Analyst'
    ]
  }
];

export function InteractiveMindMap({ 
  departments, 
  className = "", 
  onDepartmentClick,
  onRoleSelect 
}: InteractiveMindMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Use provided departments or fallback to comprehensive medical device structure
  const activeDepartments = departments.length > 0 ? departments : MEDICAL_DEVICE_DEPARTMENTS;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create nodes and links
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Add department nodes
    activeDepartments.forEach((dept, index) => {
      const angle = (index / activeDepartments.length) * 2 * Math.PI;
      const radius = 200;
      
      nodes.push({
        id: dept.id,
        name: dept.name,
        type: 'department',
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        expanded: expandedDepartments.has(dept.id)
      });

      // Add role nodes if department is expanded
      if (expandedDepartments.has(dept.id)) {
        dept.roles.forEach((role, roleIndex) => {
          const roleAngle = angle + (roleIndex - dept.roles.length / 2) * 0.3;
          const roleRadius = radius + 80;
          
          const roleNode: Node = {
            id: `${dept.id}-${role}`,
            name: role,
            type: 'role',
            parentId: dept.id,
            x: centerX + Math.cos(roleAngle) * roleRadius,
            y: centerY + Math.sin(roleAngle) * roleRadius
          };
          
          nodes.push(roleNode);
          links.push({ source: dept.id, target: roleNode.id });
        });
      }
    });

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create container group
    const container = svg.append('g');

    // Draw links
    const linkElements = container.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', d => {
        const source = nodes.find(n => n.id === d.source);
        return source?.x || 0;
      })
      .attr('y1', d => {
        const source = nodes.find(n => n.id === d.source);
        return source?.y || 0;
      })
      .attr('x2', d => {
        const target = nodes.find(n => n.id === d.target);
        return target?.x || 0;
      })
      .attr('y2', d => {
        const target = nodes.find(n => n.id === d.target);
        return target?.y || 0;
      })
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 2);

    // Draw department nodes
    const departmentNodes = container.selectAll('.department-node')
      .data(nodes.filter(n => n.type === 'department'))
      .enter()
      .append('g')
      .attr('class', 'department-node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    departmentNodes.append('circle')
      .attr('r', 40)
      .attr('fill', d => selectedDepartment === d.id ? '#3b82f6' : '#f3f4f6')
      .attr('stroke', d => expandedDepartments.has(d.id) ? '#10b981' : '#6b7280')
      .attr('stroke-width', 3);

    departmentNodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', d => selectedDepartment === d.id ? 'white' : '#374151')
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name);

    departmentNodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('font-size', '8px')
      .attr('fill', d => selectedDepartment === d.id ? 'white' : '#6b7280')
      .text(d => {
        const dept = activeDepartments.find(dept => dept.id === d.id);
        return dept ? `${dept.roles.length} roles` : '';
      });

    // Draw role nodes
    const roleNodes = container.selectAll('.role-node')
      .data(nodes.filter(n => n.type === 'role'))
      .enter()
      .append('g')
      .attr('class', 'role-node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    roleNodes.append('rect')
      .attr('x', -30)
      .attr('y', -10)
      .attr('width', 60)
      .attr('height', 20)
      .attr('rx', 10)
      .attr('fill', '#dbeafe')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1);

    roleNodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', '8px')
      .attr('fill', '#1e40af')
      .text(d => d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name);

    // Add click handlers
    departmentNodes.on('click', (event, d) => {
      setExpandedDepartments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(d.id)) {
          newSet.delete(d.id);
        } else {
          newSet.add(d.id);
        }
        return newSet;
      });
      
      setSelectedDepartment(d.id);
      onDepartmentClick?.(d.id);
    });

    roleNodes.on('click', (event, d) => {
      const dept = activeDepartments.find(dept => dept.id === d.parentId);
      if (dept && onRoleSelect) {
        onRoleSelect(d.name, dept.name);
      }
    });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', 'translate(20, 20)');

    legend.append('rect')
      .attr('width', 200)
      .attr('height', 80)
      .attr('fill', 'white')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 5);

    legend.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Interactive Mind Map');

    legend.append('circle')
      .attr('cx', 20)
      .attr('cy', 35)
      .attr('r', 8)
      .attr('fill', '#f3f4f6')
      .attr('stroke', '#6b7280');

    legend.append('text')
      .attr('x', 35)
      .attr('y', 40)
      .attr('font-size', '10px')
      .text('Click department to expand');

    legend.append('rect')
      .attr('x', 12)
      .attr('y', 50)
      .attr('width', 16)
      .attr('height', 8)
      .attr('rx', 4)
      .attr('fill', '#dbeafe')
      .attr('stroke', '#3b82f6');

    legend.append('text')
      .attr('x', 35)
      .attr('y', 58)
      .attr('font-size', '10px')
      .text('Click role to select');

  }, [activeDepartments, expandedDepartments, selectedDepartment, onDepartmentClick, onRoleSelect]);

  const resetView = () => {
    setExpandedDepartments(new Set());
    setSelectedDepartment(null);
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(750).call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      );
    }
  };

  const expandAll = () => {
    setExpandedDepartments(new Set(activeDepartments.map(d => d.id)));
  };

  const collapseAll = () => {
    setExpandedDepartments(new Set());
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="w-4 h-4 text-primary" />
            Medical Device Company Mind Map
            <Badge variant="secondary" className="ml-2">
              {activeDepartments.length} departments
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={expandAll}>
              <Plus className="w-3 h-3 mr-1" />
              Expand All
            </Button>
            <Button size="sm" variant="outline" onClick={collapseAll}>
              <Minus className="w-3 h-3 mr-1" />
              Collapse All
            </Button>
            <Button size="sm" variant="outline" onClick={resetView}>
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset View
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Click departments to expand and see roles. Drag to pan, scroll to zoom.
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full border rounded-lg overflow-hidden bg-white">
          <svg
            ref={svgRef}
            width="100%"
            height="600"
            viewBox="0 0 800 600"
            className="cursor-grab active:cursor-grabbing"
          />
        </div>
        
        {selectedDepartment && (
          <div className="mt-4 p-4 border rounded-lg bg-primary/5 border-primary/20">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              {activeDepartments.find(d => d.id === selectedDepartment)?.name} Roles
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {activeDepartments
                .find(d => d.id === selectedDepartment)
                ?.roles.map((role, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => {
                      const dept = activeDepartments.find(d => d.id === selectedDepartment);
                      if (dept && onRoleSelect) {
                        onRoleSelect(role, dept.name);
                      }
                    }}
                  >
                    {role}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}