import { Suspense } from "react";
import { getCategories } from "./actions";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesSettingsPage() {
  const { data: categories, error } = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Manage your expense and income categories. Categories help organize your transactions.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <Suspense fallback={<div>Loading...</div>}>
        <CategoriesClient initialCategories={categories || []} />
      </Suspense>
    </div>
  );
}
