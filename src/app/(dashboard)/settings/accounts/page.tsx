import { Suspense } from "react";
import { getAccounts } from "./actions";
import { AccountsClient } from "./accounts-client";

export default async function AccountsSettingsPage() {
  const { data: accounts, error } = await getAccounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground">
          Manage your financial accounts (bank accounts, M-Pesa, cash, etc.)
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <Suspense fallback={<div>Loading...</div>}>
        <AccountsClient initialAccounts={accounts || []} />
      </Suspense>
    </div>
  );
}
