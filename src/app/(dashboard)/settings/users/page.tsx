import { getHouseholdUsers } from "./actions";
import { UsersClient } from "./users-client";

export default async function UsersSettingsPage() {
  const { data: users, error, currentUserId, isAdmin } = await getHouseholdUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage household members and their permissions
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <UsersClient 
        users={users || []} 
        currentUserId={currentUserId || ""} 
        isAdmin={isAdmin || false}
      />
    </div>
  );
}
