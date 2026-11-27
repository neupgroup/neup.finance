'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, UsersRound } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@neup/components/ui/select';
import { Skeleton } from '@neup/components/ui/skeleton';
import { getApiPath } from '@/core/helpers/app-path';

type ProjectProfile = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  roles: string[];
  details: { branding?: { taxType?: 'PAN' | 'VAT'; panNumber?: string; location?: string; phone?: string; email?: string; logo?: string } } | null;
  account: { displayName: string; neupid: string } | null;
};

// Load project profile details for the selected project.
async function loadProjectProfile(projectId: string): Promise<ProjectProfile> {
  const response = await fetch(getApiPath(`/bridge/api.v1/projects?project=${encodeURIComponent(projectId)}`), { credentials: 'include' });
  if (!response.ok) throw new Error('Could not load project profile.');
  const projects = await response.json() as ProjectProfile[];
  const project = projects.find((item) => item.id === projectId);
  if (!project) throw new Error('Select a project to view its profile.');
  return project;
}

// Save editable project profile fields.
async function saveProjectProfile(projectId: string, data: Pick<ProjectProfile, 'name' | 'status'> & { details: NonNullable<ProjectProfile['details']> }): Promise<ProjectProfile> {
  const response = await fetch(getApiPath(`/bridge/api.v1/projects?project=${encodeURIComponent(projectId)}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || 'Could not save project profile.');
  }
  const projects = await response.json() as ProjectProfile;
  return projects;
}

// Render and update the selected project's profile.
export default function ProjectProfilePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project')?.trim() ?? '';
  const [profile, setProfile] = useState<ProjectProfile | null>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [taxType, setTaxType] = useState<'PAN' | 'VAT'>('PAN');
  const [panNumber, setPanNumber] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    if (!projectId) {
      setError('Select a project to view its profile.');
      setIsLoading(false);
      return () => { active = false; };
    }
    loadProjectProfile(projectId)
      .then((result) => {
        if (!active) return;
        setProfile(result);
        setName(result.name);
        setStatus(result.status);
        setTaxType(result.details?.branding?.taxType === 'VAT' ? 'VAT' : 'PAN');
        setPanNumber(result.details?.branding?.panNumber ?? '');
        setLocation(result.details?.branding?.location ?? '');
        setPhone(result.details?.branding?.phone ?? '');
        setEmail(result.details?.branding?.email ?? '');
        setLogo(result.details?.branding?.logo ?? '');
        setError('');
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load project profile.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [projectId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const updatedProfile = await saveProjectProfile(projectId, {
        name: name.trim(),
        status,
        details: { branding: { taxType, panNumber, location, phone, email, logo } },
      });
      setProfile((current) => current ? { ...current, ...updatedProfile } : current);
      setName(updatedProfile.name);
      setStatus(updatedProfile.status);
      setTaxType(updatedProfile.details?.branding?.taxType === 'VAT' ? 'VAT' : 'PAN');
      setPanNumber(updatedProfile.details?.branding?.panNumber ?? '');
      setLocation(updatedProfile.details?.branding?.location ?? '');
      setPhone(updatedProfile.details?.branding?.phone ?? '');
      setEmail(updatedProfile.details?.branding?.email ?? '');
      setLogo(updatedProfile.details?.branding?.logo ?? '');
      setNotice('Project profile saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save project profile.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Project profile</h1>
        <p className="text-sm text-muted-foreground">Update project details and view its associated account.</p>
      </div>
      {isLoading ? (
        <div className="space-y-6" aria-busy="true" aria-label="Loading project profile">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className={`space-y-2 ${index === 0 || index === 6 ? 'sm:col-span-2' : ''}`}>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <Skeleton className="h-10 w-32 sm:col-span-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-56" /></CardHeader>
            <CardContent className="space-y-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-72" /></CardHeader>
            <CardContent className="space-y-4"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-28" /></CardContent>
          </Card>
        </div>
      ) : error && !profile ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : (
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Branding</CardTitle>
            <CardDescription>Business identity and contact details used on project documents.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="branding-name">Name</Label>
              <Input id="branding-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} disabled={isLoading || isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-tax-type">TAX type</Label>
              <Select value={taxType} onValueChange={(value) => setTaxType(value as 'PAN' | 'VAT')} disabled={isLoading || isSaving}>
                <SelectTrigger id="branding-tax-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAN">PAN</SelectItem>
                  <SelectItem value="VAT">VAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-pan">PAN Number</Label>
              <Input id="branding-pan" value={panNumber} onChange={(event) => setPanNumber(event.target.value)} maxLength={40} disabled={isLoading || isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-location">Location</Label>
              <Input id="branding-location" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={240} disabled={isLoading || isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-phone">Phone</Label>
              <Input id="branding-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} disabled={isLoading || isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-email">Email</Label>
              <Input id="branding-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} disabled={isLoading || isSaving} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="branding-logo">Logo URL</Label>
              <Input id="branding-logo" type="url" value={logo} onChange={(event) => setLogo(event.target.value)} placeholder="https://…" maxLength={2048} disabled={isLoading || isSaving} />
              <p className="text-xs text-muted-foreground">Use a publicly accessible image URL for now.</p>
            </div>
            <div className="space-y-3 sm:col-span-2">
              {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
              {notice ? <p role="status" className="text-sm text-green-600">{notice}</p> : null}
              <Button type="submit" disabled={isLoading || isSaving || !name.trim()}>{isSaving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Project details</CardTitle>
            <CardDescription>Set the availability of this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'inactive')} disabled={isLoading || isSaving}>
                <SelectTrigger id="project-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <UsersRound className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Associated account and access</CardTitle>
            <CardDescription>The account linked to this project and your current project roles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><p className="text-muted-foreground">Account</p><p className="font-medium">{profile?.account?.displayName || profile?.account?.neupid || '—'}</p></div>
            {profile?.account?.neupid ? <div><p className="text-muted-foreground">Account ID</p><p className="font-medium">{profile.account.neupid}</p></div> : null}
            <div><p className="text-muted-foreground">Your roles</p><p className="font-medium">{profile?.roles.join(', ') || (isLoading ? 'Loading…' : '—')}</p></div>
          </CardContent>
        </Card>
      </form>
      )}
    </div>
  );
}
