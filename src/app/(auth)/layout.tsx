import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | FamFin",
  description: "Sign in to your FamFin account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="text-4xl">💰</span>
        <span className="text-3xl font-bold text-primary">FamFin</span>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Family Budget & Finance Tracking
      </p>
    </div>
  );
}
