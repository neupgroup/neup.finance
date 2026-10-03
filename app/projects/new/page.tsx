'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Could not create project');
      }
      window.location.assign('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create project');
      setSaving(false);
    }
  }

  return <AppShell>
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create project</h1>
        <p className="text-sm text-muted-foreground">Keep this project’s finance records together.</p>
      </div>
      <form className="space-y-4" onSubmit={createProject}>
        <div className="space-y-2">
          <Label htmlFor="project-name">Project name</Label>
          <Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Creating…' : 'Create project'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  </AppShell>;
}
