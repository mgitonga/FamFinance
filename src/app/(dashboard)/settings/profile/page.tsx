import { getProfile } from "./actions";
import { ProfileForm } from "./profile-form";

export default async function ProfileSettingsPage() {
  const { data: profile, error } = await getProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Update your personal information
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {profile && <ProfileForm profile={profile} />}
    </div>
  );
}
