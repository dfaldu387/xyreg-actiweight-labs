
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PhaseDocument } from "@/types/phaseDocuments";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentListProps {
  documents: PhaseDocument[];
  loading: boolean;
  onRemoveDocument: (id: string) => Promise<boolean>;
  onAddDocument: (name: string, type?: string) => Promise<string | null>;
  operationInProgress: boolean;
}

export function DocumentList({
  documents,
  loading,
  onRemoveDocument,
  onAddDocument,
  operationInProgress
}: DocumentListProps) {
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Standard");
  const [addingDoc, setAddingDoc] = useState(false);
  const [removingDocId, setRemovingDocId] = useState<string | null>(null);

  const handleAddDocument = async () => {
    if (!newDocName.trim()) return;
    
    try {
      setAddingDoc(true);
      await onAddDocument(newDocName.trim(), newDocType);
      setNewDocName("");
    } finally {
      setAddingDoc(false);
    }
  };

  const handleRemoveDocument = async (id: string) => {
    try {
      setRemovingDocId(id);
      await onRemoveDocument(id);
    } finally {
      setRemovingDocId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Add a custom document</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-grow">
            <Input
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="Document name"
              disabled={operationInProgress}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select 
              value={newDocType} 
              onValueChange={setNewDocType}
              disabled={operationInProgress}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Regulatory">Regulatory</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Clinical">Clinical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleAddDocument}
            disabled={!newDocName.trim() || addingDoc || operationInProgress}
            className="whitespace-nowrap"
          >
            {addingDoc ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Document
              </>
            )}
          </Button>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold">Assigned Documents</h3>
      {documents.length === 0 ? (
        <Alert>
          <AlertDescription>
            No documents assigned to this phase yet. Add documents using the form above.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="border shadow-sm">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex-grow">
                  <h4 className="font-medium">{doc.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {doc.type || "Standard"} · {doc.status || "Not Started"}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveDocument(doc.id!)}
                  disabled={removingDocId === doc.id || operationInProgress}
                >
                  {removingDocId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
