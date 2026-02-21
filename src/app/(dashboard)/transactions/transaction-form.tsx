"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createTransaction, updateTransaction, uploadReceipt, type TransactionWithDetails } from "./actions";
import { formatKES } from "@/lib/currency";
import { Upload, X, Image, FileText, Loader2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  type: string;
  color: string | null;
};

type Account = {
  id: string;
  name: string;
  type: string;
};

type TransactionFormProps = {
  transaction?: TransactionWithDetails | null;
  categories: Category[];
  accounts: Account[];
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export function TransactionForm({ transaction, categories, accounts }: TransactionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(transaction?.receipt_url || "");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    transaction?.type || "expense"
  );
  
  const isEditing = !!transaction;

  // Filter categories based on transaction type
  const filteredCategories = categories.filter((cat) => {
    if (cat.type === "both") return true;
    return cat.type === transactionType;
  });

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }

    setUploadingReceipt(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      
      const result = await uploadReceipt(formData);
      
      if (result.error) {
        setError(result.error);
        setReceiptPreview(null);
      } else if (result.data) {
        const data = result.data as { url: string; path: string };
        setReceiptUrl(data.url);
      }
    } catch {
      setError("Failed to upload receipt");
      setReceiptPreview(null);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const removeReceipt = () => {
    setReceiptUrl("");
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);

    // Add receipt URL if uploaded
    if (receiptUrl) {
      formData.set("receiptUrl", receiptUrl);
    }

    try {
      const result = isEditing
        ? await updateTransaction(formData)
        : await createTransaction(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        router.push("/transactions");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Transaction" : "Add New Transaction"}</CardTitle>
      </CardHeader>
      <form action={handleSubmit}>
        {isEditing && <input type="hidden" name="id" value={transaction.id} />}
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Type Selection */}
          <div className="space-y-2">
            <Label required>Transaction Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={transactionType === "expense" ? "default" : "outline"}
                className={transactionType === "expense" ? "bg-danger hover:bg-danger/90" : ""}
                onClick={() => setTransactionType("expense")}
              >
                Expense
              </Button>
              <Button
                type="button"
                variant={transactionType === "income" ? "default" : "outline"}
                className={transactionType === "income" ? "bg-success hover:bg-success/90" : ""}
                onClick={() => setTransactionType("income")}
              >
                Income
              </Button>
            </div>
            <input type="hidden" name="type" value={transactionType} />
          </div>

          {/* Amount and Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" required>
                Amount (KES)
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                defaultValue={transaction?.amount}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" required>
                Date
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={transaction?.date || new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          {/* Category and Account Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId" required>
                Category
              </Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={transaction?.category_id || ""}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>
                  Select category...
                </option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parent_id ? "  └ " : ""}{cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountId" required>
                Account
              </Label>
              <select
                id="accountId"
                name="accountId"
                defaultValue={transaction?.account_id || ""}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>
                  Select account...
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description and Merchant Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="What was this for?"
                defaultValue={transaction?.description || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant / Vendor</Label>
              <Input
                id="merchant"
                name="merchant"
                placeholder="Where did you pay?"
                defaultValue={transaction?.merchant || ""}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              defaultValue={transaction?.payment_method || ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select method...</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="e.g., groceries, weekly, essential"
              defaultValue={transaction?.tags?.join(", ") || ""}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes..."
              defaultValue={transaction?.notes || ""}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label>Receipt (optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {receiptUrl || receiptPreview ? (
                <div className="flex items-center gap-4">
                  {receiptPreview ? (
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="h-20 w-20 object-cover rounded"
                    />
                  ) : receiptUrl?.includes(".pdf") ? (
                    <div className="h-20 w-20 bg-muted rounded flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={receiptUrl}
                      alt="Receipt"
                      className="h-20 w-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">Receipt uploaded</p>
                    <p className="text-xs text-muted-foreground">
                      Click remove to delete and upload a new one
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeReceipt}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : uploadingReceipt ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-4 cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to upload receipt</span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, or PDF up to 5MB
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || uploadingReceipt}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Update Transaction"
            ) : (
              "Add Transaction"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
