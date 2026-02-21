"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateProfile } from "./actions";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  households: {
    name: string;
    primary_currency: string;
  } | null;
};

type ProfileFormProps = {
  profile: Profile;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const result = await updateProfile(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(true);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and profile details</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-success/10 p-3 text-sm text-success">
                Profile updated successfully!
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" required>
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={profile.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <p className="font-medium capitalize">{profile.role}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Household</Label>
              <p className="font-medium">{profile.households?.name || "None"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Currency</Label>
              <p className="font-medium">
                {profile.households?.primary_currency || "KES"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
