"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKES } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import {
  getCSVTemplate,
  parseCSV,
  importTransactions,
  type ParsedTransaction,
} from "./actions";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function ImportClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleDownloadTemplate = async () => {
    const template = await getCSVTemplate();
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "famfin_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const content = await file.text();
      const result = await parseCSV(content);

      if (result.error) {
        setError(result.error);
      } else {
        setParsedData(result.data);
        setStep("preview");
      }
    } catch {
      setError("Failed to read file");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await importTransactions(parsedData);

      if (result.error) {
        setError(result.error);
      } else if (result.success && result.data) {
        setImportResult(result.data as { imported: number; skipped: number });
        setStep("result");
      }
    } catch {
      setError("Failed to import transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setParsedData([]);
    setImportResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validCount = parsedData.filter((t) => t.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-danger/10 p-4 text-sm text-danger flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {step === "upload" && (
        <>
          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Import Instructions</CardTitle>
              <CardDescription>
                Follow these steps to import your transactions from a CSV file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Download the CSV template below</li>
                <li>Fill in your transaction data following the template format</li>
                <li>
                  <strong>Date format:</strong> DD/MM/YYYY (e.g., 15/01/2026)
                </li>
                <li>
                  <strong>Type:</strong> &quot;income&quot; or &quot;expense&quot;
                </li>
                <li>
                  <strong>Category:</strong> Must match an existing category name
                </li>
                <li>
                  <strong>Account:</strong> Must match an existing account name
                </li>
                <li>Upload your completed CSV file</li>
                <li>Review the preview and confirm import</li>
              </ol>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-sm text-muted-foreground">Processing file...</p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <span className="text-lg font-medium">Click to upload CSV</span>
                    <span className="text-sm text-muted-foreground">
                      or drag and drop your file here
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === "preview" && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Import Preview</CardTitle>
              <CardDescription>
                Review the parsed transactions before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{validCount} valid</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 text-danger">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">{invalidCount} with errors</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transactions Preview Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Category</th>
                      <th className="px-4 py-3 text-left font-medium">Account</th>
                      <th className="px-4 py-3 text-left font-medium">Description</th>
                      <th className="px-4 py-3 text-left font-medium">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedData.map((row, index) => (
                      <tr
                        key={index}
                        className={row.isValid ? "" : "bg-danger/5"}
                      >
                        <td className="px-4 py-3">
                          {row.isValid ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-danger" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.date ? formatDate(row.date) : "-"}
                        </td>
                        <td className="px-4 py-3 capitalize">{row.type}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatKES(row.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {row.category}
                          {row.subCategory && ` > ${row.subCategory}`}
                        </td>
                        <td className="px-4 py-3">{row.account}</td>
                        <td className="px-4 py-3">{row.description || "-"}</td>
                        <td className="px-4 py-3 text-danger text-xs">
                          {row.errors.join("; ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || validCount === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>Import {validCount} Transactions</>
              )}
            </Button>
          </div>
        </>
      )}

      {step === "result" && importResult && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="h-16 w-16 text-success mb-4" />
              <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Successfully imported {importResult.imported} transactions.
                {importResult.skipped > 0 && (
                  <> {importResult.skipped} were skipped due to errors.</>
                )}
              </p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleReset}>
                  Import More
                </Button>
                <Button onClick={() => router.push("/transactions")}>
                  View Transactions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
