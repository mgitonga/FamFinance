import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Tag, Landmark, Users } from "lucide-react";

const settingsLinks = [
  {
    title: "Profile",
    description: "Update your personal information and preferences",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Categories",
    description: "Manage expense and income categories",
    href: "/settings/categories",
    icon: Tag,
  },
  {
    title: "Accounts",
    description: "Manage your financial accounts",
    href: "/settings/accounts",
    icon: Landmark,
  },
  {
    title: "Users",
    description: "Manage household members and permissions",
    href: "/settings/users",
    icon: Users,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, categories, and household settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <link.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
