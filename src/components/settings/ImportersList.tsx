
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Importer {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
}

interface ImportersListProps {
  importers: Importer[];
  onRemoveImporter: (index: number) => void;
}

export function ImportersList({ importers, onRemoveImporter }: ImportersListProps) {
  if (importers.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No importers/distributors added yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {importers.map((importer, index) => (
        <Card key={index} className="border border-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">{importer.name}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{importer.address}</p>
                  <p>
                    {importer.city}
                    {importer.postal_code && `, ${importer.postal_code}`}
                    {importer.country && `, ${importer.country}`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveImporter(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
