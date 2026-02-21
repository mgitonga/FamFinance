"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createAccount, updateAccount } from "./actions";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

type AccountFormProps = {
  account?: Account | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank Account" },
  { value: "mobile_money", label: "Mobile Money (M-Pesa)" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "other", label: "Other" },
];

export function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditing = !!account;

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);

    try {
      const result = isEditing
        ? await updateAccount(formData)
        : await createAccount(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        onSuccess?.();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Account" : "Add New Account"}</CardTitle>
      </CardHeader>
      <form action={handleSubmit}>
        {isEditing && <input type="hidden" name="id" value={account.id} />}
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" required>
              Account Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Joint Account, M-Pesa"
              defaultValue={account?.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" required>
              Account Type
            </Label>
            <select
              id="type"
              name="type"
              defaultValue={account?.type || ""}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="" disabled>
                Select type...
              </option>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance (KES)</Label>
            <Input
              id="balance"
              name="balance"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              defaultValue={account?.balance || 0}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
