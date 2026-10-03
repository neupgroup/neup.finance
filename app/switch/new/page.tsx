'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@neup/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { createProject } from '@/core/hooks/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const project = await createProject(name.trim());
      router.push(`/?project=${encodeURIComponent(project.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create project.');
      setIsSaving(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-background p-4"><Card className="w-full max-w-md"><CardHeader><CardTitle>New project</CardTitle><CardDescription>Create a project to organize your finance data.</CardDescription></CardHeader><CardContent><form className="space-y-4" onSubmit={handleSubmit}><div className="space-y-2"><Label htmlFor="project-name">Project name</Label><Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></div>{error ? <p className="text-sm text-destructive">{error}</p> : null}<div className="flex gap-2"><Button type="submit" disabled={isSaving || !name.trim()}>{isSaving ? 'Creating…' : 'Create project'}</Button><Button type="button" variant="outline" onClick={() => router.push('/switch')}>Cancel</Button></div></form></CardContent></Card></main>;
}
