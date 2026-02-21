"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "../actions";

export default function ResetPasswordPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);

    try {
      const result = await resetPassword(formData);
      if (result.error) {
        setError(result.error);
      }
      // If successful, the action redirects to /login
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>
          Enter your new password below. Make sure it&apos;s at least 8
          characters with 1 number and 1 special character.
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" required>
              New Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" required>
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            <Link href="/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
