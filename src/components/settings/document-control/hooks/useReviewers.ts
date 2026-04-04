
import { toast } from "sonner";
import { DocumentItem, ReviewerItem } from "@/types/client";

export function useReviewers(
  documents: DocumentItem[],
  setDocuments: (docs: DocumentItem[]) => void
) {
  const handleUpdateReviewers = (docId: string, reviewers: ReviewerItem[]): void => {
    setDocuments(documents.map(doc => 
      doc.id === docId ? {...doc, reviewers} : doc
    ));
    toast.success(`Reviewers updated successfully`);
  };

  return {
    handleUpdateReviewers
  };
}
