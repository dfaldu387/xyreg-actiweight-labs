import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users } from "lucide-react";
import { ReviewerItem } from "@/types/client";

interface DocumentReviewersProps {
  reviewers: ReviewerItem[];
  onReviewersChange: (reviewers: ReviewerItem[]) => void;
  availableUsers?: any[];
}

export function DocumentReviewers({ reviewers, onReviewersChange, availableUsers = [] }: DocumentReviewersProps) {
  const addReviewer = () => {
    const newReviewer: ReviewerItem = {
      id: Date.now().toString(),
      name: "",
      email: "", // Add required email property
      role: "internal",
      status: "Pending",
      lastAction: "Added to review"
    };
    onReviewersChange([...reviewers, newReviewer]);
  };

  const updateReviewer = (index: number, field: keyof ReviewerItem, value: string) => {
    const updatedReviewers = [...reviewers];
    updatedReviewers[index] = { ...updatedReviewers[index], [field]: value };
    onReviewersChange(updatedReviewers);
  };

  const removeReviewer = (index: number) => {
    const updatedReviewers = reviewers.filter((_, i) => i !== index);
    onReviewersChange(updatedReviewers);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Document Reviewers</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addReviewer}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Reviewer
        </Button>
      </div>

      {reviewers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No reviewers assigned</p>
          <p className="text-xs">Click "Add Reviewer" to assign reviewers to this document</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviewers.map((reviewer, index) => (
            <div key={reviewer.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Input
                    placeholder="Reviewer name"
                    value={reviewer.name}
                    onChange={(e) => updateReviewer(index, "name", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Reviewer email"
                    value={reviewer.email}
                    onChange={(e) => updateReviewer(index, "email", e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <Select
                value={reviewer.role}
                onValueChange={(value: "internal" | "external") => updateReviewer(index, "role", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeReviewer(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
