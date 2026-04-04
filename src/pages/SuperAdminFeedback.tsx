import { useState, useCallback } from "react";
import { FeedbackTrackerWidget } from "@/components/mission-control/widgets/FeedbackTrackerWidget";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function SuperAdminFeedback() {
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [showClosed, setShowClosed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const handleCountReady = useCallback((count: number) => {
    setFeedbackCount(count);
  }, []);

  return (
    <div className="w-full px-4 py-3 space-y-3">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Feedback Tracker
            {feedbackCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                — {feedbackCount} items
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage feedback from all users
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          Show closed
          <Switch
            checked={showClosed}
            onCheckedChange={setShowClosed}
          />
        </label>
      </div>

      {/* Filters — same style as Users page */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback..."
              className="pl-9 h-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[170px] h-9">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="bug_report">Bug Report</SelectItem>
            <SelectItem value="improvement_suggestion">Improvement</SelectItem>
            <SelectItem value="feature_request">Feature Request</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <FeedbackTrackerWidget
          companyId={null as any}
          readOnly={false}
          defaultExpanded={true}
          hideHeader={true}
          onCountReady={handleCountReady}
          externalShowClosed={showClosed}
          externalSearchTerm={searchTerm}
          externalTypeFilter={typeFilter}
          externalStatusFilter={statusFilter}
          externalPriorityFilter={priorityFilter}
        />
      </div>
    </div>
  );
}
