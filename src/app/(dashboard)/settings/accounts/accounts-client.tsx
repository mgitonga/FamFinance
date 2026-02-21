"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountForm } from "./account-form";
import { deleteAccount } from "./actions";
import { formatKES } from "@/lib/currency";
import {
  Landmark,
  Smartphone,
  Wallet,
  CreditCard,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  is_active: boolean;
  created_at: string;
};

const ACCOUNT_ICONS: Record<string, React.ReactNode> = {
  bank: <Landmark className="h-5 w-5" />,
  mobile_money: <Smartphone className="h-5 w-5" />,
  cash: <Wallet className="h-5 w-5" />,
  credit_card: <CreditCard className="h-5 w-5" />,
  other: <MoreHorizontal className="h-5 w-5" />,
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bank: "Bank Account",
  mobile_money: "Mobile Money",
  cash: "Cash",
  credit_card: "Credit Card",
  other: "Other",
};

type AccountsClientProps = {
  initialAccounts: Account[];
};

export function AccountsClient({ initialAccounts }: AccountsClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAccount(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) {
      return;
    }

    setDeletingId(id);
    const formData = new FormData();
    formData.set("id", id);

    try {
      const result = await deleteAccount(formData);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const totalBalance = initialAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatKES(totalBalance)}</div>
          <p className="text-xs text-muted-foreground">
            Across {initialAccounts.length} account{initialAccounts.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Form */}
      {(showForm || editingAccount) && (
        <AccountForm
          account={editingAccount}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingAccount(null);
          }}
        />
      )}

      {/* Accounts List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialAccounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  {ACCOUNT_ICONS[account.type] || ACCOUNT_ICONS.other}
                </div>
                <div>
                  <CardTitle className="text-base font-medium">
                    {account.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {ACCOUNT_TYPE_LABELS[account.type] || account.type}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAccount(account)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(account.id)}
                  disabled={deletingId === account.id}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">
                {formatKES(account.balance)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {initialAccounts.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No accounts yet. Add your first account to start tracking.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
