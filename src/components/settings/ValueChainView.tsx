import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Building, Users, User, ArrowRight } from "lucide-react";
import { DepartmentPeople } from "@/components/users/DepartmentPeople";

interface Department {
  id: string;
  name: string;
  departmentHead?: string;
  departmentHeadName?: string;
  keyResponsibilities: string;
  position: number;
  color?: string;
  category?: 'support' | 'primary';
}

interface CompanyUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  functional_area?: string;
  avatar_url?: string | null;
}

interface ValueChainViewProps {
  departments: Department[];
  employeesByDept: Record<string, { employees: CompanyUser[]; totalFTE: number }>;
  normalizeDepartmentName: (name: string) => string;
  onDepartmentClick: (dept: Department) => void;
  onUserUpdate: () => void;
  onCategoryChange: (deptId: string, category: 'support' | 'primary' | undefined) => void;
  onReorder: (deptId: string, targetIndex: number, category: 'support' | 'primary' | undefined) => void;
  companyId?: string;
  readOnly?: boolean;
}

const SUPPORT_COLORS = [
  { bg: 'bg-teal-500', light: 'bg-teal-50 border-teal-500', text: 'text-teal-900' },
  { bg: 'bg-blue-500', light: 'bg-blue-50 border-blue-500', text: 'text-blue-900' },
  { bg: 'bg-green-500', light: 'bg-green-50 border-green-500', text: 'text-green-900' },
  { bg: 'bg-amber-500', light: 'bg-amber-50 border-amber-500', text: 'text-amber-900' },
  { bg: 'bg-purple-500', light: 'bg-purple-50 border-purple-500', text: 'text-purple-900' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-50 border-indigo-500', text: 'text-indigo-900' },
];

const PRIMARY_COLORS = [
  'from-blue-500 to-blue-600',
  'from-cyan-500 to-cyan-600',
  'from-teal-500 to-teal-600',
  'from-emerald-500 to-emerald-600',
  'from-green-500 to-green-600',
  'from-lime-500 to-lime-600',
  'from-amber-500 to-amber-600',
  'from-orange-500 to-orange-600',
];

export function ValueChainView({ departments, employeesByDept, normalizeDepartmentName, onDepartmentClick, onUserUpdate, onCategoryChange, onReorder, companyId, readOnly }: ValueChainViewProps) {
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ deptId: string; position: 'before' | 'after' } | null>(null);

  const supportDepts = departments.filter(d => d.category === 'support').sort((a, b) => a.position - b.position);
  const primaryDepts = departments.filter(d => d.category === 'primary').sort((a, b) => a.position - b.position);
  const unassignedDepts = departments.filter(d => !d.category).sort((a, b) => a.position - b.position);

  const handleDragStart = (e: React.DragEvent, dept: Department) => {
    e.dataTransfer.setData("departmentId", dept.id);
    e.dataTransfer.setData("sourceCategory", dept.category || "unassigned");
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverZone(zone);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverZone(null);
    }
  };

  const handleDrop = (e: React.DragEvent, category: 'support' | 'primary' | undefined) => {
    e.preventDefault();
    setDragOverZone(null);
    setDropIndicator(null);
    const deptId = e.dataTransfer.getData("departmentId");
    if (deptId) {
      onCategoryChange(deptId, category);
    }
  };

  const handleCardDragOver = (e: React.DragEvent, targetDept: Department, sectionDepts: Department[]) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const midX = rect.left + rect.width / 2;
    const isBefore = targetDept.category === 'primary' ? e.clientX < midX : e.clientY < midY;

    setDropIndicator({ deptId: targetDept.id, position: isBefore ? 'before' : 'after' });
    setDragOverZone(targetDept.category || 'unassigned');
  };

  const handleCardDrop = (e: React.DragEvent, targetDept: Department, sectionDepts: Department[]) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverZone(null);
    setDropIndicator(null);

    const deptId = e.dataTransfer.getData("departmentId");
    if (!deptId || deptId === targetDept.id) return;

    const targetIdx = sectionDepts.findIndex(d => d.id === targetDept.id);
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const midX = rect.left + rect.width / 2;
    const isBefore = targetDept.category === 'primary' ? e.clientX < midX : e.clientY < midY;
    const insertIdx = isBefore ? targetIdx : targetIdx + 1;

    onReorder(deptId, insertIdx, targetDept.category);
  };

  const handleCardDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropIndicator(null);
    }
  };

  const getDeptData = (dept: Department) => {
    const normalizedName = normalizeDepartmentName(dept.name);
    return employeesByDept[normalizedName] || { employees: [], totalFTE: 0 };
  };

  const dropZoneClass = (zone: string) =>
    dragOverZone === zone ? 'ring-2 ring-dashed ring-blue-400 bg-blue-50/30' : '';

  const renderSupportBar = (dept: Department, index: number) => {
    const colorSet = SUPPORT_COLORS[index % SUPPORT_COLORS.length];
    const deptData = getDeptData(dept);
    const indicator = dropIndicator?.deptId === dept.id ? dropIndicator.position : null;

    return (
      <div
        key={dept.id}
        draggable
        onDragStart={(e) => handleDragStart(e, dept)}
        onDragOver={(e) => handleCardDragOver(e, dept, supportDepts)}
        onDrop={(e) => handleCardDrop(e, dept, supportDepts)}
        onDragLeave={handleCardDragLeave}
        onClick={() => onDepartmentClick(dept)}
        className={`flex items-center border-l-4 ${colorSet.light} rounded-r-md cursor-grab hover:shadow-md transition-all active:cursor-grabbing ${
          indicator === 'before' ? 'border-t-4 border-t-blue-400' : indicator === 'after' ? 'border-b-4 border-b-blue-400' : ''
        }`}
      >
        <div className={`${colorSet.bg} w-10 h-full min-h-[48px] flex items-center justify-center rounded-l-sm shrink-0`}>
          <Building className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 flex items-center justify-between px-3 py-2 min-h-[48px]">
          <div className="flex items-center gap-3">
            <h4 className={`font-semibold text-sm ${colorSet.text}`}>{dept.name}</h4>
            {dept.keyResponsibilities && (
              <span className="text-xs text-muted-foreground truncate max-w-[300px] hidden md:inline">
                {dept.keyResponsibilities}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {dept.departmentHeadName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{dept.departmentHeadName}</span>
              </div>
            )}
            {deptData.employees.length > 0 && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Users className="h-3 w-3" />
                {deptData.employees.length}
              </Badge>
            )}
            <DepartmentPeople
              departmentName={dept.name}
              users={deptData.employees}
              onUserUpdate={onUserUpdate}
              companyId={companyId}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPrimaryColumn = (dept: Department, index: number) => {
    const colorClass = PRIMARY_COLORS[index % PRIMARY_COLORS.length];
    const deptData = getDeptData(dept);
    const indicator = dropIndicator?.deptId === dept.id ? dropIndicator.position : null;

    return (
      <React.Fragment key={dept.id}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, dept)}
          onDragOver={(e) => handleCardDragOver(e, dept, primaryDepts)}
          onDrop={(e) => handleCardDrop(e, dept, primaryDepts)}
          onDragLeave={handleCardDragLeave}
          onClick={() => onDepartmentClick(dept)}
          className={`relative flex flex-col bg-gradient-to-b ${colorClass} text-white cursor-grab hover:shadow-lg transition-all active:cursor-grabbing min-h-[140px] ${
            indicator === 'before' ? 'ring-l-4 border-l-4 border-l-blue-400' : indicator === 'after' ? 'border-r-4 border-r-blue-400' : ''
          }`}
          style={{
            clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)',
            paddingLeft: index === 0 ? '12px' : '24px',
            paddingRight: '24px',
          }}
        >
          <div className="flex flex-col items-center justify-center flex-1 py-3 px-1 text-center">
            <h4 className="font-bold text-xs leading-tight mb-1">{dept.name}</h4>
            {dept.keyResponsibilities && (
              <p className="text-[10px] text-white/80 leading-tight line-clamp-2 mb-1">
                {dept.keyResponsibilities}
              </p>
            )}
            <div className="mt-auto flex flex-col items-center gap-1">
              {deptData.employees.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-white/90">
                  <Users className="h-3 w-3" />
                  <span>{deptData.employees.length} • {Math.round(deptData.totalFTE)}% FTE</span>
                </div>
              )}
              <DepartmentPeople
                departmentName={dept.name}
                users={deptData.employees}
                onUserUpdate={onUserUpdate}
                companyId={companyId}
              />
            </div>
          </div>
        </div>
        {index === 0 && (
          <div
            style={{
              clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)',
              marginLeft: '-16px',
            }}
          />
        )}
      </React.Fragment>
    );
  };

  const renderUnassignedCard = (dept: Department) => {
    const deptData = getDeptData(dept);
    const indicator = dropIndicator?.deptId === dept.id ? dropIndicator.position : null;

    return (
      <div
        key={dept.id}
        draggable
        onDragStart={(e) => handleDragStart(e, dept)}
        onDragOver={(e) => handleCardDragOver(e, dept, unassignedDepts)}
        onDrop={(e) => handleCardDrop(e, dept, unassignedDepts)}
        onDragLeave={handleCardDragLeave}
        onClick={() => onDepartmentClick(dept)}
        className={`bg-white border border-slate-200 rounded-lg p-3 cursor-grab hover:shadow-md transition-all active:cursor-grabbing ${
          indicator === 'before' ? 'border-t-4 border-t-blue-400' : indicator === 'after' ? 'border-b-4 border-b-blue-400' : ''
        }`}
      >
        <h4 className="font-semibold text-sm text-slate-700 mb-1">{dept.name}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {deptData.employees.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {deptData.employees.length}
            </span>
          )}
          {dept.departmentHeadName && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {dept.departmentHeadName}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border p-6 space-y-1">
      {/* Main Value Chain diagram */}
      <div className="flex gap-0">
        {/* Left: Support + Primary stacked */}
        <div className="flex-1 space-y-0">
          {/* Support Activities */}
          <div
            className={`rounded-t-lg border border-b-0 border-slate-200 overflow-hidden transition-all ${dropZoneClass('support')}`}
            onDragOver={(e) => handleDragOver(e, 'support')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'support')}
          >
            <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Support Activities</h3>
            </div>
            <div className="p-2 space-y-1 min-h-[60px] bg-white/50">
              {supportDepts.length > 0 ? (
                supportDepts.map((dept, i) => renderSupportBar(dept, i))
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-muted-foreground">
                  Drag departments here for support activities
                </div>
              )}
            </div>
          </div>

          {/* Primary Activities */}
          <div
            className={`rounded-b-lg border border-slate-200 overflow-hidden transition-all ${dropZoneClass('primary')}`}
            onDragOver={(e) => handleDragOver(e, 'primary')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'primary')}
          >
            <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Primary Activities</h3>
            </div>
            <div className="p-2 min-h-[80px] bg-white/50">
              {primaryDepts.length > 0 ? (
                <div className="flex" style={{ marginLeft: '0' }}>
                  {primaryDepts.map((dept, i) => renderPrimaryColumn(dept, i))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-muted-foreground">
                  Drag departments here for primary activities
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Margin arrow - spans full height */}
        <div
          className="w-20 shrink-0 flex items-stretch"
          style={{
            clipPath: 'polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%)',
          }}
        >
          <div className="bg-gradient-to-b from-amber-400 via-orange-500 to-red-500 w-full flex flex-col items-center justify-center text-white">
            <span className="font-black text-sm tracking-widest" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              MARGIN
            </span>
            <ArrowRight className="h-5 w-5 mt-3" />
          </div>
        </div>
      </div>

      {/* Unassigned departments - hidden in readOnly mode when empty */}
      {!readOnly && (unassignedDepts.length > 0 || dragOverZone === 'unassigned') && (
        <div
          className={`mt-4 rounded-lg border border-slate-200 overflow-hidden transition-all ${dropZoneClass('unassigned')}`}
          onDragOver={(e) => handleDragOver(e, 'unassigned')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, undefined)}
        >
          <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unassigned Departments</h3>
          </div>
          <div className="p-2 min-h-[40px] bg-white/50">
            {unassignedDepts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {unassignedDepts.map((dept) => renderUnassignedCard(dept))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-sm text-muted-foreground">
                Drag departments here to unassign
              </div>
            )}
          </div>
        </div>
      )}

      {/* Always show unassigned drop zone when dragging (settings only) */}
      {!readOnly && unassignedDepts.length === 0 && dragOverZone !== 'unassigned' && (
        <div
          className="mt-4 rounded-lg border-2 border-dashed border-slate-200 p-4 text-center text-sm text-muted-foreground transition-all"
          onDragOver={(e) => handleDragOver(e, 'unassigned')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, undefined)}
        >
          Drag departments here to unassign
        </div>
      )}

      {/* In readOnly mode, show unassigned departments without drag UI */}
      {readOnly && unassignedDepts.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unassigned Departments</h3>
          </div>
          <div className="p-2 bg-white/50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {unassignedDepts.map((dept) => renderUnassignedCard(dept))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
