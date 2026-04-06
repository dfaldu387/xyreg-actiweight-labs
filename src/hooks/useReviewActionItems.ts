import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ReviewActionItem {
  id: string;
  documentId: string;
  documentName: string;
  role: "reviewer" | "author";
  reviewerGroupName: string;
  assignedDate: string;
  dueDate: string | null;
  status: string;
}

export function useReviewActionItems(companyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["review-action-items", companyId, user?.id],
    queryFn: async (): Promise<ReviewActionItem[]> => {
      if (!companyId || !user?.id) return [];

      // 1. Get user's active reviewer groups
      const { data: memberships } = await supabase
        .from("reviewer_group_members_new")
        .select("group_id")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const groupIds = (memberships || []).map((m) => m.group_id);

      // 2. Get reviewer group names
      let groupNamesMap = new Map<string, string>();
      if (groupIds.length > 0) {
        const { data: groups } = await supabase
          .from("reviewer_groups")
          .select("id, name")
          .in("id", groupIds);
        groupNamesMap = new Map((groups || []).map((g) => [g.id, g.name]));
      }

      const ALL_STATUSES = [
        "Not Started", "In Progress", "Under Review", "In Review",
        "Pending", "Changes Requested", "Draft", "Approved", "Rejected", "Closed",
      ];

      // 3. Fetch phase-assigned docs where user is a reviewer
      let reviewerDocs: ReviewActionItem[] = [];
      if (groupIds.length > 0) {
        const { data: phaseDocs } = await supabase
          .from("phase_assigned_document_template")
          .select("id, name, status, created_at, due_date, deadline, reviewer_group_ids")
          .eq("company_id", companyId)
          .eq("is_excluded", false)
          .in("status", ALL_STATUSES)
          .or(`reviewer_group_ids.ov.{${groupIds.join(',')}},reviewer_user_ids.cs.{${user.id}}`);

        reviewerDocs = (phaseDocs || []).map((doc) => {
          const matchedGroup = (doc.reviewer_group_ids || []).find((gid: string) => groupIds.includes(gid));
          return {
            id: `reviewer-${doc.id}`,
            documentId: doc.id,
            documentName: doc.name,
            role: "reviewer" as const,
            reviewerGroupName: matchedGroup ? (groupNamesMap.get(matchedGroup) || "—") : "—",
            assignedDate: doc.created_at,
            dueDate: doc.due_date || doc.deadline || null,
            status: doc.status || "Pending",
          };
        });
      }

      // 4. Fetch docs where user is an author
      const { data: authorDocs } = await supabase
        .from("phase_assigned_document_template")
        .select("id, name, status, created_at, due_date, deadline")
        .eq("company_id", companyId)
        .eq("is_excluded", false)
        .in("status", ALL_STATUSES)
        .contains("authors_ids", JSON.stringify([user.id]));

      const authorItems: ReviewActionItem[] = (authorDocs || [])
        .filter((doc) => !reviewerDocs.some((r) => r.documentId === doc.id))
        .map((doc) => ({
          id: `author-${doc.id}`,
          documentId: doc.id,
          documentName: doc.name,
          role: "author" as const,
          reviewerGroupName: "—",
          assignedDate: doc.created_at,
          dueDate: doc.due_date || doc.deadline || null,
          status: doc.status || "Draft",
        }));

      // 5. Get user's personal review decisions to show per-user status
      const allItems = [...reviewerDocs, ...authorItems];
      if (allItems.length > 0) {
        const docIds = allItems.map((d) => d.documentId);
        const { data: myDecisions } = await supabase
          .from("document_reviewer_decisions")
          .select("document_id, decision")
          .eq("reviewer_id", user.id)
          .in("document_id", docIds);

        if (myDecisions && myDecisions.length > 0) {
          const decisionMap = new Map(myDecisions.map((d) => [d.document_id, d.decision]));
          const statusMap: Record<string, string> = {
            approved: "Approved",
            rejected: "Rejected",
            changes_requested: "Changes Requested",
            in_review: "In Review",
            not_started: "Not Started",
            pending: "Pending",
          };
          allItems.forEach((item) => {
            const decision = decisionMap.get(item.documentId);
            if (decision && item.role === "reviewer") {
              item.status = statusMap[decision] || item.status;
            }
          });
        }
      }

      return allItems;
    },
    enabled: !!companyId && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}
