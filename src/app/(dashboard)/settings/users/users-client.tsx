"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { changeUserRole, removeUser } from "./actions";
import { User, Shield, UserMinus, Crown } from "lucide-react";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
};

type UsersClientProps = {
  users: UserData[];
  currentUserId: string;
  isAdmin: boolean;
};

export function UsersClient({ users, currentUserId, isAdmin }: UsersClientProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: "admin" | "contributor") => {
    setLoadingAction(`role-${userId}`);
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("role", newRole);

    try {
      const result = await changeUserRole(formData);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user from the household?")) {
      return;
    }

    setLoadingAction(`remove-${userId}`);
    const formData = new FormData();
    formData.set("userId", userId);

    try {
      const result = await removeUser(formData);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><strong>Admin:</strong> Full access — manage categories, budgets, accounts, users</li>
              <li><strong>Contributor:</strong> Add/edit transactions, view reports & dashboards</li>
            </ul>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          return (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {user.name}
                      {isCurrentUser && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">You</span>
                      )}
                      {user.role === "admin" && (
                        <Crown className="h-4 w-4 text-warning" />
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                
                {isAdmin && !isCurrentUser && (
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as "admin" | "contributor")}
                      disabled={loadingAction === `role-${user.id}`}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="contributor">Contributor</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(user.id)}
                      disabled={loadingAction === `remove-${user.id}`}
                    >
                      <UserMinus className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                )}

                {!isAdmin && (
                  <span className="text-sm capitalize text-muted-foreground">
                    {user.role}
                  </span>
                )}

                {isCurrentUser && isAdmin && (
                  <span className="text-sm capitalize bg-primary/10 text-primary px-3 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No users found in your household.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
