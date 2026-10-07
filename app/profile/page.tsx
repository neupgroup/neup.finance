'use client';

import { useAccountProfile } from '@/core/hooks/api';
import { Avatar, AvatarFallback, AvatarImage } from '@neup/components/ui/avatar';
import { Badge } from '@neup/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Skeleton } from '@neup/components/ui/skeleton';
import { CircleUserRound, Fingerprint, ShieldCheck } from 'lucide-react';

type Profile = {
  id?: string;
  aid?: string;
  expiry?: number | null;
  displayName?: string | null;
  displayImage?: string | null;
  neupid?: string | null;
  roleId?: string | null;
  project?: { id?: string; name?: string | null } | null;
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-all font-medium">{value || 'Not provided'}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { data, isLoading, error } = useAccountProfile();
  const profile = data as Profile | undefined;
  const displayName = profile?.displayName || 'Account profile';
  const image = profile?.displayImage;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2"><Skeleton className="h-9 w-48" /><Skeleton className="h-5 w-72" /></div>
        <Card><CardContent className="flex items-center gap-5 p-6"><Skeleton className="h-20 w-20 rounded-full" /><div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></div></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-36" /></CardHeader><CardContent className="grid gap-6 sm:grid-cols-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></CardContent></Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Profile</h1><p className="mt-1 text-muted-foreground">Your account information.</p></div>
        <Card><CardContent className="flex items-center gap-4 p-6"><CircleUserRound className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Sign in to view your profile information.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">Information associated with your signed-in account.</p>
      </div>

      {error ? <p role="alert" className="text-sm text-destructive">Could not load the account details from your current session.</p> : null}

      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={image || undefined} alt={`${displayName} profile photo`} />
            <AvatarFallback className="text-xl">{initials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-2xl font-semibold">{displayName}</h2>
            <p className="text-sm text-muted-foreground">Your Neup account</p>
            {profile?.roleId ? <Badge variant="secondary" className="mt-2"><ShieldCheck className="mr-1 h-3.5 w-3.5" />{profile.roleId}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Fingerprint className="h-5 w-5" />Account details</CardTitle>
          <CardDescription>Identifiers and workspace linked to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Detail label="Display name" value={profile.displayName} />
            <Detail label="Neup ID" value={profile.neupid} />
            <Detail label="Account ID" value={profile.aid || profile.id} />
            <Detail label="Session expires" value={profile.expiry ? new Date(profile.expiry * 1000).toLocaleString() : null} />
            <Detail label="Current project" value={profile?.project?.name} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
