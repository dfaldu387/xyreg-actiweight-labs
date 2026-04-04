
import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, AlertTriangle, CheckCircle, XCircle, Building, Users } from "lucide-react";
import { toast } from "sonner";
import { CompanyDocumentTemplateImportService, type DocumentTemplateImportResult } from "@/services/companyDocumentTemplateImportService";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DocumentImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    companyId: string;
    onImportComplete: () => void;
}

interface ParsedCSVData {
    data: any[];
    errors: Papa.ParseError[];
    meta: Papa.ParseMeta;
}

export function DocumentImportDialog({
    open,
    onOpenChange,
    companyId,
    onImportComplete
}: DocumentImportDialogProps) {
    const [csvData, setCsvData] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ processed: 0, total: 0, operation: "" });
    const [importResult, setImportResult] = useState<DocumentTemplateImportResult | null>(null);
    const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dataImported, setDataImported] = useState<any[]>([]);
    const [parseErrors, setParseErrors] = useState<Papa.ParseError[]>([]);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const navigate = useNavigate();
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error("Please select a CSV file");
            return;
        }

        try {
            // Use papaparse to parse the CSV file
            Papa.parse(file, {
                header: true, // Treat first row as headers
                skipEmptyLines: true,
                complete: (results: ParsedCSVData) => {
                    console.log("Document Parsed CSV data:", results.data);

                    setDataImported(results.data);

                    if (results.errors.length > 0) {
                        setParseErrors(results.errors);
                        toast.error(`CSV parsing completed with ${results.errors.length} errors`);
                    } else {
                        setParseErrors([]);
                        toast.success(`CSV file parsed successfully! ${results.data.length} rows found.`);
                    }

                    setParsedData(results.data);
                    setCsvData(JSON.stringify(results.data, null, 2)); // Store as JSON for display
                },
                error: (error: Papa.ParseError) => {
                    console.error('CSV parsing error:', error);
                    toast.error(`Failed to parse CSV: ${error.message}`);
                }
            });
        } catch (error) {
            console.error('Error reading file:', error);
            toast.error("Failed to read the CSV file");
        }
    };



    const handleImport = async () => {
        setIsImporting(true);
        try {
            console.log(`Starting import of ${dataImported.length} documents...`);

            // Process all documents sequentially to avoid race conditions
            for (let i = 0; i < dataImported.length; i++) {
                const doc = dataImported[i];
                setImportProgress({
                    processed: i + 1,
                    total: dataImported.length,
                    operation: `Importing document: ${doc["Document Name"]}`
                });
                console.log('Importing document:', doc);

                // Insert company document template
                const { data, error } = await supabase
                    .from('company_document_templates')
                    .insert({
                        company_id: companyId,
                        name: doc["Document Name"],
                        description: doc["Description"] || null,
                        document_type: doc["Type"],
                        tech_applicability: "All device types",
                        markets: ["US", "EU", "CA", "AU", "JP"],
                        classes_by_market: { "CA": ["I", "II", "III", "IV"], "EU": ["I", "IIa", "IIb", "III"], "US": ["I", "II", "III"] }
                    }).select('*')
                    .single();

                if (error) {
                    console.error('Error inserting company document template:', error);
                    toast.error(`Failed to import document "${doc["Document Name"]}": ${error.message}`);
                    continue; // Skip to next document if this one fails
                }

                console.log('Imported company document template:', data);

                // Get chosen phases for the company
                const { data: chosenPhases, error: chosenError } = await supabase
                    .from('company_chosen_phases')
                    .select("*")
                    .eq('company_id', companyId)
                    .order('position');

                if (chosenError) {
                    console.error('[DocumentImportDialog] Error fetching chosen phases:', chosenError);
                    toast.error('Failed to fetch chosen phases');
                    continue;
                }

                console.log('[DocumentImportDialog] chosenPhases:', chosenPhases);

                const phaseIds = chosenPhases.map((phase: any) => phase.phase_id);

                // Find the specific phase by name
                const { data: phaseData, error: phaseError } = await supabase
                    .from('phases')
                    .select("*")
                    .in('id', phaseIds)
                    .eq('name', doc["Phase Name"])
                    .single();

                if (phaseError) {
                    console.error('[DocumentImportDialog] Error fetching phase data:', phaseError);
                    // toast.error(`Failed to find phase "${doc["Phase Name"]}" for document "${doc["Document Name"]}"`);
                    continue;
                }

                if (!phaseData) {
                    console.error(`Phase "${doc["Phase Name"]}" not found for company`);
                    // toast.error(`Phase "${doc["Phase Name"]}" not found for document "${doc["Document Name"]}"`);
                    continue;
                }

                console.log('[DocumentImportDialog] phaseData:', phaseData);

                // Add phase assigned document
                const { data: addPhaseDocument, error: addPhaseDocumentError } = await supabase
                    .from('phase_assigned_documents')
                    .insert({
                        phase_id: phaseData.id,
                        name: doc["Document Name"],
                        document_type: doc["Type"],
                        tech_applicability: "All device types",
                        markets: ["US", "EU", "CA", "AU", "JP"],
                        classes_by_market: { "CA": ["I", "II", "III", "IV"], "EU": ["I", "IIa", "IIb", "III"], "US": ["I", "II", "III"] }
                    });

                if (addPhaseDocumentError) {
                    console.error('[DocumentImportDialog] Error adding phase document:', addPhaseDocumentError);
                    // toast.error(`Failed to add phase document for "${doc["Document Name"]}": ${addPhaseDocumentError.message}`);
                    continue;
                }

                console.log('[DocumentImportDialog] Successfully added phase document:', addPhaseDocument);
            }

            toast.success(`Successfully imported ${dataImported.length} documents!`);
            onOpenChange(false);
            onImportComplete();
            navigate(0);
        } catch (error) {
            console.error('Import error:', error);
            toast.error("Import failed: " + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setCsvData("");
        setValidationResult(null);
        setImportResult(null);
        setImportProgress({ processed: 0, total: 0, operation: "" });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onOpenChange(false);
    };

    const getProgressPercentage = () => {
        if (importProgress.total === 0) return 0;
        return Math.round((importProgress.processed / importProgress.total) * 100);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        <DialogTitle>Import Document</DialogTitle>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            <Building className="h-3 w-3 mr-1" />
                            Company Specific
                        </Badge>
                    </div>
                </DialogHeader>



                <div className="space-y-6">
                    {/* File Upload Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Upload CSV File
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="csv-file">Select CSV File</Label>
                                    <Input
                                        id="csv-file"
                                        type="file"
                                        accept=".csv"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        disabled={isImporting}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Display parsed data count */}
                                {parsedData.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        <span>{parsedData.length} documents ready for import</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Import Progress Section */}
                    {isImporting && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Import Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span>{importProgress.operation}</span>
                                        <span>{importProgress.processed} / {importProgress.total}</span>
                                    </div>
                                    <Progress value={getProgressPercentage()} className="w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    )}


                </div>

                <div className="flex justify-between">
                    {/* <Button variant="outline" onClick={validateData} disabled={isImporting || !csvData.trim()}>
                        Validate CSV
                    </Button> */}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                            Close
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={isImporting || !csvData.trim() || (validationResult && !validationResult.isValid)}
                        >
                            {isImporting ? "Importing..." : `Import ${parsedData.length} Documents`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
