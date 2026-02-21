import { ImportClient } from "./import-client";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
        <p className="text-muted-foreground">
          Import transactions from a CSV file
        </p>
      </div>

      <ImportClient />
    </div>
  );
}
