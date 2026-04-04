import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, X, Loader2, ChevronRight, ChevronDown, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useReviewActionItems } from "@/hooks/useReviewActionItems";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useCompanyId } from "@/hooks/useCompanyId";

interface ReviewActionItemsWidgetProps {
  companyId?: string;
  onRemove?: () => void;
}

const CLOSED_STATUSES = ["Approved", "Rejected", "Closed"];

const statusBadgeVariant: Record<string, string> = {
  "Not Started": "bg-orange-500/15 text-orange-700 border-orange-500/30",
  "Pending": "bg-orange-500/15 text-orange-700 border-orange-500/30",
  "In Review": "bg-blue-500/15 text-blue-700 border-blue-500/30",
  "Under Review": "bg-blue-500/15 text-blue-700 border-blue-500/30",
  "In Progress": "bg-blue-500/15 text-blue-700 border-blue-500/30",
  "Draft": "bg-slate-500/15 text-slate-700 border-slate-500/30",
  "Changes Requested": "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  "Approved": "bg-green-500/15 text-green-700 border-green-500/30",
  "Rejected": "bg-red-500/15 text-red-700 border-red-500/30",
  "Closed": "bg-muted text-muted-foreground border-border",
};

const roleBadgeVariant: Record<string, string> = {
  reviewer: "bg-purple-100 text-purple-800 border-purple-300",
  author: "bg-blue-100 text-blue-800 border-blue-300",
};

export function ReviewActionItemsWidget({ companyId, onRemove }: ReviewActionItemsWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const navigate = useNavigate();
  const { companyRoles } = useCompanyRole();
  const resolvedCompanyId = useCompanyId();
  const effectiveCompanyId = companyId || resolvedCompanyId;

  const { data: items = [], isLoading, error } = useReviewActionItems(effectiveCompanyId);

  const filteredItems = showClosed ? items : items.filter((i) => !CLOSED_STATUSES.includes(i.status));

  // Status counts (from full list)
  const statusCounts = {
    pending: items.filter((i) => ["Not Started", "Pending"].includes(i.status)).length,
    inReview: items.filter((i) => ["In Review", "Under Review", "In Progress"].includes(i.status)).length,
    approved: items.filter((i) => i.status === "Approved").length,
    rejected: items.filter((i) => i.status === "Rejected").length,
    changesRequested: items.filter((i) => i.status === "Changes Requested").length,
  };

  const roleCounts = {
    reviewer: items.filter((i) => i.role === "reviewer").length,
    author: items.filter((i) => i.role === "author").length,
  };

  const currentCompanyName = companyRoles.find((r) => r.companyId === effectiveCompanyId)?.companyName;

  const handleRowClick = (item: typeof items[0]) => {
    if (!currentCompanyName) return;
    navigate(
      `/app/company/${encodeURIComponent(currentCompanyName)}/review?highlight=${item.documentId}&t=${Date.now()}`
    );
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const summaryView = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground font-medium mr-1">Status:</span>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${statusBadgeVariant["Pending"]}`}>
          Pending: {statusCounts.pending}
        </Badge>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${statusBadgeVariant["In Review"]}`}>
          In Review: {statusCounts.inReview}
        </Badge>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${statusBadgeVariant["Changes Requested"]}`}>
          Changes Requested: {statusCounts.changesRequested}
        </Badge>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${statusBadgeVariant["Approved"]}`}>
          Approved: {statusCounts.approved}
        </Badge>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${statusBadgeVariant["Rejected"]}`}>
          Rejected: {statusCounts.rejected}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground font-medium mr-1">Role:</span>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${roleBadgeVariant.reviewer}`}>
          Reviewer: {roleCounts.reviewer}
        </Badge>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${roleBadgeVariant.author}`}>
          Author: {roleCounts.author}
        </Badge>
      </div>
    </div>
  );

  const expandedTable = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 pr-3 font-medium">Date</th>
            <th className="text-left py-2 pr-3 font-medium">Document Name</th>
            <th className="text-left py-2 pr-3 font-medium">Role</th>
            <th className="text-left py-2 pr-3 font-medium">Reviewer Group</th>
            <th className="text-left py-2 pr-3 font-medium">Due Date</th>
            <th className="text-left py-2 font-medium">Status</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-6 text-muted-foreground text-xs">
                {showClosed ? "No review items found" : "No pending review items"}
              </td>
            </tr>
          ) : (
            filteredItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border/50 hover:bg-muted/50 cursor-pointer"
                onClick={() => handleRowClick(item)}
              >
                <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                  {format(new Date(item.assignedDate), "MMM d, yyyy")}
                </td>
                <td className="py-2 pr-3 font-medium max-w-[220px] truncate">
                  {item.documentName}
                </td>
                <td className="py-2 pr-3">
                  <Badge variant="outline" className={`text-xs px-1.5 py-0 capitalize ${roleBadgeVariant[item.role]}`}>
                    {item.role}
                  </Badge>
                </td>
                <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                  {item.reviewerGroupName}
                </td>
                <td className={`py-2 pr-3 whitespace-nowrap ${isOverdue(item.dueDate) ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {item.dueDate ? format(new Date(item.dueDate), "MMM d, yyyy") : "—"}
                </td>
                <td className="py-2 pr-3">
                  <Badge variant="outline" className={`text-xs px-1.5 py-0 ${statusBadgeVariant[item.status] || ""}`}>
                    {item.status}
                  </Badge>
                </td>
                <td className="py-2">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const content = error ? (
    <p className="text-xs text-destructive text-center py-4">Unable to load review items</p>
  ) : isLoading ? (
    <div className="flex items-center justify-center py-4">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  ) : items.length === 0 ? (
    <p className="text-xs text-muted-foreground text-center py-4">No review assignments yet</p>
  ) : null;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-primary" />
          Review Action Items
          {filteredItems.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">{filteredItems.length}</Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <Checkbox
                checked={showClosed}
                onCheckedChange={(checked) => setShowClosed(checked === true)}
                className="h-3.5 w-3.5"
              />
              Show closed
            </label>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
          {onRemove && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isExpanded ? (content || expandedTable) : (content || summaryView)}
      </CardContent>
    </Card>
  );
}
